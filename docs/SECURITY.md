# การตรวจสอบความปลอดภัย

| ประเด็น | สิ่งที่ใช้ |
|---|---|
| Authentication | JWT HS256 ตรวจ signature, exp, issuer, audience, subject และบัญชีใน MySQL |
| Authorization | requireAdmin อ่าน role ฝั่ง server; register ตั้ง customer เท่านั้น |
| Ownership | การดูออเดอร์/ยกเลิก/ผูกการจองตรวจ user_id ฝั่ง server |
| Password | bcrypt cost 12; ไม่ส่ง password_hash ใน response |
| Request | Zod ตรวจ body/ID/query ที่ API ใช้งาน; จำกัด JSON 100 KB |
| SQL | placeholders ของ mysql2 ทุกค่าผู้ใช้; ชื่อ resource ใน SQL มาจากรายการคงที่ในโค้ด |
| CORS | CORS_ORIGINS เป็นรายชื่อ origin ตรงตัว คั่น comma; ไม่มี wildcard; ไม่ใช้ cookies credentials |
| Error | JSON error กลาง ไม่ส่ง stack trace, SQL หรือข้อมูลเชื่อมต่อ |
| Brute force | register/login รวม 30 requests ต่อ 15 นาทีต่อ IP |
| Headers | Helmet และปิด x-powered-by |
| Consistency | transaction, FK และ unique constraints; ล็อกแถวโต๊ะร่วมกับแก้ไข/ปิดโต๊ะ |
| Secrets | .env และ .local/ อยู่ใน .gitignore; .env.example ไม่มีค่าจริง |

CORS ไม่ใช่ระบบยืนยันตัวตน: Postman ที่ไม่มี Origin เรียกได้ แต่ endpoint ส่วนตัวก็ยังต้องใช้ JWT อยู่ รายชื่อเริ่มต้นอนุญาต http://localhost:5173 และ http://127.0.0.1:5173 เท่านั้น เปลี่ยน CORS_ORIGINS ให้ตรงหน้าเว็บที่จะใช้แล้ว restart API

ข้อจำกัด: localhost development ยังไม่มี HTTPS/reverse proxy, refresh token, server-side token revocation หรือระบบลืมรหัสผ่าน บัญชีที่ถูกลบจะใช้ token ไม่ได้ แต่ไม่มี API logout แบบเพิกถอน token ในขอบเขตนี้
