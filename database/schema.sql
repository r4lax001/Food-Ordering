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
