// S07-TC-088 y 089 · Bloque B (D-83) · Reglas del cliente para los comunicados en carrusel: medidas y recorte de la
// imagen, enlace de Genially, atajos de vigencia, validación local y payload. El servidor repite las comprobaciones.
import {test, expect} from 'vitest';
import {analyzeImage, cropRect, outputSize, normalizeGenially, addPeriod, validateCarousel, toPayload, audienceOf} from './announcementRules';

const KB = 1024;

test('S07-TC-088 analiza la imagen: rechaza las menores al mínimo, avisa si no es 3:1 y calcula el recorte ajustable', () => {
  expect(analyzeImage({width: 1920, height: 640, size: 400 * KB, type: 'image/jpeg'})).toEqual({
    error: '', warning: '', crop: false, encode: false, summary: '1920 × 640 px · 400 KB'});
  expect(analyzeImage({width: 1440, height: 479, size: 100 * KB, type: 'image/jpeg'}).error)
    .toBe('La imagen mide 1440 × 479 px; el mínimo es 1440 × 480 px.');
  expect(analyzeImage({width: 1000, height: 2000, size: 100 * KB, type: 'image/webp'}).error).toContain('el mínimo es 1440 × 480 px');
  // Cuadrada de 1400: al recortarla a 3:1 quedaría en 1400 × 467, bajo el mínimo.
  expect(analyzeImage({width: 1400, height: 1400, size: 100 * KB, type: 'image/jpeg'}).error).toContain('el mínimo es 1440 × 480 px');

  const wide = analyzeImage({width: 2400, height: 1350, size: 900 * KB, type: 'image/jpeg'});
  expect(wide).toMatchObject({error: '', crop: true, encode: true});
  expect(wide.warning).toBe('La imagen no está en proporción 3:1 (mide 2400 × 1350 px). Ajusta el encuadre del recorte.');
  expect(cropRect(2400, 1350, 'main')).toEqual({x: 0, y: 275, width: 2400, height: 800});
  expect(cropRect(2400, 1350, 'main', {y: 0})).toEqual({x: 0, y: 0, width: 2400, height: 800});
  expect(cropRect(2400, 1350, 'main', {y: 1})).toEqual({x: 0, y: 550, width: 2400, height: 800});
  expect(outputSize(cropRect(2400, 1350, 'main'), 'main')).toEqual({width: 1920, height: 640});
  // El acercamiento no baja del mínimo: 2400 × 800 admite hasta 1440 × 480.
  expect(cropRect(2400, 800, 'main', {zoom: 3})).toEqual({x: 480, y: 160, width: 1440, height: 480});
  expect(outputSize({x: 0, y: 0, width: 1500, height: 500}, 'main')).toEqual({width: 1500, height: 500});

  expect(analyzeImage({width: 1920, height: 640, size: 700 * KB, type: 'image/jpeg'})).toMatchObject({error: '', crop: false, encode: true});
  expect(analyzeImage({width: 1920, height: 640, size: 300 * KB, type: 'image/png'})).toMatchObject({error: '', encode: true});
  expect(analyzeImage({width: 1920, height: 640, size: 1, type: 'image/gif'}).error).toBe('Elige una imagen JPG, PNG o WebP.');

  expect(analyzeImage({width: 1080, height: 720, size: 200 * KB, type: 'image/webp'}, 'mobile')).toMatchObject({error: '', crop: false});
  expect(analyzeImage({width: 1080, height: 1080, size: 200 * KB, type: 'image/webp'}, 'mobile').warning).toContain('proporción 3:2');
  expect(cropRect(1080, 1080, 'mobile')).toEqual({x: 0, y: 180, width: 1080, height: 720});
  expect(analyzeImage({width: 800, height: 533, size: 1, type: 'image/jpeg'}, 'mobile').error).toContain('el mínimo es 810 × 540 px');
});

test('S07-TC-089 valida Genially como el servidor, los atajos de vigencia, los campos obligatorios y arma el payload', () => {
  expect(normalizeGenially(' https://VIEW.Genially.com/66f1c2a0b3e4d5f6a7b8c9d0/interactive-content-promo/?utm=x#inicio '))
    .toBe('https://view.genially.com/66f1c2a0b3e4d5f6a7b8c9d0');
  for (const url of ['http://view.genially.com/66f1c2a0b3e4', 'https://view.genially.com.evil.test/66f1c2a0b3e4',
    'https://genially.com/66f1c2a0b3e4', 'https://view.genially.com/', 'javascript:alert(1)', 'https://user@view.genially.com/66f1c2a0b3e4',
    'https://view.genially.com:8443/66f1c2a0b3e4', 'https://view.genially.com/66f1c2/../../evilevil', 'https://view.genially.com/<script>']) {
    expect(normalizeGenially(url), url).toBeNull();
  }

  expect(addPeriod('2026-10-26T09:00', 'week')).toBe('2026-11-02T09:00');
  expect(addPeriod('2026-10-26T09:00', 'two-weeks')).toBe('2026-11-09T09:00');
  expect(addPeriod('2026-10-26T09:00', 'month')).toBe('2026-11-26T09:00');
  expect(addPeriod('2027-01-31T09:00', 'month')).toBe('2027-02-28T09:00');

  const empty = validateCarousel({source: 'image', kind: '', title: 'A', alt_text: '', image: null, audience: '', starts_at: '', ends_at: '', link_url: '', link_label: ''});
  expect(Object.keys(empty).sort()).toEqual(['alt_text', 'audiences', 'ends_at', 'image_media_id', 'kind', 'starts_at', 'title']);
  const genially = validateCarousel({source: 'genially', kind: 'news', title: 'Novedades', alt_text: 'Presentación de novedades', genially_url: 'https://genially.com/x',
    audience: 'both', starts_at: '2026-10-27T09:00', ends_at: '2026-10-26T09:00', link_url: 'https://example.test', link_label: ''});
  expect(Object.keys(genially).sort()).toEqual(['ends_at', 'genially_url', 'link_label']);

  const value = {source: 'image', kind: 'raffle', title: 'Sorteo', alt_text: 'Sorteo de un mantenimiento gratis', body: '',
    image: {id: 4}, mobile: {id: 5}, genially_url: 'https://view.genially.com/abc123def', audience: 'both',
    starts_at: '2026-10-26T09:00', ends_at: '2026-11-02T09:00', link_url: '', link_label: ''};
  expect(validateCarousel(value)).toEqual({});
  expect(toPayload(value)).toEqual({source: 'image', kind: 'raffle', title: 'Sorteo', alt_text: 'Sorteo de un mantenimiento gratis',
    body: '', image_media_id: 4, mobile_media_id: 5, genially_url: null, audiences: ['client', 'technician'],
    starts_at: new Date('2026-10-26T09:00').toISOString(), ends_at: new Date('2026-11-02T09:00').toISOString(), link_url: null, link_label: null});
  expect(toPayload({...value, source: 'genially', image: null})).toMatchObject({source: 'genially', image_media_id: null,
    mobile_media_id: null, genially_url: 'https://view.genially.com/abc123def'});
  expect([audienceOf(['client']), audienceOf(['technician']), audienceOf(['technician', 'client'])]).toEqual(['client', 'technician', 'both']);
});
