// Ejemplos deliberadamente no operativos: reemplazar antes de publicar contacto.
export const CONTACT = Object.freeze({
  email: "REEMPLAZAR@example.invalid",
  whatsapp: "REEMPLAZAR",
  hours: "Horario de atención por confirmar",
  configured: false,
});
export function rememberSearch(filters) {
  try {
    sessionStorage.setItem("tecnicoya.searchIntent", JSON.stringify(filters));
  } catch {
    /* Sin almacenamiento, la navegación sigue disponible. */
  }
}
export function readSearch() {
  try {
    const data = JSON.parse(sessionStorage.getItem("tecnicoya.searchIntent"));
    return (
      data &&
      Object.fromEntries(
        ["specialty_id", "district_id"]
          .filter((k) => /^\d+$/.test(data[k]))
          .map((k) => [k, data[k]]),
      )
    );
  } catch {
    return null;
  }
}
export function consumeSearch() {
  const data = readSearch();
  try {
    sessionStorage.removeItem("tecnicoya.searchIntent");
  } catch {}
  return data;
}
let authIntent = null;
export function setAuthIntent(mode, role = "client") {
  authIntent = { mode, role };
}
export function takeAuthIntent() {
  const value = authIntent;
  authIntent = null;
  return value;
}
