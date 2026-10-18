import { mkdir, writeFile } from 'node:fs/promises';
const items = [];
function add(name, method, path, { body, token, status = 200, tests = [] } = {}) {
  items.push({ name, request: { method, header: [{ key: 'Content-Type', value: 'application/json' }, ...(token ? [{ key: 'Authorization', value: `Bearer {{${token}}}` }] : [])], url: '{{base_url}}' + path, ...(body ? { body: { mode: 'raw', raw: JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } } } : {}) }, event: [{ listen: 'test', script: { type: 'text/javascript', exec: [`pm.test('HTTP ${status}', () => pm.response.to.have.status(${status}));`, ...tests] } }] });
}
const save = (key, expression) => `if (pm.response.code < 300) pm.environment.set('${key}', ${expression});`;
add('01 Health: MySQL connection', 'GET', '/api/health', { tests: ["pm.test('Database connected', () => pm.expect(pm.response.json().database).to.eql('connected'));"] });
add('02 GET menu from MySQL', 'GET', '/api/menu', { tests: ["pm.test('Menu is an array', () => pm.expect(pm.response.json().data).to.be.an('array'));"] });
add('03 Categories', 'GET', '/api/categories');
add('04 Register customer', 'POST', '/api/auth/register', { status: 201, body: { name: 'Postman Customer', email: 'postman-{{run_id}}@example.com', password: 'PostmanTest123!' } });
add('05 Customer login', 'POST', '/api/auth/login', { body: { email: 'postman-{{run_id}}@example.com', password: 'PostmanTest123!' }, tests: [save('token', 'pm.response.json().token')] });
add('06 My profile', 'GET', '/api/me', { token: 'token' });
add('07 Admin login', 'POST', '/api/auth/login', { body: { email: '{{admin_email}}', password: '{{admin_password}}' }, tests: [save('admin_token', 'pm.response.json().token')] });
add('08 Customer forbidden from admin', 'GET', '/api/admin/orders', { token: 'token', status: 403 });
const menu = { category_id: 1, name: 'Postman menu {{run_id}}', price: 65, description: 'API test item', is_available: true };
add('09 Create menu', 'POST', '/api/menu', { token: 'admin_token', status: 201, body: menu, tests: [save('menu_id', 'pm.response.json().data.id')] });
add('10 Menu detail', 'GET', '/api/menu/{{menu_id}}');
add('11 Update menu', 'PUT', '/api/menu/{{menu_id}}', { token: 'admin_token', body: { ...menu, price: 70 } });
add('12 Reservation slots', 'GET', '/api/reservation-slots');
add('13 Available tables', 'GET', '/api/tables/availability?date={{booking_date}}&slot=11:00&guests=2', { tests: ["pm.test('A table is available', () => pm.expect(pm.response.json().data.length).to.be.above(0));", save('table_id', 'pm.response.json().data[0]?.id')] });
const booking = { table_id: '{{table_id}}', date: '{{booking_date}}', slot: '11:00', guests: 2 };
add('14 Reserve table', 'POST', '/api/reservations', { token: 'token', status: 201, body: booking, tests: [save('reservation_id', 'pm.response.json().data.id')] });
add('15 Duplicate reservation is rejected', 'POST', '/api/reservations', { token: 'token', status: 409, body: booking });
add('16 My reservations', 'GET', '/api/me/reservations', { token: 'token' });
add('17 Create linked order', 'POST', '/api/orders', { token: 'token', status: 201, body: { reservation_id: '{{reservation_id}}', items: [{ menu_item_id: '{{menu_id}}', quantity: 2 }] }, tests: [save('order_id', 'pm.response.json().data.id'), "pm.test('Server calculated 140 baht', () => pm.expect(pm.response.json().data.total).to.eql('140.00'));"] });
add('18 My orders', 'GET', '/api/me/orders', { token: 'token' });
add('19 Order detail', 'GET', '/api/orders/{{order_id}}', { token: 'token' });
add('20 Cannot cancel reservation with order', 'PATCH', '/api/reservations/{{reservation_id}}/cancel', { token: 'token', status: 409 });
add('21 All orders (admin)', 'GET', '/api/admin/orders', { token: 'admin_token' });
add('22 All reservations (admin)', 'GET', '/api/admin/reservations', { token: 'admin_token' });
add('23 Confirm order', 'PATCH', '/api/admin/orders/{{order_id}}/status', { token: 'admin_token', body: { status: 'confirmed' } });
add('24 Admin cancel confirmed order', 'PATCH', '/api/admin/orders/{{order_id}}/status', { token: 'admin_token', body: { status: 'cancelled' } });
add('25 Cancel reservation', 'PATCH', '/api/reservations/{{reservation_id}}/cancel', { token: 'token' });
add('26 Create standalone order', 'POST', '/api/orders', { token: 'token', status: 201, body: { items: [{ menu_item_id: '{{menu_id}}', quantity: 1 }] }, tests: [save('order_id', 'pm.response.json().data.id')] });
add('27 Customer cancels pending order', 'PATCH', '/api/orders/{{order_id}}/cancel', { token: 'token' });
add('28 Delete menu', 'DELETE', '/api/menu/{{menu_id}}', { token: 'admin_token', status: 204 });
add('29 Deleted menu is hidden', 'GET', '/api/menu/{{menu_id}}', { status: 404 });
add('30 Authentication is required', 'GET', '/api/me', { status: 401 });
const collection = {
  info: { name: 'Food Ordering & Reservation Web Service', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json', description: 'Run in order with Local environment. Creates a test customer and cancelled orders. Requires seeded database and admin credentials.' },
  event: [{ listen: 'prerequest', script: { type: 'text/javascript', exec: ["if (pm.info.requestName === '01 Health: MySQL connection') {", "  pm.environment.set('run_id', Date.now().toString() + Math.random().toString(36).slice(2, 6));", "  pm.environment.set('booking_date', new Date(Date.now() + 7*86400000).toISOString().slice(0,10));", "}"] } }], item: items,
};
const environment = { name: 'Food Service Local', values: Object.entries({ base_url: 'http://127.0.0.1:3000', admin_email: '', admin_password: '', token: '', admin_token: '', run_id: '', booking_date: '', table_id: '', menu_id: '', reservation_id: '', order_id: '' }).map(([key, value]) => ({ key, value, enabled: true, type: /password|token/.test(key) ? 'secret' : 'default' })), _postman_variable_scope: 'environment' };
await mkdir(new URL('../postman/', import.meta.url), { recursive: true });
await writeFile(new URL('../postman/Food-Service.postman_collection.json', import.meta.url), JSON.stringify(collection, null, 2));
await writeFile(new URL('../postman/Local.postman_environment.json', import.meta.url), JSON.stringify(environment, null, 2));
console.log('Postman collection and environment generated (no credentials included).');
