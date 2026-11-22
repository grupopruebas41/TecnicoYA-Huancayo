import React, { useEffect, useRef, useState } from "react";
import { distanceLabel, feeLabel, initialsOf } from "../client/clientRules";
import { specialtyIcon } from "../client/specialtyIcon";
import Icon from "../panel/icons";
import { favoriteLabel, ratingOf, specialtySlug } from "./technicianView";
import "../client/polish.css";
import "./technicianCard.css";

const MAX_SERVICES = 3;

/**
 * Insignias de calificación de la tarjeta y del perfil: «★ 4,6» real o de ejemplo (con «Ejemplo») o «Nuevo».
 * Pulido final (DEF-77): cada insignia es una pieza en una sola línea (cx-badge, white-space: nowrap).
 */
export function RatingBadge({ technician }) {
  const rating = ratingOf(technician);
  if (rating.kind === "new") return <span className="cx-badge is-info tcard-new"><Icon name="star" /> Nuevo</span>;
  return (
    <>
      <span className={"cx-badge is-warning tcard-rating" + (rating.kind === "sample" ? " is-sample" : "")} role="img" aria-label={rating.label}>
        <Icon name="star" /> {rating.value}
      </span>
      {rating.kind === "sample" && <span className="cx-badge is-muted">Ejemplo</span>}
    </>
  );
}

/** Confirmación en la misma tarjeta antes de quitar un favorito (pantalla «Técnicos favoritos»). */
function RemoveConfirm({ technician, onConfirm, onCancel }) {
  const no = useRef(null);
  useEffect(() => { no.current?.focus(); }, []);
  return (
    <div className="tcard-confirm" role="group" aria-label={`Confirmar: quitar a ${technician.display_name} de favoritos`}
      onKeyDown={(event) => { if (event.key === "Escape") onCancel(); }}>
      <p>¿Quitar a {technician.display_name} de tus favoritos?</p>
      <div>
        <button type="button" className="button danger" onClick={onConfirm}>Sí, quitar</button>
        <button type="button" ref={no} className="button outline" onClick={onCancel}>No</button>
      </div>
    </div>
  );
}

/**
 * Tarjeta pública del técnico (lista blanca del S3, D-88, D-101). Pulido final del cliente: portada con el degradado de su
 * especialidad, avatar montado sobre el borde, corazón arriba a la derecha, insignias que se ajustan en líneas, «Desde
 * S/ 50,00» en grande, hasta 3 servicios y «+N más», y la acción al pie siempre alineada abajo. Con onRequest (favoritos),
 * «Pedir de nuevo» es la acción principal y quitar el corazón pide confirmación.
 */
export default function TechnicianCard({ technician, onOpen = () => {}, onFavorite = null, favorite = technician.favorite, onRequest = null, index = 0 }) {
  const [confirming, setConfirming] = useState(false);
  const specialty = technician.specialties?.[0]?.name || "";
  const tone = specialtySlug(specialty);
  const nameId = "tecnico-" + technician.id + "-nombre";
  const services = technician.services || [];
  const extra = services.length - MAX_SERVICES;
  function heart() {
    if (onRequest && favorite) setConfirming(true);
    else onFavorite(technician, !favorite);
  }
  return (
    <article className="tcard cx-rise" style={{ "--i": Math.min(index, 8) }} aria-labelledby={nameId}
      data-cy="technician-card" data-testid="technician-card">
      <div className="tcard-cover" data-tone={tone} aria-hidden="true">
        <Icon name={specialtyIcon(specialty)} />
      </div>
      {onFavorite && (
        <button type="button" className={"tcard-favorite" + (favorite ? " is-on" : "")} aria-pressed={!!favorite}
          aria-label={favoriteLabel(technician, favorite)} onClick={heart}>
          <Icon name="heart" />
        </button>
      )}
      <span className="tcard-avatar" aria-hidden="true">{initialsOf(technician.display_name)}</span>
      <div className="tcard-body">
        <h3 id={nameId} className="tcard-name">{technician.display_name}</h3>
        <div className="cx-badges tcard-badges">
          {technician.verified !== false && <span className="cx-badge is-success"><Icon name="verify" /> Verificado</span>}
          <RatingBadge technician={technician} />
        </div>
        <p className="tcard-experience muted"><Icon name="briefcase" /> {technician.experience_years} años de experiencia</p>
        <p className="tcard-fee client-fee">{feeLabel(services)}</p>
        {technician.distance !== undefined && (
          <p className="tcard-distance client-distance"><Icon name="pin" /> {distanceLabel(technician.distance)}</p>
        )}
        {services.length > 0 && (
          <ul className="cx-chips" aria-label="Servicios">
            {services.slice(0, MAX_SERVICES).map((s) => <li key={s.subcategory_id} title={s.subcategory_name}>{s.subcategory_name}</li>)}
            {extra > 0 && <li className="is-more">+{extra} más</li>}
          </ul>
        )}
        {technician.districts?.length > 0 && (
          <p className="muted tcard-districts client-districts">Atiende en {technician.districts.map((d) => d.name).join(", ")}</p>
        )}
        <div className="tcard-foot">
          {confirming && (
            <RemoveConfirm technician={technician} onCancel={() => setConfirming(false)}
              onConfirm={() => { setConfirming(false); onFavorite(technician, false); }} />
          )}
          {onRequest ? (
            <>
              <button type="button" className="button primary" onClick={() => onRequest(technician)}>
                Pedir de nuevo<span className="sr-only"> a {technician.display_name}</span>
              </button>
              <button type="button" className="button outline" onClick={() => onOpen(technician.id)}>
                Ver perfil<span className="sr-only"> de {technician.display_name}</span>
              </button>
            </>
          ) : (
            <button type="button" className="button primary" onClick={() => onOpen(technician.id)}>
              Ver perfil<span className="sr-only"> de {technician.display_name}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
