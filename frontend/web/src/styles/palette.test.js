// S07-TC-077 · Ajuste del PR #32 (A3 y A4): paleta nueva del tema claro con contraste AA, el tema oscuro sin cambios
// y la vista previa de comunicados sobre tokens del tema (antes, texto oscuro sobre un fondo verde fijo).
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {test, expect} from 'vitest';

const tokens = readFileSync(resolve('src/styles/tokens.css'), 'utf8');
const panel = readFileSync(resolve('src/features/panel/panel.css'), 'utf8');

function block(css, selector) {
  const start = css.indexOf(selector + ' {');
  expect(start, selector).toBeGreaterThanOrEqual(0);
  return css.slice(start, css.indexOf('}', start));
}
function values(css) {
  return Object.fromEntries([...css.matchAll(/(--ty-[\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map(([, name, hex]) => [name, hex.toUpperCase()]));
}
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
};

test('S07-TC-077 tema claro con la paleta pedida y contraste AA; el tema oscuro y la vista previa no dependen de colores fijos', () => {
  const light = values(block(tokens, '[data-theme="light"]'));
  expect(light).toMatchObject({
    '--ty-bg': '#F4F7F6', '--ty-surface': '#FFFFFF', '--ty-border': '#DDE5E3', '--ty-topbar-bg': '#FFFFFF',
    '--ty-sidebar-bg': '#0F2A2E', '--ty-sidebar-text': '#E8EFEE', '--ty-sidebar-active': '#1C4A4F', '--ty-sidebar-mark': '#C9A35A',
    '--ty-text': '#13222A', '--ty-muted': '#5A6B70', '--ty-accent': '#1F6F6B', '--ty-gold': '#B8893B',
    '--ty-success': '#2E7D5B', '--ty-warning': '#B7791F', '--ty-error': '#B42318',
  });

  // Texto normal: 4.5:1. Bordes de controles, foco e indicadores no textuales: 3:1 (WCAG 1.4.11).
  const text = [
    ['--ty-text', '--ty-bg'], ['--ty-text', '--ty-surface'], ['--ty-text', '--ty-raised'], ['--ty-muted', '--ty-bg'],
    ['--ty-muted', '--ty-surface'], ['--ty-accent', '--ty-surface'], ['--ty-on-accent', '--ty-accent'],
    ['--ty-sidebar-text', '--ty-sidebar-bg'], ['--ty-sidebar-text', '--ty-sidebar-active'], ['--ty-sidebar-muted', '--ty-sidebar-bg'],
    ['--ty-error', '--ty-surface'], ['--ty-success', '--ty-surface'], ['--ty-warning-text', '--ty-warning-bg'],
    ['--ty-success-text', '--ty-success-bg'], ['--ty-muted', '--ty-neutral-bg'],
  ];
  for (const [fg, bg] of text) expect(contrast(light[fg], light[bg]), `${fg} sobre ${bg}`).toBeGreaterThanOrEqual(4.5);
  for (const [fg, bg] of [['--ty-control-border', '--ty-surface'], ['--ty-accent', '--ty-surface'], ['--ty-sidebar-mark', '--ty-sidebar-active'], ['--ty-sidebar-mark', '--ty-sidebar-bg']]) {
    expect(contrast(light[fg], light[bg]), `${fg} sobre ${bg}`).toBeGreaterThanOrEqual(3);
  }

  const dark = values(block(tokens, ':root'));
  expect(dark).toMatchObject({'--ty-bg': '#0D1B1E', '--ty-surface': '#152A2D', '--ty-raised': '#203B3E', '--ty-text': '#F2EBDF',
    '--ty-muted': '#B9C9C7', '--ty-accent': '#D9BD8B', '--ty-border': '#4B6261'});

  const preview = block(panel, '.panel-shell .s02-preview');
  expect(preview).toContain('background: var(--ty-raised)');
  expect(preview).toContain('color: var(--ty-text)');
});
