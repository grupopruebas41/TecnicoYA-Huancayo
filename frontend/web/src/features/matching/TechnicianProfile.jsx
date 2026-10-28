import React from "react";
import { useResource, ResourceState } from "../administration/Sprint02Common";
import { initialsOf } from "../client/clientRules";
import Icon from "../panel/icons";
// Perfil público del técnico (S3, sin contacto ni documentos). Revisión del PR #39: cabecera con avatar, rubros,
// distritos, experiencia y «Solicitar servicio» arriba (fija abajo en móvil). Los distritos y la marca «Verificado»
// vienen de la tarjeta de búsqueda (preview): la búsqueda solo devuelve técnicos verificados y activos.
export default function TechnicianProfile({ id, preview = null, onRequest, onBack }) {
  const resource = useResource("/technicians/" + id),
    profile = resource.data;
  const name = profile?.display_name || preview?.display_name || "";
  return (
    <section aria-label="Perfil público" className="client-profile">
      <button type="button" className="button outline client-back" onClick={onBack}>
        <span aria-hidden="true">‹</span> <span>Volver a la búsqueda</span>
      </button>
      <ResourceState resource={resource} />
      {profile && (
        <>
          <section className="client-profile-head" aria-labelledby="technician-profile-name">
            <span className="client-avatar is-large" aria-hidden="true">{initialsOf(name)}</span>
            <div className="client-profile-title">
              <h2 id="technician-profile-name">{name}</h2>
              <p className="client-chips-inline">
                {preview && <span className="client-chip is-verified">Verificado</span>}
                <span className="client-chip">{profile.experience_years} años de experiencia</span>
              </p>
              {profile.services?.length > 0 && (
                <p className="muted">{profile.services.map((s) => s.subcategory_name).join(" · ")}</p>
              )}
              {preview?.districts?.length > 0 && (
                <p className="muted">
                  Atiende en <span>{preview.districts.map((d) => d.name).join(", ")}</span>
                </p>
              )}
            </div>
            {onRequest && (
              <button
                type="button"
                className="button primary client-profile-cta"
                disabled={!profile.services?.length}
                onClick={() => onRequest(profile)}
              >
                Solicitar servicio
              </button>
            )}
          </section>
          {profile.bio && <p className="client-profile-bio">{profile.bio}</p>}
          <section className="panel-card client-block">
            <h3>Servicios</h3>
            <ul className="client-services">
              {profile.services?.map((s) => (
                <li key={s.subcategory_id}>
                  <span>{s.subcategory_name}</span>
                  <strong>Referencial S/ {s.reference_fee}</strong>
                </li>
              ))}
            </ul>
            <p className="muted">Tarifa orientativa: el monto final se acuerda con el técnico; no es un cobro.</p>
          </section>
          <section className="panel-card client-block">
            <h3>Portafolio público</h3>
            {!profile.portfolio?.length && (
              <div className="client-empty">
                <span aria-hidden="true"><Icon name="image" /></span>
                <p>Este técnico aún no publicó trabajos.</p>
              </div>
            )}
            <div className="client-gallery">
              {profile.portfolio?.map((p) => (
                <article key={p.id}>
                  <h4>{p.title}</h4>
                  <p className="muted">{p.description}</p>
                  <div className="client-gallery-images">
                    {p.images?.map((m) => (
                      <img key={m.media_id} src={m.url} alt={m.caption || p.title} loading="lazy" />
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section className="panel-card client-block">
            <h3>Reseñas</h3>
            <div className="client-empty">
              <span aria-hidden="true"><Icon name="star" /></span>
              <p><strong>Este técnico aún no tiene reseñas</strong></p>
              <p className="muted"><span>Sin reseñas publicadas todavía.</span> Cuando complete servicios, aquí verás las opiniones de sus clientes.</p>
            </div>
          </section>
        </>
      )}
    </section>
  );
}
