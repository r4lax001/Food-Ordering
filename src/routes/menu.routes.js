import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { HttpError } from '../domain.js';
import { parse, id, menuSchema } from '../validation.js';

const router = Router();
const admin = [requireAuth, requireAdmin];
const getId = req => parse(id, req.params.id);
const pagination = req => parse(z.object({ limit: z.coerce.number().int().min(1).max(100).default(50), offset: z.coerce.number().int().min(0).max(1000000).default(0) }), req.query);
async function requireCategory(categoryId) {
  const [rows] = await pool.execute('SELECT id FROM categories WHERE id=?', [categoryId]);
  if (!rows.length) throw new HttpError(400, 'Category does not exist');
}

router.get('/', async (req, res) => {
  const { category_id } = parse(z.object({ category_id: id.optional() }), req.query);
  const { limit, offset } = pagination(req);
  const [rows] = await pool.query(`SELECT m.*, c.name AS category_name FROM menu_items m JOIN categories c ON c.id = m.category_id WHERE m.deleted_at IS NULL ${category_id ? 'AND m.category_id = ?' : ''} ORDER BY m.id LIMIT ? OFFSET ?`, [...(category_id ? [category_id] : []), limit, offset]);
  res.json({ data: rows, limit, offset });
});
router.get('/:id', async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM menu_items WHERE id = ? AND deleted_at IS NULL', [getId(req)]);
  if (!rows.length) throw new HttpError(404, 'Menu item not found'); res.json({ data: rows[0] });
});
router.post('/', ...admin, async (req, res) => {
  const d = parse(menuSchema, req.body);
  await requireCategory(d.category_id);
  const [result] = await pool.execute('INSERT INTO menu_items (category_id, name, description, price, image_url, is_available) VALUES (?, ?, ?, ?, ?, ?)', [d.category_id, d.name, d.description, d.price, d.image_url, d.is_available]);
  res.status(201).json({ data: { id: result.insertId, ...d } });
});
router.put('/:id', ...admin, async (req, res) => {
  const itemId = getId(req), d = parse(menuSchema, req.body);
  await requireCategory(d.category_id);
  const [result] = await pool.execute('UPDATE menu_items SET category_id=?, name=?, description=?, price=?, image_url=?, is_available=? WHERE id=? AND deleted_at IS NULL', [d.category_id, d.name, d.description, d.price, d.image_url, d.is_available, itemId]);
  if (!result.affectedRows) throw new HttpError(404, 'Menu item not found'); res.json({ data: { id: itemId, ...d } });
});
router.delete('/:id', ...admin, async (req, res) => {
  const [result] = await pool.execute('UPDATE menu_items SET deleted_at=NOW(), is_available=FALSE WHERE id=? AND deleted_at IS NULL', [getId(req)]);
  if (!result.affectedRows) throw new HttpError(404, 'Menu item not found'); res.status(204).end();
});

export default router;
