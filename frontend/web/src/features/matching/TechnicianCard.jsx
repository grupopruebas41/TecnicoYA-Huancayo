import React from "react";
import { distanceLabel, feeLabel } from "../client/clientRules";
// Tarjeta pública (lista blanca del S3). D-88: con orden por cercanía trae la distancia aproximada por zona.
// Un solo botón por tarjeta: las pruebas E2E del S3 lo buscan con find("button").
export default function TechnicianCard({ technician, onOpen = () => {} }) {
  const initials = technician.display_name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0] || "")
    .join("")
    .toUpperCase();
  return (
    <article className="s02-card client-technician" data-cy="technician-card" data-testid="technician-card">
      <span className="client-technician-avatar" aria-hidden="true">{initials}</span>
      <div className="client-technician-body">
        <h3>{technician.display_name}</h3>
        <p className="muted">
          {technician.experience_years} años de experiencia ·{" "}
          <span>
            {technician.rating?.average == null
              ? "Sin calificaciones aún"
              : technician.rating.average +
                " de 5 · " +
                technician.rating.count +
                " calificaciones"}
          </span>
        </p>
        <ul className="client-technician-services">
          {technician.services?.map((s) => (
            <li key={s.subcategory_id}>{s.subcategory_name}</li>
          ))}
        </ul>
        <p className="muted">{technician.districts?.map((d) => d.name).join(", ")}</p>
        <p className="client-technician-meta">
          {technician.distance !== undefined && (
            <span className="client-distance">{distanceLabel(technician.distance)}</span>
          )}
          <strong>{feeLabel(technician.services)}</strong>
        </p>
      </div>
      <button type="button" className="button outline" onClick={() => onOpen(technician.id)}>
        Ver perfil de {technician.display_name}
      </button>
    </article>
  );
}
