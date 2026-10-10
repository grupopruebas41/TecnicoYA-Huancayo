import React, { useState } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import { request } from "./http";
import { Notice } from "./forms";
export default function RetireButton({
  path,
  reload,
  label = "Retirar",
  onRetired,
}) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  async function confirm() {
    if (busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await request(path, undefined, "DELETE");
      setSuccess("Contenido retirado.");
      setOpen(false);
      onRetired?.();
      await reload();
    } catch (e) {
      setOpen(false);
      setError(e.message);
      if (e.status === 0) await reload();
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button type="button" disabled={busy} onClick={() => setOpen(true)}>
        {label}
      </button>
      <Notice error={error} success={success} />
      {open && (
        <ConfirmDialog
          busy={busy}
          onCancel={() => setOpen(false)}
          onConfirm={confirm}
        />
      )}
    </>
  );
}
