import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({channel:'chrome',args:['--enable-unsafe-swiftshader']});
try {
 const page = await browser.newPage({viewport:{width:1440,height:1100}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const creds=JSON.parse(await readFile(new URL('../../.local/demo-admin.json',import.meta.url),'utf8'));
 const r=await page.request.post('http://127.0.0.1:3000/api/auth/login',{data:{email:creds.email,password:creds.password}});
 const json=await r.json();const token=json.data?.token||json.token;assert(token,'login');
 await page.addInitScript(t=>sessionStorage.setItem('phungpong.token',t),token);
 // Simulate an occupied table without creating real bookings.
 await page.route('**/api/tables/availability?*',async route=>{const res=await route.fetch();const data=await res.json();data.data=data.data.filter(t=>t.table_number!=='T03');await route.fulfill({response:res,json:data})});
 await page.goto('http://127.0.0.1:5173/reservation');
 await page.locator('input[name=date]').fill(new Date(Date.now()+9*86400000).toISOString().slice(0,10));
 await page.locator('select[name=slot]').selectOption('11:00');
 await page.getByRole('button',{name:'ค้นหาโต๊ะว่าง'}).click();
 await page.locator('.room3d canvas').waitFor();await page.waitForTimeout(1200);
 assert.equal(await page.locator('.room3d-table').count(),10);
 assert(await page.getByRole('button',{name:/โต๊ะ T03 .*โต๊ะเต็ม/}).isDisabled());
 await page.locator('.room3d').screenshot({path:'.local/room3d-desktop.png'});
 await page.getByRole('button',{name:/โต๊ะ T10 /}).click();
 await page.locator('.booking-confirm h3').filter({hasText:'T10'}).waitFor();
 await page.getByRole('button',{name:'ผัง 2D',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:/โต๊ะ T10 /}).getAttribute('aria-pressed'),'true');
 await page.getByRole('button',{name:'รายการโต๊ะ',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:/โต๊ะ T10 /}).getAttribute('aria-pressed'),'true');
 await page.getByRole('button',{name:'ร้าน 3D',exact:true}).click();
 await page.locator('.room3d canvas').waitFor();await page.waitForTimeout(300);
 const before=await page.locator('.room3d canvas').screenshot();
 await page.getByRole('button',{name:'หมุนร้านไปทางซ้าย',exact:true}).click();
 await page.waitForTimeout(150);
 const after=await page.locator('.room3d canvas').screenshot();assert(!before.equals(after),'rotation changes rendering');
 await page.getByRole('button',{name:'ขยายร้านสามมิติ',exact:true}).click();
 await page.getByRole('button',{name:'มุมเริ่มต้น',exact:true}).click();
 for(const width of [320,360,390,430,560,768,820,1024,1280,1440,1920,2560]) {
   await page.setViewportSize({width,height:900});await page.waitForTimeout(150);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width);
   const rects=await page.locator('.room3d-table').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom}}));
   for(let i=0;i<rects.length;i++)for(let k=i+1;k<rects.length;k++){
     const a=rects[i],b=rects[k];
     assert(!(a.x<b.right && a.right>b.x && a.y<b.bottom && a.bottom>b.y), 'labels overlap '+width+' '+i+'/'+k);
   }
 }
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);
 await page.locator('.room3d').screenshot({path:'.local/room3d-mobile.png'});
 await page.getByRole('button',{name:/โต๊ะ T01 /}).click();
 assert.equal(await page.getByRole('button',{name:/โต๊ะ T01 /}).getAttribute('aria-pressed'),'true');
 await page.locator('input[name=guests]').fill('8');await page.getByRole('button',{name:'ค้นหาโต๊ะว่าง'}).click();
 await page.getByRole('button',{name:/โต๊ะ T01 .*ที่นั่งไม่พอ/}).waitFor();
 assert(await page.getByRole('button',{name:/โต๊ะ T01 /}).isDisabled());
 await page.locator('.room3d canvas').evaluate(c=>c.dispatchEvent(new Event('webglcontextlost')));
 await page.getByRole('button',{name:'เปิดผัง 2D'}).click();await page.locator('.restaurant-floor').waitFor();
 assert.deepEqual(errors,[]);
 console.log('PASS: 3D rendering, real API availability with simulated occupied table, selection across 3 views, camera rotation/zoom/reset, 12 screen widths and nonoverlapping initial labels, mobile selection, capacity, WebGL fallback. No booking created.');
} finally { await browser.close(); }
