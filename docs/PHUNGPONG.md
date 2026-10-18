# พุงป่อง — แบรนด์และ frontend

ชื่อไทย: **พุงป่อง** · ชื่ออังกฤษ: **PhungPong**

คำโปรย: **อิ่มอร่อย ส่งไว ถูกใจทุกมื้อ** / **Good Food, Happy Belly.**

## ภาพลักษณ์

ใช้โลโก้จานยิ้มพร้อมช้อนและส้อม (SVG) คู่ชื่อไทย สีส้ม #F45B0B พื้นหลังครีมและการ์ดขาว ตัวอักษร Noto Sans Thai/Inter มี fallback sans-serif เมนูนำทาง footer loading state title metadata และ favicon ใช้ชื่อพุงป่องทั้งหมด หน้าแรกจัดสองคอลัมน์ตามแนวทางอ้างอิงและปรับเป็นหนึ่งคอลัมน์บนมือถือ

## หน้าที่ใช้งานได้

| URL | ความสามารถ / API |
|---|---|
| / | หน้าแรก แสดงเมนูและหมวดหมู่จริง |
| /menu | ค้นหาชื่อเมนู/กรองหมวดหมู่ จาก GET /api/menu |
| /menu/:id | รายละเอียดเมนู เลือกจำนวน ใส่ตะกร้า |
| /cart | ปรับจำนวน ลบสินค้า หมายเหตุ และ POST /api/orders |
| /login, /register | สมัคร/login ผ่าน JWT API เดิม |
| /reservation | วันเวลา จำนวนคน ตรวจโต๊ะว่างและยืนยันการจอง |
| /orders | ประวัติ รายละเอียดออเดอร์ และยกเลิก pending |
| /reservations | ประวัติและยกเลิกการจองก่อนเริ่ม; backend ตรวจเงื่อนไขจริง |
| /admin | CRUD เมนู/หมวดหมู่/โต๊ะ ดูการจอง เปลี่ยนสถานะออเดอร์ |

API client กลางอยู่ใน frontend/src/services/api.js ใช้ Axios และ VITE_API_URL (default /api) เส้นทางที่ต้อง login/admin มี route guard และ backend ตรวจสิทธิ์จริงอีกครั้ง JWT เก็บใน sessionStorage ต่อแท็บ ไม่เก็บรหัสผ่าน ส่วนตะกร้าเก็บใน localStorage และยอดจริงตรวจจากราคาฝั่ง server เมื่อส่งคำสั่งซื้อ Token หมดอายุล้าง session และให้เข้าสู่ระบบใหม่

ราคาแสดงเงินบาทผ่าน Intl.NumberFormat('th-TH') และวันเวลาใช้ th-TH/Asia/Bangkok มีสถานะโหลด ไม่มีข้อมูล ข้อผิดพลาด และข้อความสำเร็จภาษาไทย ใช้ semantic controls, accessible labels, focus states และ reduced-motion

## ข้อจำกัดตาม API จริง

ชุดเมนูร้านอาหารตามสั่งล่าสุด: ข้าวจานเดียว/อาหารแห้ง 6 รายการ, ต้มและแกงพร้อมข้าว 4 รายการ (รวมข้าวสวย 1 จาน) และเครื่องดื่มสดชื่น 8 รายการ รวม 18 รายการ ราคา 30–95 บาท รายละเอียดอยู่ใน `database/menu-catalog.json` เมนูเก่าที่เลิกขายถูก soft delete และประวัติราคาใน order_items ไม่เปลี่ยน ภาพข้าวเป็นภาพประกอบ ส่วนต้มแกงและเครื่องดื่มใช้ภาพวาดประกอบหมวด ไม่ใช่ภาพอาหารจริงแต่ละเมนู

`scripts/build-menu-seed.js` สร้าง seed.sql และ install.sql จากชุดเมนูนี้ การ setup ซ้ำไม่เพิ่มเมนูชื่อเดิม ส่วน `scripts/update-menu-catalog.js` เป็นคำสั่งเปลี่ยนชุดเมนูโดยตั้งใจ จะสำรองข้อมูลหมวดและเมนูไว้ใน .local/catalog-backups แล้วอัปเดตราคา/หมวดและนำเมนูอื่นออกจากรายการขาย จึงไม่ควรรันซ้ำหลังมีการปรับเมนูร้านเองหากไม่ต้องการคืนชุดนี้

