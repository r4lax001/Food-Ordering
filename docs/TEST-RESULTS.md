# ผลตรวจจริง วันที่ 17 ตุลาคม 2026

สภาพแวดล้อม: Windows, Node.js 24.21.0, MySQL 26.7 instance เฉพาะโปรเจกต์ที่ 127.0.0.1:3307

| การตรวจ | ผล |
|---|---|
| npm run db:setup | สร้าง schema และ seed สำเร็จ |
| npm test | 6 tests ผ่านทั้งหมด |
| npm run test:integration | 1 end-to-end scenario ผ่าน ใช้ HTTP และ MySQL จริง |
| Postman collection ผ่าน Newman | 30 requests, 34 assertions ผ่านทั้งหมด |
| npm audit หลังนำเครื่องมือทดสอบชั่วคราวออก | 0 vulnerabilities |

Integration scenario ตรวจการสมัคร/อีเมลซ้ำ, login, สิทธิ์ admin, CRUD เมนู, ราคา snapshot, ห้ามดูออเดอร์คนอื่น, ลำดับสถานะ, rollback เมื่อรายการอาหารผิด, ความจุโต๊ะ, การจองพร้อมกันสองคำขอ (201 และ 409), การผูกออเดอร์กับการจองตนเอง, การยกเลิก, การจองใหม่หลังยกเลิก และ input ที่พยายามแทรก SQL

ได้รันไฟล์ Postman collection จริงด้วย Newman ซึ่งเป็นเครื่องมือรัน collection ไม่ได้ใช้หน้าต่าง Postman โดยตรง หลังทดสอบนำ Newman ออกจาก dependencies เนื่องจาก dependency ทางอ้อมมีรายการช่องโหว่จาก npm audit ไฟล์ collection ยังคงใช้งานกับ Postman Collection Runner ได้ตามปกติ ไม่มี Newman เป็นส่วนหนึ่งของ API ที่ส่งมอบ

ผลนี้ยืนยันการทำงานในสภาพแวดล้อมพัฒนา ไม่ใช่การทดสอบโหลดหรือการตรวจระบบ production ข้อมูลที่เกิดจาก Postman ประกอบด้วยลูกค้าทดลอง ออเดอร์ที่ยกเลิก การจองที่ยกเลิก และเมนูที่ soft delete เพื่อดูประวัติการทำงานได้
