// Pantalla #cuenta: inicio de sesión, registro, error de conexión y «Comprobando tu sesión».
// Uso: node login.cjs <outDir> <prefix>
const path = require("path");
const fs = require("fs");
const { chromium } = require(path.join(process.env.USERPROFILE, ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"));
const [outDir, prefix] = process.argv.slice(2);
const BASE = "http://127.0.0.1:5180";

function measure(page) {
  return page.evaluate(() => {
    const box = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), height: Math.round(r.height) }; };
    const card = document.querySelector(".auth-shell, .auth-status");
    const alertOutside = [...document.querySelectorAll("[role=alert]")].filter((a) => !a.closest(".auth-shell, .auth-status")).length;
    return {
      header: box(".account-page > .header"), card: card && box(card.classList.contains("auth-shell") ? ".auth-shell" : ".auth-status"),
      panel: box(".auth-welcome"), form: box(".auth-form-side"), fits: card ? card.getBoundingClientRect().bottom <= innerHeight : null,
      alertOutside, overflowX: document.documentElement.scrollWidth > innerWidth,
    };
  });
}

(async () => {
  const browser = await chromium.launch({ executablePath: path.join(process.env.LOCALAPPDATA, "ms-playwright/chromium-1248/chrome-win64/chrome.exe") });
  const report = {};
  for (const [w, h] of [[1366, 768], [1920, 1080], [390, 844]]) {
    const tag = `${w}x${h}`;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    // Sin error: la API real responde 401 en /me y aparece el formulario.
    await page.goto(BASE + "/#cuenta", { waitUntil: "networkidle" });
    await page.waitForSelector("[data-cy=login-submit]");
    await page.screenshot({ path: `${outDir}/${prefix}-${tag}-login.png` });
    report[`${tag}-login`] = await measure(page);
    await page.click("[data-cy=show-register]");
    await page.waitForSelector("[data-cy=register-name]");
    await page.screenshot({ path: `${outDir}/${prefix}-${tag}-registro.png` });
    report[`${tag}-registro`] = await measure(page);
    // Con error de conexión: se corta /me.
    await page.route("**/api/v1/me", (route) => route.abort("connectionrefused"));
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector(".auth-alert");
    await page.screenshot({ path: `${outDir}/${prefix}-${tag}-error-conexion.png` });
    report[`${tag}-error-conexion`] = await measure(page);
    // Comprobando tu sesión: /me queda pendiente.
    await page.unroute("**/api/v1/me");
    await page.route("**/api/v1/me", () => {});
    await page.reload();
    await page.waitForSelector(".auth-status output");
    await page.screenshot({ path: `${outDir}/${prefix}-${tag}-comprobando.png` });
    report[`${tag}-comprobando`] = await measure(page);
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(`${outDir}/${prefix}-layout.json`, JSON.stringify(report, null, 2));
  for (const [k, v] of Object.entries(report)) console.log(k.padEnd(26), JSON.stringify({ header: v.header?.height, card: v.card && [v.card.top, v.card.bottom], fits: v.fits, panelW: v.panel && v.panel.right - v.panel.left, formW: v.form && v.form.right - v.form.left, alertOutside: v.alertOutside, ovf: v.overflowX }));
})().catch((e) => { console.error(e); process.exit(1); });
