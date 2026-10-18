# Data Dictionary

สร้างจาก schema ใน MySQL จริง ทุกตารางใช้ InnoDB/utf8mb4; ชนิด BOOLEAN แสดงเป็น tinyint(1) ตาม MySQL

## users

| Column | SQL type | NULL | Default / Generated | Key | ความหมาย |
|---|---|---|---|---|---|
| id | int | NO | AUTO_INCREMENT | pk | รหัสหลักของแถว |
| name | varchar(100) | NO | — |  | ชื่อ |
| email | varchar(190) | NO | — | uk | อีเมลที่ไม่ซ้ำ |
| password_hash | varchar(255) | NO | — |  | bcrypt hash; ห้ามส่งออกใน API |
| role | enum('customer','admin') | NO | customer |  | สิทธิ์ customer/admin |
| created_at | timestamp | NO | CURRENT_TIMESTAMP |  | เวลาสร้าง |

## tables

| Column | SQL type | NULL | Default / Generated | Key | ความหมาย |
|---|---|---|---|---|---|
| id | int | NO | AUTO_INCREMENT | pk | รหัสหลักของแถว |
| table_number | varchar(20) | NO | — | uk | หมายเลขโต๊ะไม่ซ้ำ |
| capacity | int | NO | — |  | จำนวนที่นั่ง |
| is_active | tinyint(1) | NO | 1 |  | เปิดใช้งาน 1/0 |

## reservations

| Column | SQL type | NULL | Default / Generated | Key | ความหมาย |
|---|---|---|---|---|---|
| id | int | NO | AUTO_INCREMENT | pk | รหัสหลักของแถว |
| user_id | int | NO | — | fk → users.id | เจ้าของรายการ |
| table_id | int | NO | — | uk, fk → tables.id | โต๊ะที่จอง |
| reservation_date | date | NO | — | uk | วันที่จองในประเทศไทย |
| slot | char(5) | NO | — | uk | เวลาเริ่มรอบ 90 นาที |
| guests | int | NO | — |  | จำนวนคน |
| status | enum('confirmed','completed','cancelled') | NO | confirmed |  | สถานะตาม ENUM |
| note | varchar(500) | NO | — |  | หมายเหตุ |
| active_slot | tinyint | YES | (case when (`status` <> _utf8mb4\'cancelled\') then 1 else NULL end) | uk | generated: 1 เมื่อไม่ cancelled; NULL เมื่อ cancelled |
| created_at | timestamp | NO | CURRENT_TIMESTAMP |  | เวลาสร้าง |

## orders

| Column | SQL type | NULL | Default / Generated | Key | ความหมาย |
|---|---|---|---|---|---|
| id | int | NO | AUTO_INCREMENT | pk | รหัสหลักของแถว |
| user_id | int | NO | — | fk → users.id | เจ้าของรายการ |
| reservation_id | int | YES | — | fk → reservations.id | การจองที่เกี่ยวข้อง; NULL ได้ |
| total | decimal(12,2) | NO | — |  | ยอดรวม ณ ตอนสั่ง (บาท) |
| status | enum('pending','confirmed','preparing','ready','completed','cancelled') | NO | pending |  | สถานะตาม ENUM |
| note | varchar(500) | NO | — |  | หมายเหตุ |
| created_at | timestamp | NO | CURRENT_TIMESTAMP |  | เวลาสร้าง |

## order_items

| Column | SQL type | NULL | Default / Generated | Key | ความหมาย |
|---|---|---|---|---|---|
| id | int | NO | AUTO_INCREMENT | pk | รหัสหลักของแถว |
| order_id | int | NO | — | uk, fk → orders.id | คำสั่งซื้อ |
| menu_item_id | int | NO | — | uk, fk → menu_items.id | เมนูที่สั่ง |
| menu_name | varchar(150) | NO | — |  | ชื่อเมนู ณ ตอนสั่ง |
| quantity | int | NO | — |  | จำนวน |
| unit_price | decimal(10,2) | NO | — |  | ราคาต่อหน่วย ณ ตอนสั่ง |

## categories

| Column | SQL type | NULL | Default / Generated | Key | ความหมาย |
|---|---|---|---|---|---|
| id | int | NO | AUTO_INCREMENT | pk | รหัสหลักของแถว |
| name | varchar(100) | NO | — | uk | ชื่อ |

## menu_items

| Column | SQL type | NULL | Default / Generated | Key | ความหมาย |
|---|---|---|---|---|---|
| id | int | NO | AUTO_INCREMENT | pk | รหัสหลักของแถว |
| category_id | int | NO | — | fk → categories.id | หมวดหมู่อาหาร |
| name | varchar(150) | NO | — |  | ชื่อ |
| description | text | NO | — |  | รายละเอียดอาหาร |
| price | decimal(10,2) | NO | — |  | ราคาปัจจุบัน (บาท) |
| image_url | varchar(1000) | YES | — |  | URL รูปภาพ HTTP/HTTPS |
| is_available | tinyint(1) | NO | 1 |  | พร้อมจำหน่าย 1/0 |
| deleted_at | datetime | YES | — |  | เวลาลบแบบ soft delete |
| created_at | timestamp | NO | CURRENT_TIMESTAMP |  | เวลาสร้าง |

## ข้อจำกัดร่วม

- reservations UNIQUE(table_id, reservation_date, slot, active_slot) ป้องกันจองซ้ำ และอนุญาตจองใหม่หลัง cancelled
- order_items UNIQUE(order_id, menu_item_id) หนึ่งเมนูต่อหนึ่งบรรทัดในออเดอร์
- categories.name, users.email และ tables.table_number ไม่ซ้ำ
- Foreign keys ใช้ RESTRICT โดยปริยาย ป้องกันลบข้อมูลที่มีการอ้างอิง
- API จำกัด capacity/guests 1–20, quantity 1–99, price > 0 และทศนิยมไม่เกิน 2 ตำแหน่ง
- SQL CHECK เพิ่มข้อจำกัดจำนวนและราคาเป็นบวก พร้อมรายการ slot ที่อนุญาต
