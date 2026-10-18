import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome'});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}}), errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const creds=JSON.parse(await readFile(new URL('../../.local/demo-admin.json',import.meta.url),'utf8'));
 const login=await page.request.post('http://127.0.0.1:3000/api/auth/login',{data:{email:creds.email,password:creds.password}});
 const json=await login.json(); assert(json.token);
 await page.addInitScript(t=>sessionStorage.setItem('phungpong.token',t),json.token);
 await page.goto('http://127.0.0.1:5173/admin');
 await page.locator('.admin-metric').first().waitFor();
 await page.screenshot({path:'.local/admin-overview-desktop.png',fullPage:true});
 const sections=['ภาพรวมร้าน','เมนูอาหาร','หมวดหมู่','โต๊ะอาหาร','คำสั่งซื้อ','การจอง'];
 for(const width of [320,390,560,768,1024,1440,1920]) {
   await page.setViewportSize({width,height:900});
   for(const section of sections) {
     await page.getByRole('navigation',{name:'ส่วนจัดการร้าน'}).getByRole('button',{name:new RegExp(section)}).click();
     await page.waitForTimeout(100);
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width+' '+section);
   }
 }
 await page.setViewportSize({width:390,height:844});
 const nav=page.getByRole('navigation',{name:'ส่วนจัดการร้าน'});
 await nav.getByRole('button',{name:/เมนูอาหาร/}).click();await page.locator('.admin-menu-card').first().waitFor();
 await page.getByRole('textbox',{name:'ค้นหาในหมวดนี้'}).fill('กะเพรา');
 const names=await page.locator('.admin-menu-card h3').allTextContents();assert(names.length>0&&names.every(n=>n.includes('กะเพรา')));
 await page.getByRole('textbox',{name:'ค้นหาในหมวดนี้'}).fill('zzzz-empty');await page.locator('.admin-empty').waitFor();
 await page.getByRole('button',{name:'แสดงรายการทั้งหมด',exact:true}).click();
 await page.locator('.admin-menu-card').first().getByRole('button',{name:/แก้ไข/}).click();
 await page.locator('.admin-form input[name=name]').waitFor();
 assert(await page.locator('.admin-form input[name=name]').evaluate(e=>document.activeElement===e));
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'form overflow');
 await page.getByRole('button',{name:'ปิดแบบฟอร์ม'}).click();
 await page.screenshot({path:'.local/admin-menu-mobile.png',fullPage:true});
 await nav.getByRole('button',{name:/หมวดหมู่/}).click();
 await page.locator('.admin-category-card').first().getByRole('button',{name:/เปิดดูเมนู/}).click();
 await page.waitForFunction(()=>document.querySelector('[aria-label="กรองหมวดอาหาร"]')?.value);
 assert.notEqual(await page.getByRole('combobox',{name:'กรองหมวดอาหาร'}).inputValue(),'');
 await nav.getByRole('button',{name:/โต๊ะอาหาร/}).click();await page.locator('.admin-table-card').first().waitFor();
 assert.equal(await page.getByRole('button',{name:'เพิ่มรายการ',exact:true}).count(),0);
 await page.locator('.admin-table-card').first().getByRole('button',{name:/แก้ไข/}).click();
 assert(await page.locator('input[name=table_number]').isVisible());await page.getByRole('button',{name:'ปิดแบบฟอร์ม'}).click();
 await nav.getByRole('button',{name:/คำสั่งซื้อ/}).click();await page.locator('.admin-order-card').first().waitFor();
 await page.locator('.admin-order-card').first().getByRole('button',{name:'ดูรายการอาหาร'}).click();await page.locator('.admin-order-detail strong').first().waitFor();
 await nav.getByRole('button',{name:/การจอง/}).click();await page.getByLabel('กรองวันจอง').fill('2099-01-01');await page.locator('.admin-empty').waitFor();
 // Exercise form submission with an isolated response, without changing shop data.
 await nav.getByRole('button',{name:/หมวดหมู่/}).click();
 let payload;
 await page.route('**/api/categories',async route=>{if(route.request().method()==='POST'){payload=route.request().postDataJSON();await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({data:{id:999999,...payload}})});}else await route.continue()});
 await page.getByRole('button',{name:'เพิ่มรายการ',exact:true}).click();await page.locator('.admin-form input[name=name]').fill('ทดสอบหน้าจอ');await page.getByRole('button',{name:'บันทึกข้อมูล'}).click();await page.locator('.admin-form').waitFor({state:'detached'});assert.equal(payload.name,'ทดสอบหน้าจอ');
 let statusPayload;
 await page.route('**/api/admin/orders?*',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:[{id:999999,user_id:1,total:'75.00',created_at:'2026-10-18 11:00:00',status:statusPayload?.status||'pending'}]})}));
 await page.route('**/api/admin/orders/999999/status',async route=>{statusPayload=route.request().postDataJSON();await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:{id:999999,...statusPayload}})})});
 await nav.getByRole('button',{name:/คำสั่งซื้อ/}).click();
 await page.getByRole('combobox',{name:'เปลี่ยนสถานะคำสั่งซื้อ 999999'}).selectOption('confirmed');
 await page.waitForFunction(()=>document.querySelector('.admin-order-card')?.classList.contains('order-confirmed'));
 assert.equal(statusPayload.status,'confirmed');
 await nav.getByRole('button',{name:/ภาพรวมร้าน/}).click();await page.locator('.admin-metric').first().waitFor();
 await page.screenshot({path:'.local/admin-mobile-viewport.png'});
 assert.deepEqual(errors,[]);
 console.log('PASS: six sections at 7 widths, search/empty/filter/reset, category drill-down, edit focus, table add prohibited, order details, date filter and isolated create request. No shop data changed.');
} finally { await browser.close(); }
