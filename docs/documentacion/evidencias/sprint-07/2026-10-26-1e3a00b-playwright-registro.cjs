// Registro en 2 pasos y recuperación de contraseña. La API se simula con page.route (datos sintéticos).
// Uso: node registro.cjs <outDir> <prefix>
const path = require("path");
const fs = require("fs");
const { chromium } = require(path.join(process.env.USERPROFILE, ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"));
const [outDir, prefix] = process.argv.slice(2);
const BASE = "http://127.0.0.1:5180";
const json = (route, body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

async function mockApi(page, log) {
  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204, headers: { "set-cookie": "XSRF-TOKEN=sintetico; Path=/" } }));
  await page.route("**/api/v1/**", (route) => {
    const url = route.request().url();
    if (url.endsWith("/catalog/districts")) return json(route, { data: [{ id: 1, code: "HUANCAYO", name: "Huancayo" }, { id: 2, code: "EL-TAMBO", name: "El Tambo" }, { id: 3, code: "CHILCA", name: "Chilca" }] });
    if (url.endsWith("/catalog/specialties")) return json(route, { data: [{ id: 10, code: "computo", name: "Cómputo" }, { id: 11, code: "refrigeracion", name: "Refrigeración comercial" }, { id: 12, code: "electricidad", name: "Electricidad" }] });
    if (url.endsWith("/auth/register")) { log.push(JSON.parse(route.request().postData())); return json(route, { data: { id: "1" } }, 201); }
    if (url.endsWith("/auth/password/forgot")) return json(route, { data: { message: "Si el correo existe, te enviamos un enlace para restablecer tu contraseña." } }, 202);
    if (url.endsWith("/auth/password/reset")) return json(route, { data: { message: "Tu contraseña se actualizó. Inicia sesión con la nueva contraseña." } });
    if (url.endsWith("/me")) return json(route, { error: { code: "UNAUTHENTICATED", message: "Tu sesión no está activa." } }, 401);
    return json(route, { data: [] });
  });
}

(async () => {
  const browser = await chromium.launch({ executablePath: path.join(process.env.LOCALAPPDATA, "ms-playwright/chromium-1248/chrome-win64/chrome.exe") });
  const report = {};
  for (const [w, h] of [[1366, 768], [390, 844]]) {
    const tag = `${w}x${h}`;
    const log = [];
    const page = await (await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" })).newPage();
    await mockApi(page, log);
    const shot = (name) => page.screenshot({ path: `${outDir}/${prefix}-${tag}-${name}.png` });
    await page.goto(BASE + "/#cuenta", { waitUntil: "networkidle" });
    await page.click("[data-cy=show-register]");
    await page.check("[data-cy=register-type-client]");
    await shot("registro-paso1");
    // Cliente: paso 2 con validación en vivo y medidor.
    await page.click("[data-cy=register-next]");
    await page.fill("[data-cy=register-given-names]", "Ana Lucía");
    await page.fill("[data-cy=register-family-names]", "Quispe Rojas");
    await page.fill("[data-cy=register-email]", "ana@example.test");
    await page.fill("[data-cy=register-phone]", "98765432");
    await page.locator("[data-cy=register-phone]").blur();
    await page.selectOption("[data-cy=register-district]", "1");
    await page.selectOption("[data-cy=register-client-type]", "mype");
    await page.fill("[data-cy=register-password]", "Abcdefgh12!x");
    await shot("registro-cliente-paso2");
    report[`${tag}-cliente`] = await page.evaluate(() => ({ phoneInvalid: document.querySelector("[data-cy=register-phone]").getAttribute("aria-invalid"), meter: document.querySelector("[role=meter]").getAttribute("aria-valuenow"), overflowX: document.documentElement.scrollWidth > innerWidth }));
    // Técnico: volver al paso 1 y cambiar de tarjeta.
    await page.click("[data-cy=register-back]");
    await page.check("[data-cy=register-type-technician]");
    await shot("registro-paso1-tecnico");
    await page.click("[data-cy=register-next]");
    await page.fill("[data-cy=register-phone]", "987654321");
    await page.selectOption("[data-cy=register-base-district]", "2");
    await page.check("[data-cy=register-district-HUANCAYO]");
    await page.check("[data-cy=register-specialty-computo]");
    await page.fill("[data-cy=register-experience]", "4");
    await page.fill("[data-cy=register-password-confirmation]", "Abcdefgh12!x");
    await page.check("[data-cy=register-terms]");
    await shot("registro-tecnico-paso2");
    await page.click("[data-cy=register-submit]");
    await page.waitForSelector("[data-cy=register-success]");
    await shot("registro-tecnico-creado");
    report[`${tag}-tecnico`] = { enviado: Object.fromEntries(Object.entries(log[0] || {}).filter(([k]) => !k.startsWith("password"))), conservoNombres: log[0]?.given_names === "Ana Lucía" };
    // Recuperación.
    await page.click("[data-cy=show-forgot]");
    await page.fill("[data-cy=forgot-email]", "ana@example.test");
    await page.click("[data-cy=forgot-submit]");
    await page.waitForSelector("[data-cy=forgot-sent]");
    await shot("recuperar-enlace-enviado");
    await page.goto(BASE + "/#cuenta/restablecer?token=sintetico&email=ana%40example.test", { waitUntil: "networkidle" });
    await page.fill("[data-cy=reset-password]", "Abcdefgh12!x");
    await page.fill("[data-cy=reset-password-confirmation]", "Abcdefgh12!x");
    await shot("restablecer-formulario");
    await page.click("[data-cy=reset-submit]");
    await page.waitForSelector("[data-cy=reset-done]");
    await shot("restablecer-listo");
    await page.context().close();
  }
  await browser.close();
  fs.writeFileSync(`${outDir}/${prefix}-registro.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
