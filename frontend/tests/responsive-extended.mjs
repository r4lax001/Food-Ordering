import { chromium } from 'playwright';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'chrome',args:['--enable-unsafe-swiftshader']});
const page=await browser.newPage({reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const creds=JSON.parse(fs.readFileSync('.local/demo-admin.json','utf8'));
const res=await page.request.post('http://127.0.0.1:3000/api/auth/login',{data:creds});
const {token}=await res.json();if(!token)throw Error('Login failed');
await page.addInitScript(t=>sessionStorage.setItem('phungpong.token',t),token);
const menu=await (await page.request.get('http://127.0.0.1:3000/api/menu')).json();
await page.addInitScript(item=>localStorage.setItem('phungpong.cart',JSON.stringify([{...item,quantity:2}])),menu.data[0]);
const checks=[];
for(const width of [320,360,390,430,559,600,767,768,820,1024,1280,1440,1920,2560]){
 await page.setViewportSize({width,height:width===820?430:900});
 for(const path of ['/','/menu','/menu/'+menu.data[0].id,'/cart','/login','/register','/reservation','/orders','/reservations',...['overview','menu','categories','tables','orders','reservations','users'].map(s=>'/admin?section='+s)]){
 await page.goto('http://127.0.0.1:5173'+path);await page.locator('main h1:visible').first().waitFor();
 await page.waitForFunction(()=>!document.querySelector('main .spin'));
 await page.evaluate(()=>document.fonts.ready);
 const result=await page.evaluate(()=>{
  const bad=[...document.querySelectorAll('main h1, main h2, main input, main select, main button, main textarea, .food-card, .admin-user-row')].filter(el=>{
   if(!el.getClientRects().length)return false;
   if(el.closest('.room3d,.restaurant-floor,.floor-plan'))return false;
   const b=el.getBoundingClientRect();return b.left< -1||b.right>innerWidth+1;
  }).map(el=>({tag:el.tagName,cls:el.className,text:el.textContent.slice(0,50)}));
  return {overflow:document.documentElement.scrollWidth>innerWidth+1,bad};
 });checks.push({width,path,...result});
 if(result.overflow||result.bad.length)console.log(JSON.stringify(checks.at(-1)));
 }
 console.log('Checked '+width);
}
fs.writeFileSync('docs/evidence/responsive/extended-audit.json',JSON.stringify({checks,errors},null,2));
await browser.close();
if(errors.length || checks.some(c=>c.overflow||c.bad.length))throw Error('Responsive audit failed; see report');
console.log('PASS: '+checks.length+' route/viewport checks, no runtime errors.');

