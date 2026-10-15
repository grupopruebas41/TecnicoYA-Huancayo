import React, { useState } from "react";
import { request } from "./http";
import { ReviewForm, useResource, ResourceState } from "./Sprint02Common";
import { technicianState } from "./sprint02Validation";
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
