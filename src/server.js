import { app } from './app.js';
import { config } from './config.js';
import { pool } from './db.js';

try {
  await pool.query('SELECT 1');
  const server = app.listen(config.PORT, '127.0.0.1', () => console.log(`Food Service: http://127.0.0.1:${config.PORT}`));
  const shutdown = () => server.close(async () => { await pool.end(); process.exit(0); });
  process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
} catch (error) {
  console.error(`Cannot start: ${error.code || error.message}. Check MySQL and .env, then run npm run db:setup.`);
  await pool.end(); process.exitCode = 1;
}
