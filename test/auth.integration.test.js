import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';

test('authentication with real MySQL: validation, bcrypt, duplicate email, JWT and roles', async () => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const account = { name: 'Authentication test', email: `auth-${Date.now()}@example.com`, password: 'AuthTest123!' };
  let userId;
  async function request(method, path, body, token) {
    const result = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: result.status, body: await result.json() };
  }
  try {
    const [columns] = await pool.query('SHOW COLUMNS FROM users');
    assert.ok(columns.some(c => c.Field === 'password_hash'));
    assert.ok(columns.some(c => c.Field === 'email' && c.Key === 'UNI'));
    assert.ok(columns.some(c => c.Field === 'role' && c.Type === "enum('customer','admin')"));
    for (const invalid of [{ name: ' ' }, { email: 'invalid' }, { password: 'short' }, { role: 'admin' }]) {
      assert.equal((await request('POST', '/api/auth/register', { ...account, ...invalid })).status, 400);
    }
    const created = await request('POST', '/api/auth/register', account);
    assert.equal(created.status, 201); userId = created.body.data.id;
    assert.equal(created.body.data.role, 'customer');
    assert.ok(!('password_hash' in created.body.data));
    const [[stored]] = await pool.execute('SELECT * FROM users WHERE id=?', [userId]);
    assert.notEqual(stored.password_hash, account.password);
    assert.match(stored.password_hash, /^\$2[ab]\$12\$/);
    assert.equal(await bcrypt.compare(account.password, stored.password_hash), true);
    assert.equal(await bcrypt.compare('WrongPassword123!', stored.password_hash), false);
    assert.equal((await request('POST', '/api/auth/register', { ...account, email: account.email.toUpperCase() })).status, 409);
    const login = { email: account.email, password: account.password };
    assert.equal((await request('POST', '/api/auth/login', { ...login, password: 'WrongPassword123!' })).status, 401);
    assert.equal((await request('POST', '/api/auth/login', { ...login, email: `missing-${account.email}` })).status, 401);
    const loggedIn = await request('POST', '/api/auth/login', login);
    assert.equal(loggedIn.status, 200);
    assert.ok(!('password_hash' in loggedIn.body.user));
    const token = loggedIn.body.token;
    const payload = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'], issuer: 'food-service', audience: 'food-client' });
    assert.equal(payload.sub, String(userId)); assert.ok(payload.exp > payload.iat);
    assert.equal((await request('GET', '/api/me', null, token)).status, 200);
    assert.equal((await request('GET', '/api/admin/orders', null, token)).status, 403);
    assert.equal((await request('GET', '/api/me')).status, 401);
    const options = { subject: String(userId), issuer: 'food-service', audience: 'food-client' };
    for (const badToken of ['invalid-token', jwt.sign({}, 'wrong-secret', options), jwt.sign({}, config.JWT_SECRET, { ...options, expiresIn: -1 }), jwt.sign({}, config.JWT_SECRET, { ...options, subject: 'invalid' })]) {
      assert.equal((await request('GET', '/api/me', null, badToken)).status, 401);
    }
    await pool.execute("UPDATE users SET role='admin' WHERE id=?", [userId]);
    assert.equal((await request('GET', '/api/admin/orders', null, token)).status, 200);
    await pool.execute('DELETE FROM users WHERE id=?', [userId]); userId = null;
    assert.equal((await request('GET', '/api/me', null, token)).status, 401);
  } finally {
    if (userId) await pool.execute('DELETE FROM users WHERE id=?', [userId]);
    await new Promise(resolve => server.close(resolve));
    await pool.end();
  }
});
