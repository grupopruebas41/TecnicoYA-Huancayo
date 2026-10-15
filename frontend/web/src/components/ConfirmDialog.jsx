import React, { useEffect, useRef } from "react";
export default function ConfirmDialog({
  onCancel,
  onConfirm,
  title = "Confirmar retiro",
  busy = false,
}) {
  const root = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    root.current.querySelector("button").focus();
    return () => previous?.focus();
  }, []);
  function keys(e) {
    if (e.key === "Escape" && !busy) onCancel();
    if (e.key === "Tab") {
      const buttons = [
        ...root.current.querySelectorAll("button:not(:disabled)"),
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
      <div
        ref={root}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={keys}
      >
        <h2>{title}</h2>
        <p>El contenido dejará de estar visible. ¿Deseas continuar?</p>
        <button type="button" disabled={busy} onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" disabled={busy} onClick={onConfirm}>
          Confirmar
        </button>
      </div>
    </div>
  );
}
