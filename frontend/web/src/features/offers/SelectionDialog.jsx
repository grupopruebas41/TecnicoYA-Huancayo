import React, { useRef, useState } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import { request } from "../administration/http";
import { OfferError } from "./offerErrors";
export default function SelectionDialog({
  requestId,
  version,
  candidate,
  onCancel,
  onComplete,
}) {
  const lock = useRef(false),
    attempt = useRef(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  async function confirm() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    attempt.current ??= {
      key: crypto.randomUUID(),
      body: { offer_id: candidate.offer_id, expected_version: version },
    };
    try {
      const result = await request(
        `/requests/${requestId}/selection`,
        attempt.current.body,
        "POST",
        { headers: { "Idempotency-Key": attempt.current.key } },
      );
      await onComplete(result.data);
    } catch (e) {
      setError(e);
      if (e.status === 409 || e.status === 0) await onComplete(null, e);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <OfferError error={error} />
      <ConfirmDialog
        title={`Elegir a ${candidate.technician.display_name}`}
        description="Confirma el técnico y la tarifa referencial. La disponibilidad se verificará nuevamente."
        busy={busy}
        onCancel={onCancel}
        onConfirm={confirm}
      />
    </>
  );
}
