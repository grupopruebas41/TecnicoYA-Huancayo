import React, { useEffect, useRef, useState } from "react";
import { request } from "../administration/http";
import { Notice } from "../administration/forms";
import ConfirmDialog from "../../components/ConfirmDialog";
import { validateEvidence } from "./requestValidation";
export default function EvidencePicker({
  record,
  media,
  setMedia,
  onUpdate,
  onBusy = () => {},
  disabled = false,
}) {
  const [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false),
    [remove, setRemove] = useState(null),
    [uncertain, setUncertain] = useState(false);
  const lock = useRef(false);
  const linked = record?.attachments || [],
    pending = media.filter((m) => !linked.some((a) => a.media_id === m.id));
  const images = [
    ...linked.map((a) => ({ ...a, id: a.media_id, linked: true })),
    ...pending,
  ];
  useEffect(() => {
    onBusy(busy || uncertain);
  }, [busy, uncertain, onBusy]);
  function running(value) {
    lock.current = value;
    setBusy(value);
  }
  async function refresh() {
    if (!record) return null;
    try {
      const current = (await request("/requests/" + record.id)).data;
      onUpdate(current);
      setUncertain(false);
      return current;
    } catch (error) {
      setUncertain(true);
      setError(error.message);
      return null;
    }
  }
  async function upload(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file || lock.current) return;
    const invalid = validateEvidence(file, images.length);
    setError(invalid);
    setSuccess("");
    if (invalid) return;
    running(true);
    try {
      const body = new FormData();
      body.append("purpose", "evidence");
      body.append("file", file);
      const image = (await request("/media", body)).data;
      setMedia([...media, image]);
      if (record) {
        await request("/requests/" + record.id + "/attachments", {
          media_id: image.id,
          expected_version: record.version,
        });
        onUpdate((await request("/requests/" + record.id)).data);
        setSuccess("Foto adjuntada.");
      } else
        setSuccess(
          "Foto subida. Se vinculará al registrar la solicitud en el resumen.",
        );
    } catch (error) {
      setError(error.message);
      if (record) {
        setUncertain(true);
        await refresh();
      }
    } finally {
      running(false);
    }
  }
  async function confirm() {
    if (lock.current) return;
    running(true);
    setSuccess("");
    setError("");
    try {
      if (remove.linked) {
        await request(
          "/requests/" + record.id + "/attachments/" + remove.id,
          { expected_version: record.version },
          "DELETE",
        );
        await refresh();
      }
      setMedia(media.filter((m) => m.id !== remove.id));
      setSuccess("Foto retirada de la solicitud.");
    } catch (error) {
      setError(error.message);
      if (error.status === 0) {
        setUncertain(true);
        const current = await refresh();
        if (
          current &&
          !current.attachments.some((a) => a.media_id === remove.id)
        ) {
          setMedia(media.filter((m) => m.id !== remove.id));
          setError("");
          setSuccess("Retiro confirmado con el servidor.");
        }
      }
    } finally {
      setRemove(null);
      running(false);
    }
  }
  const editable = !record || record.status === "registered";
  return (
    <EvidenceView
      {...{
        error,
        success,
        editable,
        disabled,
        busy,
        uncertain,
        images,
        upload,
        setRemove,
        refresh,
        remove,
        confirm,
      }}
    />
  );
}
function EvidenceView({
  error,
  success,
  editable,
  disabled,
  busy,
  uncertain,
  images,
  upload,
  setRemove,
  refresh,
  remove,
  confirm,
}) {
  return (
    <section aria-label="Evidencias">
      <h3>Fotos de la falla</h3>
      <Notice error={error} success={success} />
      {editable && (
        <label>
          Subir evidencia
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            disabled={disabled || busy || uncertain || images.length >= 5}
            onChange={upload}
          />
        </label>
      )}
      <p>JPG, PNG o WebP de hasta 5 MB; máximo 5 fotos.</p>
      {busy && <output>Procesando foto…</output>}
      <div className="s02-images">
        {images.map((image, i) => (
          <figure key={image.id}>
            <a href={image.url} target="_blank" rel="noreferrer">
              <img src={image.url} alt={"Evidencia " + (i + 1)} />
            </a>
            <figcaption>
              {image.linked ? "Adjuntada" : "Pendiente de vincular"}
            </figcaption>
            {editable && (
              <button
                type="button"
                disabled={disabled || busy || uncertain}
                onClick={() => setRemove(image)}
              >
                Retirar foto {i + 1}
              </button>
            )}
          </figure>
        ))}
      </div>
      {uncertain && (
        <button type="button" onClick={refresh}>
          Consultar fotos de la solicitud
        </button>
      )}
      {remove && (
        <ConfirmDialog
          title="Retirar evidencia"
          busy={busy}
          onCancel={() => setRemove(null)}
          onConfirm={confirm}
        />
      )}
    </section>
  );
}
