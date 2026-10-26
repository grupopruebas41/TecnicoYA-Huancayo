// Modos de #cuenta con movimiento normal: login, intermedio de la animación, registro y vuelta.
// Uso: node modos.cjs <outDir> <prefix>
const path = require("path");
const fs = require("fs");
const { chromium } = require(path.join(process.env.USERPROFILE, ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"));
const [outDir, prefix] = process.argv.slice(2);

const state = (page) => page.evaluate(() => {
  const r = (s) => { const b = document.querySelector(s)?.getBoundingClientRect(); return b && [Math.round(b.left), Math.round(b.right)]; };
  return { panel: r(".auth-welcome"), form: r(".auth-form-side"), heading: document.querySelector(".auth-welcome h2")?.textContent,
    focus: document.activeElement?.dataset?.cy || document.activeElement?.tagName, card: (() => { const b = document.querySelector(".auth-shell").getBoundingClientRect(); return [Math.round(b.top), Math.round(b.bottom)]; })(),
    linksInForm: document.querySelectorAll(".auth-form .text-button").length };
});

(async () => {
  const browser = await chromium.launch({ executablePath: path.join(process.env.LOCALAPPDATA, "ms-playwright/chromium-1248/chrome-win64/chrome.exe") });
  const report = {};
  for (const [w, h] of [[1366, 768], [390, 844]]) {
    const tag = `${w}x${h}`;
    const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
    await page.goto("http://127.0.0.1:5180/#cuenta", { waitUntil: "networkidle" });
    await page.waitForSelector("[data-cy=login-submit]");
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${outDir}/${prefix}-${tag}-modo-login.png` });
    report[`${tag}-login`] = await state(page);
    await page.click("[data-cy=show-register]");
    await page.waitForTimeout(300);
    if (w > 760) {
      await page.screenshot({ path: `${outDir}/${prefix}-${tag}-modo-intermedio.png` });
      report[`${tag}-intermedio`] = await state(page);
    }
    await page.waitForTimeout(900);
    await page.click("[aria-label='Mostrar contraseña']");
    await page.fill("[data-cy=register-password]", "Ejemplo-123");
    await page.screenshot({ path: `${outDir}/${prefix}-${tag}-modo-registro.png` });
    report[`${tag}-registro`] = await state(page);
    await page.click("[data-cy=show-login]");
    await page.waitForTimeout(900);
    report[`${tag}-vuelta`] = await state(page);
  }
  await browser.close();
  fs.writeFileSync(`${outDir}/${prefix}-modos.json`, JSON.stringify(report, null, 2));
  for (const [k, v] of Object.entries(report)) console.log(k.padEnd(22), JSON.stringify(v));
})().catch((e) => { console.error(e); process.exit(1); });
