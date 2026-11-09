import React, { useEffect, useRef, useState } from "react";
import { request } from "../administration/http";
import { Notice } from "../administration/forms";

const REASON_MIN = 5;
const REASON_MAX = 255;
const REASON_ERROR = "Cuéntanos el motivo: debe tener de 5 a 255 caracteres.";
const COMMENT_ERROR = "El comentario admite hasta 255 caracteres.";
// D-100 (aprobada): lista cerrada; con «Otro motivo» el texto es obligatorio.
export const CANCEL_REASONS = [
  ["solved", "Ya se solucionó el problema"],
  ["other_technician", "Encontré otro técnico"],
  ["reschedule", "Necesito cambiar la fecha u horario"],
  ["price", "El precio no me conviene"],
  ["mistake", "Me equivoqué al hacer el pedido"],
  ["other", "Otro motivo"],
];

/**
 * Cancelación con motivo (HU-S05-06, D-100). Diálogo accesible: atrapa el foco, se cierra con Escape y, al cerrarse,
 * devuelve el foco a quien lo abrió. La clave de idempotencia pertenece al cuerpo: reintentar lo mismo no cancela dos veces.
 */
export default function CancelRequestDialog({ row, onClose, onCancelled, onConflict }) {
  const [code, setCode] = useState("");
  const [codeInvalid, setCodeInvalid] = useState(false);
  const [reason, setReason] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const root = useRef(null);
  const field = useRef(null);
  const firstOption = useRef(null);
  const attempt = useRef(null);
  const title = `Cancelar la solicitud #${row.id}`;

  useEffect(() => {
    const previous = document.activeElement;
    firstOption.current.focus();
    return () => previous?.focus?.();
  }, []);

  function keys(event) {
    if (event.key === "Escape" && !busy) onClose();
    if (event.key !== "Tab") return;
    const items = [...root.current.querySelectorAll("input:not(:disabled), textarea:not(:disabled), button:not(:disabled)")];
    const [first, last] = [items[0], items.at(-1)];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function send(reason_, version) {
    const body = { reason_code: code, reason: reason_ || null, expected_version: version };
    const serialized = JSON.stringify(body);
    if (attempt.current?.serialized !== serialized) attempt.current = { serialized, key: crypto.randomUUID() };
    return request(`/requests/${row.id}/cancellation`, body, "POST", { headers: { "Idempotency-Key": attempt.current.key } });
  }

  async function submit(event) {
    event.preventDefault();
    const text = reason.trim();
    const size = Array.from(text).length;
    if (!code) {
      setCodeInvalid(true);
      firstOption.current.focus();
      return;
    }
    setCodeInvalid(false);
    if ((code === "other" && size < REASON_MIN) || size > REASON_MAX) {
      setInvalid(true);
      field.current.focus();
      return;
    }
    setInvalid(false);
    setFailure("");
    setBusy(true);
    try {
      await send(text, row.version).catch(async (error) => {
        if (error.code !== "STALE_VERSION") throw error;
        // La búsqueda avanza sola y sube la versión: cancelar sigue siendo lo que la persona pidió. Una sola vez.
        const fresh = await request("/requests/" + row.id);
        await send(text, fresh.data.version);
      });
      onCancelled(row.id);
    } catch (error) {
      if (error.status === 409 && error.code !== undefined) onConflict(error.message);
      else if (error.fields?.reason) {
        setInvalid(true);
        field.current?.focus();
      } else setFailure(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="s02-modal">
      <dialog open ref={root} className="client-cancel-dialog" aria-modal="true" aria-label={title} onKeyDown={keys}>
        <h2>{title}</h2>
        <p>
          {row.specialty.name}. Avisaremos a los técnicos que la recibieron y quedará en Canceladas. Esta acción no se puede deshacer.
        </p>
        <form noValidate onSubmit={submit}>
          <fieldset className="client-reason-group" role="radiogroup" aria-labelledby="cancel-code-legend"
            aria-describedby={codeInvalid ? "cancel-code-error" : undefined}>
            <legend id="cancel-code-legend">¿Por qué cancelas?</legend>
            {CANCEL_REASONS.map(([value, label], index) => (
              <label key={value} className={"client-reason-option" + (code === value ? " is-checked" : "")}>
                <input type="radio" name="reason_code" value={value} checked={code === value} disabled={busy}
                  ref={index === 0 ? firstOption : undefined} aria-invalid={codeInvalid && index === 0 ? true : undefined}
                  onChange={() => { setCode(value); setCodeInvalid(false); setInvalid(false); }} />
                <span>{label}</span>
              </label>
            ))}
            {codeInvalid && <span className="field-error" id="cancel-code-error">Elige un motivo.</span>}
          </fieldset>
          <div className="form-field">
            <label htmlFor="cancel-reason">{code === "other" ? "Cuéntanos el motivo" : "Comentario (opcional)"}</label>
            <textarea id="cancel-reason" ref={field} name="reason" rows={3} value={reason} disabled={busy} required={code === "other"}
              aria-invalid={invalid} aria-describedby={invalid ? "cancel-reason-error" : "cancel-reason-help"}
              onChange={(event) => setReason(event.target.value)} />
            {invalid
              ? <span className="field-error" id="cancel-reason-error">{code === "other" ? REASON_ERROR : COMMENT_ERROR}</span>
              : <small className="muted" id="cancel-reason-help">El técnico no verá el motivo ni el comentario.</small>}
          </div>
          <Notice error={failure} />
          <div className="client-dialog-actions">
            <button type="button" disabled={busy} onClick={onClose}>Volver</button>
            <button type="submit" disabled={busy} aria-busy={busy}>{busy ? "Cancelando…" : "Cancelar solicitud"}</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
