import React from "react";
export const messages = {
  OFFER_EXPIRED: "La oferta venció. Ya no puedes responderla.",
  OFFER_NOT_PENDING: "Esta oferta ya no está disponible.",
  TECHNICIAN_UNAVAILABLE:
    "El técnico ya no está disponible. Elige otra opción.",
  SCHEDULE_CONFLICT:
    "El técnico ya no tiene disponible esa franja. Elige otra opción.",
  ROUND_NOT_CLOSED: "Espera a que respondan todos o venza el plazo.",
  NO_ALTERNATIVES_PENDING: "Esta solicitud no espera tu autorización.",
  MEDIA_LINKED:
    "La foto está adjunta a una solicitud. Quítala primero de la solicitud.",
  STALE_VERSION: "La información cambió. Actualiza y vuelve a intentarlo.",
};
export function offerMessage(error, technician = false) {
  if (error?.status === 0)
    return "No pudimos confirmar el resultado. Actualiza para consultar el estado.";
  if (technician && error?.code === "TECHNICIAN_UNAVAILABLE")
    return "Ya no estás disponible para esta solicitud.";
  return (
    messages[error?.code] ||
    "No se pudo completar la operación. Actualiza y vuelve a intentarlo."
  );
}
export function OfferError({ error, technician = false }) {
  return error ? <p role="alert">{offerMessage(error, technician)}</p> : null;
}
