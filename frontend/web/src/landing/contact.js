// Único lugar para los datos de contacto públicos. Mientras el equipo no los
// confirme quedan en null y la interfaz los muestra como «Por confirmar».
export const CONTACT = Object.freeze({
  whatsapp: null,
  email: null,
  hours: null,
});
export const CONTACT_PENDING = "Por confirmar";
const LABELS = [
  ["whatsapp", "WhatsApp"],
  ["email", "Correo"],
  ["hours", "Horario"],
];
export function isContactConfigured(contact = CONTACT) {
  return Boolean(contact.whatsapp && contact.email);
}
export function contactItems(contact = CONTACT) {
  return LABELS.map(([key, label]) => ({
    key,
    label,
    value: contact[key] || CONTACT_PENDING,
    pending: !contact[key],
  }));
}
