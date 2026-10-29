/** Ícono de línea de una especialidad por su nombre (el catálogo no guarda íconos): buscador y asistente (D-92, D-94). */
export function specialtyIcon(name = '') {
  const plain = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (plain.includes('refrig')) return 'snow';
  if (plain.includes('electr')) return 'bolt';
  if (plain.includes('comput')) return 'monitor';
  return 'catalog';
}
