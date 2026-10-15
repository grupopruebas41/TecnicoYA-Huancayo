import React from "react";
import { useResource, ResourceState } from "../administration/Sprint02Common";
import { ReferenceFee } from "../requests/RequestSummary";
export default function TechnicianProfile({ id, onRequest, onBack }) {
  const resource = useResource("/technicians/" + id),
    profile = resource.data;
  return (
    <section aria-label="Perfil público">
      <button type="button" onClick={onBack}>
        Volver a la búsqueda
      </button>
      <ResourceState resource={resource} />
      {profile && (
        <>
          <h2>{profile.display_name}</h2>
          <p>{profile.bio}</p>
          <p>{profile.experience_years} años de experiencia</p>
          <h3>Servicios</h3>
          {profile.services?.map((s) => (
            <article key={s.subcategory_id}>
              <h4>{s.subcategory_name}</h4>
              <ReferenceFee fee={{ amount: s.reference_fee }} />
            </article>
          ))}
          <h3>Portafolio público</h3>
          {!profile.portfolio?.length && <p>Sin trabajos públicos todavía.</p>}
          {profile.portfolio?.map((p) => (
            <article key={p.id}>
              <h4>{p.title}</h4>
              <p>{p.description}</p>
              <div className="s02-images">
                {p.images?.map((m) => (
                  <img
                    key={m.media_id}
                    src={m.url}
                    alt={m.caption || p.title}
                  />
                ))}
              </div>
            </article>
          ))}
          <h3>Reseñas</h3>
          <p>Sin reseñas publicadas todavía.</p>
          {onRequest && (
            <button
              type="button"
              disabled={!profile.services?.length}
              onClick={() => onRequest(profile)}
            >
              Solicitar servicio
            </button>
          )}
        </>
      )}
    </section>
  );
}
