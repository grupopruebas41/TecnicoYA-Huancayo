import React, { useEffect, useRef, useState } from "react";
import { request } from "../administration/http";
import { Notice } from "../administration/forms";
import { createSubmissionAttempt } from "./requestsApi";
import { fieldErrors } from "./requestValidation";
export function ReferenceFee({ fee }) {
  if (fee?.amount == null) return <p>Sin tarifa referencial</p>;
  return (
    <p className="request-fee">
      Referencial S/{" "}
      {Number(fee.amount).toLocaleString("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
      <small>Orientativa. No representa un cobro.</small>
    </p>
  );
}
export default function RequestSummary({
  record,
  onUpdate = () => {},
  targetName,
  disabled = false,
  onBusy = () => {},
}) {
  const attempt = useRef(null),
    sending = useRef(false);
  const labels = {
    subcategory_id: "Subcategoría",
    district_id: "Distrito",
    target_technician_id: "Técnico elegido",
    preferred_start_at: "Inicio programado",
    summary_confirmed: "Confirmación",
    expected_version: "Versión de solicitud",
    idempotency_key: "Clave de envío",
  };
  const [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [uncertain, setUncertain] = useState(false),
    [fields, setFields] = useState({});
  const notice = useRef(null);
  useEffect(() => {
    onBusy(busy || uncertain);
  }, [busy, uncertain, onBusy]);
  useEffect(() => {
    if (error) notice.current?.focus();
  }, [error]);
  async function recover() {
    try {
      const current = (await request("/requests/" + record.id)).data;
      onUpdate(current);
      setUncertain(false);
      if (current.status === "sent") {
        setError("");
        setSuccess("Solicitud enviada. Estado confirmado con el servidor.");
      }
      return current;
    } catch {
      setUncertain(true);
      return null;
    }
  }
  async function send(event) {
    event.preventDefault();
    if (sending.current || disabled || !confirmed || uncertain) return;
    sending.current = true;
    setBusy(true);
    setError("");
    setSuccess("");
    setFields({});
    attempt.current ??= createSubmissionAttempt(record.id);
    try {
      const result = await attempt.current.send(record.version);
      onUpdate({ ...record, ...result.data });
      setSuccess("Solicitud enviada correctamente.");
    } catch (error) {
      setFields(fieldErrors(error));
      setError("Solicitud #" + record.id + ": " + error.message);
      if (error.status === 0) {
        setUncertain(true);
        await recover();
      } else if (error.status === 409 || error.status === 422) {
        attempt.current.resetVersion();
        await recover();
      }
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="s02-card" aria-label="Resumen de solicitud">
      <h3>Resumen · Solicitud #{record.id}</h3>
      <p>{record.status === "sent" ? "Enviada" : "Registrada"}</p>
      <p>
        {record.subcategory?.name} · {record.district?.name}
      </p>
      <p>{record.description}</p>
      <p>{record.address}</p>
      <p>
        {record.mode === "scheduled"
          ? "Atención programada"
          : "Atención inmediata"}
      </p>
      {record.mode === "scheduled" && (
        <p>
          {record.preferred_start_at} — {record.preferred_end_at}
        </p>
      )}
      {record.source === "profile" && (
        <p>
          Solicitud dirigida a{" "}
          {targetName || "técnico #" + record.target_technician_id}
        </p>
      )}
      <ReferenceFee fee={record.reference_fee} />
      <div ref={notice} tabIndex={-1}>
        <Notice error={error} success={success} />
      </div>
      {Object.entries(fields).map(([key, value]) => (
        <p className="field-error" key={key}>
          {labels[key] || "Revisa el campo"}: {value}
        </p>
      ))}
      {record.status === "registered" && (
        <form onSubmit={send}>
          <label>
            <input
              type="checkbox"
              checked={confirmed}
              disabled={busy || disabled}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            Confirmo que el resumen es correcto
          </label>
          <button
            type="submit"
            disabled={busy || disabled || !confirmed || uncertain}
          >
            {busy ? "Enviando…" : "Enviar solicitud"}
          </button>
        </form>
      )}
      {uncertain && (
        <button type="button" disabled={busy} onClick={recover}>
          Consultar estado del envío
        </button>
      )}
    </section>
  );
}
