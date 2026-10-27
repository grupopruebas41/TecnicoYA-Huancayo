import React from 'react';
import {formatDate} from './clientRules';

/**
 * D-89 (TIMELINE-01): línea de tiempo del titular. Los textos vienen fijos del servidor (lista blanca); la SPA no
 * traduce ni agrega eventos. Se actualiza cuando RequestTracking recarga el detalle con request.updated.
 */
export default function RequestTimeline({events}) {
  if (!events?.length) return null;
  return <ol className="client-timeline" aria-label="Línea de tiempo de la solicitud">
    {events.map((event, index) => <li key={`${event.type}-${event.occurred_at}-${index}`}>
      <strong>{event.label}</strong>
      <time dateTime={event.occurred_at}>{formatDate(event.occurred_at)}</time>
    </li>)}
  </ol>;
}
