import React, {useEffect, useRef, useState} from 'react';
import {validateReason} from './adminRules';

/**
 * Confirmación de una acción sensible con motivo obligatorio (D-85). Con `word`, además hay que escribir esa palabra
 * (ELIMINAR). Atrapa el foco, Escape cancela y el foco vuelve al botón que lo abrió.
 */
export default function ReasonDialog({title, description, confirmLabel, danger = false, word = null, busy = false, error = '', onCancel, onConfirm}) {
  const [reason, setReason] = useState('');
  const [typed, setTyped] = useState('');
  const [errors, setErrors] = useState({});
  const root = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    root.current.querySelector('textarea').focus();
    return () => previous?.focus();
  }, []);
  function keys(event) {
    if (event.key === 'Escape' && !busy) onCancel();
    if (event.key !== 'Tab') return;
    const focusable = [...root.current.querySelectorAll('textarea, input, button:not(:disabled)')];
    const [first, last] = [focusable[0], focusable.at(-1)];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  function submit(event) {
    event.preventDefault();
    if (busy) return;
    const invalid = validateReason(reason);
    setErrors(invalid);
    if (Object.keys(invalid).length || (word && typed !== word)) return;
    onConfirm(reason.trim());
  }
  const ready = !word || typed === word;
  return <div className="s02-modal">
    <dialog open ref={root} aria-modal="true" aria-label={title} className="admin-dialog" onKeyDown={keys}>
      <h2>{title}</h2>
      <p>{description}</p>
      <form noValidate onSubmit={submit}>
        <label htmlFor="admin-reason">Motivo (queda en la auditoría)</label>
        <textarea id="admin-reason" rows={3} maxLength={500} value={reason} disabled={busy} aria-invalid={Boolean(errors.reason)}
          aria-describedby={errors.reason ? 'admin-reason-error' : undefined} onChange={event => setReason(event.target.value)}/>
        {errors.reason && <p id="admin-reason-error" className="field-error" role="alert">{errors.reason[0]}</p>}
        {word && <>
          <label htmlFor="admin-confirm-word">Escribe {word} para confirmar</label>
          <input id="admin-confirm-word" autoComplete="off" value={typed} disabled={busy} onChange={event => setTyped(event.target.value)}/>
        </>}
        {error && <p className="error" role="alert">{error}</p>}
        <div className="admin-dialog-actions">
          <button type="button" disabled={busy} onClick={onCancel}>Cancelar</button>
          <button type="submit" className={danger ? 'is-danger' : 'is-primary'} disabled={busy || !ready} aria-busy={busy}>{confirmLabel}</button>
        </div>
      </form>
    </dialog>
  </div>;
}
