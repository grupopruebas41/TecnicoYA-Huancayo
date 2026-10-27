// Reglas del cliente para los comunicados en carrusel (D-83). El servidor repite cada comprobación: aquí solo se
// evita enviar lo que se sabe inválido y se calcula el recorte de la imagen.

export const KIND_LABELS = {promotion: 'Promoción', raffle: 'Sorteo', news: 'Novedad', notice: 'Aviso'};
export const AUDIENCE_OPTIONS = [
  {value: 'client', label: 'Solo clientes', hint: 'Panel del cliente', audiences: ['client']},
  {value: 'technician', label: 'Solo técnicos', hint: 'Panel del técnico', audiences: ['technician']},
  {value: 'both', label: 'Ambos', hint: 'Clientes y técnicos', audiences: ['client', 'technician']},
];
export const AUDIENCE_TAGS = {client: 'Clientes', technician: 'Técnicos'};
export const PHASE_LABELS = {draft: 'Borrador', scheduled: 'Programado', active: 'Vigente', expired: 'Vencido', retired: 'Retirado'};
/** Fase que calcula la API; si falta (respuestas anteriores a D-83), se deduce del estado. */
export const phaseOf = item => item?.phase || (item?.retired_at || item?.status === 'retired' ? 'retired' : item?.status === 'draft' ? 'draft' : 'active');
export const MAX_BYTES = 600 * 1024;
export const IMAGE_GUIDE = 'Recomendado 1920 × 640 px (3:1), WebP o JPG hasta 600 KB. Mínimo 1440 × 480. Deja el texto importante en el 80 % central. Versión móvil opcional 1080 × 720.';
export const MOBILE_GUIDE = 'Opcional. Recomendado 1080 × 720 px (3:2), WebP o JPG hasta 600 KB. Mínimo 810 × 540.';

// Medidas del servidor (AnnouncementImages): el mínimo es el 75 % de la medida recomendada.
export const SLOTS = {
  main: {ratio: 3, label: '3:1', minWidth: 1440, minHeight: 480, width: 1920, height: 640},
  mobile: {ratio: 1.5, label: '3:2', minWidth: 810, minHeight: 540, width: 1080, height: 720},
};
const INPUT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const UPLOAD_TYPES = ['image/jpeg', 'image/webp'];
const RATIO_TOLERANCE = 0.01;

const px = (width, height) => `${width} × ${height} px`;

/** Base del recorte: el mayor rectángulo con la proporción del espacio que cabe en la imagen. */
function baseCrop(width, height, ratio) {
  return width / height > ratio ? {width: Math.round(height * ratio), height} : {width, height: Math.round(width / ratio)};
}

export function analyzeImage({width, height, size, type}, slot = 'main') {
  const rule = SLOTS[slot];
  const summary = `${px(width, height)} · ${Math.max(1, Math.round(size / 1024))} KB`;
  const minimum = `el mínimo es ${px(rule.minWidth, rule.minHeight)}.`;
  if (!INPUT_TYPES.includes(type)) return {error: 'Elige una imagen JPG, PNG o WebP.', warning: '', crop: false, encode: false, summary};
  if (width < rule.minWidth || height < rule.minHeight) {
    return {error: `La imagen mide ${px(width, height)}; ${minimum}`, warning: '', crop: false, encode: false, summary};
  }
  const crop = Math.abs(width / height - rule.ratio) / rule.ratio > RATIO_TOLERANCE;
  const base = baseCrop(width, height, rule.ratio);
  if (crop && (base.width < rule.minWidth || base.height < rule.minHeight)) {
    return {error: `Recortada a ${rule.label} quedaría en ${px(base.width, base.height)}; ${minimum}`, warning: '', crop: false, encode: false, summary};
  }
  const warning = crop ? `La imagen no está en proporción ${rule.label} (mide ${px(width, height)}). Ajusta el encuadre del recorte.` : '';
  const encode = crop || size > MAX_BYTES || !UPLOAD_TYPES.includes(type) || width > rule.width;
  return {error: '', warning, crop, encode, summary};
}

