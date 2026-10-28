import React from 'react';

// Iconos del menú (bloque C, D-85): una sola familia en SVG en línea, 24 × 24 con trazo de 1,8 px y puntas
// redondeadas, sin dependencias. Son decorativos: el texto del botón (o su tooltip) da el nombre.
const PATHS = {
  home: <><path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10v9h11v-9"/><path d="M10 19v-5h4v5"/></>,
  chart: <><path d="M4 20h16"/><path d="M7 16v-5"/><path d="M12 16V7"/><path d="M17 16v-8"/></>,
  users: <><circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15.5 6a3 3 0 0 1 0 5.8"/><path d="M17 14.2a5 5 0 0 1 3.5 4.8"/></>,
  verify: <><path d="M12 3.5 19 6v5.5c0 4.3-3 7.4-7 9-4-1.6-7-4.7-7-9V6z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/></>,
  requests: <><rect x="5" y="4" width="14" height="16" rx="2.5"/><path d="M9 4v2.5h6V4"/><path d="M8.5 11h7"/><path d="M8.5 15h4.5"/></>,
  catalog: <><rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/></>,
  announcements: <><path d="M4.5 10v4h3l6 4V6l-6 4z"/><path d="M17 9.5a3.5 3.5 0 0 1 0 5"/></>,
  profile: <><circle cx="12" cy="9" r="3.5"/><path d="M5.5 19.5a6.5 6.5 0 0 1 13 0"/></>,
  // Panel del cliente (D-87): nueva solicitud, búsqueda y notificaciones.
  plus: <><circle cx="12" cy="12" r="8"/><path d="M12 8.5v7"/><path d="M8.5 12h7"/></>,
  search: <><circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 4.5 4.5"/></>,
  bell: <><path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></>,
  // D-94: una sola familia de íconos de línea en todo el panel (sin emojis de colores).
  check: <><path d="m5 12.5 4.5 4.5L19 7.5"/></>,
  clock: <><circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/></>,
  alert: <><path d="M12 4 21 19.5H3z"/><path d="M12 10v4.5"/><path d="M12 17.5v.1"/></>,
  close: <><path d="m6.5 6.5 11 11"/><path d="m17.5 6.5-11 11"/></>,
  image: <><rect x="4" y="5" width="16" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="m5 17 4.5-4.5 3 3 2.5-2.5 4 4"/></>,
  star: <><path d="m12 4.5 2.3 4.7 5.2.8-3.8 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1L4.5 10l5.2-.8z"/></>,
  menu: <><path d="M4.5 7h15"/><path d="M4.5 12h15"/><path d="M4.5 17h15"/></>,
  collapse: <><path d="m14.5 7-5 5 5 5"/><path d="M19 5v14"/></>,
  expand: <><path d="m9.5 7 5 5-5 5"/><path d="M5 5v14"/></>,
  site: <><path d="M14 5h5v5"/><path d="M19 5 11 13"/><path d="M17 14v4a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 5 18V8.5A1.5 1.5 0 0 1 6.5 7H10"/></>,
  logout: <><path d="M12 4v7"/><path d="M7.5 7a7 7 0 1 0 9 0"/></>,
};

export default function Icon({name}) {
  return <svg className="panel-svg-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{PATHS[name]}</svg>;
}
