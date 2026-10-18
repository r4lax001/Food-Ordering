import { readFile, writeFile } from 'node:fs/promises';
const c=JSON.parse(await readFile('postman/Final-Acceptance.postman_collection.json','utf8'));
const seen=new Set();
let out='# API Documentation — ฉบับส่งงาน\n\nBase URL: `http://127.0.0.1:3000` รับส่ง JSON; POST/PUT/PATCH ใช้ Content-Type: application/json\n\nBearer token จาก /api/auth/login ใช้กับ endpoints สมาชิก ส่วน admin ตรวจ role ใน MySQL ทุกคำขอ ราคาที่อ่านจาก MySQL เป็น string แบบ DECIMAL, boolean เป็น 0/1 การส่งราคาใช้ JSON number และสถานะใช้ JSON boolean\n\nรายการรองรับ limit 1–100 (default 50), offset >= 0 ในเมนู โต๊ะ หมวดหมู่ ประวัติ และรายการ admin\n\nตัวอย่าง Response ด้านล่างเก็บจากการทดสอบจริง ID/วันเวลาเป็นข้อมูลทดสอบ ไม่ใช่ค่าที่ต้องใช้ซ้ำ Token/ข้อมูลลับถูกปิดบัง\n\n';
for(const item of c.item){
 const req=item.request;
 const url=req.url.replace('{{base_url}}','').replace(/\{\{(?:final_)?(?:menu|table|category|reservation|order)_id\}\}/g,':id');
 if(/2147483647|%20|does-not-exist/.test(url) || req.method==='OPTIONS')continue;
 const key=req.method+' '+url.split('?')[0];if(seen.has(key))continue;seen.add(key);
 const authHeader=req.header.find(h=>h.key==='Authorization');
 const role=authHeader?.value.includes('admin_token')?'Admin':authHeader?'สมาชิก / เจ้าของรายการ':'สาธารณะ';
 out+=`## ${key}\n\nสิทธิ์: ${role}\n\n`;
 if(url.includes('?'))out+=`Query: \`${url.split('?')[1]}\`\n\n`;
 if(req.body)out+='Request body:\n```json\n'+req.body.raw+'\n```\n\n';
 else out+='Request body: ไม่มี\n\n';
 const response=item.response?.[0];
 if(response) out+=`Response ${response.code}:\n`+(response.body?'```json\n'+response.body+'\n```\n\n':'ไม่มี body\n\n');
}
out+='## ข้อผิดพลาดและกติกา\n\nรูปแบบ `{ "error": "ข้อความ" }`: 400 ข้อมูลผิด/หมวดหมู่ไม่มี/เกินความจุ; 401 token หาย ผิด หรือหมดอายุ; 403 สิทธิ์ไม่พอหรือ Origin ไม่อนุญาต; 404 ID ไม่พบ/ไม่ใช่เจ้าของ; 409 ข้อมูลซ้ำหรือสถานะขัดแย้ง; 413 body เกิน 100 KB; 429 auth เกิน 30 ครั้ง/15 นาที/IP; 503 MySQL ไม่พร้อม; 500 ภายใน โดยไม่ส่ง SQL หรือ stack trace\n\nการจองใช้เวลา Asia/Bangkok รอบ 90 นาที: 11:00, 12:30, 14:00, 17:00, 18:30, 20:00 ภายใน 90 วันข้างหน้า การยกเลิกต้องเป็นเจ้าของและยังไม่เริ่ม และต้องยกเลิกออเดอร์ที่ผูกไว้ก่อน\n\nDELETE เมนูเป็น soft delete; DELETE โต๊ะเป็น is_active=0 และห้ามเมื่อมี confirmed reservation ที่เวลาสิ้นสุดยังมาไม่ถึง; PUT โต๊ะห้ามปิดใช้งานหรือลด capacity จนรองรับการจองเดิมไม่ได้; DELETE หมวดหมู่ห้ามถ้ายังมีเมนูอ้างอิง รวมเมนู soft delete\n\nสถานะออเดอร์ pending → confirmed → preparing → ready → completed; admin ยกเลิก pending/confirmed ได้ ลูกค้ายกเลิกเฉพาะ pending ระบบคำนวณยอดจากฐานข้อมูลเอง\n';
await writeFile('docs/API-COMPLETE.md',out);
console.log('API documentation generated:',seen.size,'method/path combinations');
