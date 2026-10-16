import { serverNow } from "../administration/http";
const size = (value) => Array.from((value || "").trim()).length;
export function validateStep(step, value, now = serverNow()) {
  const errors = {};
  if (step === 1 && !value.specialty_id)
    errors.specialty_id = "Selecciona una especialidad.";
  if (step === 2 && !value.subcategory_id)
    errors.subcategory_id = "Selecciona una subcategoría.";
  if (step === 3) {
    if (size(value.description) < 20)
      errors.description = "La descripción debe tener al menos 20 caracteres.";
    if (size(value.description) > 1000)
      errors.description = "La descripción no debe superar 1000 caracteres.";
  }
  if (step === 4) return validateLocation(value, now);
  return errors;
}
function validateSchedule(value, now) {
  const errors = {},
    start = Date.parse(value.preferred_start_at),
    end = Date.parse(value.preferred_end_at);
  if (!Number.isFinite(start) || start < now)
    errors.preferred_start_at =
      "El inicio debe ser igual o posterior a la hora actual.";
  if (!Number.isFinite(end) || end <= start)
    errors.preferred_end_at = "El fin debe ser posterior al inicio.";
  return errors;
}
export function validateEvidence(file, count) {
  if (count >= 5) return "La solicitud admite como máximo 5 fotos.";
  if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return "El archivo debe ser una imagen JPG, PNG o WebP.";
  return file.size > 5242880 ? "El archivo no debe superar 5 MB." : "";
}
export const fieldErrors = (error) =>
  Object.fromEntries(
    Object.entries(error.fields || {}).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.join(" ") : value,
    ]),
  );

function validateLocation(value, now) {
  const errors = {};
  if (!value.district_id)
    errors.district_id = "Selecciona un distrito dentro de cobertura.";
  if (size(value.address) < 5 || size(value.address) > 255)
    errors.address = "La dirección debe tener de 5 a 255 caracteres.";
  if (!["asap", "scheduled"].includes(value.mode))
    errors.mode = "Selecciona una modalidad.";
  if (value.mode === "scheduled")
    Object.assign(errors, validateSchedule(value, now));
  return errors;
}
