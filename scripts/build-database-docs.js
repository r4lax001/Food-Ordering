import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
const folder = '.archify/erd-food-service-20261017-190000';
const descriptions = { id:'รหัสหลักของแถว',name:'ชื่อ',email:'อีเมลที่ไม่ซ้ำ',password_hash:'bcrypt hash; ห้ามส่งออกใน API',role:'สิทธิ์ customer/admin',created_at:'เวลาสร้าง',category_id:'หมวดหมู่อาหาร',description:'รายละเอียดอาหาร',price:'ราคาปัจจุบัน (บาท)',image_url:'URL รูปภาพ HTTP/HTTPS',is_available:'พร้อมจำหน่าย 1/0',deleted_at:'เวลาลบแบบ soft delete',table_number:'หมายเลขโต๊ะไม่ซ้ำ',capacity:'จำนวนที่นั่ง',is_active:'เปิดใช้งาน 1/0',user_id:'เจ้าของรายการ',table_id:'โต๊ะที่จอง',reservation_date:'วันที่จองในประเทศไทย',slot:'เวลาเริ่มรอบ 90 นาที',guests:'จำนวนคน',status:'สถานะตาม ENUM',note:'หมายเหตุ',active_slot:'generated: 1 เมื่อไม่ cancelled; NULL เมื่อ cancelled',reservation_id:'การจองที่เกี่ยวข้อง; NULL ได้',total:'ยอดรวม ณ ตอนสั่ง (บาท)',order_id:'คำสั่งซื้อ',menu_item_id:'เมนูที่สั่ง',menu_name:'ชื่อเมนู ณ ตอนสั่ง',quantity:'จำนวน',unit_price:'ราคาต่อหน่วย ณ ตอนสั่ง'};
try {
  const [columns]=await pool.execute('SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY, EXTRA, GENERATION_EXPRESSION FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME, ORDINAL_POSITION',[config.DB_NAME]);
  const [keys]=await pool.execute('SELECT TABLE_NAME,COLUMN_NAME,CONSTRAINT_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=?',[config.DB_NAME]);
  const order=['users','tables','reservations','orders','order_items','categories','menu_items'];
  let dictionary='# Data Dictionary\n\nสร้างจาก schema ใน MySQL จริง ทุกตารางใช้ InnoDB/utf8mb4; ชนิด BOOLEAN แสดงเป็น tinyint(1) ตาม MySQL\n\n';
  const layout={users:[0,0,'สมาชิก'],tables:[0,1,'การจอง'],reservations:[1,1,'การจอง'],orders:[0,2,'คำสั่งซื้อ'],order_items:[1,2,'คำสั่งซื้อ'],categories:[0,3,'อาหาร'],menu_items:[1,3,'อาหาร']};
  const entities=[],relationships=[];
  for(const table of order){
    const fields=columns.filter(c=>c.TABLE_NAME===table);
    dictionary+=`## ${table}\n\n| Column | SQL type | NULL | Default / Generated | Key | ความหมาย |\n|---|---|---|---|---|---|\n`;
    const attributes=fields.map(c=>{
      const ownKeys=keys.filter(k=>k.TABLE_NAME===table && k.COLUMN_NAME===c.COLUMN_NAME);
      const fk=ownKeys.find(k=>k.REFERENCED_TABLE_NAME);
      const roles=[...new Set(ownKeys.map(k=>k.REFERENCED_TABLE_NAME?'fk':k.CONSTRAINT_NAME==='PRIMARY'?'pk':'uk'))];
      dictionary+=`| ${c.COLUMN_NAME} | ${c.COLUMN_TYPE} | ${c.IS_NULLABLE} | ${c.GENERATION_EXPRESSION || c.COLUMN_DEFAULT || (c.EXTRA.includes('auto_increment')?'AUTO_INCREMENT':'—')} | ${roles.join(', ')}${fk?` → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`:''} | ${descriptions[c.COLUMN_NAME]||c.COLUMN_NAME} |\n`;
      if(fk) relationships.push({id:`${table}_${c.COLUMN_NAME}`,from:table,to:fk.REFERENCED_TABLE_NAME,fromCardinality:'many',fromOptional:true,toCardinality:'one',toOptional:c.IS_NULLABLE==='YES'});
      return {name:c.COLUMN_NAME,type:c.COLUMN_TYPE,...(roles.length?{key:roles}:{}),...(fk?{references:`${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`}:{})};
    });
    dictionary+='\n';
    const [row,col,tag]=layout[table];
    entities.push({id:table,label:table,row,col,tag,attributes,...(table==='orders'?{width:550}:table==='reservations'?{width:460}:{})});
  }
  dictionary+='## ข้อจำกัดร่วม\n\n- reservations UNIQUE(table_id, reservation_date, slot, active_slot) ป้องกันจองซ้ำ และอนุญาตจองใหม่หลัง cancelled\n- order_items UNIQUE(order_id, menu_item_id) หนึ่งเมนูต่อหนึ่งบรรทัดในออเดอร์\n- categories.name, users.email และ tables.table_number ไม่ซ้ำ\n- Foreign keys ใช้ RESTRICT โดยปริยาย ป้องกันลบข้อมูลที่มีการอ้างอิง\n- API จำกัด capacity/guests 1–20, quantity 1–99, price > 0 และทศนิยมไม่เกิน 2 ตำแหน่ง\n- SQL CHECK เพิ่มข้อจำกัดจำนวนและราคาเป็นบวก พร้อมรายการ slot ที่อนุญาต\n';
  await writeFile('docs/DATA-DICTIONARY.md',dictionary);
  await mkdir(folder,{recursive:true});
  const candidate={schema_version:1,diagram_type:'erd',meta:{title:'ความสัมพันธ์ฐานข้อมูล Food Service',locale:'th',output:`${folder}/food-service.html`,quality_profile:'standard'},layout:{mode:'grid',gapX:60,gapY:85,entityW:330,rowH:24},entities,relationships};
  await writeFile(`${folder}/candidate.json`,JSON.stringify(candidate,null,2));
  await writeFile('database/install.sql',`-- Run using a MySQL account with permissions for food_service.\nCREATE DATABASE IF NOT EXISTS food_service CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\nUSE food_service;\n\n`+await readFile('database/schema.sql','utf8')+'\n'+await readFile('database/seed.sql','utf8'));
  console.log('Data dictionary, full SQL installer and ER candidate generated from MySQL schema.');
} finally {await pool.end();}
