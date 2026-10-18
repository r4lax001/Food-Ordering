import bcrypt from 'bcrypt';
import { pool } from '../src/db.js';
import { parse, registerSchema } from '../src/validation.js';
try {
  const data = parse(registerSchema, { name: process.env.ADMIN_NAME, email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  await pool.execute('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [data.name, data.email, await bcrypt.hash(data.password, 12), 'admin']);
  console.log('Administrator created. Remove ADMIN_PASSWORD from .env now.');
} catch (error) {
  console.error(error.code === 'ER_DUP_ENTRY' ? 'Account already exists; no changes made.' : error.message);
  process.exitCode = 1;
} finally { await pool.end(); }
