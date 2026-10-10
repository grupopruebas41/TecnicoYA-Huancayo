const length = (v) => Array.from(v || "").length;
const field = (e, k, message) => {
  e[k] = [message];
};
export function validateSubcategory(v) {
  const e = {};
  if (length(v.name?.trim()) < 2 || length(v.name) > 120)
    field(e, "name", "El nombre debe tener entre 2 y 120 caracteres.");
  if (!v.specialty_id) field(e, "specialty_id", "Selecciona una especialidad.");
  if (length(v.description) > 2000)
    field(e, "description", "Máximo 2000 caracteres.");
  return e;
}
export function validateAnnouncement(v) {
  const e = {};
  if (length(v.title?.trim()) < 3 || length(v.title) > 120)
    field(e, "title", "El título debe tener entre 3 y 120 caracteres.");
  if (!length(v.body) || length(v.body) > 5000)
    field(e, "body", "El contenido debe tener entre 1 y 5000 caracteres.");
  if (
    !v.audiences?.length ||
    v.audiences.length > 2 ||
    new Set(v.audiences).size !== v.audiences.length ||
    v.audiences.some((x) => !["client", "technician"].includes(x))
  )
    field(e, "audiences", "Selecciona al menos una audiencia.");
  if (!Number.isFinite(Date.parse(v.starts_at)))
    field(e, "starts_at", "Indica el inicio de la vigencia.");
  if (
    !Number.isFinite(Date.parse(v.ends_at)) ||
    Date.parse(v.ends_at) <= Date.parse(v.starts_at)
  )
    field(e, "ends_at", "El fin debe ser posterior al inicio.");
  if (v.link_url) {
    try {
      const u = new URL(v.link_url);
      if (!["http:", "https:"].includes(u.protocol) || v.link_url.length > 2048)
        throw new Error();
    } catch {
      field(e, "link_url", "Usa un enlace http o https válido.");
    }
    if (!v.link_label || length(v.link_label) > 40)
      field(e, "link_label", "Indica una etiqueta de hasta 40 caracteres.");
  }
  if (
    v.priority !== undefined &&
    (!Number.isInteger(Number(v.priority)) ||
      +v.priority < 0 ||
      +v.priority > 100)
  )
    field(e, "priority", "La prioridad debe ser un entero de 0 a 100.");
  return e;
}
export function validateSlots(slots) {
  const e = {};
  if (slots.length > 21) field(e, "slots", "Se permiten hasta 21 franjas.");
  const mins = (t) =>
    /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(t)
      ? Number(t.slice(0, 2)) * 60 + Number(t.slice(3))
      : NaN;
  slots.forEach((s, i) => {
    const a = mins(s.start),
      z = mins(s.end);
    if (
      !Number.isInteger(+s.weekday) ||
      +s.weekday < 1 ||
      +s.weekday > 7 ||
      !Number.isFinite(a + z) ||
      z - a < 30
    )
      field(
        e,
        "slots." + i + ".start",
        "Indica un día válido y una franja de al menos 30 minutos, sin cruzar medianoche.",
      );
    else if (
      slots.some(
        (o, j) =>
          j < i &&
          +o.weekday === +s.weekday &&
          a < mins(o.end) &&
          z > mins(o.start),
      )
    )
      field(
        e,
        "slots." + i + ".start",
        "La franja se solapa con otra del mismo día.",
      );
  });
  return e;
}
export function validateRate(v) {
  if (!/^\d+(\.\d{1,2})?$/.test(String(v)))
    return "La tarifa admite como máximo 2 decimales.";
  return +v < 1 || +v > 5000
    ? "La tarifa debe estar entre S/ 1,00 y S/ 5 000,00."
    : "";
}
export function validatePause(v) {
  const e = {};
  if (!v) return e;
  const start = Date.parse(v.starts_at);
  if (!Number.isFinite(start) || start < Math.floor(Date.now() / 60000) * 60000)
    field(e, "starts_at", "El inicio debe ser el minuto actual o posterior.");
  if (
    v.ends_at &&
    (!Number.isFinite(Date.parse(v.ends_at)) || Date.parse(v.ends_at) <= start)
  )
    field(e, "ends_at", "El fin debe ser posterior al inicio.");
  if (length(v.reason) > 255)
    field(e, "reason", "El motivo no debe superar 255 caracteres.");
  return e;
}
export function validateUpload(f, purpose = "portfolio") {
  const types =
    purpose === "document"
      ? ["application/pdf", "image/jpeg", "image/png"]
      : ["image/jpeg", "image/png", "image/webp"];
  if (!f || !types.includes(f.type))
    return purpose === "document"
      ? "Selecciona PDF, JPG o PNG."
      : "El archivo debe ser una imagen JPG, PNG o WebP.";
  return f.size > 5242880 ? "El archivo no debe superar 5 MB." : "";
}
export const technicianState = (s) =>
  ({
    pending: "Pendiente de verificación",
    pending_verification: "Pendiente de verificación",
    rejected: "Verificación rechazada",
    approved: "Verificación aprobada",
    active: "Activo",
    suspended: "Suspendido",
  })[s] || "Estado no disponible";
