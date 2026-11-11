// Panel del técnico, Fase T3: formatos compartidos (hora de Lima) y franjas Mañana 08–12, Tarde 12–18 y Noche 18–21.
export const TZ = 'America/Lima';
export const FRANJAS = [
  {id: 'morning', label: 'Mañana', start: '08:00', end: '12:00'},
  {id: 'afternoon', label: 'Tarde', start: '12:00', end: '18:00'},
  {id: 'night', label: 'Noche', start: '18:00', end: '21:00'},
];
export const DAYS = [[1, 'Lun', 'Lunes'], [2, 'Mar', 'Martes'], [3, 'Mié', 'Miércoles'], [4, 'Jue', 'Jueves'], [5, 'Vie', 'Viernes'],
  [6, 'Sáb', 'Sábado'], [7, 'Dom', 'Domingo']];

const part = (iso, options) => new Intl.DateTimeFormat('es-PE', {timeZone: TZ, ...options}).format(new Date(iso)).replace(/\./g, '');
/** «08:00» en hora de Lima. */
export const limaTime = iso => part(iso, {hour: '2-digit', minute: '2-digit', hourCycle: 'h23'});
/** «mié 11 nov» en hora de Lima. */
export const limaDay = iso => `${part(iso, {weekday: 'short'})} ${part(iso, {day: 'numeric'})} ${part(iso, {month: 'short'})}`.toLowerCase();
/** «mié 11 nov · 08:00–10:00» (o solo el día y la hora de inicio si no hay fin). */
export const legibleRange = (start, end) => `${limaDay(start)} · ${limaTime(start)}${end ? `–${limaTime(end)}` : ''}`;
export const franjaOf = iso => {
  const hour = Number(part(iso, {hour: 'numeric', hourCycle: 'h23'}));
  return hour < 12 ? FRANJAS[0] : hour < 18 ? FRANJAS[1] : FRANJAS[2];
};

/** Matriz día × franja desde los horarios guardados: una franja está activa si un horario de ese día la cubre entera. */
export function matrixFrom(slots = []) {
  const matrix = {};
  DAYS.forEach(([day]) => {
    matrix[day] = {};
    FRANJAS.forEach(franja => {
      matrix[day][franja.id] = slots.some(slot => Number(slot.weekday) === day && slot.start <= franja.start && slot.end >= franja.end);
    });
  });
  return matrix;
}

/** Horarios para PUT /technicians/me/availability: las franjas contiguas de un día se unen en un solo horario. */
export function slotsFrom(matrix) {
  const slots = [];
  DAYS.forEach(([day]) => {
    let open = null;
    FRANJAS.forEach(franja => {
      if (matrix[day]?.[franja.id]) {
        if (open && open.end === franja.start) open.end = franja.end;
        else { open = {weekday: day, start: franja.start, end: franja.end}; slots.push(open); }
      } else open = null;
    });
  });
  return slots;
}

/** true si algún horario guardado no coincide con las franjas (al guardar se ajustará a ellas). */
export function hasCustomSlots(slots = []) {
  const normalized = JSON.stringify(slotsFrom(matrixFrom(slots)));
  const saved = JSON.stringify([...slots].map(slot => ({weekday: Number(slot.weekday), start: slot.start, end: slot.end}))
    .sort((a, b) => a.weekday - b.weekday || a.start.localeCompare(b.start)));
  return normalized !== saved;
}

/** Resumen legible del horario: «Lun a Sáb · Mañana y Tarde; Dom · Mañana». */
export function scheduleSummary(matrix) {
  const groups = [];
  DAYS.forEach(([day, short]) => {
    const names = FRANJAS.filter(franja => matrix[day]?.[franja.id]).map(franja => franja.label);
    if (!names.length) return;
    const key = names.join(' y ');
    const last = groups.at(-1);
    if (last && last.key === key && last.lastDay === day - 1) { last.to = short; last.lastDay = day; }
    else groups.push({key, from: short, to: null, lastDay: day});
  });
  return groups.map(group => `${group.to ? `${group.from} a ${group.to}` : group.from} · ${group.key}`).join('; ');
}
