import React, { useEffect, useRef } from "react";
import { specialtyIcon } from "../client/specialtyIcon";
import Icon from "../panel/icons";
import { STAGES, specialtySlug } from "./technicianView";

/** Ilustración propia (degradado e ícono) para un trabajo sin fotos; nunca una foto de terceros (D-101). */
export function WorkIllustration({ title, specialty }) {
  return (
    <svg className="tech-illustration" data-specialty={specialtySlug(specialty)} viewBox="0 0 160 100" role="img"
      aria-label={`Ilustración del trabajo «${title}»`}>
      <rect x="0" y="0" width="160" height="100" rx="12" className="tech-illustration-bg" />
      <circle cx="132" cy="22" r="30" className="tech-illustration-glow" />
      <g transform="translate(56 26) scale(2)" className="tech-illustration-icon"><Icon name={specialtyIcon(specialty)} raw /></g>
    </svg>
  );
}

/**
 * Visor del portafolio (D-101): diálogo modal con «antes y después», textos alternativos, flechas para cambiar de
 * trabajo, Tab que no sale del diálogo y Esc para cerrar; al cerrar devuelve el foco al trabajo que lo abrió.
 */
export default function PortfolioViewer({ items, index, specialty, onIndex, onClose, returnFocus }) {
  const root = useRef(null),
    close = useRef(null);
  const item = items[index];
  useEffect(() => {
    close.current?.focus();
    return () => returnFocus?.focus?.();
  }, [returnFocus]);
  const go = (step) => onIndex((index + step + items.length) % items.length);
  function keys(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    } else if (event.key === "Tab") {
      const focusable = [...root.current.querySelectorAll("button:not(:disabled)")];
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }
  return (
    <div className="s02-modal portfolio-viewer">
      <dialog open ref={root} aria-modal="true" aria-label={item.title} onKeyDown={keys}>
        <header className="portfolio-viewer-head">
          <p className="muted">Trabajo {index + 1} de {items.length}</p>
          <button type="button" ref={close} className="button outline" aria-label="Cerrar visor" onClick={onClose}>
            <Icon name="close" />
          </button>
        </header>
        <h4>{item.title}</h4>
        <div className="portfolio-viewer-images">
          {item.images?.length ? item.images.map((image) => (
            <figure key={image.media_id}>
              <img src={image.url} alt={image.caption || `${STAGES[image.stage] || "Foto"}: ${item.title}`} />
              {STAGES[image.stage] && <figcaption>{STAGES[image.stage]}</figcaption>}
            </figure>
          )) : <WorkIllustration title={item.title} specialty={specialty} />}
        </div>
        {item.description && <p>{item.description}</p>}
        {items.length > 1 && (
          <div className="portfolio-viewer-nav">
            <button type="button" className="button outline" onClick={() => go(-1)}>‹ Anterior</button>
            <button type="button" className="button outline" onClick={() => go(1)}>Siguiente ›</button>
          </div>
        )}
      </dialog>
    </div>
  );
}
