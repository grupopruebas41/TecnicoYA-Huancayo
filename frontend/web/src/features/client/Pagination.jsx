import React from 'react';

/** Hasta 5 números alrededor de la página actual, siempre dentro de 1…last. */
export function pageWindow(current, last, size = 5) {
  const start = Math.max(1, Math.min(current - Math.floor(size / 2), last - size + 1));
  return Array.from({length: Math.min(size, last)}, (_, index) => start + index);
}

/**
 * Paginación con el estilo del sitio (revisión del PR #39): «‹ Anterior» y «Siguiente ›» con borde, números de página
 * con aria-current y extremos deshabilitados. Los nombres accesibles siguen siendo «Página anterior» y «Página siguiente».
 */
export default function Pagination({label, page, lastPage, onChange, disabled = false}) {
  const last = Math.max(1, lastPage || 1);
  return <nav className="client-pagination" aria-label={label}>
    <button type="button" className="client-page-step" aria-label="Página anterior" disabled={disabled || page <= 1}
      onClick={() => onChange(page - 1)}>‹ Anterior</button>
    <ol>
      {pageWindow(page, last).map(number => <li key={number}>
        <button type="button" className="client-page-number" aria-label={`Página ${number}`} aria-current={number === page ? 'page' : undefined}
          disabled={disabled} onClick={() => onChange(number)}>{number}</button>
      </li>)}
    </ol>
    <button type="button" className="client-page-step" aria-label="Página siguiente" disabled={disabled || page >= last}
      onClick={() => onChange(page + 1)}>Siguiente ›</button>
  </nav>;
}
