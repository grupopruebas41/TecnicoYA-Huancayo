import React from "react";
export const phases = {
  matching: "Buscando técnicos",
  awaiting_responses: "Esperando respuestas",
  awaiting_choice: "Elige a tu técnico",
  direct_declined: "Tu técnico no respondió",
  pending_availability: "Pendiente de disponibilidad",
  assigned: "Asignada",
  expired: "Expirada",
};
export default function RequestPhase({ phase }) {
  return <p role="status">{phases[phase] || "Estado pendiente de consulta"}</p>;
}
