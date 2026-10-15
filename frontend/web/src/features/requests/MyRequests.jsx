import React, { useEffect, useState } from "react";
import { request } from "../administration/http";
import { Notice } from "../administration/forms";
import RequestSummary from "./RequestSummary";
export default function MyRequests({ onContinue = () => {} }) {
  const [rows, setRows] = useState(null),
    [error, setError] = useState(""),
    [detail, setDetail] = useState(null),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setRows(null);
    setError("");
    request("/requests")
      .then((r) => {
        if (active) setRows(r.data);
      })
      .catch((error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  async function open(row) {
    setError("");
    try {
      setDetail((await request("/requests/" + row.id)).data);
    } catch (error) {
      setError(error.message);
    }
  }
  return (
    <section aria-label="Mis solicitudes">
      <h2>Mis solicitudes</h2>
      <Notice error={error} />
      {error && (
        <button type="button" onClick={() => setRetry(retry + 1)}>
          Reintentar consulta
        </button>
      )}
      {!error && rows === null && <output>Cargando solicitudes…</output>}
      {rows?.length === 0 && <p>Aún no tienes solicitudes.</p>}
      {rows?.map((row) => (
        <article className="s02-card" key={row.id}>
          <h3>Solicitud #{row.id}</h3>
          <p>{row.status === "registered" ? "Registrada" : "Enviada"}</p>
          <button type="button" onClick={() => open(row)}>
            Ver solicitud #{row.id}
          </button>
        </article>
      ))}
      {detail && (
        <>
          <RequestSummary record={detail} disabled />
          <div className="s02-images">
            {detail.attachments?.map((a) => (
              <img
                key={a.media_id}
                src={a.url}
                alt={a.caption || "Evidencia de la solicitud"}
              />
            ))}
          </div>
          {detail.status === "registered" && (
            <button type="button" onClick={() => onContinue(detail)}>
              Continuar solicitud #{detail.id}
            </button>
          )}
        </>
      )}
    </section>
  );
}
