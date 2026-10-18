# ขั้นที่ 3: CRUD API เมนูอาหาร

แยก endpoint ทั้งหมดไว้ใน `src/routes/menu.routes.js` และเรียกจาก `src/app.js` ด้วย `app.use('/api/menu', menuRoutes)`

| API | ผลสำเร็จ | สิทธิ์ |
|---|---|---|
| GET /api/menu | 200 รายการเมนู | สาธารณะ |
| POST /api/menu | 201 พร้อม ID ใหม่ | admin |
| GET /api/menu/:id | 200 รายละเอียด | สาธารณะ |
| PUT /api/menu/:id | 200 ข้อมูลที่แก้ไข | admin |
| DELETE /api/menu/:id | 204 ไม่มี body | admin |

ตรวจชื่อที่ไม่ว่างหลัง trim, ราคาเป็นตัวเลขมากกว่า 0 และมีทศนิยมไม่เกิน 2 ตำแหน่ง, category_id เป็นจำนวนเต็มบวก และ Foreign Key ใน MySQL ปฏิเสธหมวดหมู่ที่ไม่มีจริงก่อนบันทึก ทุกค่าจากผู้ใช้ส่งผ่าน placeholders `?` ของ mysql2 ไม่ต่อค่าจากผู้ใช้ลงใน SQL โดยตรง

## ทดสอบด้วย Postman

1. เปิด API ด้วย `npm start` หากยังไม่เปิดอยู่
2. Import `postman/Menu-CRUD.postman_collection.json` และ `postman/Local.postman_environment.json`
3. เลือก Food Service Local ตั้ง base_url เป็น `http://127.0.0.1:3000` และใส่ admin_email/admin_password ของตนเอง (บัญชีทดลองของเครื่องนี้อยู่ใน `.local/demo-admin.json`)
4. Run collection ตามลำดับ ระบบ login และเก็บ admin_token/menu_id อัตโนมัติ
5. ตรวจผล 23 requests และ 42 assertions ต้องผ่านทั้งหมด

ชุดทดสอบครอบคลุม CRUD, ชื่อว่าง, ราคาติดลบ, หมวดหมู่ไม่มีจริง, ID ไม่พบใน GET/PUT/DELETE, ข้อมูลที่พยายามแทรก SQL, การแก้/ลบรายการที่ลบไปแล้ว และคำขอเพิ่มเมนูที่ไม่มี token

## ผลทดสอบจริง 17 ตุลาคม 2026

- Unit tests: 6 ผ่าน
- Integration scenario: ผ่าน รวมการอ่าน MySQL โดยตรงหลัง POST/PUT/DELETE และตรวจว่าคำขอผิดไม่เปลี่ยนข้อมูลเดิม
- Postman collection รันด้วย Newman: 23 requests, 42 assertions, 0 failures (ไม่ได้ใช้หน้าต่าง Postman โดยตรง)
- อ่าน MySQL ระหว่างรัน collection: เพิ่มราคา 65.50, แก้เป็น 80.00, คำขอผิดคงราคา 80.00, ลบแล้ว is_available=0 และ deleted_at มีค่า

หลักฐานข้อมูลจริงอยู่ใน `docs/menu-crud-test-results.json` ไม่มี token หรือรหัสผ่าน ส่วน Newman ใช้เป็นเครื่องมือเฉพาะเครื่องใน `.local/postman-tools` ไม่เพิ่มลง dependencies ของ API

## ตรวจ MySQL ด้วยตนเอง

เชื่อม `127.0.0.1:3307`, database `food_service`, บัญชีจาก `.env` แล้วรัน โดยแทน 8 ด้วย menu_id ที่ได้จากการทดสอบของตนเอง:

```sql
SELECT id, name, category_id, price, is_available, deleted_at
FROM menu_items
WHERE id = 8;
```

DELETE เป็น **soft delete**: แถวข้อมูลยังอยู่แต่มี deleted_at และปิดขาย เมนูจะไม่ปรากฏใน GET รายการ และ GET รายตัวตอบ 404 เพื่อให้ประวัติคำสั่งซื้อที่อ้างถึงเมนูเดิมยังอ่านได้
