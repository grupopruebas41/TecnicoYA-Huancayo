import React, { useEffect, useRef, useState } from "react";
import { request } from "../administration/http";
import { Notice } from "../administration/forms";

const REASON_MIN = 5;
const REASON_MAX = 255;
const REASON_ERROR = "Cuéntanos el motivo: debe tener de 5 a 255 caracteres.";

/**
 * Cancelación con motivo (HU-S05-06, D-100). Diálogo accesible: atrapa el foco, se cierra con Escape y, al cerrarse,
 * devuelve el foco a quien lo abrió. La clave de idempotencia pertenece al cuerpo: reintentar lo mismo no cancela dos veces.
 */
export default function CancelRequestDialog({ row, onClose, onCancelled, onConflict }) {
  const [reason, setReason] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const root = useRef(null);
  const field = useRef(null);
  const attempt = useRef(null);
  const title = `Cancelar la solicitud #${row.id}`;

  useEffect(() => {
    const previous = document.activeElement;
    field.current.focus();
    return () => previous?.focus?.();
  }, []);

  function keys(event) {
    if (event.key === "Escape" && !busy) onClose();
    if (event.key !== "Tab") return;
    const items = [...root.current.querySelectorAll("textarea:not(:disabled), button:not(:disabled)")];
    const [first, last] = [items[0], items.at(-1)];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function submit(event) {
    event.preventDefault();
    const text = reason.trim();
    const size = Array.from(text).length;
    if (size < REASON_MIN || size > REASON_MAX) {
      setInvalid(true);
      field.current.focus();
      return;
    }
    setInvalid(false);
    setFailure("");
    setBusy(true);
    const body = { reason: text, expected_version: row.version };
    const serialized = JSON.stringify(body);
    if (attempt.current?.serialized !== serialized) attempt.current = { serialized, key: crypto.randomUUID() };
    try {
      await request(`/requests/${row.id}/cancellation`, body, "POST", { headers: { "Idempotency-Key": attempt.current.key } });
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
      <dialog open ref={root} aria-modal="true" aria-label={title} onKeyDown={keys}>
        <h2>{title}</h2>
        <p>
          {row.specialty.name}. Avisaremos a los técnicos que la recibieron y quedará en Canceladas. Esta acción no se puede deshacer.
        </p>
        <form noValidate onSubmit={submit}>
          <div className="form-field">
            <label htmlFor="cancel-reason">Motivo de la cancelación</label>
            <textarea id="cancel-reason" ref={field} name="reason" rows={3} value={reason} disabled={busy}
              aria-invalid={invalid} aria-describedby={invalid ? "cancel-reason-error" : "cancel-reason-help"}
              onChange={(event) => setReason(event.target.value)} />
            {invalid
              ? <span className="field-error" id="cancel-reason-error">{REASON_ERROR}</span>
              : <small className="muted" id="cancel-reason-help">El técnico no verá este motivo.</small>}
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
