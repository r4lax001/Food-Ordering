import reservationRoutes from './routes/reservation.routes.js';
import tableRoutes from './routes/table.routes.js';
import categoryRoutes from './routes/category.routes.js';
import { config } from './config.js';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import menuRoutes from './routes/menu.routes.js';
import express from 'express';
import helmet from 'helmet';
import { z } from 'zod';
import { pool, transaction } from './db.js';
import { requireAuth, requireAdmin } from './middleware/auth.js';
import { HttpError, validateBooking, moneyToCents, centsToMoney, orderTransitions } from './domain.js';
import { parse, id, orderSchema } from './validation.js';

export const app = express();
app.disable('x-powered-by');
app.use(helmet());
const allowedOrigins = config.CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new HttpError(403, 'Origin is not allowed'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));
app.use(express.json({ limit: '100kb' }));
const admin = [requireAuth, requireAdmin];
const getId = req => parse(id, req.params.id);
const pagination = req => parse(z.object({ limit: z.coerce.number().int().min(1).max(100).default(50), offset: z.coerce.number().int().min(0).max(1000000).default(0) }), req.query);

app.get('/api/health', async (req, res) => { await pool.query('SELECT 1'); res.json({ status: 'ok', database: 'connected' }); });
app.use('/api/auth', authRoutes);
app.get('/api/me', requireAuth, (req, res) => res.json({ data: req.user }));
app.use('/api/categories', categoryRoutes);
app.use('/api/menu', menuRoutes);
app.use(reservationRoutes);
app.use('/api/tables', tableRoutes);
app.post('/api/orders', requireAuth, async (req, res) => {
  const d = parse(orderSchema, req.body);
  const result = await transaction(async db => {
    if (d.reservation_id) {
      const [rows] = await db.execute("SELECT * FROM reservations WHERE id=? AND user_id=? AND status='confirmed' FOR UPDATE", [d.reservation_id, req.user.id]);
      if (!rows.length) throw new HttpError(400, 'Active reservation belonging to you is required');
      validateBooking(rows[0].reservation_date, rows[0].slot);
    }
    const ids = d.items.map(i => i.menu_item_id).sort((a,b) => a-b);
    const [menu] = await db.execute(`SELECT * FROM menu_items WHERE id IN (${ids.map(() => '?').join(',')}) ORDER BY id FOR SHARE`, ids);
    const items = d.items.map(item => {
      const product = menu.find(m => m.id === item.menu_item_id);
      if (!product || !product.is_available || product.deleted_at) throw new HttpError(400, `Menu item ${item.menu_item_id} is unavailable`);
      return { ...item, menu_name: product.name, unit_price: product.price };
    });
    const total = centsToMoney(items.reduce((sum, i) => sum + moneyToCents(i.unit_price) * i.quantity, 0));
    const [order] = await db.execute('INSERT INTO orders (user_id, reservation_id, total, note) VALUES (?, ?, ?, ?)', [req.user.id, d.reservation_id ?? null, total, d.note]);
    for (const i of items) await db.execute('INSERT INTO order_items (order_id, menu_item_id, menu_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)', [order.insertId, i.menu_item_id, i.menu_name, i.quantity, i.unit_price]);
    return { id: order.insertId, reservation_id: d.reservation_id ?? null, total, status: 'pending', items };
  }); res.status(201).json({ data: result });
});
app.get('/api/me/orders', requireAuth, async (req, res) => {
  const { limit, offset } = pagination(req);
  const [rows] = await pool.query('SELECT * FROM orders WHERE user_id=? ORDER BY id DESC LIMIT ? OFFSET ?', [req.user.id, limit, offset]); res.json({ data: rows, limit, offset });
});
app.get('/api/orders/:id', requireAuth, async (req, res) => {
  const orderId = getId(req);
  const [rows] = await pool.execute(`SELECT * FROM orders WHERE id=? ${req.user.role === 'admin' ? '' : 'AND user_id=?'}`, req.user.role === 'admin' ? [orderId] : [orderId, req.user.id]);
  if (!rows.length) throw new HttpError(404, 'Order not found');
  const [items] = await pool.execute('SELECT * FROM order_items WHERE order_id=?', [orderId]); res.json({ data: { ...rows[0], items } });
});
app.patch('/api/orders/:id/cancel', requireAuth, async (req, res) => {
  const orderId = getId(req);
  const [result] = await pool.execute("UPDATE orders SET status='cancelled' WHERE id=? AND user_id=? AND status='pending'", [orderId, req.user.id]);
  if (!result.affectedRows) throw new HttpError(409, 'Only your pending orders can be cancelled'); res.json({ data: { id: orderId, status: 'cancelled' } });
});
for (const resource of ['orders', 'reservations']) {
  app.get(`/api/admin/${resource}`, ...admin, async (req, res) => {
    const { limit, offset } = pagination(req);
    const [rows] = await pool.query(`SELECT * FROM ${resource} ORDER BY id DESC LIMIT ? OFFSET ?`, [limit, offset]); res.json({ data: rows, limit, offset });
  });
}
app.patch('/api/admin/orders/:id/status', ...admin, async (req, res) => {
  const orderId = getId(req), { status } = parse(z.object({ status: z.enum(Object.keys(orderTransitions)) }).strict(), req.body);
  await transaction(async db => {
    const [rows] = await db.execute('SELECT status FROM orders WHERE id=? FOR UPDATE', [orderId]);
    if (!rows.length) throw new HttpError(404, 'Order not found');
    if (!orderTransitions[rows[0].status].includes(status)) throw new HttpError(409, 'Invalid order status transition');
    await db.execute('UPDATE orders SET status=? WHERE id=?', [status, orderId]);
  }); res.json({ data: { id: orderId, status } });
});
app.use((req, res) => res.status(404).json({ error: 'Endpoint not found' }));
app.use((error, req, res, next) => {
  if (error instanceof HttpError) return res.status(error.status).json({ error: error.message });
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large' });
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: req.path === '/api/reservations' ? 'Table is already booked for this slot' : 'Record already exists' });
  if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'Referenced record does not exist' });
  if (error.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ error: 'Record is still referenced by menu items or history' });
  if (['ECONNREFUSED', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR'].includes(error.code)) return res.status(503).json({ error: 'Database unavailable' });
  console.error('Request failed:', error.code || error.name);
  res.status(500).json({ error: 'Internal server error' });
});
