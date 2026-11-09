import React, { useEffect, useRef, useState } from "react";
import RequestTracking from "../offers/RequestTracking";
import { phases } from "./RequestPhase";
import { request, serverNow } from "../administration/http";
import { Notice } from "../administration/forms";
import RequestSummary from "./RequestSummary";
import RequestTimeline from "../client/RequestTimeline";
import RequestProgress from "../client/RequestProgress";
import PhotoGallery from "../client/PhotoGallery";
import Pagination from "../client/Pagination";
import Icon from "../panel/icons";
import { BOARD_TABS, elapsedLabel, formatDate, nextStep, orderLabel, phaseIcon, statusTone, whenLabel } from "../client/clientRules";
import CancelRequestDialog from "./CancelRequestDialog";

const SEARCH_DELAY_MS = 300;
const SEARCHING = new Set(["sent", "matching", "awaiting_responses", "pending_availability", "direct_declined"]);
const SKELETONS = [0, 1, 2];

/**
 * Mis solicitudes (Fase 2 del panel final, contrato S5 §10): pestañas con contador, búsqueda, grupos por pedido y paginación
 * en el servidor. El detalle sigue debajo de la lista. openId abre el detalle al llegar desde el Inicio o la confirmación.
 */
export default function MyRequests({ onContinue = () => {}, openId = null, navigate = () => {} }) {
  const [tab, setTab] = useState("active");
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [board, setBoard] = useState(null);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [success, setSuccess] = useState("");
  const [retry, setRetry] = useState(0);
  const [detail, setDetail] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const title = useRef(null);
  const detailRef = useRef(null);
  const tabsRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const value = text.trim();
      if (value !== query) {
        setQuery(value);
        setPage(1);
      }
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text, query]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams({ tab, ...(query ? { q: query } : {}), page: String(page) });
    request("/client/requests?" + params)
      .then((response) => {
        if (!active) return;
        setError("");
        setLoadFailed(false);
        setBoard(response.data);
        setCounts(response.data.counts);
      })
      .catch((failure) => {
        if (!active) return;
        setError(failure.message);
        setLoadFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tab, query, page, retry]);

  useEffect(() => {
    if (openId) open(openId);
  }, [openId]);
  useEffect(() => {
    if (detail) detailRef.current?.focus();
  }, [detail?.id]);

  async function open(id) {
    setError("");
    try {
      setDetail((await request("/requests/" + id)).data);
    } catch (failure) {
      setError(failure.message);
    }
  }
  function changeTab(next) {
    setTab(next);
    setPage(1);
    setBoard(null);
    setError("");
    setSuccess("");
  }
  function tabKeys(event, index) {
    const move = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!move) return;
    event.preventDefault();
    const [next] = BOARD_TABS[(index + move + BOARD_TABS.length) % BOARD_TABS.length];
    changeTab(next);
    tabsRef.current?.querySelector(`[data-tab="${next}"]`)?.focus();
  }
  function afterCancel(id) {
    setCancelling(null);
    setSuccess(`Cancelaste la solicitud #${id}.`);
    if (detail?.id === id) setDetail(null);
    setRetry((value) => value + 1);
    // El botón que abrió el diálogo ya no existirá tras recargar: el foco va al título, sobre el aviso.
    setTimeout(() => title.current?.focus());
  }
  function cancelConflict(message) {
    setCancelling(null);
    setSuccess("");
    setError(message);
    // Recarga la lista sin borrar el aviso: el estado de la solicitud cambió en el servidor.
    request("/client/requests?" + new URLSearchParams({ tab, ...(query ? { q: query } : {}), page: String(page) }))
      .then((response) => {
        setBoard(response.data);
        setCounts(response.data.counts);
      })
      .catch(() => {});
  }

  const items = board?.items || [];
  const total = counts ? Object.values(counts).reduce((sum, value) => sum + value, 0) : 0;
  return (
    <section aria-label="Mis solicitudes" className="client-requests-page">
      <h2 ref={title} tabIndex={-1}>Mis solicitudes</h2>
      <Notice error={error} success={success} />
      <div className="form-field client-board-search">
        <label htmlFor="client-board-search">Buscar en tus solicitudes</label>
        <input id="client-board-search" type="search" maxLength={100} value={text} placeholder="Ej.: refrigeradora, #41 o Huancayo"
          onChange={(event) => setText(event.target.value)} />
      </div>
      <div className="announcement-tabs client-tabs" role="tablist" aria-label="Estados de tus solicitudes" ref={tabsRef}>
        {BOARD_TABS.map(([key, label], index) => (
          <button key={key} id={`client-tab-${key}`} data-tab={key} type="button" role="tab" aria-selected={tab === key} aria-controls="client-board-panel"
            tabIndex={tab === key ? 0 : -1} onClick={() => changeTab(key)} onKeyDown={(event) => tabKeys(event, index)}>
            {label}{counts ? ` (${counts[key]})` : ""}
          </button>
        ))}
      </div>
      <div id="client-board-panel" role="tabpanel" aria-labelledby={`client-tab-${tab}`} aria-busy={loading} className="client-board-panel">
        {loadFailed && !loading && (
          <button type="button" className="button primary" onClick={() => setRetry(retry + 1)}>Reintentar</button>
        )}
        {loading && !board && <BoardSkeleton />}
        {board && !items.length && (
          <EmptyState query={query} total={total} onClear={() => setText("")} onNew={() => navigate("new")} />
        )}
        <div className="client-request-list">
          {items.map((entry) => (entry.order && entry.order.total > 1
            ? <OrderGroup key={"pedido-" + entry.order.id} entry={entry} onOpen={open} onCancel={setCancelling} />
            : entry.requests.map((row) => <RequestCard key={row.id} row={row} onOpen={open} onCancel={setCancelling} />)))}
        </div>
        {board?.pagination.last_page > 1 && (
          <Pagination label="Páginas de solicitudes" page={board.pagination.page} lastPage={board.pagination.last_page} disabled={loading} onChange={setPage} />
        )}
      </div>
      {detail && (
        <div className="client-request-detail" ref={detailRef} tabIndex={-1}>
          <RequestSummary record={detail} disabled />
          <PhotoGallery photos={detail.attachments} requestId={detail.id} />
          {detail.status === "registered" ? (
            <>
              <RequestProgress record={detail}>
                <button type="button" className="button primary" onClick={() => onContinue(detail)}>
                  Continuar solicitud #{detail.id}
                </button>
              </RequestProgress>
              <RequestTimeline events={detail.timeline} />
            </>
          ) : detail.phase ? (
            <RequestTracking key={detail.id} requestId={detail.id} />
          ) : (
            <RequestTimeline events={detail.timeline} />
          )}
        </div>
      )}
      {cancelling && (
        <CancelRequestDialog row={cancelling} onClose={() => setCancelling(null)} onCancelled={afterCancel} onConflict={cancelConflict} />
      )}
    </section>
  );
}

