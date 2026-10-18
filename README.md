# พุงป่อง (PhungPong)

**อิ่มอร่อย ส่งไว ถูกใจทุกมื้อ · Good Food, Happy Belly.**

เว็บไซต์สั่งอาหารและจองโต๊ะ แบรนด์สีส้ม–ครีม ประกอบด้วย REST API (Node.js + Express + MySQL) และ frontend (React + Vite + Tailwind) ใน `frontend/` พร้อมจานอาหาร 3D หมุนได้บนหน้าแรก

## ความสามารถ

- **ลูกค้า** — ดูเมนู/ค้นหา/กรองหมวดหมู่, หน้ารายละเอียดเมนู, ตะกร้าและสั่งอาหาร, จองโต๊ะพร้อมเลือกโต๊ะจากผังร้าน 3D, ดูประวัติคำสั่งซื้อ/การจอง, ยกเลิกรายการ, สมัครสมาชิก/เข้าสู่ระบบ (JWT)
- **ผู้ดูแลร้าน** — แดชบอร์ดภาพรวม (ออเดอร์ค้าง/การจองวันนี้/เมนูพร้อมขาย/โต๊ะ), จัดการเมนู หมวดหมู่ โต๊ะ, เปลี่ยนสถานะคำสั่งซื้อตาม state machine, ดูการจองจัดกลุ่มตามวัน, จัดการผู้ใช้
- **ของตกแต่ง** — จานคลุม 3D หมุนเพลาตลอด เปิดฝาเผยข้าวกะเพราไก่พร้อมไอน้ำและประกายวิบวับ (React Three Fiber), ผังร้าน 3D เลือกโต๊ะ, หัวข้อเคลื่อนไหวและปุ่มมีดาววิ่งจาก React Bits, หน้าเว็บ responsive ครบมือถือถึงจอกว้าง

รอบจอง 90 นาที ชำระเงินที่ร้าน ไม่มีระบบรับเงินออนไลน์หรือจัดส่ง (ขอบเขตที่ตกลงใช้)

## เปิดเว็บไซต์พุงป่อง

```powershell
npm ci
npm run db:local
npm run db:setup
npm start
```

เปิดอีก terminal ที่โฟลเดอร์โปรเจกต์:

```powershell
npm --prefix frontend ci
npm run frontend:dev
```

เปิด http://127.0.0.1:5173 — หน้าเว็บเรียก API ผ่าน Vite proxy ไปยัง http://127.0.0.1:3000 โดยไม่เปลี่ยน endpoints, schema หรือ auth ของ backend

สร้าง production frontend ด้วย `npm run frontend:build` ได้ไฟล์ใน `frontend/dist` เมื่อนำไปใช้งานจริงต้องกำหนด reverse proxy `/api` หรือ `VITE_API_URL` ให้ชี้ backend และกำหนด CORS_ORIGINS ให้ตรง origin หน้าเว็บ รวมถึงตั้ง SPA fallback ไป index.html

ดู [รายละเอียด frontend และแบรนด์](docs/PHUNGPONG.md) สำหรับความสามารถ ข้อจำกัด และผลทดสอบ รวมถึง [จานอาหาร 3D](docs/FOOD-3D.md), [ผังร้านเลือกโต๊ะ 3D](docs/RESTAURANT-3D.md), [หลังบ้านผู้ดูแล](docs/ADMIN-UI.md) และ [ส่วนประกอบ ReUI](frontend/REUI.md) หน้าลูกค้าและ admin ใช้ข้อมูลจาก MySQL จริง การสั่งอาหารปัจจุบันเป็นรับและชำระที่ร้าน ยังไม่มี payment gateway หรือบริการจัดส่งออนไลน์

