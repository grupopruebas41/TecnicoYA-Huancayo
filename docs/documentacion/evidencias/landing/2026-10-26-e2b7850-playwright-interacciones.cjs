// Capturas de interacción: FAQ abierta y panel legal. Uso: node extra.cjs <outDir> <prefix>
const path = require("path");
const { chromium } = require(path.join(process.env.USERPROFILE, ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"));
const [outDir, prefix] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: path.join(process.env.LOCALAPPDATA, "ms-playwright/chromium-1248/chrome-win64/chrome.exe") });
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: "reduce" })).newPage();
  await page.goto("http://127.0.0.1:5180/", { waitUntil: "networkidle" });
  await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Preguntas", exact: true }).click();
  await page.locator("summary", { hasText: "¿Cuánto cuesta?" }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/${prefix}-1366x768-preguntas-abierta.png` });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.getByRole("button", { name: "Términos" }).click();
  await page.waitForTimeout(400);
  const focused = await page.evaluate(() => document.activeElement?.textContent);
  await page.screenshot({ path: `${outDir}/${prefix}-1366x768-pie-terminos.png` });
  await page.keyboard.press("Escape");
  const closed = await page.locator("[role=dialog]").count();
  console.log(JSON.stringify({ focusedOnOpen: focused, dialogsAfterEscape: closed }));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