- ร้านเดียว จึงแสดงเมนูแนะนำแทนการสร้างร้านอาหารปลอม
- รับและชำระเงินที่ร้าน ยังไม่มีจัดส่ง/รับเงินจริงออนไลน์ แม้คำโปรยแบรนด์สื่อเรื่องส่งไว
- ไม่มีส่วนลดจริง รีวิวลูกค้า คะแนน/เวลาจัดส่ง หรือแอปมือถือ จึงไม่แสดงคำรับรองหรือปุ่มดาวน์โหลดที่ไม่มีบริการรองรับ
- ระบบ admin แสดงโต๊ะที่เปิดใช้ตาม API เดิม และดูการจองได้ แต่การยกเลิกยังเป็นสิทธิ์เจ้าของ
- หน้าเมนู/ประวัติ/admin โหลดสูงสุด 100 รายการตามขอบเขตโปรเจกต์นี้
- ภาพอาหารเป็นภาพประกอบจาก Unsplash ไม่ยืนยันว่าเป็นภาพเมนูจริง และมี SVG fallback เมื่อโหลดไม่ได้ Fonts จาก Google Fonts ต้องใช้อินเทอร์เน็ต
- เมื่อราคาจริงเปลี่ยนจากราคาที่ค้างในตะกร้า backend ใช้ราคาใหม่ และ UI แสดงยอดจริงหลังสำเร็จ (ก่อนยืนยันแสดงว่าเป็นยอดประมาณ)

## ไฟล์สำคัญ

frontend/src/main.jsx: layout/navigation/routes; pages.jsx: ลูกค้า; admin.jsx: ผู้ดูแล; components.jsx: shared UI; state.jsx: session/cart; styles.css: theme; responsive.css: การจัดวางตามขนาดจอ; components/reui/: Badge, Alert, Number Field; services/api.js: API; public/logo.svg: โลโก้

ไม่เปลี่ยนชื่อฐานข้อมูล เส้นทาง API การตรวจ JWT หรือสิทธิ์ backend ไม่มีคีย์ฐานข้อมูลหรือ JWT_SECRET ใน frontend

## ผลตรวจหน้าเว็บจริง

- Production build ผ่าน และ npm audit ของ frontend ไม่พบช่องโหว่ในวันที่ตรวจ
- ตรวจ Chrome viewport 1440×1050 และ 390×844 ไม่มี horizontal overflow
- ทดสอบค้นหา/เพิ่มตะกร้า → สมัครสมาชิก → login → ยืนยันสั่งอาหาร → ดูรายละเอียด → ยกเลิก ผ่าน API จริง
- ทดสอบเลือกวัน/โต๊ะ → จอง → ประวัติ → ยกเลิก ผ่าน API จริง
- ตรวจ route guard /admin และ login admin → เพิ่ม/ลบหมวดหมู่ สำเร็จ
- ภาพอาหารโหลดครบ และไม่พบ pageerror ระหว่าง flow ที่ตรวจ
- ตรวจ navbar mobile และการนำทางเมนูอาหารสำเร็จ

หลักฐาน: [ผลตรวจ](evidence/phungpong/checks.json), [Desktop](evidence/phungpong/desktop.png), [Mobile](evidence/phungpong/mobile.png), [Orders](evidence/phungpong/orders.png)

ระหว่างตรวจพบ MySQL instance สำหรับพัฒนาหยุดทำงาน จึงเปิด instance เดิมกลับมาที่พอร์ต 3307 แล้วทดสอบใหม่จนผ่าน ไม่ได้แก้ schema หรือข้อมูลบัญชีเดิม

## ปรับ Responsive และเพิ่ม ReUI — 18 ตุลาคม 2569