หน้าเว็บใช้ ReUI Badge, Alert และ Number Field และตกแต่งด้วยคอมโพเนนต์ [React Bits](https://reactbits.dev) รุ่นฟรี (BlurText, GradientText, StarBorder, ShinyText, AnimatedContent, CountUp, ClickSpark — ซอร์สเก็บใน `frontend/src/components/reactbits/` พร้อม LICENSE) พร้อม responsive สำหรับมือถือ แท็บเล็ต และจอกว้าง ดู [ส่วนประกอบและวิธีทดสอบ](frontend/REUI.md) หรือรัน `npm --prefix frontend run test:responsive` หลังเปิดระบบ เพื่อตรวจ 12 ขนาดหน้าจอใน Chrome

ระบบ REST API สำหรับร้านอาหารหนึ่งร้าน เขียนด้วย Node.js + Express + MySQL

## โครงสร้างเทคโนโลยี

| ส่วน | เทคโนโลยี |
|---|---|
| Backend | Node.js 22, Express 5, MySQL (mysql2), JWT + bcrypt, zod, helmet, express-rate-limit |
| Frontend | React 19, Vite 6, Tailwind CSS 4, React Router 7, axios, React Three Fiber + three.js, React Bits, ReUI, lucide-react |
| ฐานข้อมูล | MySQL เฉพาะโปรเจกต์บน port 3307 (สครีมต์ใน `database/`) |
| ทดสอบ | node:test (unit + integration), Playwright (UI/3D/responsive), Postman/Newman |

## ขอบเขตที่ตกลงใช้ในโปรเจกต์นี้

ขอบเขตเดิมคือ backend API, ฐานข้อมูล SQL, Postman Collection และเอกสาร ต่อมาเพิ่ม frontend พุงป่องตามภาพอ้างอิงและคำขอแบรนด์ โดยเก็บระบบ backend เดิมไว้

รองรับลูกค้าและผู้ดูแลร้าน: สมัครสมาชิก/เข้าสู่ระบบ, ดูเมนูและหมวดหมู่, CRUD เมนูสำหรับผู้ดูแล, สั่งอาหาร/ดูประวัติ/ยกเลิก, จองโต๊ะ/ตรวจโต๊ะว่าง/ดูประวัติ/ยกเลิก และจัดการสถานะคำสั่งซื้อ ชำระเงินที่ร้าน ไม่มีระบบรับเงินจริงหรือเดลิเวอรี

## เริ่มใช้งานบนเครื่องนี้

เตรียม Node.js 22 ขึ้นไป และติดตั้ง dependencies:

```powershell
npm ci
npm run db:local
npm run db:setup
npm start
```

เปิด <http://127.0.0.1:3000/api/menu> เพื่อดูข้อมูลเมนูจาก MySQL หรือ <http://127.0.0.1:3000/api/health> เพื่อตรวจการเชื่อมต่อ

ในเครื่องที่จัดทำโปรเจกต์นี้ ได้สร้าง `.env`, schema และข้อมูลตัวอย่างไว้แล้ว `db:local` จะเปิด MySQL เฉพาะโปรเจกต์ที่ `127.0.0.1:3307` ใช้โฟลเดอร์ `.local/mysql-data` และไม่แก้ไข Windows service เดิมที่พอร์ต 3306 หากเปิดอยู่แล้วคำสั่งจะตรวจสอบและใช้ต่อ

MySQL นี้เป็นโปรเซสสำหรับพัฒนา ไม่ได้ติดตั้งเป็น Windows service หลังรีสตาร์ตเครื่องให้รัน `npm run db:local` อีกครั้ง หยุดด้วย `npm run db:stop` หยุด API ด้วย Ctrl+C ในหน้าต่างที่รัน `npm start`

สคริปต์ตั้งต้นใช้ `C:/Program Files/MySQL/MySQL Server 26.7/bin/mysqld.exe` หากอยู่ที่อื่นให้กำหนด `$env:MYSQLD_PATH` ก่อนใช้ `db:local` ต้องใช้ MySQL ที่รองรับ schema นี้ (ทดสอบกับ MySQL 26.7)

## ใช้ MySQL ของตนเองแทน

1. คัดลอก `.env.example` เป็น `.env` เฉพาะเมื่อยังไม่มีไฟล์ ห้ามทับค่าที่ใช้งานอยู่
2. ให้ผู้ดูแล MySQL สร้างฐานข้อมูล `food_service` และบัญชี `food_app` ที่มีสิทธิ์ในฐานข้อมูลนี้ โดยใช้ `database/create-user.example.sql` เป็นตัวอย่าง
3. ใส่ host, port, user, password และ JWT secret แบบสุ่มอย่างน้อย 32 ตัวอักษรใน `.env`
4. รัน `npm run db:setup` และ `npm start`

`db:setup` สร้างตารางและเพิ่มข้อมูลตั้งต้นโดยไม่ลบข้อมูลเดิม ไม่ใช่ระบบ migration สำหรับเปลี่ยน schema ที่มีอยู่

## บัญชีผู้ดูแล

บัญชีผู้ใช้ที่สมัครผ่าน API จะเป็น `customer` เสมอ สร้างผู้ดูแลได้ด้วยการตั้งค่า `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` ใน `.env` แล้วรัน:

```powershell
npm run admin:create
```

ใช้รหัสผ่านอย่างน้อย 8 ตัวอักษร ไม่เกิน 72 UTF-8 bytes และลบ `ADMIN_PASSWORD` ออกจาก `.env` หลังสร้างเสร็จ ระบบไม่เปลี่ยนสิทธิ์หรือรีเซ็ตรหัสผ่านของบัญชีเดิมเมื่ออีเมลซ้ำ

สำหรับการทดลองบนเครื่องนี้ บัญชีผู้ดูแลที่สร้างไว้จะอยู่ใน `.local/demo-admin.json` อย่าส่งไฟล์นี้หรือ `.env` ไปกับงาน/ขึ้น Git

## ทดสอบ

```powershell
npm test
npm run test:integration
```

- Unit tests ตรวจเงิน วันที่จอง การตรวจข้อมูล และสถานะคำสั่งซื้อ
- Integration test เปิด API ชั่วคราวเองและใช้ MySQL จริงตาม `.env` สร้างข้อมูลเฉพาะการทดสอบแล้วลบเฉพาะข้อมูลนั้นเมื่อจบ ควรใช้ฐานข้อมูลพัฒนาเท่านั้น
- Postman Collection Runner ต้องเปิด API ไว้ก่อน และใช้บัญชีใน `.local/demo-admin.json` โดยสร้างข้อมูลทดลองไว้ในระบบสำหรับดูผล

เปิด Postman แล้ว Import `postman/Food-Service.postman_collection.json` และ `postman/Local.postman_environment.json` เลือก environment `Food Service Local` ใส่ `admin_email`, `admin_password` แล้ว Run collection ตามลำดับ Token และ ID จะถูกเก็บอัตโนมัติ ตั้ง `run_id` ให้ไม่ซ้ำเมื่อรันใหม่ (สคริปต์ก่อนเริ่ม collection ทำให้แล้ว)

ฉบับส่งงานใช้ `postman/Final-Acceptance.postman_collection.json` ซึ่งครอบคลุมส่วนใหม่และบันทึกตัวอย่าง Response จริง (ปิดบังข้อมูลลับ) ถ้าต้องการรันอัตโนมัติในเครื่อง:

```powershell
node scripts/create-demo-admin.js
npm install --prefix .local/postman-tools newman
npm run test:postman
```

Newman เป็นเครื่องมือทดสอบแยกใน .local ไม่ใช่ dependency ของ API สคริปต์เปิด API ชั่วคราวเอง และสร้าง expired JWT สำหรับทดสอบโดยไม่ส่ง JWT_SECRET ไปใน collection ระหว่างรันทดสอบ CORS ใช้ค่าเริ่มต้น localhost:5173

เอกสารส่งงาน: [ER Diagram](ER-DIAGRAM.html), [Data Dictionary](docs/DATA-DICTIONARY.md), [API ฉบับเต็ม](docs/API-COMPLETE.md), [ความปลอดภัย](docs/SECURITY.md), [ลำดับสาธิต](docs/DEMO.md), [หลังบ้านผู้ดูแล](docs/ADMIN-UI.md) และ [ผลตรวจรอบสุดท้าย](docs/FINAL-VERIFICATION.md) ตัว viewer ของ ER Diagram ใช้ปุ่มภาษาอังกฤษ ส่วนหัวข้อเป็นภาษาไทย

## โครงสร้างไฟล์

```text
src/          API, authentication, validation, database connection
src/routes/   Express Router แยกตามส่วนงาน (menu.routes.js สำหรับ CRUD เมนู)
src/middleware/ ตรวจ JWT และสิทธิ์ customer/admin
database/     schema, seed, ตัวอย่างสร้างบัญชี MySQL
scripts/      ตั้งค่าฐานข้อมูล, สร้างผู้ดูแล, จัดการ MySQL สำหรับพัฒนา
postman/      Collection และ Environment ที่ไม่มีรหัสผ่านจริง
test/         Unit และ integration tests
docs/         ขอบเขต, ออกแบบฐานข้อมูล, API และรายงาน
.local/       ข้อมูล MySQL และรหัสผ่านเฉพาะเครื่อง (ไม่ส่งงาน/ไม่ขึ้น Git)
```

อ่านรายละเอียดใน [ขอบเขต](docs/SCOPE.md), [ฐานข้อมูล](docs/DATABASE.md), [API](docs/API.md), [รายงาน](docs/REPORT.md)

ขั้นที่ 3: ทดสอบ CRUD เมนูโดย Import `postman/Menu-CRUD.postman_collection.json` พร้อม environment เดิม ใส่ admin_email/admin_password แล้ว Run collection ตามลำดับ มี 23 คำขอรวมกรณีผิด ดูผลและวิธีตรวจ MySQL ใน [MENU-CRUD.md](docs/MENU-CRUD.md)

ขั้นที่ 4: ระบบ Authentication อยู่ใน `src/routes/auth.routes.js` และ `src/middleware/auth.js` ใช้ bcrypt และ jsonwebtoken ทดสอบด้วย `postman/Authentication.postman_collection.json` มี 15 คำขอ ดูรายละเอียดใน [AUTHENTICATION.md](docs/AUTHENTICATION.md)

## กติกาสำคัญ

- รอบจอง 90 นาที เวลาไทย: 11:00, 12:30, 14:00, 17:00, 18:30, 20:00 จองล่วงหน้าไม่เกิน 90 วัน หนึ่งการจองใช้หนึ่งโต๊ะ
- ฐานข้อมูลบังคับไม่ให้โต๊ะเดียวกันมีการจองที่ไม่ถูกยกเลิกซ้ำวันและรอบเดียวกัน
- backend คำนวณราคาจากฐานข้อมูล และบันทึกชื่อ/ราคาตอนซื้อไว้ในรายการอาหาร
- รายการอาหารที่ลบเป็น soft delete เพื่อรักษาประวัติคำสั่งซื้อ
- ลูกค้ายกเลิกได้เฉพาะคำสั่งซื้อ `pending`; การจองต้องยังไม่เริ่ม และต้องยกเลิกคำสั่งซื้อที่ผูกอยู่ก่อน
- Access token อายุ 8 ชั่วโมง ไม่มี refresh token หรือ logout ที่เพิกถอน token ฝั่ง server ในขอบเขตนี้
- API ผูกกับ localhost; CORS อนุญาต localhost:5173 และ 127.0.0.1:5173 เริ่มต้น ปรับรายชื่อ origin ตรงตัวใน CORS_ORIGINS ได้
- pagination ใช้ `limit` (1–100, default 50) และ `offset` ในรายการเมนู ประวัติ และรายการผู้ดูแล