/** Recorte en píxeles de la imagen: x e y de 0 a 1 ubican el encuadre; zoom lo acerca sin bajar del mínimo. */
export function cropRect(width, height, slot, {x = 0.5, y = 0.5, zoom = 1} = {}) {
  const rule = SLOTS[slot];
  const base = baseCrop(width, height, rule.ratio);
  const limit = Math.max(1, Math.min(base.width / rule.minWidth, base.height / rule.minHeight));
  const factor = Math.min(Math.max(zoom, 1), limit);
  const cropWidth = Math.round(base.width / factor);
  const cropHeight = Math.round(cropWidth / rule.ratio);
  return {x: Math.round((width - cropWidth) * x), y: Math.round((height - cropHeight) * y), width: cropWidth, height: cropHeight};
}

/** Tamaño del archivo final: la medida recomendada, o la del recorte si es menor (no se amplía). */
export function outputSize(rect, slot) {
  const rule = SLOTS[slot];
  const width = Math.min(rect.width, rule.width);
  return {width, height: Math.round(width / rule.ratio)};
}

/** Igual que GeniallyUrl del servidor: https://view.genially.com/<código>, con un nombre legible opcional. */
export function normalizeGenially(value) {
  const match = /^https:\/\/view\.genially\.com\/([A-Za-z0-9]{6,64})(?:\/[A-Za-z0-9-]{1,120})?\/?(?:[?#].*)?$/i.exec(String(value ?? '').trim());
  return match ? 'https://view.genially.com/' + match[1] : null;
}

const pad = n => String(n).padStart(2, '0');
export const toLocalInput = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

/** Atajos de vigencia: 1 semana, 2 semanas o 1 mes desde el inicio (el mes se ajusta al último día si hace falta). */
export function addPeriod(start, period) {
  const date = new Date(start);
  if (Number.isNaN(date.getTime())) return '';
  if (period === 'month') {
    const day = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + 1);
    date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
  } else {
    date.setDate(date.getDate() + (period === 'week' ? 7 : 14));
  }
  return toLocalInput(date);
}

export const audienceOf = audiences => (audiences?.length === 2 ? 'both' : audiences?.[0] || '');

export function validateCarousel(v) {
  const errors = {};
  const add = (field, message) => { errors[field] = [message]; };
  const title = Array.from(v.title?.trim() || '').length;
  if (title < 3 || title > 120) add('title', 'El título interno debe tener entre 3 y 120 caracteres.');
  if (!KIND_LABELS[v.kind]) add('kind', 'Elige el tipo de comunicado.');
  const alt = Array.from(v.alt_text?.trim() || '').length;
  if (alt < 5 || alt > 250) add('alt_text', 'Escribe el texto alternativo: lo que dice la imagen (entre 5 y 250 caracteres).');
  if (v.source === 'image' && !v.image?.id) add('image_media_id', 'Elige la imagen principal.');
  if (v.source === 'genially' && !normalizeGenially(v.genially_url)) add('genially_url', 'Pega un enlace con la forma https://view.genially.com/<código>.');
  if (!AUDIENCE_OPTIONS.some(option => option.value === v.audience)) add('audiences', 'Elige la audiencia.');
  const starts = new Date(v.starts_at), ends = new Date(v.ends_at);
  if (!v.starts_at || Number.isNaN(starts.getTime())) add('starts_at', 'Indica el inicio de la vigencia.');
  if (!v.ends_at || Number.isNaN(ends.getTime())) add('ends_at', 'Indica el fin de la vigencia.');
  else if (ends <= starts) add('ends_at', 'El fin debe ser posterior al inicio.');
  if (v.link_url && !/^https?:\/\/\S+$/i.test(v.link_url.trim())) add('link_url', 'El enlace debe empezar con http:// o https://.');
  if (v.link_url && !v.link_label?.trim()) add('link_label', 'Escribe la etiqueta del botón del enlace.');
  if (Array.from(v.link_label || '').length > 40) add('link_label', 'La etiqueta admite hasta 40 caracteres.');
  return errors;
}

export function toPayload(v) {
  const image = v.source === 'image';
  return {
    source: v.source, kind: v.kind, title: v.title.trim(), alt_text: v.alt_text.trim(), body: v.body || '',
    image_media_id: v.image?.id ?? null, mobile_media_id: image ? v.mobile?.id ?? null : null,
    genially_url: v.source === 'genially' ? normalizeGenially(v.genially_url) : null,
    audiences: AUDIENCE_OPTIONS.find(option => option.value === v.audience)?.audiences || [],
    starts_at: new Date(v.starts_at).toISOString(), ends_at: new Date(v.ends_at).toISOString(),
    link_url: v.link_url?.trim() || null, link_label: v.link_url?.trim() ? v.link_label.trim() : null,
  };
}
