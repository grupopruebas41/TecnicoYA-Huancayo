// Uso: node shots.cjs <outDir> <prefix>
const path = require("path");
const fs = require("fs");
const { chromium } = require(path.join(process.env.USERPROFILE, ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"));
const BASE = process.env.BASE || "http://127.0.0.1:5180";
const [outDir, prefix] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });

const landingLinks = [["servicios", "Servicios"], ["proceso", "Cómo funciona"], ["tecnicos", "Para técnicos"], ["preguntas", "Preguntas"]];
const aboutLinks = [["quienes", "Quiénes somos"], ["verificacion", "Cómo verificamos"], ["seguridad", "Tu seguridad"], ["testimonios", "Testimonios"], ["equipo", "Equipo"], ["contacto", "Contacto"]];

async function measure(page, id) {
  return page.evaluate((id) => {
    const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), height: Math.round(b.height) }; };
    const header = document.querySelector(".ty-header");
    const bar = document.querySelector(".ty-about-navbar") || document.querySelector(".ty-about-nav");
    const sec = id ? document.getElementById(id) : null;
    const target = sec?.closest("[data-frame='center']") || sec;
    // Texto visible pegado al borde izquierdo (x < 8) dentro del viewport.
    const edge = [];
    for (const el of document.querySelectorAll(".landing-page h1,.landing-page h2,.landing-page h3,.landing-page p,.landing-page a,.landing-page small,.landing-page summary")) {
      const b = el.getBoundingClientRect();
      if (b.width && b.bottom > 0 && b.top < innerHeight && b.left < 8 && getComputedStyle(el).visibility !== "hidden") edge.push((el.textContent || "").trim().slice(0, 40));
    }
    return { scrollY: Math.round(scrollY), header: r(header), subnav: r(bar), target: r(target), hash: location.hash, overflowX: document.documentElement.scrollWidth > innerWidth, edge: edge.slice(0, 8) };
  }, id);
}

async function settle(page) {
  await page.waitForTimeout(700);
  // Evidencia sin nombres reales (AGENTS.md regla 9).
  await page.evaluate(() => document.querySelectorAll("[data-team-name]").forEach((el, i) => {
    el.textContent = "Integrante " + (i + 1);
    const avatar = el.closest("article")?.querySelector(".ty-avatar");
    if (avatar) avatar.textContent = "I" + (i + 1);
  }));
}

(async () => {
  const browser = await chromium.launch({ executablePath: path.join(process.env.LOCALAPPDATA, "ms-playwright/chromium-1248/chrome-win64/chrome.exe") });
  const report = {};
  for (const [w, h] of [[1366, 768], [1920, 1080], [390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    const tag = `${w}x${h}`;
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await settle(page);
    await page.screenshot({ path: `${outDir}/${prefix}-${tag}-hero.png` });
    report[`${tag}-hero`] = await measure(page, "inicio");
    if (w === 390) {
      await page.evaluate(() => window.scrollTo(0, document.getElementById("proceso").offsetTop - 72));
      await settle(page);
      await page.screenshot({ path: `${outDir}/${prefix}-${tag}-proceso.png` });
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await settle(page);
      await page.screenshot({ path: `${outDir}/${prefix}-${tag}-pie.png` });
      report[`${tag}-pie`] = await measure(page, "pie");
      await page.goto(BASE + "/nosotros", { waitUntil: "networkidle" });
      await settle(page);
      await page.screenshot({ path: `${outDir}/${prefix}-${tag}-nosotros.png` });
      report[`${tag}-nosotros`] = await measure(page, null);
      await ctx.close();
      continue;
    }
    for (const [id, name] of landingLinks) {
      await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name, exact: true }).click();
      await settle(page);
      await page.screenshot({ path: `${outDir}/${prefix}-${tag}-${id}.png` });
      report[`${tag}-${id}`] = await measure(page, id);
    }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await settle(page);
    await page.screenshot({ path: `${outDir}/${prefix}-${tag}-pie.png` });
    report[`${tag}-pie`] = await measure(page, "pie");
    await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Nosotros", exact: true }).click();
    await settle(page);
    await page.screenshot({ path: `${outDir}/${prefix}-${tag}-nosotros-hero.png` });
    report[`${tag}-nosotros-hero`] = await measure(page, null);
    for (const [id, name] of aboutLinks) {
      await page.getByRole("navigation", { name: "Acerca de TécnicoYa" }).getByRole("link", { name, exact: true }).click();
      await settle(page);
      await page.screenshot({ path: `${outDir}/${prefix}-${tag}-nosotros-${id}.png` });
      report[`${tag}-nosotros-${id}`] = await measure(page, id);
    }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await settle(page);
    await page.screenshot({ path: `${outDir}/${prefix}-${tag}-nosotros-pie.png` });
    report[`${tag}-nosotros-pie`] = await measure(page, "pie");
    if (process.env.FULL) {
      await page.screenshot({ path: `${outDir}/${prefix}-${tag}-nosotros-full.png`, fullPage: true });
      await page.goto(BASE + "/", { waitUntil: "networkidle" });
      await settle(page);
      await page.screenshot({ path: `${outDir}/${prefix}-${tag}-landing-full.png`, fullPage: true });
    }
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(`${outDir}/${prefix}-layout.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
})().catch((e) => { console.error(e); process.exit(1); });
