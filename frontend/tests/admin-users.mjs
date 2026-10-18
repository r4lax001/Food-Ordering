import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import { app } from '../../src/app.js';
import { pool } from '../../src/db.js';
import { chromium } from 'playwright';
const server=app.listen(0,'127.0.0.1');await once(server,'listening');
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({channel:'chrome'});
try {
 const page=await browser.newPage();
 const c=JSON.parse(await readFile('.local/demo-admin.json','utf8'));
 const response=await page.request.post(base+'/api/auth/login',{data:{email:c.email,password:c.password}});const login=await response.json();
 await page.addInitScript(t=>sessionStorage.setItem('phungpong.token',t),login.token);
 await page.route('**/api/**',async route=>{const url=new URL(route.request().url());const result=await route.fetch({url:base+url.pathname+url.search});await route.fulfill({response:result})});
 await page.goto('http://127.0.0.1:5173/admin?section=users');await page.locator('.admin-user-card').first().waitFor();
 await page.getByLabel('ค้นหาผู้ใช้งาน').fill(c.email);await page.getByRole('button',{name:'ค้นหา',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.admin-user-card').length===1);
 await page.getByLabel('กรองสิทธิ์ผู้ใช้งาน').selectOption('customer');await page.locator('.admin-empty').waitFor();await page.getByRole('button',{name:'แสดงทั้งหมด',exact:true}).click();await page.locator('.admin-user-card').first().waitFor();
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('overflow');}
 const next=page.getByRole('button',{name:'ถัดไป',exact:true});if(await next.isEnabled()){const first=await page.locator('.admin-user-info small').first().innerText();await next.click();await page.waitForTimeout(250);if(first===await page.locator('.admin-user-info small').first().innerText())throw Error('pagination');}
 console.log('PASS users search, roles, empty state, pagination, responsive 4 widths on isolated backend.');
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));await pool.end()}
