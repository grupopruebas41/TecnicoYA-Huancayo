const allowed = [
  "specialty_id",
  "subcategory_id",
  "district_id",
  "min_rating",
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
