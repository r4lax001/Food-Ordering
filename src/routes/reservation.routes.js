import { Router } from 'express';
import { pool, transaction } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError, slots, validateBooking } from '../domain.js';
import { parse, id, bookingSchema, availabilitySchema, pagination } from '../validation.js';
const router = Router();
const getId = req => parse(id, req.params.id);
router.get('/api/reservation-slots', (req, res) => res.json({ data: slots, duration_minutes: 90, timezone: 'Asia/Bangkok' }));
router.get('/api/tables/availability', async (req, res) => {
  const d = parse(availabilitySchema, req.query); validateBooking(d.date, d.slot);
  const [rows] = await pool.execute("SELECT t.* FROM `tables` t WHERE t.is_active=TRUE AND t.capacity >= ? AND NOT EXISTS (SELECT 1 FROM reservations r WHERE r.table_id=t.id AND r.reservation_date=? AND r.slot=? AND r.status <> 'cancelled') ORDER BY t.capacity, t.id", [d.guests, d.date, d.slot]);
  res.json({ data: rows });
});
router.post('/api/reservations', requireAuth, async (req, res) => {
  const d = parse(bookingSchema, req.body); validateBooking(d.date, d.slot);
  const result = await transaction(async db => {
    const [tables] = await db.execute('SELECT * FROM `tables` WHERE id=? AND is_active=TRUE FOR UPDATE', [d.table_id]);
    if (!tables.length) throw new HttpError(404, 'Table not found');
    if (tables[0].capacity < d.guests) throw new HttpError(400, 'Table capacity exceeded');
    const [created] = await db.execute('INSERT INTO reservations (user_id, table_id, reservation_date, slot, guests, note) VALUES (?, ?, ?, ?, ?, ?)', [req.user.id, d.table_id, d.date, d.slot, d.guests, d.note]);
    return { id: created.insertId, ...d, status: 'confirmed' };
  }); res.status(201).json({ data: result });
});
router.get(['/api/reservations/my', '/api/me/reservations'], requireAuth, async (req, res) => {
  const { limit, offset } = pagination(req);
  const [rows] = await pool.query('SELECT r.*, t.table_number FROM reservations r JOIN `tables` t ON t.id=r.table_id WHERE r.user_id=? ORDER BY r.id DESC LIMIT ? OFFSET ?', [req.user.id, limit, offset]); res.json({ data: rows, limit, offset });
});
router.patch('/api/reservations/:id/cancel', requireAuth, async (req, res) => {
  const reservationId = getId(req);
  await transaction(async db => {
    const [rows] = await db.execute('SELECT * FROM reservations WHERE id=? AND user_id=? FOR UPDATE', [reservationId, req.user.id]);
    if (!rows.length) throw new HttpError(404, 'Reservation not found');
    if (rows[0].status !== 'confirmed') throw new HttpError(409, 'Reservation cannot be cancelled');
    validateBooking(rows[0].reservation_date, rows[0].slot);
    const [orders] = await db.execute("SELECT id FROM orders WHERE reservation_id=? AND status <> 'cancelled'", [reservationId]);
    if (orders.length) throw new HttpError(409, 'Cancel linked orders before cancelling the reservation');
    await db.execute("UPDATE reservations SET status='cancelled' WHERE id=?", [reservationId]);
  }); res.json({ data: { id: reservationId, status: 'cancelled' } });
});

export default router;
