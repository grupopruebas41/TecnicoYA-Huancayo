import React, { useEffect, useState } from "react";
import { Field, Notice } from "./forms";
import { request } from "./http";
import { validateUpload } from "./sprint02Validation";
export function AnnouncementPreview({ value }) {
  return (
    <aside className="s02-preview" aria-label="Vista previa">
      <h3>{value.title || "Vista previa"}</h3>
      <p style={{ whiteSpace: "pre-wrap" }}>{value.body}</p>
    </aside>
  );
}
export function useResource(path) {
  const [data, setData] = useState(null),
    [error, setError] = useState("");
  async function reload() {
    try {
      const r = await request(path);
      setData(r.data);
      setError("");
      return r.data;
    } catch (error) {
      setError(error.message);
      return null;
    }
  }
  useEffect(() => {
    let active = true;
    setData(null);
    request(path)
      .then((r) => {
        if (active) {
          setData(r.data);
          setError("");
        }
      })
      .catch((error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, [path]);
  return { data, error, reload };
}
export function MutationForm({
  onSave,
  reload,
  children,
  validate = () => ({}),
  label = "Guardar",
  onSuccess,
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [fields, setFields] = useState({}),
    [uncertain, setUncertain] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (busy || uncertain) return;
    setSuccess("");
    setError("");
    const errors = validate();
    setFields(errors);
    if (Object.keys(errors).length) {
      setError("Revisa los campos indicados.");
      return;
    }
    setBusy(true);
    try {
      await onSave();
      setSuccess("Cambios guardados.");
      onSuccess?.();
    } catch (error) {
      setFields(error.fields || {});
      setError(
        error.status === 0
          ? "No pudimos confirmar el resultado. Consulta el estado antes de repetir la operación."
          : error.message,
      );
      if (error.status === 0) {
        setUncertain(true);
        await reload?.();
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <form noValidate onSubmit={submit}>
      <fieldset disabled={busy}>
        {typeof children === "function" ? children(fields) : children}
      </fieldset>
      <Notice error={error} success={success} />
      {Object.entries(fields).map(([key, v]) => (
        <p className="field-error" key={key}>
          {Array.isArray(v) ? v.join(" ") : v}
        </p>
      ))}
      {error && (
        <button
          type="button"
          onClick={async () => {
            const result = await reload?.();
            if (result) setUncertain(false);
          }}
        >
          Recargar estado
        </button>
      )}
      <button type="submit" disabled={busy || uncertain}>
        {busy ? "Guardando…" : label}
      </button>
    </form>
  );
}
export function ReviewForm({ onSave, reload }) {
  const [reason, set] = useState(""),
    [decision, choose] = useState("approve");
  return (
    <MutationForm
      onSave={() => onSave({ reason, decision })}
      reload={reload}
      validate={() =>
        Array.from(reason.trim()).length < 5 || Array.from(reason).length > 2000
          ? { reason: ["El motivo debe tener entre 5 y 2000 caracteres."] }
          : {}
      }
      label={
        decision === "reject" ? "Confirmar rechazo" : "Confirmar aprobación"
      }
    >
      {(errors) => (
        <>
          <Field
            name="reason"
            label="Motivo"
            errors={errors}
            value={reason}
            onChange={(e) => set(e.target.value)}
          />
          <button
            type="button"
            aria-pressed={decision === "approve"}
            onClick={() => choose("approve")}
          >
            Aprobar
          </button>
          <button type="submit" onClick={() => choose("reject")}>
            Rechazar
          </button>
        </>
      )}
    </MutationForm>
  );
}
export function Upload({ purpose, onUploaded }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div>
      <label>
        Subir archivo
        <input
          type="file"
          disabled={busy}
          accept={
            purpose === "document"
              ? ".pdf,.jpg,.jpeg,.png"
              : ".jpg,.jpeg,.png,.webp"
          }
          onChange={async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const invalid = validateUpload(file, purpose);
            setError(invalid);
            if (invalid) return;
            setBusy(true);
            try {
              const form = new FormData();
              form.append("file", file);
              form.append("purpose", purpose);
              const r = await request("/media", form);
              onUploaded(r.data);
            } catch (error) {
              setError(error.message);
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {busy && <output>Subiendo archivo…</output>}
      <Notice error={error} />
    </div>
  );
}
export function ResourceState({ resource }) {
  return (
    <>
      <Notice error={resource.error} />
      {resource.error && (
        <button type="button" onClick={resource.reload}>
          Reintentar
        </button>
      )}
      {!resource.error && resource.data === null && <output>Cargando…</output>}
    </>
  );
}

export function useSubcategories() {
  const [data, set] = useState(null),
    [error, setError] = useState("");
  async function reload() {
    try {
      const { data: specialties } = await request("/catalog/specialties");
      const lists = await Promise.all(
        specialties.map((s) =>
          request("/catalog/subcategories?specialty_id=" + s.id),
        ),
      );
      const rows = lists.flatMap((r) => r.data);
      set(rows);
      setError("");
      return rows;
    } catch (error) {
      setError(error.message);
      return null;
    }
  }
  useEffect(() => {
    reload();
  }, []);
  return { data, error, reload };
}
