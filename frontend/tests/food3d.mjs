import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({channel:'chrome',args:['--enable-unsafe-swiftshader']});
const errors=[];
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/');
 const stage=page.locator('.food3d-stage');
 await page.locator('canvas').waitFor();
 await page.waitForTimeout(1000);
 assert.equal(await stage.getAttribute('data-assembly'),'0');
 const exploded=await page.locator('canvas').screenshot();
 await stage.hover(); await page.waitForTimeout(1400);
 assert.equal(await stage.getAttribute('data-assembly'),'1');
 const assembled=await page.locator('canvas').screenshot();
 assert(!exploded.equals(assembled),'hover should change rendered geometry');
 await page.mouse.move(10,10); await page.waitForTimeout(1400);
 assert.equal(await stage.getAttribute('data-assembly'),'0');
 await page.evaluate(()=>scrollTo(0,240)); await page.waitForTimeout(350);
 assert.equal(await stage.getAttribute('data-assembly'),'1');
 assert.equal(await page.locator('.food3d button').count(),0);
 assert.equal((await page.locator('.food3d').innerText()).trim(),'');
 await stage.focus();
 for(let i=0;i<12;i++) await page.keyboard.press('ArrowRight');
 assert.equal(Number(await stage.getAttribute('data-angle')),Math.PI/2);
 for(let i=0;i<12;i++) await page.keyboard.press('ArrowLeft');
 assert.equal(Number(await stage.getAttribute('data-angle')),-Math.PI/2);
 await page.emulateMedia({reducedMotion:'reduce'}); await page.waitForTimeout(150);
 assert.equal(await stage.getAttribute('data-assembly'),'1');
 await page.locator('canvas').evaluate(c=>c.dispatchEvent(new Event('webglcontextlost')));
 await page.locator('.food3d-fallback').waitFor();
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 mobile.on('pageerror',e=>errors.push(e.message));
 await mobile.goto('http://127.0.0.1:5173/'); await mobile.locator('canvas').waitFor();
 const mobileStage=mobile.locator('.food3d-stage');
 const before=Number(await mobileStage.getAttribute('data-assembly'));
 await mobile.evaluate(()=>scrollBy(0,300)); await mobile.waitForTimeout(400);
 const after=Number(await mobileStage.getAttribute('data-assembly'));
 assert(after>before,'mobile scrolling assembles meal');
 for(const width of [320,390,768]) {
   await mobile.setViewportSize({width,height:844});
   await mobile.waitForTimeout(100);
   assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: hover renders assembly, leave separates, scroll, no visible controls or text, 180 bounds, reduced motion, fallback, mobile scroll and 320/390/768 widths.');
} finally { await browser.close(); }
