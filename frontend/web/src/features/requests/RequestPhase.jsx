import React from "react";
// El listado del S4 trae phase también para los borradores (phase = status fuera de sent): sin «registered» se veía
// «Estado pendiente de consulta» en Mis solicitudes.
export const phases = {
  registered: "Registrada",
  sent: "Enviada",
  matching: "Buscando técnicos",
  awaiting_responses: "Esperando respuestas",
  awaiting_choice: "Elige a tu técnico",
  direct_declined: "Tu técnico no respondió",
  pending_availability: "Pendiente de disponibilidad",
  assigned: "Asignada",
  expired: "Expirada",
};
export default function RequestPhase({ phase, className }) {
  return <p role="status" className={className}>{phases[phase] || "Estado pendiente de consulta"}</p>;
}
