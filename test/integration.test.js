import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { app } from '../src/app.js';
import { pool } from '../src/db.js';

test('real MySQL end-to-end: auth, menu CRUD, price snapshot, order permissions and concurrent booking', async () => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const userIds = [], menuIds = [];
  let tableId;
  async function request(method, path, body, token) {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: response.status === 204 ? null : await response.json() };
  }
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try {
    assert.equal((await request('GET', '/api/health')).status, 200);
    assert.ok((await request('GET', '/api/menu')).body.data.length > 0);
    const tokens = [];
    for (let i = 0; i < 3; i++) {
      const account = { name: `Integration ${i}`, email: `integration-${stamp}-${i}@example.com`, password: 'TestPassword123!' };
      const registered = await request('POST', '/api/auth/register', account);
      assert.equal(registered.status, 201); userIds.push(registered.body.data.id);
      assert.equal((await request('POST', '/api/auth/register', account)).status, 409);
      const login = await request('POST', '/api/auth/login', { email: account.email, password: account.password });
      assert.equal(login.status, 200); tokens.push(login.body.token);
    }
    const [customer, other, admin] = tokens;
    await pool.execute("UPDATE users SET role='admin' WHERE id=?", [userIds[2]]);
    assert.equal((await request('GET', '/api/me')).status, 401);
    assert.equal((await request('GET', '/api/admin/orders', null, customer)).status, 403);
    assert.equal((await request('GET', '/api/admin/users')).status, 401);
    assert.equal((await request('GET', '/api/admin/users', null, customer)).status, 403);
    const users = await request('GET', '/api/admin/users?q=' + encodeURIComponent(stamp) + '&limit=1&offset=0', null, admin);
    assert.equal(users.status, 200); assert.equal(users.body.total, 3); assert.equal(users.body.data.length, 1);
    assert.deepEqual(Object.keys(users.body.data[0]).sort(), ['created_at','email','id','name','role']);
    const nextUsers = await request('GET', '/api/admin/users?q=' + encodeURIComponent(stamp) + '&limit=1&offset=1', null, admin);
    assert.notEqual(nextUsers.body.data[0].id, users.body.data[0].id);
    const admins = await request('GET', '/api/admin/users?q=' + encodeURIComponent(stamp) + '&role=admin', null, admin);
    assert.equal(admins.body.total, 1); assert.equal(admins.body.data[0].role, 'admin');
    assert.equal((await request('GET', '/api/admin/users?role=root', null, admin)).status, 400);
    assert.equal((await request('GET', '/api/admin/users?limit=101', null, admin)).status, 400);
    const injection = await request('GET', '/api/admin/users?q=' + encodeURIComponent("' OR 1=1 --"), null, admin);
    assert.equal(injection.status, 200); assert.equal(injection.body.total, 0);
    const tableRequest = { table_number: 'DENY-' + Date.now(), capacity: 4 };
    const [[tableCountBefore]] = await pool.query('SELECT COUNT(*) AS total FROM `tables`');
    assert.equal((await request('POST', '/api/tables', tableRequest)).status, 401);
    assert.equal((await request('POST', '/api/tables', tableRequest, customer)).status, 403);
    const rejectedTable = await request('POST', '/api/tables', tableRequest, admin);
    assert.equal(rejectedTable.status, 403);
    assert.equal(rejectedTable.body.error, 'Adding tables is disabled');
    const [[tableCountAfter]] = await pool.query('SELECT COUNT(*) AS total FROM `tables`');
    assert.equal(tableCountAfter.total, tableCountBefore.total);
    const menu = { category_id: 1, name: `Integration ${stamp}`, price: 10.10, description: 'Temporary test item' };
    assert.equal((await request('POST', '/api/menu', menu, customer)).status, 403);
    const created = await request('POST', '/api/menu', menu, admin);
    assert.equal(created.status, 201); const menuId = created.body.data.id; menuIds.push(menuId);
    const [[insertedMenu]] = await pool.execute('SELECT * FROM menu_items WHERE id=?', [menuId]);
    assert.equal(insertedMenu.name, menu.name);
    assert.equal(insertedMenu.price, '10.10');
    assert.equal(insertedMenu.category_id, 1);
    for (const invalid of [{ ...menu, name: '   ' }, { ...menu, price: -1 }, { ...menu, category_id: 2147483647 }]) {
      assert.equal((await request('POST', '/api/menu', invalid, admin)).status, 400);
      assert.equal((await request('PUT', `/api/menu/${menuId}`, invalid, admin)).status, 400);
    }
    const [[afterInvalidMenu]] = await pool.execute('SELECT name, price, category_id FROM menu_items WHERE id=?', [menuId]);
    assert.deepEqual(afterInvalidMenu, { name: menu.name, price: '10.10', category_id: 1 });
    for (const method of ['GET', 'PUT', 'DELETE']) {
      assert.equal((await request(method, '/api/menu/2147483647', method === 'PUT' ? menu : null, admin)).status, 404);
    }
    assert.equal((await request('GET', '/api/menu/1%20OR%201=1')).status, 400);
    const createdOrder = await request('POST', '/api/orders', { items: [{ menu_item_id: menuId, quantity: 3 }] }, customer);
    assert.equal(createdOrder.status, 201); assert.equal(createdOrder.body.data.total, '30.30');
    const orderId = createdOrder.body.data.id;
    assert.equal((await request('PUT', `/api/menu/${menuId}`, { ...menu, price: 20 }, admin)).status, 200);
    const [[updatedMenu]] = await pool.execute('SELECT price FROM menu_items WHERE id=?', [menuId]);
    assert.equal(updatedMenu.price, '20.00');
    const history = await request('GET', `/api/orders/${orderId}`, null, customer);
    assert.equal(history.body.data.items[0].unit_price, '10.10');
    assert.equal((await request('GET', `/api/orders/${orderId}`, null, other)).status, 404);
    assert.equal((await request('PATCH', `/api/admin/orders/${orderId}/status`, { status: 'completed' }, admin)).status, 409);
    for (const status of ['confirmed', 'preparing', 'ready', 'completed']) assert.equal((await request('PATCH', `/api/admin/orders/${orderId}/status`, { status }, admin)).status, 200);
    assert.equal((await request('PATCH', `/api/orders/${orderId}/cancel`, null, customer)).status, 409);
    const [[before]] = await pool.execute('SELECT COUNT(*) AS count FROM orders WHERE user_id=?', [userIds[0]]);
    assert.equal((await request('POST', '/api/orders', { items: [{ menu_item_id: menuId, quantity: 1 }, { menu_item_id: 2147483647, quantity: 1 }] }, customer)).status, 400);
    const [[after]] = await pool.execute('SELECT COUNT(*) AS count FROM orders WHERE user_id=?', [userIds[0]]);
    assert.equal(after.count, before.count);
    const [table] = await pool.execute('INSERT INTO `tables` (table_number, capacity) VALUES (?, 4)', [`IT${Date.now()}`]); tableId = table.insertId;
    const date = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const booking = { table_id: tableId, date, slot: '11:00', guests: 2 };
    assert.equal((await request('POST', '/api/reservations', { ...booking, guests: 5 }, customer)).status, 400);
    const concurrent = await Promise.all([request('POST', '/api/reservations', booking, customer), request('POST', '/api/reservations', booking, customer)]);
    assert.deepEqual(concurrent.map(r => r.status).sort(), [201, 409]);
    const reservationId = concurrent.find(r => r.status === 201).body.data.id;
    assert.equal((await request('DELETE', `/api/tables/${tableId}`, null, admin)).status, 409);
    assert.equal((await request('PUT', `/api/tables/${tableId}`, { table_number: `IT${tableId}`, capacity: 1 }, admin)).status, 409);
    assert.equal((await request('GET', '/api/reservations/my', null, customer)).status, 200);
    const allowedOrigin = await fetch(base + '/api/menu', { headers: { Origin: 'http://localhost:5173' } });
    assert.equal(allowedOrigin.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    assert.equal((await fetch(base + '/api/menu', { headers: { Origin: 'https://untrusted.example' } })).status, 403);
    assert.equal((await fetch(base + '/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad-json' })).status, 400);
    const available = await request('GET', `/api/tables/availability?date=${date}&slot=11:00&guests=2`);
    assert.ok(!available.body.data.some(t => t.id === tableId));
    assert.equal((await request('POST', '/api/orders', { reservation_id: reservationId, items: [{ menu_item_id: menuId, quantity: 1 }] }, other)).status, 400);
    const linkedOrder = await request('POST', '/api/orders', { reservation_id: reservationId, items: [{ menu_item_id: menuId, quantity: 1 }] }, customer);
    assert.equal(linkedOrder.status, 201);
    assert.equal((await request('PATCH', `/api/reservations/${reservationId}/cancel`, null, other)).status, 404);
    assert.equal((await request('PATCH', `/api/reservations/${reservationId}/cancel`, null, customer)).status, 409);
    assert.equal((await request('PATCH', `/api/orders/${linkedOrder.body.data.id}/cancel`, null, customer)).status, 200);
    assert.equal((await request('PATCH', `/api/reservations/${reservationId}/cancel`, null, customer)).status, 200);
    assert.equal((await request('POST', '/api/reservations', booking, customer)).status, 201);
    assert.equal((await request('DELETE', `/api/menu/${menuId}`, null, admin)).status, 204);
    const [[deletedMenu]] = await pool.execute('SELECT deleted_at, is_available FROM menu_items WHERE id=?', [menuId]);
    assert.ok(deletedMenu.deleted_at);
    assert.equal(deletedMenu.is_available, 0);
    assert.ok(!(await request('GET', '/api/menu')).body.data.some(item => item.id === menuId));
    assert.equal((await request('GET', `/api/menu/${menuId}`)).status, 404);
    assert.equal((await request('POST', '/api/orders', { items: [{ menu_item_id: menuId, quantity: 1 }] }, customer)).status, 400);
    assert.equal((await request('GET', `/api/orders/${orderId}`, null, customer)).body.data.items[0].menu_name, menu.name);
    assert.equal((await request('GET', '/api/menu?category_id=1%20OR%201=1')).status, 400);
  } finally {
    // Delete only fixtures created by this test, never truncate application tables.
    for (const userId of userIds) {
      await pool.execute('DELETE oi FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.user_id=?', [userId]);
      await pool.execute('DELETE FROM orders WHERE user_id=?', [userId]);
      await pool.execute('DELETE FROM reservations WHERE user_id=?', [userId]);
      await pool.execute('DELETE FROM users WHERE id=?', [userId]);
    }
    for (const menuId of menuIds) await pool.execute('DELETE FROM menu_items WHERE id=?', [menuId]);
    if (tableId) await pool.execute('DELETE FROM `tables` WHERE id=?', [tableId]);
    await new Promise(resolve => server.close(resolve));
    await pool.end();
  }
});
