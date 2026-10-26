import React, { useState } from "react";
import { request } from "./http";
import { ReviewForm, useResource, ResourceState } from "./Sprint02Common";
import { technicianState } from "./sprint02Validation";
// D-32 y D-50: suspensión y reactivación con motivo y un paso de confirmación (Fase 1 del panel).
const statusActions = {
  active: { open: "Suspender técnico", label: "Motivo de la suspensión", confirm: "Confirmar suspensión", path: "suspension",
    done: "Técnico suspendido. Sus sesiones se cerraron." },
  suspended: { open: "Reactivar técnico", label: "Motivo de la reactivación", confirm: "Confirmar reactivación", path: "reactivation",
    done: "Técnico reactivado." },
};
function StatusChange({ id, technician, onDone }) {
  const action = statusActions[technician.status];
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!action) return null;
  async function confirm() {
    if (busy) return;
    if (reason.trim().length < 5) { setError("Escribe un motivo de al menos 5 caracteres."); return; }
    setBusy(true); setError("");
    try {
      await request("/admin/technicians/" + id + "/" + action.path, { reason: reason.trim(), expected_version: technician.version });
      setOpen(false); setReason("");
      await onDone(action.done);
    } catch (failure) {
      setError(failure.fields?.reason?.[0] || failure.message);
    } finally { setBusy(false); }
  }
  if (!open) return <button type="button" className="button outline" onClick={() => setOpen(true)}>{action.open}</button>;
  return (
    <div className="s02-status-change">
      <label>
        {action.label}
        <textarea value={reason} maxLength={2000} aria-invalid={!!error} aria-describedby={error ? "status-reason-error" : undefined}
          onChange={(e) => setReason(e.target.value)} />
      </label>
      {error && <p className="field-error" id="status-reason-error" role="alert">{error}</p>}
      <p className="muted">Quedará registrado en la auditoría con tu motivo.</p>
      <button type="button" className="button primary" disabled={busy} onClick={confirm}>{action.confirm}</button>
      <button type="button" className="button outline" disabled={busy} onClick={() => { setOpen(false); setError(""); }}>Cancelar</button>
    </div>
  );
}
function Detail({ id, reload }) {
  const r = useResource("/admin/technicians/" + id);
  const [notice, setNotice] = useState("");
  return (
    <div className="s02-card">
      <ResourceState resource={r} />
      {notice && <output>{notice}</output>}
      {r.data && (
        <>
          <h3>{r.data.display_name}</h3>
          <p>{r.data.bio}</p>
          <p>{r.data.experience_years} años de experiencia</p>
          <ul>
            {Object.entries(r.data.checklist || {}).map(([k, v]) => (
              <li key={k}>
                {k}: {v ? "Completo" : "Falta completar"}
              </li>
            ))}
          </ul>
          <h4>Servicios y zonas</h4>
          {r.data.services?.map((s) => (
            <p key={s.subcategory_id}>
              {s.subcategory_name} · S/ {s.reference_fee}
            </p>
          ))}
          <p>
            {r.data.districts?.map((d) => d.name).join(", ") ||
              "Sin zona declarada."}
          </p>
          <h4>Documentos privados de verificación</h4>
          {r.data.documents?.map((d) => (
            <a key={d.id} href={d.url} target="_blank" rel="noreferrer">
              {d.document_type}
            </a>
          ))}
          {!r.data.documents?.length && <p>Sin documentos.</p>}
          <h4>Revisiones</h4>
          {r.data.reviews?.map((v, i) => (
            <p key={i}>
              {v.decision === "reject" ? "Rechazo" : "Aprobación"}: {v.reason}
            </p>
          ))}
          <StatusChange id={id} technician={r.data} onDone={async (message) => { setNotice(message); await r.reload(); await reload(); }} />
          {r.data.verification_status === "pending" && (
            <ReviewForm
              reload={r.reload}
              onSave={async (v) => {
                await request("/admin/technicians/" + id + "/reviews", {
                  ...v,
                  expected_version: r.data.version,
                });
                setNotice("Revisión registrada correctamente.");
                await r.reload();
                await reload();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
export default function VerificationAdmin() {
  const notice = "";
  const [status, setStatus] = useState("pending"),
    [id, setId] = useState(null);
  const r = useResource("/admin/technicians?status=" + status);
  return (
    <section className="s02-panel">
      <h2>Verificación de técnicos</h2>
      <label>
        Estado
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setId(null);
          }}
        >
          {["pending", "rejected", "active", "suspended"].map((v) => (
            <option key={v} value={v}>
              {technicianState(v)}
            </option>
          ))}
        </select>
      </label>
      <ResourceState resource={r} />
      {r.data?.length === 0 && <p>No hay técnicos en este estado.</p>}
      {r.data?.map((t) => (
        <button type="button" key={t.id} onClick={() => setId(t.id)}>
          {t.display_name} ·{" "}
          {technicianState(
            t.verification_status === "rejected" ? "rejected" : t.status,
          )}
        </button>
      ))}
      {id && <Detail key={id} id={id} reload={r.reload} />}
    </section>
  );
}
