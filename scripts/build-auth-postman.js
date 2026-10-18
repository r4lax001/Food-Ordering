import { writeFile } from 'node:fs/promises';
const item = [];
function add(name, method, path, status, body, token, checks = []) {
  item.push({ name, request: { method, url: '{{base_url}}' + path,
    header: [{ key: 'Content-Type', value: 'application/json' }, ...(token ? [{ key: 'Authorization', value: `Bearer ${token}` }] : [])],
    ...(body ? { body: { mode: 'raw', raw: JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } } } : {}),
  }, event: [{ listen: 'test', script: { type: 'text/javascript', exec: [`pm.test('HTTP ${status}', () => pm.response.to.have.status(${status}));`, ...checks] } }] });
}
const account = { name: 'Auth Postman', email: 'auth-postman-{{run_id}}@example.com', password: 'AuthPostman123!' };
add('01 Register', 'POST', '/api/auth/register', 201, account, null, ["pm.test('Customer role', () => pm.expect(pm.response.json().data.role).to.eql('customer'));", "pm.test('No password hash', () => pm.expect(pm.response.json().data).not.to.have.property('password_hash'));", "if (pm.response.code === 201) pm.environment.set('auth_user_id', pm.response.json().data.id);"]);
add('02 Duplicate email', 'POST', '/api/auth/register', 409, account);
for (const [label, values] of [['Empty name', { name: ' ' }], ['Invalid email', { email: 'bad-email' }], ['Short password', { password: 'short' }], ['Cannot register as admin', { role: 'admin' }]]) add(label, 'POST', '/api/auth/register', 400, { ...account, ...values });
const login = { email: account.email, password: account.password };
add('03 Login', 'POST', '/api/auth/login', 200, login, null, ["if (pm.response.code === 200) pm.environment.set('token', pm.response.json().token);", "pm.test('JWT returned', () => pm.expect(pm.response.json().token.split('.')).to.have.lengthOf(3));", "pm.test('No password hash', () => pm.expect(pm.response.json().user).not.to.have.property('password_hash'));"]);
add('04 Wrong password', 'POST', '/api/auth/login', 401, { ...login, password: 'IncorrectPassword123!' });
add('05 Unknown account', 'POST', '/api/auth/login', 401, { ...login, email: 'missing-{{run_id}}@example.com' });
add('06 Valid token', 'GET', '/api/me', 200, null, '{{token}}');
add('07 Missing token', 'GET', '/api/me', 401);
add('08 Invalid token', 'GET', '/api/me', 401, null, 'not-a-valid-token');
add('09 Customer forbidden', 'GET', '/api/admin/orders', 403, null, '{{token}}');
add('10 Admin login', 'POST', '/api/auth/login', 200, { email: '{{admin_email}}', password: '{{admin_password}}' }, null, ["if (pm.response.code === 200) pm.environment.set('admin_token', pm.response.json().token);"]);
add('11 Admin allowed', 'GET', '/api/admin/orders', 200, null, '{{admin_token}}');
const collection = { info: { name: 'Step 4 - Authentication', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json', description: 'Run in order with Food Service Local environment and admin credentials. Creates one customer per run.' },
  event: [{ listen: 'prerequest', script: { type: 'text/javascript', exec: ["if (pm.info.requestName === '01 Register') pm.environment.set('run_id', Date.now().toString());"] } }], item };
await writeFile(new URL('../postman/Authentication.postman_collection.json', import.meta.url), JSON.stringify(collection, null, 2));
console.log(`Authentication collection generated: ${item.length} requests.`);
