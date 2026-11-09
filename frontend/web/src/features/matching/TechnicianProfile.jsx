import React, { useState } from "react";
import { useResource, ResourceState } from "../administration/Sprint02Common";
import { Notice } from "../administration/forms";
import { initialsOf } from "../client/clientRules";
import { specialtyIcon } from "../client/specialtyIcon";
import Icon from "../panel/icons";
import { RatingBadge } from "./TechnicianCard";
import PortfolioViewer, { WorkIllustration } from "./PortfolioViewer";
import { BANDS, SAMPLE_TAG, STAGES, decimal, favoriteLabel, saveFavorite, specialtySlug } from "./technicianView";
import "./search.css";

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

/**
 * Perfil público del técnico (S3, sin contacto ni documentos). D-101 (Fase 3): portada por especialidad, avatar,
 * verificado, experiencia, zonas, calificación, «Solicitar servicio» fijo (abajo en el celular) y seis secciones:
 * Sobre mí, Servicios, Disponibilidad, Portafolio (visor accesible), Calificaciones (reseñas de ejemplo rotuladas) y
 * Confianza. El perfil nunca muestra teléfono, correo, dirección ni documentos (TC-034).
 */
export default function TechnicianProfile({ id, preview = null, onRequest, onBack, favorite: initialFavorite, onFavorite }) {
  const resource = useResource("/technicians/" + id),
    profile = resource.data;
  const [viewer, setViewer] = useState(null),
    [favorite, setFavorite] = useState(null),
    [notice, setNotice] = useState({});
  const name = profile?.display_name || preview?.display_name || "";
  const isFavorite = favorite ?? initialFavorite ?? profile?.favorite ?? false;
  const districts = profile?.districts?.length ? profile.districts : preview?.districts || [];
  const specialty = profile?.specialties?.[0]?.name || preview?.specialties?.[0]?.name || "";
  async function toggleFavorite() {
    const next = !isFavorite;
    setFavorite(next);
    setNotice({});
    try {
      setNotice({ success: await saveFavorite(profile, next) });
      onFavorite?.(profile, next, { saved: true });
    } catch (failure) {
      setFavorite(!next);
      setNotice({ error: failure.message });
    }
  }
  return (
    <section aria-label="Perfil público" className="client-profile tech-profile">
      <button type="button" className="button outline client-back" onClick={onBack}>
        <span aria-hidden="true">‹</span> <span>Volver a la búsqueda</span>
      </button>
      <ResourceState resource={resource} />
      {profile && (
        <>
          <section className="client-profile-head tech-profile-head" aria-labelledby="technician-profile-name">
            <div className="profile-cover" data-specialty={specialtySlug(specialty)} aria-hidden="true">
              <Icon name={specialtyIcon(specialty)} />
            </div>
            <div className="tech-profile-identity">
              <span className="client-avatar is-large tech-avatar" aria-hidden="true">{initialsOf(name)}</span>
              <div className="client-profile-title">
                <h2 id="technician-profile-name">{name}</h2>
                <p className="client-chips-inline">
                  {(profile.verified ?? !!preview) && <span className="client-chip is-verified"><Icon name="verify" /> Verificado</span>}
                  <span className="client-chip">{profile.experience_years} años de experiencia</span>
                  {profile.availability?.available_today && <span className="client-chip is-today">Disponible hoy</span>}
                  <RatingBadge technician={profile} />
                </p>
                {profile.specialties?.length > 0 && <p className="muted">{profile.specialties.map((s) => s.name).join(" · ")}</p>}
                {districts.length > 0 && <p className="muted">Atiende en <span>{districts.map((d) => d.name).join(", ")}</span></p>}
              </div>
            </div>
          </section>
          {(onRequest || onFavorite) && (
            <div className="profile-cta-bar">
              {onRequest && (
                <button type="button" className="button primary client-profile-cta" disabled={!profile.services?.length}
                  onClick={() => onRequest(profile)}>
                  Solicitar servicio
                </button>
              )}
              {onFavorite && (
                <button type="button" className={"tech-favorite" + (isFavorite ? " is-on" : "")} aria-pressed={isFavorite}
                  aria-label={favoriteLabel(profile, isFavorite)} onClick={toggleFavorite}>
                  <Icon name="heart" />
                </button>
              )}
            </div>
          )}
          <Notice error={notice.error} success={notice.success} />

          <Block id="sobre-mi" title="Sobre mí">
            {profile.bio ? <p className="client-profile-bio">{profile.bio}</p>
              : <p className="client-profile-bio muted">Este técnico aún no agregó una descripción.</p>}
            {profile.work_style && <><h4>Forma de trabajo</h4><p>{profile.work_style}</p></>}
            {profile.warranty_text && <><h4>Garantía</h4><p>{profile.warranty_text}</p></>}
          </Block>

          <Block id="servicios" title="Servicios">
            <ul className="client-services tech-services">
              {profile.services?.map((s) => (
                <li key={s.subcategory_id}>
                  <h4>{s.subcategory_name}</h4>
                  <strong>Referencial S/ {s.reference_fee}</strong>
                  {s.includes && <p className="muted">Qué incluye: {s.includes}</p>}
                </li>
              ))}
            </ul>
            <p className="muted">Tarifa orientativa: el monto final se acuerda con el técnico; no es un cobro.</p>
          </Block>

          <Block id="disponibilidad" title="Disponibilidad">
            <div className="tech-week-wrap">
              <table className="tech-week" aria-label="Disponibilidad semanal">
                <caption>Disponibilidad semanal</caption>
                <thead>
                  <tr><th scope="col">Día</th>{BANDS.map(([key, label]) => <th scope="col" key={key}>{label}</th>)}</tr>
                </thead>
                <tbody>
                  {(profile.availability?.week || []).map((day) => (
                    <tr key={day.weekday}>
                      <th scope="row">{day.day}</th>
                      {BANDS.map(([key]) => {
                        const on = day.bands.includes(key);
                        return <td key={key} className={on ? "is-on" : ""}><span className="tech-dot" aria-hidden="true" />{on ? "Disponible" : "No disponible"}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {districts.length > 0 && <p className="muted">Atiende en {districts.map((d) => d.name).join(", ")}</p>}
          </Block>

          <Block id="portafolio" title="Portafolio">
            {!profile.portfolio?.length && (
              <div className="client-empty">
                <span aria-hidden="true"><Icon name="image" /></span>
                <p>Este técnico aún no publicó trabajos.</p>
              </div>
            )}
            <div className="tech-gallery">
              {profile.portfolio?.map((item, index) => (
                <article key={item.id} className="tech-work">
                  <button type="button" className="tech-work-thumb" aria-label={`Ver el trabajo «${item.title}»`}
                    onClick={(event) => setViewer({ index, opener: event.currentTarget })}>
                    {item.images?.length ? item.images.slice(0, 2).map((image) => (
                      <span className="tech-work-image" key={image.media_id}>
                        <img src={image.url} alt="" loading="lazy" />
                        {STAGES[image.stage] && <span className="tech-stage">{STAGES[image.stage]}</span>}
                      </span>
                    )) : <WorkIllustration title={item.title} specialty={specialty} />}
                  </button>
                  <h4>{item.title}</h4>
                  {item.description && <p className="muted">{item.description}</p>}
                </article>
              ))}
            </div>
          </Block>

          <Block id="calificaciones" title="Calificaciones">
            <Ratings profile={profile} />
          </Block>

          <Block id="confianza" title="Confianza">
            <p className="tech-trust">
              <Icon name="verify" />
              <strong>{profile.verified ? "Identidad verificada por el administrador" : "Verificación pendiente"}</strong>
            </p>
            <p className="muted">TécnicoYa no muestra documentos, teléfono, correo ni dirección del técnico.</p>
          </Block>

          {viewer && (
            <PortfolioViewer items={profile.portfolio} index={viewer.index} specialty={specialty} returnFocus={viewer.opener}
              onIndex={(index) => setViewer((current) => ({ ...current, index }))} onClose={() => setViewer(null)} />
          )}
        </>
      )}
    </section>
  );
}

function Block({ id, title, children }) {
  return (
    <section className="panel-card client-block" aria-labelledby={"perfil-" + id}>
      <h3 id={"perfil-" + id}>{title}</h3>
      {children}
    </section>
  );
}

/** Calificaciones reales (Sprint 6) o, mientras tanto, reseñas de ejemplo con su marca visible. */
function Ratings({ profile }) {
  const summary = profile.rating?.count > 0 ? profile.rating : profile.sample_rating;
  const sample = !(profile.rating?.count > 0);
  if (!summary?.count) {
    return (
      <div className="client-empty">
        <span aria-hidden="true"><Icon name="star" /></span>
        <p><strong>Este técnico aún no tiene reseñas</strong></p>
        <p className="muted"><span>Sin reseñas publicadas todavía.</span> Cuando complete servicios, aquí verás las opiniones de sus clientes.</p>
      </div>
    );
  }
  const distribution = summary.distribution || {};
  return (
    <>
      <div className="tech-rating-summary">
        <strong className="tech-rating-value">{decimal(summary.average)}</strong>
        <span className="muted">{plural(summary.count, "reseña", "reseñas")}</span>
        {sample && <span className="tech-sample-tag">{SAMPLE_TAG}</span>}
      </div>
      <div className="tech-bars">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = Number(distribution[stars] || 0);
          return (
            <div key={stars} className="tech-bar" role="img"
              aria-label={`${plural(stars, "estrella", "estrellas")}: ${plural(count, "reseña", "reseñas")}`}>
              <span className="tech-bar-label">{stars} <Icon name="star" /></span>
              <span className="tech-bar-track"><span style={{ width: (summary.count ? (count / summary.count) * 100 : 0) + "%" }} /></span>
              <span>{count}</span>
            </div>
          );
        })}
      </div>
      <ul className="tech-reviews">
        {(profile.reviews || []).map((review) => (
          <li key={review.id}>
            <p className="tech-review-head">
              <span className="tech-stars" role="img" aria-label={`${review.rating} de 5`}>
                {[1, 2, 3, 4, 5].map((n) => <span key={n} className={n <= review.rating ? "is-on" : ""}><Icon name="star" /></span>)}
              </span>
              <strong>{review.author_label}</strong>
              <time dateTime={review.reviewed_on} className="muted">{review.reviewed_on.split("-").reverse().join("/")}</time>
            </p>
            <p>{review.comment}</p>
            {review.sample && <span className="tech-sample-tag">{SAMPLE_TAG}</span>}
          </li>
        ))}
      </ul>
    </>
  );
}
