import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Run against the local API and frontend. Uses an isolated browser profile.
const base = process.env.UI_BASE_URL || "http://127.0.0.1:5173";
const output = fileURLToPath(
  new URL("../../docs/evidence/responsive/", import.meta.url),
);
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
const errors = [];
const checks = [];
page.on("pageerror", (error) => errors.push(error.message));
const sizes = [
  [320, 740],
  [360, 800],
  [390, 844],
  [430, 932],
  [560, 800],
  [768, 1024],
  [820, 1180],
  [1024, 768],
  [1280, 800],
  [1440, 1000],
  [1920, 1080],
  [2560, 1440],
];
async function checkLayout(name) {
  const result = await page.evaluate(() => {
    const visible = (el) =>
      el.getClientRects().length &&
      getComputedStyle(el).visibility !== "hidden";
    const offscreen = [
      ...document.querySelectorAll(
        "header a, main button, main input, main select, main textarea, main h1, main h2, .food-card, .admin-row, footer a",
      ),
    ]
      .filter(visible)
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.left < -1 || r.right > innerWidth + 1;
      })
      .map((el) => ({
        tag: el.tagName,
        text: (el.textContent || el.getAttribute("aria-label") || "").slice(
          0,
          60,
        ),
      }));
    return {
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      offscreen,
    };
  });
  checks.push({ name, ...result });
  assert.ok(
    result.scrollWidth <= result.width + 1,
    `${name}: document overflow at ${result.width}`,
  );
  assert.deepEqual(
    result.offscreen,
    [],
    `${name}: clipped content at ${result.width}`,
  );
}
async function visit(path) {
  await page.goto(base + path);
  await page.locator("main").waitFor();
  await page.waitForFunction(() => !document.querySelector("main .spin"));
  await page.evaluate(() => document.fonts.ready);
}
try {
  const menuResponse = await page.request.get(base + "/api/menu");
  assert.ok(
    menuResponse.ok(),
    "Start MySQL and the API before running this check.",
  );
  const menu = (await menuResponse.json()).data;
  assert.ok(menu.length, "Seed menu is required.");
  await visit("/");
  await page.evaluate(
    (item) =>
      localStorage.setItem(
        "phungpong.cart",
        JSON.stringify([{ ...item, quantity: 2 }]),
      ),
    menu[0],
  );
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    for (const route of [
      "/",
      "/menu",
      `/menu/${menu[0].id}`,
      "/cart",
      "/login",
      "/register",
    ]) {
      await visit(route);
      await checkLayout(route);
      if (route === "/" && [390, 768, 1440].includes(width)) {
        await page.screenshot({
          path: `${output}/home-${width}.png`,
          fullPage: true,
        });
      }
    }
  }
  // ReUI quantity: limits, buttons and keyboard edits update the real cart.
  await page.setViewportSize({ width: 390, height: 844 });
  await visit("/cart");
  const quantity = page.getByRole("textbox", { name: "จำนวนอาหาร" });
  await page.getByRole("button", { name: "เพิ่มจำนวน", exact: true }).click();
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem("phungpong.cart"))[0].quantity === 3,
  );
  await quantity.fill("99");
  await quantity.press("Tab");
  assert.ok(
    await page
      .getByRole("button", { name: "เพิ่มจำนวน", exact: true })
      .isDisabled(),
  );
  await quantity.fill("1");
  await quantity.press("Tab");
  await quantity.fill("1.5");
  await quantity.press("Tab");
  assert.equal(await quantity.inputValue(), "2");
  await quantity.fill("0");
  await quantity.press("Tab");
  assert.equal(await quantity.inputValue(), "1");
  assert.ok(
    await page
      .getByRole("button", { name: "ลดจำนวน", exact: true })
      .isDisabled(),
  );
  await page.screenshot({ path: `${output}/cart-390.png`, fullPage: true });

  // Dialog traps focus, supports Escape/backdrop, and closes after navigation/resize.
  const trigger = page.getByRole("button", { name: "เปิดเมนู" });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press("Tab");
    await page.waitForFunction(
      () =>
        document
          .querySelector('[role="dialog"]')
          ?.contains(document.activeElement),
      undefined,
      { timeout: 2000 },
    );
  }
  await page.screenshot({
    path: `${output}/navigation-390.png`,
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  assert.ok(await trigger.evaluate((el) => el === document.activeElement));
  await trigger.click();
  await page.locator(".menu-backdrop").click({ position: { x: 5, y: 100 } });
  await dialog.waitFor({ state: "hidden" });
  await trigger.click();
  await dialog.getByRole("link", { name: "เมนูอาหาร", exact: true }).click();
  await page.waitForURL("**/menu");
  await dialog.waitFor({ state: "hidden" });
  await trigger.click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await dialog.waitFor({ state: "hidden" });

  // Error state and empty menu remain usable in narrow layouts.
  await page.setViewportSize({ width: 320, height: 740 });
  await page.route("**/api/menu?*", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Service unavailable" }),
    }),
  );
  await visit("/menu");
  await page.locator('[data-slot="alert"]').waitFor();
  await checkLayout("menu error");
  await page.unroute("**/api/menu?*");
  await visit("/menu");
  await page
    .getByLabel("ค้นหาเมนู", { exact: true })
    .fill("ไม่มีเมนูนี้แน่นอน");
  await checkLayout("menu empty");

  // Optional local demo account; credentials are never written to the report.
  let admin;
  try {
    admin = JSON.parse(
      await fs.readFile(
        new URL("../../.local/demo-admin.json", import.meta.url),
        "utf8",
      ),
    );
  } catch {}
  if (process.env.UI_ADMIN_EMAIL && process.env.UI_ADMIN_PASSWORD)
    admin = {
      email: process.env.UI_ADMIN_EMAIL,
      password: process.env.UI_ADMIN_PASSWORD,
    };
  if (admin) {
    const response = await page.request.post(base + "/api/auth/login", {
      data: admin,
    });
    assert.ok(response.ok(), "Local demo admin login failed");
    const { token } = await response.json();
    await page.evaluate(
      (token) => sessionStorage.setItem("phungpong.token", token),
      token,
    );
    for (const [width, height] of sizes) {
      await page.setViewportSize({ width, height });
      for (const route of [
        "/reservation",
        "/orders",
        "/reservations",
        "/admin",
      ]) {
        await visit(route);
        assert.equal(new URL(page.url()).pathname, route);
        await checkLayout(route);
      }
      await page
        .getByRole("button", { name: /เมนูอาหาร/ })
        .click();
      await page
        .getByRole("button", { name: "เพิ่มรายการ", exact: true })
        .click();
      await checkLayout("admin form");
      if ([390, 768].includes(width))
        await page.screenshot({
          path: `${output}/admin-${width}.png`,
          fullPage: true,
        });
      await visit("/reservation");
      const date = new Date(Date.now() + 8 * 86400000)
        .toISOString()
        .slice(0, 10);
      await page.getByLabel("วันที่", { exact: true }).fill(date);
      await page.getByRole("button", { name: "ค้นหาโต๊ะว่าง" }).click();
      await page
        .getByRole("button", { name: /โต๊ะ T/ })
        .first()
        .waitFor();
      await page
        .getByRole("button", { name: /โต๊ะ T/ })
        .first()
        .click();
      await checkLayout("reservation selection");
      if (width === 390)
        await page.screenshot({
          path: `${output}/reservation-390.png`,
          fullPage: true,
        });
    }
  }
  assert.deepEqual(errors, []);
  await fs.writeFile(
    `${output}/checks.json`,
    JSON.stringify(
      {
        passed: true,
        viewportSizes: sizes,
        checks,
        quantity: true,
        keyboardNavigation: true,
        errorAndEmptyStates: true,
        authenticatedChecks: !!admin,
        pageErrors: errors,
      },
      null,
      2,
    ),
  );
  console.log(
    `PASS: ${checks.length} layout checks, ReUI quantity, keyboard navigation, error/empty states. Authenticated checks: ${!!admin}`,
  );
} finally {
  await browser.close();
}
