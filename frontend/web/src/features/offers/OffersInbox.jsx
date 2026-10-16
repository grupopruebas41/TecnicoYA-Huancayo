import React, { useEffect, useRef, useState } from "react";
import { request } from "../administration/http";
import ConfirmDialog from "../../components/ConfirmDialog";
import { feeLabel } from "./CandidateCard";
import OfferCountdown from "./OfferCountdown";
import { OfferError } from "./offerErrors";
import { ConnectionStatus, useRealtimeResource } from "../realtime/Realtime";
const labels = {
  pending: "Pendiente",
  accepted: "Aceptada",
  rejected: "Rechazada",
  expired: "Vencida",
  withdrawn: "Retirada",
};
function OfferCard({ offer, serverTime, onChange }) {
  const [expired, setExpired] = useState(false),
    [busy, setBusy] = useState(false),
    [reject, setReject] = useState(false),
    [reason, setReason] = useState(""),
    [error, setError] = useState(null),
    [message, setMessage] = useState("");
  const lock = useRef(false),
    attempt = useRef(null);
  useEffect(() => {
    setExpired(false);
    attempt.current = null;
  }, [offer.id, offer.version]);
  async function respond(decision) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    setMessage("");
    attempt.current ??= {
      key: crypto.randomUUID(),
      body: {
        decision,
        expected_version: offer.version,
        reason: decision === "reject" ? reason : null,
      },
    };
    try {
      await request(
        `/offers/${offer.id}/response`,
        attempt.current.body,
        "POST",
        { headers: { "Idempotency-Key": attempt.current.key } },
      );
      setMessage(
        decision === "accept"
          ? "Aceptaste la oferta. El cliente elegirá cuando cierre la ronda."
          : "Rechazaste la oferta.",
      );
      await onChange(offer.id);
    } catch (e) {
      setError(e);
      if (e.status === 0) {
        setMessage("No pudimos confirmar tu respuesta. Comprobando…");
        if (await onChange(offer.id))
          setMessage(
            "Respuesta consultada. Revisa el estado actualizado de la oferta.",
          );
      } else if (e.status === 409) await onChange(offer.id);
    } finally {
      lock.current = false;
      setBusy(false);
      setReject(false);
    }
  }
  return (
    <article className="s02-card" aria-label={`Oferta ${offer.id}`}>
      <h3>Solicitud #{offer.request.id}</h3>
      <p>
        {offer.request.subcategory?.name} · {offer.request.district?.name}
      </p>
      <p>{offer.request.description}</p>
      {offer.reference_fee && <p>{feeLabel(offer.reference_fee.amount)}</p>}
      {offer.request.preferred_start_at && (
        <p>
          Horario solicitado:{" "}
          {new Date(offer.request.preferred_start_at).toLocaleString("es-PE", {
            timeZone: "America/Lima",
          })}{" "}
          –{" "}
          {new Date(offer.request.preferred_end_at).toLocaleString("es-PE", {
            timeZone: "America/Lima",
          })}
        </p>
      )}
      {offer.request.address && <p>{offer.request.address}</p>}
      <p>{labels[offer.status] || "Estado pendiente de consulta"}</p>
      {offer.request.evidence?.map((image) => (
        <a
          key={image.media_id}
          href={image.url}
          target="_blank"
          rel="noreferrer"
        >
          Ver evidencia {image.media_id}
        </a>
      ))}
      <OfferError error={error} technician />
      {message && <p role="status">{message}</p>}
      {offer.status === "pending" && (
        <>
          <OfferCountdown
            expiresAt={offer.expires_at}
            serverTime={serverTime}
            onExpire={() => setExpired(true)}
          />
          <button
            type="button"
            disabled={busy || expired || !serverTime}
            aria-busy={busy}
            onClick={() => respond("accept")}
          >
            Aceptar
          </button>
          <button
            type="button"
            disabled={busy || expired || !serverTime}
            onClick={() => setReject(true)}
          >
            Rechazar
          </button>
        </>
      )}
      {reject && (
        <>
          <label>
            Motivo del rechazo (opcional)
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={busy}
            />
          </label>
          <ConfirmDialog
            title="Rechazar oferta"
            description="El cliente podrá buscar otro técnico. ¿Deseas rechazar esta oferta?"
            busy={busy}
            onCancel={() => setReject(false)}
            onConfirm={() => respond("reject")}
          />
        </>
      )}
    </article>
  );
}
export default function OffersInbox({ technicianId }) {
  const [rows, setRows] = useState([]),
    [serverTime, setServerTime] = useState(null),
    [error, setError] = useState(null),
    [loading, setLoading] = useState(true);
  async function refresh(event) {
    try {
      const id = typeof event === "number" ? event : event?.offer_id;
      if (id) {
        const result = await request("/offers/" + id);
        setRows((rows) => {
          const existing = rows.find((row) => row.id === id);
          if (existing && existing.version > result.data.version) return rows;
          return [result.data, ...rows.filter((row) => row.id !== id)];
        });
        setServerTime(result.meta?.server_time);
      } else {
        const result = await request("/offers?status=pending,accepted");
        const missing = rows.filter(
          (row) => !result.data.items.some((item) => item.id === row.id),
        );
        const recovered = await Promise.all(
          missing.map(async (row) => {
            try {
              return (await request("/offers/" + row.id)).data;
            } catch (error) {
              if (error.status === 404) return null;
              throw error;
            }
          }),
        );
        setRows([...result.data.items, ...recovered.filter(Boolean)]);
        setServerTime(result.meta?.server_time);
      }
      setError(null);
      return true;
    } catch (e) {
      setError(e);
      return false;
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, [technicianId]);
  const connected = useRealtimeResource(
    `technicians.${technicianId}`,
    ["offer.created", "offer.updated"],
    refresh,
    (event) => rows.find((row) => row.id === event.offer_id)?.version || 0,
  );
  return (
    <section aria-label="Solicitudes entrantes" className="s02-panel">
      <h2>Solicitudes entrantes</h2>
      <ConnectionStatus connected={connected} />
      <button type="button" onClick={() => refresh()}>
        Actualizar ofertas
      </button>
      <OfferError error={error} />
      {loading ? (
        <p role="status">Cargando ofertas…</p>
      ) : (
        !rows.length &&
        !error && <p>No tienes ofertas pendientes ni aceptadas.</p>
      )}
      {rows.map((offer) => (
        <OfferCard
          key={offer.id}
          offer={offer}
          serverTime={serverTime}
          onChange={refresh}
        />
      ))}
    </section>
  );
}
