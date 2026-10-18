import { Router } from 'express';
import { pool, transaction } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { parse, id, tableSchema, pagination } from '../validation.js';
import { HttpError } from '../domain.js';

const router = Router();
const admin = [requireAuth, requireAdmin];
// Compare booking end in Bangkok time without relying on the MySQL host timezone.
const activeBooking = "status='confirmed' AND TIMESTAMP(reservation_date, CONCAT(slot, ':00')) + INTERVAL 90 MINUTE > UTC_TIMESTAMP() + INTERVAL 7 HOUR";

router.get('/', async (req, res) => {
  const { limit, offset } = pagination(req);
  const [rows] = await pool.query('SELECT * FROM `tables` WHERE is_active=TRUE ORDER BY id LIMIT ? OFFSET ?', [limit, offset]);
  res.json({ data: rows, limit, offset });
});
// The restaurant layout is provisioned during setup, never through admin actions.
router.post('/', ...admin, (_req, _res) => {
  throw new HttpError(403, 'Adding tables is disabled');
});
router.put('/:id', ...admin, async (req, res) => {
  const tableId = parse(id, req.params.id), d = parse(tableSchema, req.body);
  await transaction(async db => {
    const [rows] = await db.execute('SELECT id FROM `tables` WHERE id=? FOR UPDATE', [tableId]);
    if (!rows.length) throw new HttpError(404, 'Table not found');
    const [bookings] = await db.execute(`SELECT guests FROM reservations WHERE table_id=? AND ${activeBooking}`, [tableId]);
    if (bookings.some(b => !d.is_active || b.guests > d.capacity)) throw new HttpError(409, 'Table has active reservations incompatible with this change');
    await db.execute('UPDATE `tables` SET table_number=?, capacity=?, is_active=? WHERE id=?', [d.table_number, d.capacity, d.is_active, tableId]);
  });
  res.json({ data: { id: tableId, ...d } });
});
router.delete('/:id', ...admin, async (req, res) => {
  const tableId = parse(id, req.params.id);
  await transaction(async db => {
    const [rows] = await db.execute('SELECT id FROM `tables` WHERE id=? AND is_active=TRUE FOR UPDATE', [tableId]);
    if (!rows.length) throw new HttpError(404, 'Table not found');
    const [bookings] = await db.execute(`SELECT id FROM reservations WHERE table_id=? AND ${activeBooking} LIMIT 1`, [tableId]);
    if (bookings.length) throw new HttpError(409, 'Cannot delete a table with active reservations');
    await db.execute('UPDATE `tables` SET is_active=FALSE WHERE id=?', [tableId]);
  });
  res.status(204).end();
});
export default router;
