// Empieza ahora y submenú de Nosotros con movimiento normal. Uso: node submenu.cjs <outDir> <prefix>
const path = require("path");
const fs = require("fs");
const { chromium } = require(path.join(process.env.USERPROFILE, ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"));
const [outDir, prefix] = process.argv.slice(2);
const BASE = "http://127.0.0.1:5180";

function chrome(page) {
  return page.evaluate(() => {
    const box = (el) => el && (({ top, bottom }) => ({ top: Math.round(top), bottom: Math.round(bottom) }))(el.getBoundingClientRect());
    const header = document.querySelector(".ty-header");
    const bar = document.querySelector(".ty-about-navbar");
    const hidden = bar ? getComputedStyle(bar).visibility === "hidden" : null;
    return {
      scrollY: Math.round(scrollY),
      header: box(header),
      subnav: bar ? { ...box(bar), hidden, ariaHidden: bar.getAttribute("aria-hidden"), inert: bar.hasAttribute("inert") } : null,
      gap: bar && !hidden ? Math.round(bar.getBoundingClientRect().top - header.getBoundingClientRect().bottom) : null,
      hash: location.hash,
    };
  });
}

(async () => {
  const browser = await chromium.launch({ executablePath: path.join(process.env.LOCALAPPDATA, "ms-playwright/chromium-1248/chrome-win64/chrome.exe") });
  const report = {};
  for (const [w, h] of [[1366, 768], [1920, 1080]]) {
    const tag = `${w}x${h}`;
    const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
    // Empieza ahora: tras la intro, se desplaza hasta la sección y deja terminar la entrada.
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForSelector(".ty-intro-content:not([hidden])", { timeout: 20000 });
    await page.waitForTimeout(1200);
    await page.evaluate(() => {
      const s = document.getElementById("empezar");
      window.scrollTo({ top: s.getBoundingClientRect().top + scrollY - document.querySelector(".ty-header").offsetHeight, behavior: "instant" });
    });
    await page.waitForTimeout(1400);
    await page.mouse.move(5, 5);
    await page.screenshot({ path: `${outDir}/${prefix}-${tag}-empieza-ahora.png` });
    report[`${tag}-empieza`] = await page.evaluate(() => {
      const s = document.getElementById("empezar").getBoundingClientRect();
      return { height: Math.round(s.height), cards: [...document.querySelectorAll(".ty-path-card")].map((c) => getComputedStyle(c).opacity) };
    });
    // Nosotros arriba: submenú oculto.
    await page.goto(BASE + "/nosotros", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${outDir}/${prefix}-${tag}-nosotros-arriba.png` });
    report[`${tag}-nosotros-arriba`] = await chrome(page);
    // Bajar con la rueda hasta salir de la portada.
    for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(60); }
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${outDir}/${prefix}-${tag}-nosotros-tras-portada.png` });
    report[`${tag}-nosotros-tras-portada`] = await chrome(page);
    for (const [id, name] of [["quienes", "Quiénes somos"], ["testimonios", "Testimonios"]]) {
      await page.getByRole("navigation", { name: "Acerca de TécnicoYa" }).getByRole("link", { name, exact: true }).click();
      await page.waitForTimeout(1600);
      await page.screenshot({ path: `${outDir}/${prefix}-${tag}-nosotros-${id}.png` });
      report[`${tag}-nosotros-${id}`] = { ...(await chrome(page)), sectionTop: await page.evaluate((id) => Math.round(document.getElementById(id).getBoundingClientRect().top), id) };
    }
    // Volver arriba: el submenú se oculta de nuevo.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(800);
    report[`${tag}-nosotros-vuelta`] = await chrome(page);
    await page.context().close();
  }
  await browser.close();
  fs.writeFileSync(`${outDir}/${prefix}-submenu-layout.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
