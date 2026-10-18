import mysql from 'mysql2/promise';
import { config } from './config.js';

export const pool = mysql.createPool({
  host: config.DB_HOST, port: config.DB_PORT, user: config.DB_USER,
  password: config.DB_PASSWORD, database: config.DB_NAME,
  waitForConnections: true, connectionLimit: 10, timezone: '+07:00',
  dateStrings: true, charset: 'utf8mb4',
});

export async function transaction(fn) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await fn(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}
