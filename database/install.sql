-- Run using a MySQL account with permissions for food_service.
CREATE DATABASE IF NOT EXISTS food_service CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE food_service;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS menu_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  image_url VARCHAR(1000),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `tables` (
  id INT PRIMARY KEY AUTO_INCREMENT,
  table_number VARCHAR(20) NOT NULL UNIQUE,
  capacity INT NOT NULL CHECK (capacity > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reservations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  table_id INT NOT NULL,
  reservation_date DATE NOT NULL,
  slot CHAR(5) NOT NULL,
  guests INT NOT NULL CHECK (guests > 0),
  status ENUM('confirmed','completed','cancelled') NOT NULL DEFAULT 'confirmed',
  note VARCHAR(500) NOT NULL DEFAULT '',
  active_slot TINYINT GENERATED ALWAYS AS (CASE WHEN status <> 'cancelled' THEN 1 ELSE NULL END) STORED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_table_slot UNIQUE (table_id, reservation_date, slot, active_slot),
  CHECK (slot IN ('11:00','12:30','14:00','17:00','18:30','20:00')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (table_id) REFERENCES `tables`(id),
  INDEX idx_reservation_user (user_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  reservation_id INT NULL,
  total DECIMAL(12,2) NOT NULL CHECK (total >= 0),
  status ENUM('pending','confirmed','preparing','ready','completed','cancelled') NOT NULL DEFAULT 'pending',
  note VARCHAR(500) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (reservation_id) REFERENCES reservations(id),
  INDEX idx_order_user (user_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  menu_item_id INT NOT NULL,
  menu_name VARCHAR(150) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id),
  UNIQUE (order_id, menu_item_id)
) ENGINE=InnoDB;

-- Generated from menu-catalog.json; existing dishes/prices are retained on setup.
INSERT IGNORE INTO categories (name) VALUES ('ข้าวจานเดียว / อาหารแห้ง');
INSERT IGNORE INTO categories (name) VALUES ('ต้มและแกง พร้อมข้าว');
INSERT IGNORE INTO categories (name) VALUES ('เครื่องดื่มสดชื่น');
INSERT INTO menu_items (category_id, name, description, price)
SELECT c.id, 'ข้าวกะเพราไก่', 'ไก่ผัดพริกกระเทียมและใบกะเพรา เสิร์ฟพร้อมข้าวสวย ไม่รวมไข่ดาว', 55.00 FROM categories c
WHERE c.name='ข้าวจานเดียว / อาหารแห้ง' AND NOT EXISTS (SELECT 1 FROM menu_items WHERE name='ข้าวกะเพราไก่');
INSERT INTO menu_items (category_id, name, description, price)
SELECT c.id, 'ข้าวผัดกุ้ง', 'ข้าวผัดไข่กับกุ้ง หอมกลิ่นกระทะ เสิร์ฟพร้อมแตงกวาและมะนาว', 75.00 FROM categories c
WHERE c.name='ข้าวจานเดียว / อาหารแห้ง' AND NOT EXISTS (SELECT 1 FROM menu_items WHERE name='ข้าวผัดกุ้ง');
INSERT INTO menu_items (category_id, name, description, price)
SELECT c.id, 'ข้าวกะเพราหมูสับ', 'หมูสับผัดกะเพราหอม ๆ รสจัดจ้าน เสิร์ฟพร้อมข้าวสวย ไม่รวมไข่ดาว', 60.00 FROM categories c
WHERE c.name='ข้าวจานเดียว / อาหารแห้ง' AND NOT EXISTS (SELECT 1 FROM menu_items WHERE name='ข้าวกะเพราหมูสับ');
INSERT INTO menu_items (category_id, name, description, price)
SELECT c.id, 'ข้าวหมูกระเทียม', 'หมูนุ่มผัดกระเทียมพริกไทย เสิร์ฟพร้อมข้าวสวย', 60.00 FROM categories c
WHERE c.name='ข้าวจานเดียว / อาหารแห้ง' AND NOT EXISTS (SELECT 1 FROM menu_items WHERE name='ข้าวหมูกระเทียม');
INSERT INTO menu_items (category_id, name, description, price)
SELECT c.id, 'ข้าวไก่กระเทียม', 'ไก่ผัดกระเทียมหอม ๆ กินง่าย เสิร์ฟพร้อมข้าวสวย', 55.00 FROM categories c
WHERE c.name='ข้าวจานเดียว / อาหารแห้ง' AND NOT EXISTS (SELECT 1 FROM menu_items WHERE name='ข้าวไก่กระเทียม');
INSERT INTO menu_items (category_id, name, description, price)
SELECT c.id, 'ข้าวผัดหมู', 'ข้าวผัดไข่และหมู เสิร์ฟพร้อมแตงกวาและมะนาว', 60.00 FROM categories c
WHERE c.name='ข้าวจานเดียว / อาหารแห้ง' AND NOT EXISTS (SELECT 1 FROM menu_items WHERE name='ข้าวผัดหมู');
INSERT INTO menu_items (category_id, name, description, price)
SELECT c.id, 'ต้มจืดเต้าหู้หมูสับ + ข้าว', 'น้ำซุปใส เต้าหู้ไข่ หมูสับ และผักกาดขาว รวมข้าวสวย 1 จาน', 70.00 FROM categories c
WHERE c.name='ต้มและแกง พร้อมข้าว' AND NOT EXISTS (SELECT 1 FROM menu_items WHERE name='ต้มจืดเต้าหู้หมูสับ + ข้าว');
INSERT INTO menu_items (category_id, name, description, price)
SELECT c.id, 'ต้มยำไก่น้ำใส + ข้าว', 'เปรี้ยวเผ็ด หอมข่า ตะไคร้ และใบมะกรูด รวมข้าวสวย 1 จาน', 75.00 FROM categories c
WHERE c.name='ต้มและแกง พร้อมข้าว' AND NOT EXISTS (SELECT 1 FROM menu_items WHERE name='ต้มยำไก่น้ำใส + ข้าว');
INSERT INTO menu_items (category_id, name, description, price)
SELECT c.id, 'ต้มยำกุ้งน้ำข้น + ข้าว', 'น้ำต้มยำเข้มข้น หอมมันและรสจัดจ้าน รวมข้าวสวย 1 จาน', 95.00 FROM categories c
WHERE c.name='ต้มและแกง พร้อมข้าว' AND NOT EXISTS (SELECT 1 FROM menu_items WHERE name='ต้มยำกุ้งน้ำข้น + ข้าว');
INSERT INTO menu_items (category_id, name, description, price)
SELECT c.id, 'แกงเขียวหวานไก่ + ข้าว', 'กะทิหอมมัน เนื้อไก่ มะเขือ และโหระพา รวมข้าวสวย 1 จาน', 80.00 FROM categories c
WHERE c.name='ต้มและแกง พร้อมข้าว' AND NOT EXISTS (SELECT 1 FROM menu_items WHERE name='แกงเขียวหวานไก่ + ข้าว');
INSERT INTO menu_items (category_id, name, description, price)
SELECT c.id, 'ชามะนาว', 'ชาหอมเข้ม ตัดด้วยรสเปรี้ยวของมะนาว เสิร์ฟเย็น', 35.00 FROM categories c
WHERE c.name='เครื่องดื่มสดชื่น' AND NOT EXISTS (SELECT 1 FROM menu_items WHERE name='ชามะนาว');
INSERT INTO menu_items (category_id, name, description, price)
SELECT c.id, 'น้ำมะนาว', 'เปรี้ยวหวาน ดื่มคู่กับอาหารรสจัด เสิร์ฟเย็น', 35.00 FROM categories c
WHERE c.name='เครื่องดื่มสดชื่น' AND NOT EXISTS (SELECT 1 FROM menu_items WHERE name='น้ำมะนาว');
INSERT INTO menu_items (category_id, name, description, price)
SELECT c.id, 'น้ำผึ้งมะนาว', 'หอมกลิ่นน้ำผึ้ง เปรี้ยวหวานกลมกล่อม เสิร์ฟเย็น', 40.00 FROM categories c
WHERE c.name='เครื่องดื่มสดชื่น' AND NOT EXISTS (SELECT 1 FROM menu_items WHERE name='น้ำผึ้งมะนาว');
INSERT INTO menu_items (category_id, name, description, price)
SELECT c.id, 'น้ำผึ้งมะนาวโซดา', 'น้ำผึ้งและมะนาวเติมโซดาซ่า เสิร์ฟเย็น', 45.00 FROM categories c
WHERE c.name='เครื่องดื่มสดชื่น' AND NOT EXISTS (SELECT 1 FROM menu_items WHERE name='น้ำผึ้งมะนาวโซดา');
INSERT INTO menu_items (category_id, name, description, price)
SELECT c.id, 'แดงมะนาวโซดา', 'สีสดใส หวานซ่าอมเปรี้ยว เสิร์ฟเย็น', 35.00 FROM categories c
WHERE c.name='เครื่องดื่มสดชื่น' AND NOT EXISTS (SELECT 1 FROM menu_items WHERE name='แดงมะนาวโซดา');
INSERT INTO menu_items (category_id, name, description, price)
SELECT c.id, 'น้ำกระเจี๊ยบ', 'เปรี้ยวหวาน หอมกระเจี๊ยบ เสิร์ฟเย็น', 30.00 FROM categories c
WHERE c.name='เครื่องดื่มสดชื่น' AND NOT EXISTS (SELECT 1 FROM menu_items WHERE name='น้ำกระเจี๊ยบ');
INSERT INTO menu_items (category_id, name, description, price)
SELECT c.id, 'น้ำเก๊กฮวย', 'หอมดอกเก๊กฮวย รสหวานละมุน เสิร์ฟเย็น', 30.00 FROM categories c
WHERE c.name='เครื่องดื่มสดชื่น' AND NOT EXISTS (SELECT 1 FROM menu_items WHERE name='น้ำเก๊กฮวย');
INSERT INTO menu_items (category_id, name, description, price)
SELECT c.id, 'น้ำอัญชันมะนาว', 'สีม่วงสวย เปรี้ยวหวานสดชื่น เสิร์ฟเย็น', 35.00 FROM categories c
WHERE c.name='เครื่องดื่มสดชื่น' AND NOT EXISTS (SELECT 1 FROM menu_items WHERE name='น้ำอัญชันมะนาว');
INSERT IGNORE INTO `tables` (id, table_number, capacity) VALUES
  (1, 'T01', 2), (2, 'T02', 2), (3, 'T03', 4), (4, 'T04', 4), (5, 'T05', 6);
