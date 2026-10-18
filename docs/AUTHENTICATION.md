# ขั้นที่ 4: Authentication

## โครงสร้าง

- `src/routes/auth.routes.js`: POST /api/auth/register และ POST /api/auth/login
- `src/middleware/auth.js`: requireAuth ตรวจ JWT, requireAdmin ตรวจสิทธิ์ และ signToken สร้าง token
- `src/app.js`: เชื่อม router ด้วย `app.use('/api/auth', authRoutes)` และใช้ middleware กับ API ที่ต้อง login
- `src/validation.js`: ตรวจชื่อ อีเมล และรหัสผ่าน
- `database/schema.sql`: users มี email UNIQUE, password_hash และ role ENUM('customer','admin') ใช้ CREATE TABLE IF NOT EXISTS ผ่าน npm run db:setup

ติดตั้ง `bcrypt` และ `jsonwebtoken` แล้ว เปลี่ยนจาก bcryptjs เป็น bcrypt จริง ทั้ง routes และสคริปต์สร้าง admin; hash เดิมยังใช้เข้าสู่ระบบได้

## การสมัครและ login

POST /api/auth/register:
```json
{ "name": "Somchai", "email": "somchai@example.com", "password": "YourStrongPassword123!" }
```

ชื่อต้องไม่ว่างหลัง trim, อีเมลต้องถูกต้องและถูกแปลงเป็นตัวพิมพ์เล็ก, รหัสผ่าน 8–72 ตัวอักษรและไม่เกิน 72 UTF-8 bytes ใช้ bcrypt.hash(password, 12) ก่อน INSERT คอลัมน์ password_hash ไม่เก็บ plaintext การสมัครซ้ำตอบ 409 และไม่เขียนทับบัญชีเดิม การส่ง role ผ่าน register จะถูกปฏิเสธ ทุกบัญชีที่สมัครเองเป็น customer

POST /api/auth/login ใช้เฉพาะ email/password ตรวจด้วย bcrypt.compare() สำเร็จตอบ 200 พร้อม token, token_type และ user โดยไม่มี password_hash รหัสผ่านผิดหรือไม่พบอีเมลตอบ 401 ข้อความเดียวกัน JWT ใช้ HS256, issuer food-service, audience food-client และ subject เป็น user ID อายุเริ่มต้น 8 ชั่วโมง กำหนด secret ผ่าน .env

ส่ง `Authorization: Bearer <token>` เพื่อเรียก GET /api/me; middleware ตรวจลายเซ็น อายุ issuer audience และ subject แล้วโหลดบัญชี/สิทธิ์ล่าสุดจาก MySQL ไม่มี token, token ผิด/หมดอายุ หรือบัญชีถูกลบตอบ 401 ลูกค้าเรียก API admin ตอบ 403 สร้าง admin ผ่าน npm run admin:create ตาม README

## Postman

Import `postman/Authentication.postman_collection.json` และ `postman/Local.postman_environment.json` เลือก Food Service Local ใส่ admin_email/admin_password (บัญชีทดลองอยู่ใน .local/demo-admin.json) แล้ว Run ตามลำดับ จะเก็บ token และ ID อัตโนมัติ สร้างลูกค้าทดลองใหม่หนึ่งบัญชีต่อการรัน

ชุดทดสอบมี 15 คำขอ: สมัคร, อีเมลซ้ำ, ชื่อว่าง, อีเมลผิด, รหัสผ่านสั้น, ป้องกันสมัคร admin, login, รหัสผ่านผิด, บัญชีไม่พบ, token ถูก/ผิด/หาย และสิทธิ์ customer/admin

รัน `npm test` และ `npm run test:integration` เพื่อทดสอบเพิ่ม รวม token หมดอายุ ลายเซ็นผิด subject ผิด บัญชีที่ถูกลบ และตรวจ hash ใน MySQL โดยตรง

ตรวจ MySQL โดยไม่แสดง hash เต็ม:
```sql
SELECT id, name, email, role,
       LEFT(password_hash, 7) AS hash_prefix,
       CHAR_LENGTH(password_hash) AS hash_length
FROM users
ORDER BY id DESC;
```

hash ที่สร้างใหม่จะขึ้นต้น $2b$12$ และยาว 60 ตัวอักษร การยืนยันว่า hash ตรงกับรหัสผ่านใช้ bcrypt.compare ไม่ใช่การถอดรหัส

ผลทดสอบจริงวันที่ 17 ตุลาคม 2026: Unit 6 tests ผ่าน, integration 2 scenarios ผ่าน, Postman collection ผ่าน Newman 15 requests / 19 assertions ไม่มี failure (ไม่ได้กดผ่านหน้าต่าง Postman โดยตรง) ตรวจ MySQL แล้วเก็บเป็น bcrypt hash และ bcrypt.compare ตรงกับรหัสผ่านทดสอบ หลักฐานที่ไม่รวมข้อมูลลับอยู่ใน `docs/auth-test-results.json`
