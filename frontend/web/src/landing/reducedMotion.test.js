import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {expect, test} from 'vitest';

// S05-TC-379 · Cierre S4-S5 (workflow e2e-cierre, S02-TC-060): con «Reducir movimiento», landing.css quita transform a
// todo (.landing-page * { transform: none !important }) y con eso el centrado translate(-50%, -50%) de las tarjetas del
// carrusel, que tienen posición absoluta: la tarjeta central quedaba corrida y tapaba los controles (1000, 1366 y 390 px,
// medido con Playwright). jsdom no calcula diseño, así que se comprueba la regla que lo evita.
test('S05-TC-379 con movimiento reducido, las tarjetas del carrusel conservan su centrado sobre la regla general', () => {
  const css = readFileSync(resolve('src/landing.css'), 'utf8').replace(/\s+/g, ' ');
  const reduced = [...css.matchAll(/@media \(prefers-reduced-motion: reduce\) \{(.*?)\} \}/g)].map(match => match[1]).join(' ');
  expect(reduced).toContain('.landing-page * , .landing-page *:before { animation: none !important; transition: none !important; transform: none !important;'.replace(' , ', ', '));
  expect(reduced).toMatch(/\.landing-page \.ty-product-stage\.is-reduced \.ty-product-card \{[^}]*transform: translate\(-50%, -50%\) translateX\(var\(--card-x\)\) scale\(var\(--card-scale\)\) !important/);
  expect(reduced).toMatch(/\.landing-page \.ty-product-stage\.is-reduced \.ty-product-card\.is-center \{[^}]*transform: translate\(-50%, -50%\) translateX\(var\(--card-x\)\) scale\(1\) !important/);
});
