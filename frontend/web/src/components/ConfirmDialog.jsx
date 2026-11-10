import React, { useEffect, useRef } from "react";
export default function ConfirmDialog({
  onCancel,
  onConfirm,
  title = "Confirmar retiro",
  busy = false,
  description = "El contenido dejará de estar visible. ¿Deseas continuar?",
  children = null,
}) {
  const root = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    // DEF-64: si el diálogo trae un campo (el motivo del rechazo), el foco empieza en él.
    root.current.querySelector("textarea, input, button").focus();
    return () => previous?.focus();
  }, []);
  function keys(e) {
    if (e.key === "Escape" && !busy) onCancel();
    if (e.key === "Tab") {
      const buttons = [
        ...root.current.querySelectorAll("textarea:not(:disabled), input:not(:disabled), button:not(:disabled)"),
      ];
      const first = buttons[0],
        last = buttons.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
  return (
    <div className="s02-modal">
      <dialog
        open
        ref={root}
        aria-modal="true"
        aria-label={title}
        onKeyDown={keys}
      >
        <h2>{title}</h2>
        <p>{description}</p>
        {children}
        <button type="button" disabled={busy} onClick={onCancel}>
          Cancelar
        </button>
        <button
          type="button"
          disabled={busy}
          aria-busy={busy}
          onClick={onConfirm}
        >
          Confirmar
        </button>
      </dialog>
    </div>
  );
}
