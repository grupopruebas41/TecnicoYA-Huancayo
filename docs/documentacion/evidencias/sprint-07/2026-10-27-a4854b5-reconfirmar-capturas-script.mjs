  // Bloque C (D-85): menú agrupado, Inicio, Estadísticas, Usuarios, Solicitudes y activación, con la API real del slot A.
  const browser = await chromium.launch({executablePath: path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1248/chrome-win64/chrome.exe'),
    args: ['--renderer-process-limit=1', '--disable-gpu', '--disable-extensions', '--disable-background-networking']});
  async function session(width, height) {
    const context = await browser.newContext({viewport: {width, height}, reducedMotion: 'reduce'});
    const page = await context.newPage();
    globalThis.debugPage = page;
    page.on('console', message => { if (message.type() === 'error') console.error('[consola]', message.text()); });
    page.on('pageerror', error => { report.errors = [...(report.errors || []), String(error)]; });
    return {context, page};
  }
  const login = async (page, role) => {
    await page.goto(web + '/#cuenta', {waitUntil: 'load', timeout: 90000});
    await page.waitForSelector('[data-cy=login-email]', {timeout: 90000});
    await page.fill('[data-cy=login-email]', `e2e-${role}@example.test`);
    await page.fill('[data-cy=login-password]', password);
    await page.click('[data-cy=login-submit]');
    await page.waitForSelector(`[data-cy=portal-${role}]`);
  };
  const logout = async page => { await page.locator('[data-cy=logout]').evaluate(node => node.click()); await page.waitForSelector('[data-cy=login-submit]'); };
  const setTheme = async (page, theme) => {
    if (await page.evaluate(() => document.documentElement.dataset.theme) !== theme) {
      await page.click('.panel-avatar-button');
      await page.getByRole('menuitem', {name: /Tema/}).click();
      await page.waitForFunction(value => document.documentElement.dataset.theme === value, theme);
    }
  };
  const nav = async (page, width, label) => {
    if (width < 760) await page.click('.panel-drawer-toggle');
    await page.locator('.panel-sidebar nav').getByRole('button', {name: label, exact: true}).click();
  };
  const settle = page => page.waitForTimeout(500);
  // D-85 confirmada: alta de un administrador con reconfirmación de la contraseña de quien lo crea.
  for (const [width, height, theme] of [[1366, 900, 'light'], [390, 844, 'dark']]) {
    const {context, page} = await session(width, height);
    const tag = `${width}-${theme}`;
    const shot = name => page.screenshot({path: `${outDir}/${prefix}-${tag}-${name}.png`, fullPage: true});
    const overflow = async name => { report[`${tag}-${name}`] = {overflowX: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)}; };
    await login(page, 'admin'); await setTheme(page, theme);
    await page.getByRole('navigation', {name: 'Accesos rápidos'}).getByRole('button', {name: 'Crear usuario'}).click();
    await page.getByRole('radio', {name: 'Administrador'}).check();
    await page.getByLabel('Nombres').fill('Carla');
    await page.getByLabel('Apellidos').fill('Paredes');
    await page.getByLabel('Correo').fill(`carla.${width}@example.test`);
    await page.getByLabel('Teléfono').fill('923456789');
    await page.getByLabel('Motivo (queda en la auditoría)').fill('Nueva integrante del equipo de soporte.');
    await page.getByRole('button', {name: 'Crear y enviar activación'}).click();
    await page.getByText('Escribe tu contraseña para confirmar el alta de un administrador.').waitFor();
    await settle(page); await shot('admin-sin-contrasena'); await overflow('admin-sin-contrasena');
    await page.getByLabel('Tu contraseña (para confirmar)').fill('clave-equivocada-123');
    await page.getByRole('button', {name: 'Crear y enviar activación'}).click();
    await page.getByText('La contraseña actual no es correcta.').waitFor();
    await settle(page); await shot('admin-contrasena-incorrecta'); await overflow('admin-contrasena-incorrecta');
    await page.getByLabel('Tu contraseña (para confirmar)').fill(password);
    await page.getByRole('button', {name: 'Crear y enviar activación'}).click();
    await page.getByText('Usuario creado: le enviamos el enlace de activación a su correo.').waitFor();
    await settle(page); await shot('admin-creado'); await overflow('admin-creado');
    await context.close();
  }
  await browser.close();
  writeFileSync(`${outDir}/${prefix}-capturas.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(error);
  try { await globalThis.debugPage?.screenshot({path: `${outDir}/fallo.png`}); } catch {}
  process.exitCode = 1;
} finally { stop(); }
