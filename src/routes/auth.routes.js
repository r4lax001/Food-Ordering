import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import { pool } from '../db.js';
import { signToken } from '../middleware/auth.js';
import { HttpError } from '../domain.js';
import { parse, registerSchema, loginSchema } from '../validation.js';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many authentication requests. Try again later.' } });

router.post('/register', authLimiter, async (req, res) => {
  const data = parse(registerSchema, req.body);
  const [result] = await pool.execute('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [data.name, data.email, await bcrypt.hash(data.password, 12)]);
  res.status(201).json({ data: { id: result.insertId, name: data.name, email: data.email, role: 'customer' } });
});
router.post('/login', authLimiter, async (req, res) => {
  const data = parse(loginSchema, req.body);
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [data.email]);
  if (!rows.length || !await bcrypt.compare(data.password, rows[0].password_hash)) throw new HttpError(401, 'Invalid email or password');
  const { password_hash, ...user } = rows[0];
  res.json({ token: signToken(user), token_type: 'Bearer', user });
});

export default router;
