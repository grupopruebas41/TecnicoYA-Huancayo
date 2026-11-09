const allowed = [
  "specialty_id",
  "subcategory_id",
  "district_id",
  "min_rating",
  // D-88: tarifa máxima y orden por cercanía.
  "max_fee",
  // D-101: «Disponible hoy» con la disponibilidad real.
  "available_today",
  "sort",
  "page",
  "per_page",
];
export function searchQuery(filters) {
  return new URLSearchParams(
    Object.entries(filters).filter(
      ([key, value]) => allowed.includes(key) && value !== "" && value != null,
    ),
  ).toString();
}
export function changeFilters(filters, name, value) {
  return {
    ...filters,
    [name]: value,
    ...(name === "specialty_id" ? { subcategory_id: "" } : {}),
    page: 1,
  };
}
/**
 * D-88: ordena por cercanía cuando hay un origen (el distrito del filtro o el distrito principal del cliente).
 * D-101: precio y experiencia se respetan con o sin origen; sin origen y sin elección, el servidor ordena por nombre.
 */
export function withProximity(filters, defaultDistrictId) {
  const { sort, page, ...rest } = filters;
  const chosen = ["price", "experience"].includes(sort)
    ? sort
    : filters.district_id || defaultDistrictId
      ? "proximity"
      : null;
  return chosen ? { ...rest, sort: chosen, page } : { ...rest, page };
}
