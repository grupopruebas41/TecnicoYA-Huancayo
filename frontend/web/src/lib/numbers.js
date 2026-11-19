/**
 * Agrupa los miles con un espacio: «1200» → «1 200», «-1234567» → «-1 234 567».
 * Cierre S4-S5 (Sonar S8786): reemplaza a /\B(?=(\d{3})+(?!\d))/g, que retrocede de forma superlineal; aquí es un bucle lineal.
 */
export function groupThousands(digits) {
  const text = String(digits);
  const sign = text.startsWith('-') ? '-' : '';
  const body = sign ? text.slice(1) : text;
  const groups = [];
  for (let end = body.length; end > 0; end -= 3) groups.unshift(body.slice(Math.max(0, end - 3), end));
  return sign + groups.join(' ');
}
