import {request} from '../administration/http';

// Fase 3 del panel final (D-101, propuesta): textos y reglas compartidas por Buscar técnicos y el perfil público.

/** Portada por especialidad: computo, refrigeracion o electricidad (el catálogo no guarda imágenes de portada). */
export function specialtySlug(name = '') {
  const plain = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (plain.includes('refrig')) return 'refrigeracion';
  if (plain.includes('electr')) return 'electricidad';
  if (plain.includes('comput')) return 'computo';
  return 'general';
}

/** Un decimal con coma, como el resto del panel: 4.7 → «4,7». */
export const decimal = value => Number(value).toFixed(1).replace('.', ',');

/**
 * Calificación de la tarjeta y del perfil: las reales (Sprint 6) mandan; si no hay, el resumen de las reseñas de ejemplo
 * con la marca «Ejemplo»; si tampoco, «Nuevo». Las reseñas de ejemplo nunca son calificaciones.
 */
export function ratingOf(technician) {
  if (technician?.rating?.count > 0) {
    const {average, count} = technician.rating;
    return {kind: 'real', value: decimal(average), label: `${decimal(average)} de 5 en ${count} ${count === 1 ? 'calificación' : 'calificaciones'}`};
  }
  if (technician?.sample_rating?.count > 0) {
    const {average, count} = technician.sample_rating;
    return {kind: 'sample', value: decimal(average), label: `${decimal(average)} de 5 en ${count} ${count === 1 ? 'reseña' : 'reseñas'} de ejemplo`};
  }
  return {kind: 'new'};
}

export const SAMPLE_TAG = 'Ejemplo · datos de demostración';

export const SORT_NOTICES = {
  proximity: 'Ordenados por cercanía a tu distrito; no es una recomendación.',
  price: 'Ordenados por precio referencial, de menor a mayor; no es una recomendación.',
  experience: 'Ordenados por años de experiencia; no es una recomendación.',
};

export const BANDS = [['morning', 'Mañana 08–12'], ['afternoon', 'Tarde 12–18'], ['night', 'Noche 18–21']];

export const STAGES = {before: 'Antes', after: 'Después'};

/** Guarda o quita un favorito; devuelve el texto de la alerta de éxito. El llamador revierte la marca si falla. */
export async function saveFavorite(technician, favorite) {
  await request('/client/favorites/' + technician.id, null, favorite ? 'PUT' : 'DELETE');
  return favorite
    ? `Guardaste a ${technician.display_name} en tus favoritos.`
    : `Quitaste a ${technician.display_name} de tus favoritos.`;
}

export const favoriteLabel = (technician, favorite) => favorite
  ? `Quitar a ${technician.display_name} de favoritos`
  : `Guardar a ${technician.display_name} en favoritos`;
