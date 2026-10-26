const path = require("path");
const { chromium } = require(path.join(process.env.USERPROFILE, ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"));
const [outDir, prefix] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ executablePath: path.join(process.env.LOCALAPPDATA, "ms-playwright/chromium-1248/chrome-win64/chrome.exe") });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" })).newPage();
  await page.goto("http://127.0.0.1:5180/", { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, document.getElementById("empezar").getBoundingClientRect().top + scrollY - 77));
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${outDir}/${prefix}-390x844-empieza-ahora.png` });
  await page.goto("http://127.0.0.1:5180/nosotros", { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, document.getElementById("verificacion").getBoundingClientRect().top + scrollY - 140));
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${outDir}/${prefix}-390x844-nosotros-submenu.png` });
  console.log(await page.evaluate(() => ({ overflowX: document.documentElement.scrollWidth > innerWidth, gap: Math.round(document.querySelector(".ty-about-navbar").getBoundingClientRect().top - document.querySelector(".ty-header").getBoundingClientRect().bottom) })));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
