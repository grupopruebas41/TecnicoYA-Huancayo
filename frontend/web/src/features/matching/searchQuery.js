const allowed = [
  "specialty_id",
  "subcategory_id",
  "district_id",
  "min_rating",
  // D-88: tarifa máxima y orden por cercanía.
  "max_fee",
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
/** D-88: ordena por cercanía cuando hay un origen (el distrito del filtro o el distrito principal del cliente). */
export function withProximity(filters, defaultDistrictId) {
  const { sort, page, ...rest } = filters;
  return filters.district_id || defaultDistrictId
    ? { ...rest, sort: "proximity", page }
    : { ...rest, page };
}
