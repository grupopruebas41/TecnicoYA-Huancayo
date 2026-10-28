import React, { useEffect, useRef, useState } from "react";
import { request } from "../administration/http";
import RequestPhase from "../requests/RequestPhase";
import { OfferError } from "./offerErrors";
import CandidateList from "./CandidateList";
import SelectionDialog from "./SelectionDialog";
import { ConnectionStatus, useRealtimeResource } from "../realtime/Realtime";
import RequestTimeline from "../client/RequestTimeline";
import RequestProgress from "../client/RequestProgress";
export default function RequestTracking({ requestId }) {
  const [record, setRecord] = useState(null),
    [candidates, setCandidates] = useState(null),
    [selected, setSelected] = useState(null),
    [error, setError] = useState(null),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const lock = useRef(false),
    attempt = useRef(null),
    accepted = useRef(null);
  async function refresh() {
    try {
      const [r, c] = await Promise.all([
        request(`/requests/${requestId}`),
        request(`/requests/${requestId}/candidates`),
      ]);
      setRecord(r.data);
      setCandidates(c.data);
      return true;
    } catch (e) {
      setError(e);
      return false;
    }
  }
  useEffect(() => {
    setRecord(null);
    setCandidates(null);
    setSelected(null);
    setError(null);
    setNotice("");
    attempt.current = null;
    refresh();
  }, [requestId]);
  const connected = useRealtimeResource(
    `requests.${requestId}`,
    ["request.updated"],
    refresh,
    record?.version || 0,
  );
  async function complete(data, failure) {
    setSelected(null);
    if (failure) setCandidates(null);
    setError(failure || null);
    setNotice(
      data
        ? `Asignaste a ${selected.technician.display_name}.`
        : failure?.status === 0
          ? "No pudimos confirmar tu elección. Comprobando…"
          : "",
    );
    await refresh();
  }
  async function alternatives() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    attempt.current ??= {
      key: crypto.randomUUID(),
      body: { expected_version: candidates.request_version },
    };
    try {
      await request(
        `/requests/${requestId}/alternative-searches`,
        attempt.current.body,
        "POST",
        { headers: { "Idempotency-Key": attempt.current.key } },
      );
      setNotice("Autorizaste la búsqueda de otros técnicos.");
      await refresh();
    } catch (e) {
      setError(e);
      if (e.status === 409) attempt.current = null;
      if (e.status === 409 || e.status === 0) await refresh();
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  return (
    <section aria-label="Seguimiento de solicitud" className="s02-panel">
      <h2>Seguimiento de solicitud #{requestId}</h2>
      <ConnectionStatus connected={connected} />
      <button
        type="button"
        onClick={() => {
          setError(null);
          refresh();
        }}
      >
        Actualizar seguimiento
      </button>
      <OfferError error={error} />
      {notice && <p role="status">{notice}</p>}
      <TrackingPhase record={record} onChoose={() => accepted.current?.focus()} />
      {candidates?.phase === "awaiting_choice" && (
        <div ref={accepted} tabIndex={-1} className="client-candidates" aria-label="Técnicos que aceptaron" role="group">
          <CandidateList
            candidates={candidates.accepted}
            onChoose={setSelected}
            disabled={busy}
          />
        </div>
      )}
      {candidates?.phase === "direct_declined" && (
        <>
          <p>
            Tu técnico no respondió a tiempo. Estas alternativas aún no han sido
            contactadas.
          </p>
          <CandidateList candidates={candidates.alternatives} />
          <button
            type="button"
            disabled={busy}
            aria-busy={busy}
            onClick={alternatives}
          >
            Buscar otros técnicos
          </button>
        </>
      )}
      {selected && (
        <SelectionDialog
          requestId={requestId}
          version={candidates.request_version}
          candidate={selected}
          onCancel={() => setSelected(null)}
          onComplete={complete}
        />
      )}
    </section>
  );
}

function TrackingPhase({ record, onChoose }) {
  return (
    <>
      {record && (
        <>
          <RequestPhase phase={record.phase} className="client-phase" />
          {/* Revisión del PR #39: pasos y «¿Qué pasa ahora?» con la acción que le toca al cliente. */}
          <RequestProgress record={record} onChoose={onChoose} />
          {record.phase === "awaiting_responses" && (
            <p>Espera a que respondan todos o venza el plazo.</p>
          )}
          {record.phase === "pending_availability" &&
            record.search?.pending_expires_at && (
              <p>
                Buscaremos hasta el{" "}
                {new Date(record.search.pending_expires_at).toLocaleString(
                  "es-PE",
                  { timeZone: "America/Lima" },
                )}{" "}
                (hora de Lima).
              </p>
            )}
          {record.phase === "expired" && (
            <p>La búsqueda venció. Puedes crear otra solicitud.</p>
          )}
          {record.timeline?.length > 0 && (
            <details className="client-history" open>
              <summary>Historial</summary>
              <RequestTimeline events={record.timeline} />
            </details>
          )}
          {record.assignment?.appointment && (
            <p>
              Franja confirmada:{" "}
              {new Date(record.assignment.appointment.starts_at).toLocaleString(
                "es-PE",
                { timeZone: "America/Lima" },
              )}{" "}
              –{" "}
              {new Date(record.assignment.appointment.ends_at).toLocaleString(
                "es-PE",
                { timeZone: "America/Lima" },
              )}
            </p>
          )}
        </>
      )}
    </>
  );
}
