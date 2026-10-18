# ลำดับสาธิตและตรวจส่ง

1. เปิด MySQL ด้วย npm run db:local และตั้ง schema ด้วย npm run db:setup
2. เปิด API ด้วย npm start ตรวจ GET /api/health และ GET /api/menu
3. Import Final-Acceptance.postman_collection.json กับ Local.postman_environment.json ใน Postman
4. ใส่ admin_email/admin_password เฉพาะในเครื่อง อ่านจาก .local/demo-admin.json (ห้ามแนบในรายงาน)
5. สาธิต register → login → GET /api/me
6. เลือกเมนูและ POST /api/orders แล้วดู total ที่ server คำนวณ; เปลี่ยนราคาทาง client ไม่ได้
7. GET /api/tables/availability → POST /api/reservations → GET /api/reservations/my
8. ส่งจองเดิมซ้ำเพื่อแสดง 409 และลองจำนวนคนเกิน capacity เพื่อแสดง 400
9. เพิ่มโต๊ะด้วย token customer หรือ admin จะได้ 403; เพิ่มเมนูทำได้เฉพาะ admin
10. ลองลบโต๊ะที่มีการจอง จะได้ 409; ยกเลิกการจองของตนเองก่อน แล้วปิดโต๊ะได้

## การเก็บภาพใน Postman

เปิด Collection Runner แล้วเลือกผล 200/201/400/401/403/409 ที่ต้องการจับภาพ ระวังอย่าให้ช่อง Authorization, รหัสผ่าน หรือ token ใน login response ปรากฏในภาพส่งงาน แนะนำภาพหน้า GET menu, ผลจองซ้ำ 409 และตารางสรุปผลทดสอบ

การทดสอบอัตโนมัติใช้ Newman และมี JSON หลักฐานจริงใน docs/evidence/final-postman-results.json สคริปต์ npm run test:postman สร้าง expired JWT ที่ลงลายเซ็นจริงให้ด้วย; หากรันผ่าน Postman UI ต้องกำหนด expired_token ใน environment เอง มิฉะนั้นคำขอนี้จะถูก skip ไม่ถือว่าทดสอบ expiry ผ่าน

เครื่องมือจับภาพหน้าต่าง Postman ใน session นี้ล้มเหลวด้วย FrameArrived timed out จึงไม่มีภาพจาก Postman UI ให้แอบอ้างว่าเป็นผลของแอป ภาพ/รายงานที่ระบุ Newman เป็นหลักฐานคนละรูปแบบ ต้องเก็บภาพ Postman UI เพิ่มหากอาจารย์บังคับ

## ไฟล์ที่ส่ง

ส่ง source, package.json, package-lock.json, .env.example, README, database/, postman/, docs/ และ ER Diagram ไม่ส่ง node_modules, .env, .local, รหัสผ่านจริง หรือโฟลเดอร์ข้อมูล MySQL