- ปรับหน้าหลัก เมนู รายละเอียดอาหาร ตะกร้า แบบฟอร์มสมาชิก จองโต๊ะ ประวัติ และหน้าผู้ดูแล ให้ใช้พื้นที่ตามขนาดหน้าจอ
- จอกว้างจำกัดความกว้างเนื้อหาเพื่อให้อ่านง่าย แท็บเล็ตย้ายส่วนแนะนำลงด้านล่าง มือถือปรับฟอร์มเป็นคอลัมน์เดียวและแยกราคากับปุ่มในตะกร้า
- ปุ่มหลัก/เพิ่มอาหาร/ปรับจำนวน/เปิดเมนูมีพื้นที่แตะอย่างน้อย 44px ช่องกรอกข้อมูลใช้ขนาดตัวอักษร 16px
- ใช้ source จาก ReUI registry จริง: Badge สำหรับสถานะ, Alert สำหรับข้อผิดพลาด, Number Field สำหรับจำนวนอาหาร พร้อมสีแบรนด์พุงป่อง
- เมนูมือถือใช้ Base UI Dialog รองรับ Tab, Escape, กดด้านนอกเพื่อปิด และคืน focus กลับปุ่มเปิดเมนู ปิดอัตโนมัติเมื่อเลือกหน้าและเมื่อขยายจอเป็น desktop
- ผ่าน 146 layout checks ใน Chrome ที่ 320, 360, 390, 430, 560, 768, 820, 1024, 1280, 1440, 1920 และ 2560px รวมหน้า admin/จองโต๊ะหลังเข้าสู่ระบบ ไม่พบเนื้อหาหลักล้นจอ
- ทดสอบจำนวนอาหาร 1–99, สถานะไม่มีข้อมูล/ผิดพลาด, เมนูคีย์บอร์ด และทดสอบ flow สมัครสมาชิก→สั่งอาหาร→ยกเลิก, จองโต๊ะ→ยกเลิก, เพิ่ม/ลบหมวดหมู่ซ้ำหลังปรับ UI ผ่านทั้งหมด
- ผลนี้เป็นการจำลอง viewport ใน Chrome ไม่ใช่การตรวจอุปกรณ์จริงทุกยี่ห้อหรือ Safari

รันทดสอบซ้ำ: `npm --prefix frontend run test:responsive` (เปิด API/MySQL/frontend และมี Chrome ติดตั้ง)

[ผลตรวจ 146 รายการ](evidence/responsive/checks.json) · [มือถือ](evidence/responsive/home-390.png) · [แท็บเล็ต](evidence/responsive/home-768.png) · [เดสก์ท็อป](evidence/responsive/home-1440.png) · [ตะกร้า](evidence/responsive/cart-390.png) · [รายละเอียด ReUI และที่มา](../frontend/REUI.md)

## ตกแต่งด้วย React Bits — 18 ตุลาคม 2569

เพิ่มคอมโพเนนต์จาก [React Bits](https://reactbits.dev) รุ่นฟรี (สัญญาอนุญาต MIT + Commons Clause ดูที่ `frontend/src/components/reactbits/LICENSE.md`) เก็บซอร์สโค้ดไว้ในโปรเจกต์ที่ `frontend/src/components/reactbits/` ปรับเล็กน้อย 2 จุดคือ BlurText เรนเดอร์เป็น `<span>` แทน `<p>` เพื่อไม่ให้โดนสไตล์ย่อหน้าของเว็บและไม่ผิดหลัก HTML ใน h1/h2 และเปลี่ยน display เป็น inline-flex ให้ข้อความไหลบรรทัดเดียวกัน

- ClickSpark — ประกายสีส้มพุ่งทุกครั้งที่คลิก ครอบทั้งแอปใน `main.jsx`
- BlurText (ผ่าน `AnimatedHeading`) — หัวข้อทุกหน้าค่อย ๆ เบลอเข้ามา
- GradientText — คำว่า "พุงป่อง" ใน hero หน้าแรกเป็นเกรเดียนต์ส้มไหล
- StarBorder — ปุ่ม CTA หลัก (จองโต๊ะ / สั่งอาหาร / เพิ่มลงตะกร้า / ยืนยันคำสั่งซื้อ) มีดาววิ่งรอบขอบ
- ShinyText — ลิงก์ "ดูทั้งหมด" และหัวข้อเล่า (eyebrow) มีแสงวาบ
- AnimatedContent — ส่วนเมนูแนะนำ ตะกร้า ฟอร์มจองโต๊ะ เลื่อนเข้าฉากเมื่อ scroll
- CountUp — ตัวเลขสถิติบนแดชบอร์ดผู้ดูแลนับจาก 0

dependencies เพิ่ม: `gsap`, `@gsap/react` (SplitText/AnimatedContent), `motion` (BlurText/CountUp) — ติดตั้งแล้วใน `frontend/package.json` ทุกคอมโพเนนต์เคารพ `prefers-reduced-motion` ยกเว้นการหมุนเพลาของจาน 3D ที่เจ้าของเว็บกำหนดให้หมุนตลอด

ผลตรวจ: production build ผ่าน, Playwright responsive 146 จุดผ่าน, `frontend/tests/food3d.mjs` ผ่าน (ปรับ locator เป็น `.food3d-stage canvas` เพราะปุ่ม StarBorder มี canvas ของตัวเอง)
