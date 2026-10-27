import RequestTracking from '../offers/RequestTracking';
import RequestPhase from './RequestPhase';
import React, { useEffect, useRef, useState } from "react";
import { request } from "../administration/http";
import { Notice } from "../administration/forms";
import RequestSummary from "./RequestSummary";
import RequestTimeline from "../client/RequestTimeline";
import { REQUEST_TABS, countByGroup, formatDate, requestGroup, statusTone } from "../client/clientRules";
// Panel del cliente (D-87): pestañas por estado con contador y tarjetas con el estado en texto y color. openId abre el
// detalle al llegar desde el Inicio. El detalle sigue debajo de la lista, como en el S3 (las E2E abren varias seguidas).
export default function MyRequests({ onContinue = () => {}, openId = null }) {
  const [rows, setRows] = useState(null),
    [error, setError] = useState(""),
    [detail, setDetail] = useState(null),
    [tab, setTab] = useState("all"),
    [retry, setRetry] = useState(0);
  const detailRef = useRef(null);
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
  useEffect(() => {
    if (openId) open({ id: openId });
  }, [openId]);
  useEffect(() => {
    if (detail) detailRef.current?.focus();
  }, [detail?.id]);
  async function open(row) {
    setError("");
    try {
      setDetail((await request("/requests/" + row.id)).data);
    } catch (error) {
      setError(error.message);
    }
  }
  const counts = countByGroup(rows || []);
  const visible = (rows || []).filter((row) => tab === "all" || requestGroup(row) === tab);
  return (
    <section aria-label="Mis solicitudes" className="client-requests-page">
      <h2>Mis solicitudes</h2>
      <Notice error={error} />
      {error && (
        <button type="button" onClick={() => setRetry(retry + 1)}>
          Reintentar consulta
        </button>
      )}
      {!error && rows === null && <output>Cargando solicitudes…</output>}
      {rows?.length === 0 && <p>Aún no tienes solicitudes.</p>}
      {rows?.length > 0 && (
        <div className="announcement-tabs client-tabs" role="tablist" aria-label="Estados de tus solicitudes">
          {REQUEST_TABS.map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}>
              {label} ({counts[key]})
            </button>
          ))}
        </div>
      )}
      {rows?.length > 0 && !visible.length && <p className="muted">No tienes solicitudes en este estado.</p>}
      <div className="client-request-list">
        {visible.map((row) => (
          <article className="s02-card client-request-card" key={row.id}>
            <h3>Solicitud #{row.id}</h3>
            {row.phase ? (
              <RequestPhase phase={row.phase} className={"client-status " + statusTone(row)} />
            ) : (
              <p className={"client-status " + statusTone(row)}>{row.status === "registered" ? "Registrada" : "Enviada"}</p>
            )}
            {row.subcategory && (
              <p className="muted">
                {row.subcategory.name} · {row.district?.name}
                {row.updated_at && <> · Actualizada {formatDate(row.updated_at)}</>}
              </p>
            )}
            <button type="button" className="button outline" onClick={() => open(row)}>
              Ver solicitud #{row.id}
            </button>
          </article>
        ))}
      </div>
      {detail && (
        <div className="client-request-detail" ref={detailRef} tabIndex={-1}>
          <RequestSummary record={detail} disabled />
          {detail.phase && detail.status !== "registered" ? (
            <RequestTracking key={detail.id} requestId={detail.id} />
          ) : (
            <RequestTimeline events={detail.timeline} />
          )}
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
            <button type="button" className="button primary" onClick={() => onContinue(detail)}>
              Continuar solicitud #{detail.id}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
