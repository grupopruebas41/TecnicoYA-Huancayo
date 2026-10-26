// Vitrina con movimiento normal (abanico 3D real). Uso: node motion.cjs <outDir> <prefix>
const path = require("path");
const { chromium } = require(path.join(process.env.USERPROFILE, ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"));
const [outDir, prefix] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: path.join(process.env.LOCALAPPDATA, "ms-playwright/chromium-1248/chrome-win64/chrome.exe") });
  for (const [w, h] of [[1366, 768], [1920, 1080]]) {
    const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
    await page.goto("http://127.0.0.1:5180/", { waitUntil: "networkidle" });
    await page.waitForSelector(".ty-intro-content:not([hidden])", { timeout: 20000 });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `${outDir}/${prefix}-${w}x${h}-hero-video.png` });
    await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Servicios", exact: true }).click();
    await page.waitForTimeout(1500);
    const cards = await page.evaluate(() => [...document.querySelectorAll(".ty-product-card")].filter((c) => { const r = c.getBoundingClientRect(); return r.width > 0 && getComputedStyle(c).opacity > 0.05; }).length);
    await page.mouse.move(5, 400);
    await page.screenshot({ path: `${outDir}/${prefix}-${w}x${h}-servicios-abanico.png` });
    console.log(w, "cartas visibles", cards);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