function BoardSkeleton() {
  return (
    <div className="client-request-list">
      <output className="sr-only">Cargando solicitudes…</output>
      {SKELETONS.map((index) => (
        <div key={index} className="client-board-skeleton" aria-hidden="true"><span /><span /><span /></div>
      ))}
    </div>
  );
}

function EmptyState({ query, total, onClear, onNew }) {
  if (query) {
    return (
      <div className="client-board-empty">
        <p>Ninguna solicitud coincide con «{query}».</p>
        <button type="button" className="button outline" onClick={onClear}>Limpiar búsqueda</button>
      </div>
    );
  }
  return (
    <div className="client-board-empty">
      {total === 0 ? <h3>Aún no tienes solicitudes</h3> : <p>No tienes solicitudes en esta pestaña.</p>}
      {total === 0 && <p className="muted">Cuéntanos qué se malogró y buscamos un técnico cerca de ti.</p>}
      <button type="button" className="button primary" onClick={onNew}>Nueva solicitud</button>
    </div>
  );
}

function OrderGroup({ entry, onOpen, onCancel }) {
  const label = orderLabel(entry.order);
  return (
    <section className="client-order-group" aria-label={label}>
      <h3 className="client-order-title">{label}</h3>
      <div className="client-request-list">
        {entry.requests.map((row) => <RequestCard key={row.id} row={row} onOpen={onOpen} onCancel={onCancel} />)}
      </div>
    </section>
  );
}

function RequestCard({ row, onOpen, onCancel }) {
  const phase = row.phase || row.status;
  const completed = ["completed", "closed", "unrated"].includes(row.status);
  const finished = completed || ["cancelled", "expired"].includes(row.status);
  const searching = row.status !== "registered" && SEARCHING.has(phase) && !row.technician;
  return (
    <article className="s02-card client-request-card" aria-label={`Solicitud #${row.id}`}>
      <header className="client-card-head">
        <h3>{row.specialty.name}</h3>
        <p className={"client-status " + statusTone(row)}>
          <Icon name={phaseIcon(phase)} /> <span>{phases[phase] || "Estado pendiente de consulta"}</span>
        </p>
      </header>
      <p className="client-card-works">{row.subcategories.map((subcategory) => subcategory.name).join(", ")}</p>
      <small className="muted">Solicitud #{row.id}</small>
      <p className="muted">{whenLabel(row)} · {row.district.name}</p>
      {row.technician
        ? <p className="client-next-line">Técnico: {row.technician.display_name}</p>
        : searching
          ? <p className="client-next-line">Buscando técnico · {elapsedLabel(row.submitted_at || row.created_at, serverNow())}</p>
          : !finished && <p className="client-next-line">{nextStep(row)}</p>}
      {row.recent_events.length > 0 && (
        <ol className="client-mini-timeline" aria-label={`Últimos avances de la solicitud #${row.id}`}>
          {row.recent_events.map((event, index) => (
            <li key={event.type + index}><strong>{event.label}</strong> <small className="muted">{formatDate(event.occurred_at)}</small></li>
          ))}
        </ol>
      )}
      <div className="client-card-actions">
        <button type="button" className="button outline" onClick={() => onOpen(row.id)}>
          Ver detalle<span className="sr-only"> de la solicitud #{row.id}</span>
        </button>
        {row.can_cancel && (
          <button type="button" className="button outline client-card-cancel" onClick={() => onCancel(row)}>
            Cancelar<span className="sr-only"> la solicitud #{row.id}</span>
          </button>
        )}
        {completed && (
          <span className="client-card-rate">
            <button type="button" className="button outline" disabled aria-describedby={`rate-note-${row.id}`}>
              Calificar<span className="sr-only"> la solicitud #{row.id}</span>
            </button>
            <small className="muted" id={`rate-note-${row.id}`}>Disponible en el Sprint 6</small>
          </span>
        )}
      </div>
    </article>
  );
}
