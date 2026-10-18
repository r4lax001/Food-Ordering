import { readFile, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { pool, transaction } from '../src/db.js';

// Explicit one-off catalog replacement. Does not change users, tables or order snapshots.
const catalog = JSON.parse(await readFile(new URL('../database/menu-catalog.json', import.meta.url), 'utf8'));
try {
  await transaction(async connection => {
    const [categories] = await connection.query('SELECT * FROM categories FOR UPDATE');
    const [items] = await connection.query('SELECT * FROM menu_items FOR UPDATE');
    const [history] = await connection.query('SELECT * FROM order_items ORDER BY id');
    await mkdir(new URL('../.local/catalog-backups/', import.meta.url), {recursive: true});
    await writeFile(new URL(`../.local/catalog-backups/${Date.now()}.json`, import.meta.url), JSON.stringify({categories, items}, null, 2));
    const oldNames = ['อาหารจานหลัก', 'ของหวาน', 'เครื่องดื่ม'];
    const ids = [];
    for (const [index, name] of catalog.categories.entries()) {
      let row = categories.find(c => c.name === name);
      if (!row) {
        row = categories.find(c => c.name === oldNames[index]);
        if (row) await connection.execute('UPDATE categories SET name=? WHERE id=?', [name, row.id]);
        else {
          const [result] = await connection.execute('INSERT INTO categories (name) VALUES (?)', [name]);
          row = {id: result.insertId};
        }
      }
      ids.push(row.id);
    }
    const retained = [];
    for (const item of catalog.items) {
      const existing = items.find(row => row.name === item.name && !row.deleted_at);
      if (existing) {
        await connection.execute('UPDATE menu_items SET category_id=?, description=?, price=?, is_available=TRUE WHERE id=?', [ids[item.category], item.description, item.price, existing.id]);
        retained.push(existing.id);
      } else {
        const [result] = await connection.execute('INSERT INTO menu_items (category_id, name, description, price) VALUES (?, ?, ?, ?)', [ids[item.category], item.name, item.description, item.price]);
        retained.push(result.insertId);
      }
    }
    // Retired dishes keep their original IDs for historical order references.
    await connection.query(`UPDATE menu_items SET deleted_at=NOW(), is_available=FALSE WHERE deleted_at IS NULL AND id NOT IN (${retained.map(() => '?').join(',')})`, retained);
    const [after] = await connection.query('SELECT * FROM order_items ORDER BY id');
    assert.deepEqual(after, history, 'Order snapshots must remain unchanged');
    const [counts] = await connection.query('SELECT c.name, COUNT(*) AS count FROM menu_items m JOIN categories c ON c.id=m.category_id WHERE m.deleted_at IS NULL GROUP BY c.id, c.name');
    assert.equal(counts.reduce((sum, row) => sum + row.count, 0), 18);
    console.log(JSON.stringify({categories: counts, historicalOrderItemsPreserved: after.length}, null, 2));
  });
} finally { await pool.end(); }
