import { existsSync } from 'node:fs';
import { writeFile, mkdir } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import { pool } from '../src/db.js';

const file = new URL('../.local/demo-admin.json', import.meta.url);
try {
  if (existsSync(file)) console.log('Demo credentials already exist; no changes made.');
  else {
    const email = `admin-${randomBytes(4).toString('hex')}@example.com`;
    const password = randomBytes(18).toString('base64url');
    await pool.execute("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')", ['Demo Admin', email, await bcrypt.hash(password, 12)]);
    await mkdir(new URL('../.local/', import.meta.url), { recursive: true });
    await writeFile(file, JSON.stringify({ email, password }, null, 2), { flag: 'wx' });
    console.log('Demo admin created. Credentials saved in .local/demo-admin.json (excluded from Git).');
  }
} finally { await pool.end(); }
