import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { parse, id, categorySchema, pagination } from '../validation.js';
import { HttpError } from '../domain.js';

const router = Router();
const admin = [requireAuth, requireAdmin];
router.get('/', async (req, res) => {
  const { limit, offset } = pagination(req);
  const [rows] = await pool.query('SELECT * FROM categories ORDER BY id LIMIT ? OFFSET ?', [limit, offset]);
  res.json({ data: rows, limit, offset });
});
router.get('/:id', async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM categories WHERE id=?', [parse(id, req.params.id)]);
  if (!rows.length) throw new HttpError(404, 'Category not found');
  res.json({ data: rows[0] });
});
router.post('/', ...admin, async (req, res) => {
  const d = parse(categorySchema, req.body);
  const [result] = await pool.execute('INSERT INTO categories (name) VALUES (?)', [d.name]);
  res.status(201).json({ data: { id: result.insertId, ...d } });
});
router.put('/:id', ...admin, async (req, res) => {
  const categoryId = parse(id, req.params.id), d = parse(categorySchema, req.body);
  const [result] = await pool.execute('UPDATE categories SET name=? WHERE id=?', [d.name, categoryId]);
  if (!result.affectedRows) throw new HttpError(404, 'Category not found');
  res.json({ data: { id: categoryId, ...d } });
});
router.delete('/:id', ...admin, async (req, res) => {
  const [result] = await pool.execute('DELETE FROM categories WHERE id=?', [parse(id, req.params.id)]);
  if (!result.affectedRows) throw new HttpError(404, 'Category not found');
  res.status(204).end();
});
export default router;
