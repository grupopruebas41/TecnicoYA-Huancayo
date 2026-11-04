import React, { useEffect, useId, useRef, useState } from "react";
import { request } from "../../administration/http";
import { Notice } from "../../administration/forms";
import ConfirmDialog from "../../../components/ConfirmDialog";
import Icon from "../../panel/icons";
import { validateEvidence } from "../requestValidation";
import { MAX_PHOTOS } from "./orderModel";

/**
 * Fotos de un rubro (D-92: hasta 5 por solicitud). Se suben como evidencia privada (POST /media) y se vinculan al
 * enviar el pedido. Arrastrar y soltar o elegir archivos; vista previa local; quitar con confirmación retira el archivo
 * (D-61: evidencia propia aún no adjunta).
 */
export default function OrderPhotos({ photos, onChange, onBusy = () => {}, label }) {
  const [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false),
    [dragging, setDragging] = useState(false),
    [remove, setRemove] = useState(null);
  const id = useId();
  const latest = useRef(photos);
  latest.current = photos;
  useEffect(() => onBusy(busy), [busy, onBusy]);

  async function upload(files) {
    setError("");
    setSuccess("");
    let current = latest.current;
    const before = current.length;
    setBusy(true);
    try {
      for (const file of files) {
        const invalid = validateEvidence(file, current.length);
        if (invalid) {
          setError(invalid);
          break;
        }
        const body = new FormData();
        body.append("purpose", "evidence");
        body.append("file", file);
        const image = (await request("/media", body)).data;
        current = [...current, { id: image.id, name: file.name, preview: URL.createObjectURL(file) }];
        onChange(current);
      }
      if (current.length > before) setSuccess("Foto agregada. Se adjuntará al enviar el pedido.");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemove() {
    setBusy(true);
    try {
      await request("/media/" + remove.id, undefined, "DELETE");
      onChange(latest.current.filter((photo) => photo.id !== remove.id));
      setSuccess("Quitaste la foto.");
      setError("");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
      setRemove(null);
    }
  }

  const full = photos.length >= MAX_PHOTOS;
  return (
    <div className="order-photos">
      <span className="order-label" id={`${id}-label`}>
        Fotos (opcional, hasta {MAX_PHOTOS})
      </span>
      <label
        className={"order-drop" + (dragging ? " is-dragging" : "") + (full ? " is-full" : "")}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!busy && !full) upload([...event.dataTransfer.files]);
        }}
      >
        <Icon name="upload" />
        <span>
          {full ? "Llegaste al máximo de 5 fotos." : busy ? "Subiendo…" : "Arrastra tus fotos aquí o elige archivos"}
        </span>
        <small className="muted">JPG, PNG o WebP, hasta 5 MB cada una.</small>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={busy || full}
          aria-label={`Agregar fotos de ${label}`}
          onChange={(event) => {
            const files = [...event.target.files];
            event.target.value = "";
            upload(files);
          }}
        />
      </label>
      <Notice error={error} success={success} />
      {photos.length > 0 && (
        <ul className="order-thumbs" aria-label={`Fotos de ${label}`}>
          {photos.map((photo, index) => (
            <li key={photo.id}>
              {photo.preview ? <img src={photo.preview} alt={`Foto ${index + 1} de ${label}`} /> : <Icon name="image" />}
              <button type="button" className="order-thumb-remove" disabled={busy} onClick={() => setRemove(photo)}>
                <Icon name="trash" />
                <span className="sr-only">Retirar foto {index + 1}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {remove && (
        <ConfirmDialog
          title="Quitar foto"
          description="La foto se quitará de este rubro. ¿Deseas continuar?"
          busy={busy}
          onCancel={() => setRemove(null)}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  );
}
