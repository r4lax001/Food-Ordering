import { writeFile } from 'node:fs/promises';

const item = [];
function add(name, method, path, status, body, checks = [], authenticated = true) {
  item.push({
    name,
    request: { method, url: '{{base_url}}' + path,
      header: [{ key: 'Content-Type', value: 'application/json' }, ...(authenticated ? [{ key: 'Authorization', value: 'Bearer {{admin_token}}' }] : [])],
      ...(body ? { body: { mode: 'raw', raw: JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } } } : {}),
    },
    event: [{ listen: 'test', script: { type: 'text/javascript', exec: [
      `pm.test('HTTP ${status}', () => pm.response.to.have.status(${status}));`,
      ...(status >= 400 ? ["pm.test('JSON error', () => pm.expect(pm.response.json().error).to.be.a('string'));"] : []), ...checks,
    ] } }],
  });
}
const menu = { category_id: 1, name: 'Menu CRUD {{run_id}}', description: 'Postman test menu', price: 65.50, is_available: true };
add('01 Login admin', 'POST', '/api/auth/login', 200, { email: '{{admin_email}}', password: '{{admin_password}}' }, ["if (pm.response.code === 200) pm.environment.set('admin_token', pm.response.json().token);"], false);
add('02 GET menu list', 'GET', '/api/menu', 200, null, ["pm.test('Menu array', () => pm.expect(pm.response.json().data).to.be.an('array'));"], false);
add('03 POST create menu', 'POST', '/api/menu', 201, menu, ["if (pm.response.code === 201) pm.environment.set('menu_id', pm.response.json().data.id);"]);
add('04 GET menu detail', 'GET', '/api/menu/{{menu_id}}', 200, null, ["pm.test('Inserted price', () => pm.expect(pm.response.json().data.price).to.eql('65.50'));"], false);
add('05 PUT update menu', 'PUT', '/api/menu/{{menu_id}}', 200, { ...menu, name: 'Updated menu {{run_id}}', price: 80 });
add('06 GET updated menu', 'GET', '/api/menu/{{menu_id}}', 200, null, ["pm.test('Updated price', () => pm.expect(pm.response.json().data.price).to.eql('80.00'));"], false);
for (const [label, invalid] of [['negative price', { price: -1 }], ['empty name', { name: '   ' }], ['missing category', { category_id: 2147483647 }]]) {
  add(`Invalid POST ${label}`, 'POST', '/api/menu', 400, { ...menu, ...invalid });
  add(`Invalid PUT ${label}`, 'PUT', '/api/menu/{{menu_id}}', 400, { ...menu, ...invalid });
}
add('07 Invalid changes were not saved', 'GET', '/api/menu/{{menu_id}}', 200, null, ["pm.test('Valid price retained', () => pm.expect(pm.response.json().data.price).to.eql('80.00'));"], false);
for (const method of ['GET', 'PUT', 'DELETE']) add(`Missing ID ${method}`, method, '/api/menu/2147483647', 404, method === 'PUT' ? menu : null);
add('08 Invalid ID / SQL injection input', 'GET', '/api/menu/1%20OR%201=1', 400, null, [], false);
add('09 Invalid category filter', 'GET', '/api/menu?category_id=1%20OR%201=1', 400, null, [], false);
add('10 DELETE menu', 'DELETE', '/api/menu/{{menu_id}}', 204);
add('11 GET deleted menu', 'GET', '/api/menu/{{menu_id}}', 404, null, [], false);
add('12 DELETE already deleted menu', 'DELETE', '/api/menu/{{menu_id}}', 404);
add('13 PUT deleted menu', 'PUT', '/api/menu/{{menu_id}}', 404, menu);
add('14 Unauthenticated creation', 'POST', '/api/menu', 401, menu, [], false);
const collection = {
  info: { name: 'Step 3 - Menu CRUD', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json', description: 'Run all requests in order with Food Service Local environment. Requires seeded categories and admin credentials. DELETE is soft delete.' },
  event: [{ listen: 'prerequest', script: { type: 'text/javascript', exec: ["if (pm.info.requestName === '01 Login admin') pm.environment.set('run_id', Date.now().toString());"] } }],
  item,
};
await writeFile(new URL('../postman/Menu-CRUD.postman_collection.json', import.meta.url), JSON.stringify(collection, null, 2));
console.log(`Menu collection generated: ${item.length} requests.`);
