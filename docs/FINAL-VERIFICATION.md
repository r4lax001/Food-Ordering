# ผลตรวจรอบสุดท้าย — 17 ตุลาคม 2026

| รายการ | ผลตรวจจริง |
|---|---|
| ติดตั้ง dependencies ใหม่ด้วย npm ci | ผ่านใน .local/fresh-install (ไม่มี node_modules เดิม) |
| สร้าง schema/seed จากฐานข้อมูลว่าง | ผ่านในฐานข้อมูลทดสอบแยก |
| เริ่ม server หลังติดตั้งใหม่ | ผ่าน; health connected และเมนูตั้งต้น 4 รายการ |
| Unit tests | 6 ผ่าน |
| Integration scenarios | 2 ผ่าน บน MySQL จริง |
| Final Postman Collection ผ่าน Newman | 74 requests / 79 assertions / 0 failures |
| npm audit ของ dependencies API | 0 vulnerabilities ณ วันที่ตรวจ |
| ER Diagram | schema, delivery, provenance และ browser checks ผ่าน; viewer มีปุ่มอังกฤษ |
| ภาพผล Newman | บันทึก HTML/PNG จากรายงานผลจริงแล้ว |
| ภาพ Postman Desktop | ยังไม่มี: เครื่องมือ capture รายงาน FrameArrived timed out |

กรณีที่ตรวจ: register/login, bcrypt hash, อีเมลซ้ำ, token ผิด/หมดอายุ/ลายเซ็นผิด, customer/admin, ownership, CRUD เมนู/หมวดหมู่/โต๊ะ, หมวดหมู่ที่มีเมนูห้ามลบ, ราคา/สถานะผิด, order total/snapshot/rollback, จำนวนที่นั่ง, วันที่/รอบเวลา, จองซ้ำพร้อมกัน, การปิดโต๊ะและลด capacity ขณะมีการจอง, CORS allowlist/preflight, malformed JSON และ ID ที่พยายามแทรก SQL

## หลักฐาน

- [ผล Postman Collection แบบ JSON](evidence/final-postman-results.json)
- [ผลติดตั้งใหม่](evidence/fresh-install.json)
- [รายงานผล Newman](evidence/TEST-REPORT.html)
- [ภาพสรุปผล](evidence/newman-summary.png)
- [ภาพผลทั้งหมด](evidence/newman-full-results.png)
- [ER Diagram](../ER-DIAGRAM.html)

ภาพที่ส่งมอบเป็นภาพรายงาน Newman ไม่ใช่หน้าต่าง Postman หากผู้สอนกำหนดภาพหน้าต่าง Postman ต้องเก็บเพิ่มตาม DEMO.md ส่วนการทดสอบ API และชุด Collection ทำครบและผ่านแล้ว

ไม่มีการทดสอบโหลด การเปิดสาธารณะ หรือ frontend ในขอบเขตนี้ ผล unit/integration เก็บข้อมูลทดสอบเฉพาะรายการแล้วล้าง ส่วน Newman เก็บประวัติรายการทดลองที่ยกเลิกไว้สำหรับตรวจสอบย้อนหลัง
