import React from "react";
import { distanceLabel, feeLabel, initialsOf } from "../client/clientRules";
import { specialtyIcon } from "../client/specialtyIcon";
import Icon from "../panel/icons";
import { favoriteLabel, ratingOf, specialtySlug } from "./technicianView";

/** Estrellas de la tarjeta y del perfil: reales, de ejemplo (con su marca) o «Nuevo». */
export function RatingBadge({ technician }) {
  const rating = ratingOf(technician);
  if (rating.kind === "new") return <span className="tech-rating is-new">Nuevo</span>;
  return (
    <>
      <span className={"tech-rating" + (rating.kind === "sample" ? " is-sample" : "")} role="img" aria-label={rating.label}>
        <Icon name="star" /> {rating.value}
      </span>
      {rating.kind === "sample" && <span className="tech-sample-tag">Ejemplo</span>}
    </>
  );
}

// Tarjeta pública (lista blanca del S3). D-88: con orden por cercanía trae la distancia aproximada por zona.
// D-101 (Fase 3): portada por especialidad, avatar grande, «Verificado», estrellas o «Nuevo», «Desde S/», distritos,
// distancia y el corazón para guardar en favoritos (solo si la búsqueda pasa onFavorite).
export default function TechnicianCard({ technician, onOpen = () => {}, onFavorite = null, favorite = technician.favorite }) {
  const specialty = technician.specialties?.[0]?.name || "";
  const nameId = "tecnico-" + technician.id + "-nombre";
  return (
    <article className="s02-card client-technician tech-card" aria-labelledby={nameId}
      data-cy="technician-card" data-testid="technician-card">
      <div className="tech-cover" data-specialty={specialtySlug(specialty)} aria-hidden="true">
        <Icon name={specialtyIcon(specialty)} />
      </div>
      <div className="tech-card-body">
        <div className="client-technician-head">
          <span className="client-avatar is-large tech-avatar" aria-hidden="true">{initialsOf(technician.display_name)}</span>
          <div className="tech-card-title">
            <h3 id={nameId}>{technician.display_name}</h3>
            <p className="tech-badges">
              {technician.verified !== false && (
                <span className="client-chip is-verified"><Icon name="verify" /> Verificado</span>
              )}
              <RatingBadge technician={technician} />
            </p>
          </div>
          {onFavorite && (
            <button type="button" className={"tech-favorite" + (favorite ? " is-on" : "")} aria-pressed={!!favorite}
              aria-label={favoriteLabel(technician, favorite)} onClick={() => onFavorite(technician, !favorite)}>
              <Icon name="heart" />
            </button>
          )}
        </div>
        <p className="tech-facts">
          <span>{technician.experience_years} años de experiencia</span>
          <strong className="client-fee">{feeLabel(technician.services)}</strong>
        </p>
        {technician.distance !== undefined && (
          <span className="client-chip client-distance">{distanceLabel(technician.distance)}</span>
        )}
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
      </div>
    </article>
  );
}
