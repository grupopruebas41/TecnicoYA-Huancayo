// Pulido final del panel del cliente: formatos comunes en español del Perú, en hora de Lima.
import {groupThousands} from './numbers';

export const TZ = 'America/Lima';
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];

/** Monto en formato peruano con coma decimal: «S/ 50,00» y «S/ 1 200,00». */
export function soles(value) {
  const [whole, decimal] = Number(value).toFixed(2).split('.');
  return `S/ ${groupThousands(whole)},${decimal}`;
}

/** Día, mes y hora de Lima como números (sin depender del formato del navegador). */
function limaParts(value) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).formatToParts(new Date(value)).map(part => [part.type, part.value]));
  return {year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), time: `${parts.hour}:${parts.minute}`};
}

/** «4 dic» (y el año si no es el actual). */
export function shortDate(value, now = new Date()) {
  if (!value) return '';
  const {year, month, day} = limaParts(value);
  return `${day} ${MONTHS[month - 1]}${year === limaParts(now).year ? '' : ` ${year}`}`;
}

/** «4 dic · 09:00». */
export function shortDateTime(value, now = new Date()) {
  return value ? `${shortDate(value, now)} · ${limaParts(value).time}` : '';
}

/** «hace un momento», «hace 5 min», «hace 3 h», «ayer», «hace 12 días» o «hace 2 meses». */
export function relativeTime(value, now = Date.now()) {
  const elapsed = Number(now) - Date.parse(value);
  if (!Number.isFinite(elapsed)) return '';
  const minutes = Math.max(0, Math.floor(elapsed / 60000));
  if (minutes < 1) return 'hace un momento';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ayer';
  if (days < 60) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  return `hace ${months} meses`;
}
