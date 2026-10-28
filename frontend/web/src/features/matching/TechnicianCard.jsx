import React from "react";
import { distanceLabel, feeLabel, initialsOf } from "../client/clientRules";
// Tarjeta pública (lista blanca del S3). D-88: con orden por cercanía trae la distancia aproximada por zona.
// Revisión del PR #39: tarifa y distancia arriba, servicios como chips y botón principal.
// Un solo botón por tarjeta: las pruebas E2E del S3 lo buscan con find("button").
export default function TechnicianCard({ technician, onOpen = () => {} }) {
  return (
    <article className="s02-card client-technician" data-cy="technician-card" data-testid="technician-card">
      <div className="client-technician-meta">
        {technician.distance !== undefined && (
          <span className="client-chip client-distance">{distanceLabel(technician.distance)}</span>
        )}
        <strong className="client-fee">{feeLabel(technician.services)}</strong>
      </div>
      <div className="client-technician-head">
        <span className="client-avatar" aria-hidden="true">{initialsOf(technician.display_name)}</span>
        <div>
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
        </div>
      </div>
      <ul className="client-chips" aria-label="Servicios">
        {technician.services?.map((s) => (
          <li key={s.subcategory_id}>{s.subcategory_name}</li>
        ))}
      </ul>
      {technician.districts?.length > 0 && (
        <p className="muted client-districts">Atiende en {technician.districts.map((d) => d.name).join(", ")}</p>
      )}
      <button type="button" className="button primary" onClick={() => onOpen(technician.id)}>
        Ver perfil de {technician.display_name}
      </button>
    </article>
  );
}
