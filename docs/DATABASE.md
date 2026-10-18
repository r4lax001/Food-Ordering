# ขั้นที่ 2: ออกแบบฐานข้อมูล

ฐานข้อมูล `food_service`, InnoDB, utf8mb4 เก็บเงินเป็น DECIMAL และเวลาจองเป็นวันที่กับรอบเวลาไทย

| ตาราง | Primary key | Foreign key | ข้อมูลสำคัญ |
|---|---|---|---|
| users | id | — | name, email UNIQUE, password_hash, role |
| categories | id | — | name UNIQUE |
| menu_items | id | category_id → categories | name, description, price, image_url, is_available, deleted_at |
| tables | id | — | table_number UNIQUE, capacity, is_active |
| reservations | id | user_id → users; table_id → tables | reservation_date, slot, guests, status, note |
| orders | id | user_id → users; reservation_id → reservations (nullable) | total, status, note |
| order_items | id | order_id → orders; menu_item_id → menu_items | menu_name, quantity, unit_price |

ความสัมพันธ์: users 1:N orders และ reservations; categories 1:N menu_items; tables 1:N reservations; reservations 1:N orders; orders 1:N order_items; menu_items 1:N order_items จึงเชื่อม orders กับ menu_items แบบ N:M ผ่าน order_items

`tables` ใช้ backticks ใน SQL เพราะเป็นชื่อที่อาจชนคำสำคัญของระบบ ชื่อและราคาใน order_items เป็น snapshot โดยตั้งใจ เพื่อให้แก้เมนูแล้วประวัติเดิมยังถูกต้อง ไม่เก็บรหัสผ่าน plaintext ใน users

การป้องกันจองซ้ำใช้ UNIQUE(table_id, reservation_date, slot, active_slot) โดย active_slot เป็น generated column = 1 สำหรับรายการที่ไม่ถูกยกเลิก และ NULL เมื่อ cancelled ทำให้ยกเลิกแล้วจองรอบเดิมใหม่ได้ การจองใช้ transaction และล็อกแถวโต๊ะร่วมด้วย

คำสั่งซื้อใช้ transaction ครอบ orders และ order_items หากพบเมนูที่ไม่มี/ปิดขาย จะไม่บันทึกคำสั่งซื้อบางส่วน ใช้ราคาจาก MySQL คำนวณเป็นสตางค์จำนวนเต็มก่อนแปลงกลับเป็น DECIMAL

ดูชนิดข้อมูล ข้อจำกัด และ indexes ฉบับเต็มใน `database/schema.sql`; seed มี 3 หมวดหมู่ 4 เมนู และ 5 โต๊ะ
