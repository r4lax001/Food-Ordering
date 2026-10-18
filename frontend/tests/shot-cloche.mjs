import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-swiftshader'] });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/');
  await page.locator('canvas').waitFor();
  await page.waitForTimeout(1200);
  await page.locator('.food3d').screenshot({ path: '../.local/cloche-closed.png' });
  await page.locator('.food3d-stage').hover();
  await page.waitForTimeout(1500);
  await page.locator('.food3d').screenshot({ path: '../.local/cloche-open.png' });
  // rotate right by keyboard, screenshot at 45 deg
  await page.locator('.food3d-stage').focus();
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
  await page.mouse.move(10, 10);
  await page.waitForTimeout(1200);
  await page.locator('.food3d').screenshot({ path: '../.local/cloche-rotated.png' });
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  mobile.on('pageerror', e => errors.push(e.message));
  await mobile.goto('http://127.0.0.1:5173/');
  await mobile.locator('canvas').waitFor();
  await mobile.waitForTimeout(1200);
  await mobile.locator('.food3d').screenshot({ path: '../.local/cloche-mobile.png' });
  console.log('shots done. page errors:', JSON.stringify(errors));
} finally { await browser.close(); }
