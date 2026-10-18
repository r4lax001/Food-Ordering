import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import { config } from '../src/config.js';

const connection = await mysql.createConnection({
  host: config.DB_HOST, port: config.DB_PORT, user: config.DB_USER,
  password: config.DB_PASSWORD, multipleStatements: true, charset: 'utf8mb4',
});
try {
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`USE \`${config.DB_NAME}\``);
  await connection.query(await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8'));
  await connection.query(await readFile(new URL('../database/seed.sql', import.meta.url), 'utf8'));
  console.log('Database schema and sample data are ready (existing data retained).');
} finally { await connection.end(); }
