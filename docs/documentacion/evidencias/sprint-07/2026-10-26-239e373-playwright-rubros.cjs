// Registro del técnico con especialidades en dos niveles (2 desplegadas). API simulada con datos sintéticos.
// Uso: node rubros.cjs <outDir> <prefix>
const path = require("path");
const fs = require("fs");
const { chromium } = require(path.join(process.env.USERPROFILE, ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"));
const [outDir, prefix] = process.argv.slice(2);
const json = (route, body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
const rubros = {
  10: ["Reparación de hardware", "Mantenimiento preventivo", "Instalación de software", "Redes e infraestructura", "Recuperación de datos",
    "Eliminación de virus", "Soporte remoto", "Impresoras y equipos de oficina", "Sistemas POS", "Cámaras CCTV"],
  12: ["Instalaciones residenciales", "Instalaciones comerciales", "Tableros eléctricos", "Iluminación", "Puesta a tierra"],
};

(async () => {
  const browser = await chromium.launch({ executablePath: path.join(process.env.LOCALAPPDATA, "ms-playwright/chromium-1248/chrome-win64/chrome.exe") });
  const report = {};
  for (const [w, h] of [[1366, 768], [390, 844]]) {
    const tag = `${w}x${h}`;
    const page = await (await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" })).newPage();
    await page.route("**/api/v1/**", (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith("/catalog/districts")) return json(route, { data: [{ id: 1, code: "HUANCAYO", name: "Huancayo" }, { id: 2, code: "EL-TAMBO", name: "El Tambo" }, { id: 3, code: "CHILCA", name: "Chilca" }] });
      if (url.pathname.endsWith("/catalog/specialties")) return json(route, { data: [{ id: 10, code: "computo", name: "Cómputo" }, { id: 11, code: "refrigeracion", name: "Refrigeración comercial" }, { id: 12, code: "electricidad", name: "Electricidad" }] });
      if (url.pathname.endsWith("/catalog/subcategories")) {
        const id = Number(url.searchParams.get("specialty_id"));
        return json(route, { data: (rubros[id] || ["Vitrinas", "Cámaras de frío"]).map((name, i) => ({ id: id * 100 + i + 1, specialty_id: id, name })) });
      }
      if (url.pathname.endsWith("/me")) return json(route, { error: { code: "UNAUTHENTICATED", message: "Tu sesión no está activa." } }, 401);
      return json(route, { data: [] });
    });
    await page.goto("http://127.0.0.1:5180/#cuenta", { waitUntil: "networkidle" });
    await page.click("[data-cy=show-register]");
    await page.check("[data-cy=register-type-technician]");
    await page.click("[data-cy=register-next]");
    await page.selectOption("[data-cy=register-base-district]", "2");
    await page.check("[data-cy=register-district-HUANCAYO]");
    await page.check("[data-cy=register-specialty-computo]");
    await page.waitForSelector("[data-cy=register-subcategory-1001]");
    await page.check("[data-cy=register-subcategory-1001]");
    await page.check("[data-cy=register-subcategory-1004]");
    await page.check("[data-cy=register-subcategory-1005]");
    await page.check("[data-cy=register-specialty-electricidad]");
    await page.waitForSelector("[data-cy=register-subcategory-1201]");
    await page.check("[data-cy=register-subcategory-1203]");
    await page.check("[data-cy=register-subcategory-1204]");
    await page.locator("[data-cy=register-specialty-computo]").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${outDir}/${prefix}-${tag}-rubros-dos-especialidades.png` });
    await page.locator(".register-summary").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${outDir}/${prefix}-${tag}-rubros-resumen.png` });
    report[tag] = await page.evaluate(() => {
      const chip = document.querySelector("[data-cy=register-district-HUANCAYO]").closest("label");
      const box = chip.querySelector("input").getBoundingClientRect(), text = chip.querySelector("span").getBoundingClientRect();
      return {
        summary: document.querySelector(".register-summary")?.textContent,
        counters: [...document.querySelectorAll(".rubros-count")].map((n) => n.textContent),
        expanded: [...document.querySelectorAll(".specialty-toggle input")].map((n) => n.getAttribute("aria-expanded")),
        checkInline: Math.abs((box.top + box.bottom) / 2 - (text.top + text.bottom) / 2) < 4 && box.right <= text.left,
        overflowX: document.documentElement.scrollWidth > innerWidth,
      };
    });
    await page.context().close();
  }
  await browser.close();
  fs.writeFileSync(`${outDir}/${prefix}-rubros.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
})().catch((e) => { console.error(e); process.exit(1); });
