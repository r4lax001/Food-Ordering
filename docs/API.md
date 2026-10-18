# API Reference

ฉบับขยายที่รวม CRUD โต๊ะ/หมวดหมู่ และ GET /api/reservations/my พร้อม Request/Response อยู่ใน [API-COMPLETE.md](API-COMPLETE.md)

Base URL: `http://127.0.0.1:3000` รับส่ง JSON; POST/PUT/PATCH ที่มี body ใช้ `Content-Type: application/json`

คำขอที่ต้องเข้าสู่ระบบใช้ `Authorization: Bearer <token>` Token ได้จาก login และหมดอายุใน 8 ชั่วโมง การสมัครไม่รับ role และสร้างได้เฉพาะ customer

| Method | Path | สิทธิ์ | หน้าที่ |
|---|---|---|---|
| GET | /api/health | สาธารณะ | ตรวจ API และ MySQL |
| POST | /api/auth/register | สาธารณะ | สมัครสมาชิก |
| POST | /api/auth/login | สาธารณะ | เข้าสู่ระบบ |
| GET | /api/me | สมาชิก | ข้อมูลตนเอง |
| GET | /api/categories | สาธารณะ | หมวดหมู่ |
| GET | /api/menu | สาธารณะ | เมนู; filter category_id, limit, offset |
| GET | /api/menu/:id | สาธารณะ | รายละเอียดเมนู |
| POST | /api/menu | admin | เพิ่มเมนู |
| PUT | /api/menu/:id | admin | แทนที่ข้อมูลเมนู |
| DELETE | /api/menu/:id | admin | soft delete |
| GET | /api/reservation-slots | สาธารณะ | รอบจองและ timezone |
| GET | /api/tables/availability | สาธารณะ | query date, slot, guests (default 1) |
| POST | /api/reservations | สมาชิก | จองโต๊ะ |
| GET | /api/me/reservations | สมาชิก | ประวัติการจองของตน |
| PATCH | /api/reservations/:id/cancel | เจ้าของ | ยกเลิกการจองก่อนเวลาเริ่ม |
| POST | /api/orders | สมาชิก | สร้างคำสั่งซื้อ |
| GET | /api/me/orders | สมาชิก | ประวัติคำสั่งซื้อของตน |
| GET | /api/orders/:id | เจ้าของ/admin | รายละเอียดพร้อมรายการอาหาร |
| PATCH | /api/orders/:id/cancel | เจ้าของ | ยกเลิกออเดอร์ pending |
| GET | /api/admin/orders | admin | คำสั่งซื้อทั้งหมด |
| GET | /api/admin/reservations | admin | การจองทั้งหมด |
| PATCH | /api/admin/orders/:id/status | admin | เปลี่ยนสถานะคำสั่งซื้อ |

รายการเมนู ประวัติ และรายการของ admin ใช้ limit (default 50, สูงสุด 100) และ offset (default 0) รูปแบบ `{ "data": [...], "limit": 50, "offset": 0 }` เมนูที่ปิดขายยังแสดง is_available=0 แต่สั่งไม่ได้; เมนูที่ลบจะไม่แสดง ราคา DECIMAL ส่งเป็น string เช่น `"75.00"` และ boolean ที่อ่านจาก MySQL ส่งเป็น 0/1

## ตัวอย่าง body

สมัครสมาชิก:
```json
{ "name": "Somchai", "email": "somchai@example.com", "password": "YourStrongPassword123!" }
```
Login ใช้เฉพาะ email และ password ผลลัพธ์ `{ "token": "...", "token_type": "Bearer", "user": { "id": 1, "name": "Somchai", "email": "somchai@example.com", "role": "customer", "created_at": "..." } }`

เพิ่ม/แก้ไขเมนู (PUT ต้องส่ง category_id, name, price ใหม่ด้วย):
```json
{ "category_id": 1, "name": "ข้าวผัดไก่", "description": "ข้าวผัดไก่พร้อมผัก", "price": 65, "image_url": null, "is_available": true }
```

จองโต๊ะ: เปลี่ยน date เป็นวันในอนาคตไม่เกิน 90 วัน ตรวจโต๊ะก่อนด้วย `GET /api/tables/availability?date=2026-11-01&slot=11:00&guests=2`
```json
{ "table_id": 1, "date": "2026-11-01", "slot": "11:00", "guests": 2, "note": "ขอเก้าอี้เด็ก" }
```

สั่งอาหาร (reservation_id ไม่บังคับ; ถ้าส่งมาต้องเป็นการจองของตนเองที่ยังไม่เริ่ม):
```json
{ "items": [{ "menu_item_id": 1, "quantity": 2 }, { "menu_item_id": 3, "quantity": 1 }], "note": "เผ็ดน้อย" }
```
Response 201 มี `{ "data": { "id": 1, "reservation_id": null, "total": "195.00", "status": "pending", "items": [...] } }` ไม่รับ total หรือราคาจากลูกค้า รายการไม่เกิน 50 เมนู แต่ละเมนูจำนวน 1–99 และห้าม menu_item_id ซ้ำ

เปลี่ยนสถานะ:
```json
{ "status": "confirmed" }
```
ลำดับ: pending → confirmed → preparing → ready → completed; admin ยกเลิกได้จาก pending หรือ confirmed; customer ยกเลิกได้เฉพาะ pending ไม่ย้อนสถานะ completed/cancelled

การจองใหม่มีสถานะ confirmed ทันที ไม่ต้องรออนุมัติ รายการ completed สงวนไว้ใน schema สำหรับการเพิ่มขั้นตอนเช็กอิน/ปิดการจองภายหลัง ยังไม่มี API สำหรับเปลี่ยนเป็น completed

## HTTP status

200 สำเร็จ, 201 สร้างสำเร็จ, 204 ลบสำเร็จไม่มี body, 400 ข้อมูลไม่ถูกต้อง, 401 ยังไม่ login/token ใช้ไม่ได้, 403 ไม่มีสิทธิ์, 404 ไม่พบหรือไม่ใช่เจ้าของ, 409 ข้อมูลซ้ำ/โต๊ะไม่ว่าง/สถานะขัดแย้ง, 413 body ใหญ่เกิน 100 KB, 429 เกิน 30 คำขอ auth ต่อ 15 นาทีต่อ IP, 503 ฐานข้อมูลใช้ไม่ได้, 500 ข้อผิดพลาดภายใน

ข้อผิดพลาดส่ง `{ "error": "ข้อความอธิบาย" }` ไม่มี stack trace หรือรหัสผ่าน ตัวอย่างจองซ้ำ: `{ "error": "Table is already booked for this slot" }`
