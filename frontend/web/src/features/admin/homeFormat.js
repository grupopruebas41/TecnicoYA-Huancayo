// Fase A2 del panel del administrador: formatos del Inicio, siempre con la hora de Lima (America/Lima, sin horario de
// verano), como el servidor cuenta «hoy» y los días de la serie.
const LIMA = 'America/Lima';
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];

const parts = (date, options) => Object.fromEntries(new Intl.DateTimeFormat('es-PE', {timeZone: LIMA, ...options})
  .formatToParts(date).map(({type, value}) => [type, value]));

/** «Buenos días» hasta las 11:59, «Buenas tardes» hasta las 18:59 y «Buenas noches» después (hora de Lima). */
export function greeting(date = new Date()) {
  const hour = Number(parts(date, {hour: 'numeric', hourCycle: 'h23'}).hour);
  if (hour < 12) return 'Buenos días';
  return hour < 19 ? 'Buenas tardes' : 'Buenas noches';
}

/** «miércoles, 25 de noviembre». */
export const longDate = (date = new Date()) =>
  new Intl.DateTimeFormat('es-PE', {timeZone: LIMA, weekday: 'long', day: 'numeric', month: 'long'}).format(date);

/** «10:05». */
export function clock(value) {
  const {hour, minute} = parts(new Date(value), {hour: '2-digit', minute: '2-digit', hourCycle: 'h23'});
  return `${hour}:${minute}`;
}

/** «25 nov · 09:00» (fecha y hora de Lima de un instante ISO). */
export function shortDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  const {day, month} = parts(date, {day: 'numeric', month: 'numeric'});
  return `${day} ${MONTHS[Number(month) - 1]} · ${clock(date)}`;
}

/** «25 nov» de una fecha de calendario «2026-11-25» (ya es un día de Lima). */
export function shortDay(isoDate) {
  const [, month, day] = isoDate.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]}`;
}

/** Minutos a «18 min», «1 h» o «1 h 5 min»; sin dato, «—». */
export function minutesLabel(minutes) {
  if (minutes === null || minutes === undefined) return '—';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return minutes % 60 ? `${hours} h ${minutes % 60} min` : `${hours} h`;
}

/** Día de calendario de Lima («2026-11-25») de un instante. */
export function limaDay(date) {
  const {year, month, day} = parts(date, {year: 'numeric', month: '2-digit', day: '2-digit'});
  return `${year}-${month}-${day}`;
}

/** «hace un momento», «hace 12 min», «hace 2 h», «hace 2 h 30 min», «hace 1 día» o «hace 3 días». */
export function relativeTime(value, now = new Date()) {
  const minutes = Math.max(0, Math.floor((now.getTime() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return 'hace un momento';
  if (minutes < 60) return `hace ${minutes} min`;
  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    return minutes % 60 ? `hace ${hours} h ${minutes % 60} min` : `hace ${hours} h`;
  }
  const days = Math.floor(minutes / 1440);
  return days === 1 ? 'hace 1 día' : `hace ${days} días`;
}

/** «1 creada» y «3 creadas»: el sustantivo en singular o plural según el número. */
export const counted = (count, one, many) => `${count} ${count === 1 ? one : many}`;
