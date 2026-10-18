import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { pool } from '../db.js';
import { HttpError } from '../domain.js';
export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
  if (!token) throw new HttpError(401, 'Bearer token required');
  let payload;
  try { payload = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'], issuer: 'food-service', audience: 'food-client' }); }
  catch { throw new HttpError(401, 'Invalid or expired token'); }
  if (typeof payload !== 'object' || !/^[1-9]\d*$/.test(payload.sub ?? '') || !Number.isSafeInteger(Number(payload.sub))) {
    throw new HttpError(401, 'Invalid token subject');
  }
  const [rows] = await pool.execute('SELECT id, name, email, role FROM users WHERE id = ?', [payload.sub]);
  if (!rows.length) throw new HttpError(401, 'Account not found');
  req.user = rows[0]; next();
}
export function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') throw new HttpError(403, 'Administrator access required');
  next();
}
export function signToken(user) {
  return jwt.sign({}, config.JWT_SECRET, { algorithm: 'HS256', subject: String(user.id), expiresIn: config.JWT_EXPIRES_IN, issuer: 'food-service', audience: 'food-client' });
}
