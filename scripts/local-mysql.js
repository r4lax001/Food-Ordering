import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Dedicated development instance. Never modifies the installed MySQL service.
const root = resolve(import.meta.dirname, '..');
const local = resolve(root, '.local');
const data = resolve(local, 'mysql-data');
const credentialsFile = resolve(local, 'mysql-admin.json');
const executable = process.env.MYSQLD_PATH || 'C:/Program Files/MySQL/MySQL Server 26.7/bin/mysqld.exe';
const connectionOptions = { host: '127.0.0.1', port: 3307, user: 'root' };
await mkdir(local, { recursive: true });
const credentials = existsSync(credentialsFile) ? JSON.parse(await readFile(credentialsFile, 'utf8')) : null;
if (process.argv[2] === 'stop') {
  if (!credentials) throw new Error('No local MySQL credentials found');
  const db = await mysql.createConnection({ ...connectionOptions, password: credentials.rootPassword });
  try { await db.query('SHUTDOWN'); } finally { db.destroy(); }
  console.log('Project MySQL stopped.');
  process.exit(0);
}
if (!existsSync(executable)) throw new Error('Set MYSQLD_PATH to the installed mysqld.exe path.');
if (!existsSync(data)) {
  if (existsSync(resolve(root, '.env'))) throw new Error('Existing .env found. Move it aside before first local setup; no file was overwritten.');
  const init = spawnSync(executable, ['--no-defaults', '--initialize-insecure', `--datadir=${data}`], { windowsHide: true, encoding: 'utf8' });
  if (init.status !== 0) throw new Error(`MySQL initialization failed. ${init.stderr}`);
}
let db;
try { db = await mysql.createConnection({ ...connectionOptions, password: credentials?.rootPassword || '' }); }
catch (error) {
  if (error.code !== 'ECONNREFUSED') throw error;
  const child = spawn(executable, ['--no-defaults', `--datadir=${data}`, '--port=3307', '--bind-address=127.0.0.1', '--mysqlx=0', `--log-error=${resolve(local, 'mysql-error.log')}`], { detached: true, windowsHide: true, stdio: 'ignore' });
  child.unref();
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 500));
    try { db = await mysql.createConnection({ ...connectionOptions, password: credentials?.rootPassword || '' }); break; }
    catch (error) { if (i === 59) throw new Error(`Local MySQL did not start (${error.code}); see .local/mysql-error.log`); }
  }
}
try {
  const [[row]] = await db.query('SELECT @@datadir AS dataDirectory');
  if (resolve(row.dataDirectory).toLowerCase() !== data.toLowerCase()) throw new Error('Port 3307 belongs to another MySQL instance; no changes made.');
  if (!credentials) {
    const appPassword = randomBytes(24).toString('hex');
    const rootPassword = randomBytes(32).toString('hex');
    await db.query("CREATE DATABASE IF NOT EXISTS food_service CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    await db.query("CREATE USER 'food_app'@'127.0.0.1' IDENTIFIED BY ?", [appPassword]);
    await db.query("GRANT ALL PRIVILEGES ON food_service.* TO 'food_app'@'127.0.0.1'");
    await writeFile(credentialsFile, JSON.stringify({ rootPassword }), { flag: 'wx' });
    await db.query("ALTER USER 'root'@'localhost' IDENTIFIED BY ?", [rootPassword]);
    await writeFile(resolve(root, '.env'), `PORT=3000\nDB_HOST=127.0.0.1\nDB_PORT=3307\nDB_USER=food_app\nDB_PASSWORD=${appPassword}\nDB_NAME=food_service\nJWT_SECRET=${randomBytes(48).toString('hex')}\nJWT_EXPIRES_IN=8h\n`, { flag: 'wx' });
    console.log('Created isolated project MySQL, project account, and .env. Passwords are stored locally and excluded from Git.');
  } else {
    const env = dotenv.parse(await readFile(resolve(root, '.env')));
    if (env.DB_PORT !== '3307') console.log('Note: your .env points to another database port.');
  }
  console.log('Project MySQL is ready at 127.0.0.1:3307.');
} finally { await db.end(); }
