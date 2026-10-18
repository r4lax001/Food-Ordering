import { readFile, writeFile } from 'node:fs/promises';
const catalog = JSON.parse(await readFile(new URL('../database/menu-catalog.json', import.meta.url), 'utf8'));
const quote = value => `'${value.replaceAll("'", "''")}'`;
let seed = '-- Generated from menu-catalog.json; existing dishes/prices are retained on setup.\n';
for (const name of catalog.categories) seed += `INSERT IGNORE INTO categories (name) VALUES (${quote(name)});\n`;
for (const item of catalog.items) {
  seed += `INSERT INTO menu_items (category_id, name, description, price)\nSELECT c.id, ${quote(item.name)}, ${quote(item.description)}, ${item.price.toFixed(2)} FROM categories c\nWHERE c.name=${quote(catalog.categories[item.category])} AND NOT EXISTS (SELECT 1 FROM menu_items WHERE name=${quote(item.name)});\n`;
}
seed += "INSERT IGNORE INTO `tables` (table_number, capacity) VALUES\n  ('T01', 2), ('T02', 2), ('T03', 4), ('T04', 4), ('T05', 6),\n  ('T06', 2), ('T07', 4), ('T08', 4), ('T09', 6), ('T10', 8);\n";
await writeFile(new URL('../database/seed.sql', import.meta.url), seed);
const schema = await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8');
await writeFile(new URL('../database/install.sql', import.meta.url), '-- Run using a MySQL account with permissions for food_service.\nCREATE DATABASE IF NOT EXISTS food_service CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\nUSE food_service;\n\n' + schema + '\n' + seed);
console.log('Updated seed.sql and install.sql: 3 categories, 18 menu items.');
