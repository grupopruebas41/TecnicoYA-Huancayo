import React from 'react';
import {request} from '../administration/http';
import {REQUEST_STATUS_LABELS} from './adminRules';
import Icon from '../panel/icons';

/**
 * Fase A3 del panel del administrador: piezas comunes de Solicitudes, Emparejamiento en vivo y Alertas operativas.
 * Estados con color, ícono y texto (nunca solo color); intervención de D-116 con Idempotency-Key.
 */
const REQUEST_TONES = {
  registered: ['slate', 'edit'], sent: ['info', 'search'], pending_availability: ['warning', 'clock'], assigned: ['success', 'check'],
  in_progress: ['info', 'wrench'], completed: ['success', 'check'], closed: ['slate', 'check'], unrated: ['slate', 'star'],
  cancelled: ['danger', 'close'], expired: ['slate', 'alert'],
};
export const OFFER_LABELS = {pending: 'Pendiente', accepted: 'Aceptada', rejected: 'Rechazada', expired: 'Vencida', withdrawn: 'Retirada'};
const OFFER_TONES = {pending: ['info', 'clock'], accepted: ['success', 'check'], rejected: ['slate', 'close'], expired: ['warning', 'alert'],
  withdrawn: ['slate', 'close']};

/** Mínimo de caracteres del motivo de una intervención (el servidor pide de 10 a 500). */
export const INTERVENTION_MIN = 10;

export function RequestStatus({status}) {
  const [tone, icon] = REQUEST_TONES[status] || ['slate', 'info'];
  return <span className="adm-status" data-tone={tone}><Icon name={icon}/>{REQUEST_STATUS_LABELS[status] || status}</span>;
}

export function OfferStatus({status}) {
  const [tone, icon] = OFFER_TONES[status] || ['slate', 'info'];
  return <span className="adm-status" data-tone={tone}><Icon name={icon}/>{OFFER_LABELS[status] || status}</span>;
}

/** Segundos a «35 s», «1 min 35 s» o «1 h 2 min»; sin dato, «—». */
export function secondsLabel(seconds) {
  if (seconds === null || seconds === undefined) return '—';
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return seconds % 60 ? `${minutes} min ${seconds % 60} s` : `${minutes} min`;
  return minutes % 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${Math.floor(minutes / 60)} h`;
}

/** D-116: cancelar («cancellation») o reenviar («rematch») con motivo, versión y una clave de idempotencia nueva. */
export const intervene = (id, action, reason, version) =>
  request(`/admin/requests/${id}/${action}`, {reason, expected_version: version}, 'POST', {headers: {'Idempotency-Key': crypto.randomUUID()}});

/** Textos de cada intervención: título del diálogo, descripción, botón y aviso de éxito. */
export const INTERVENTIONS = {
  cancellation: {
    open: 'Cancelar con motivo', confirm: 'Cancelar la solicitud', danger: true,
    title: id => `Cancelar la solicitud N.º ${id}`,
    description: 'La solicitud se cancela, se retiran sus ofertas y, si tenía técnico, se libera su visita. Avisamos al cliente y al técnico (sin el motivo).',
    done: 'Cancelamos la solicitud y avisamos al cliente.',
  },
  rematch: {
    open: 'Reenviar al emparejamiento', confirm: 'Reenviar', danger: false,
    title: id => `Reenviar la solicitud N.º ${id} al emparejamiento`,
    description: 'Se retiran las ofertas abiertas y se busca técnicos otra vez con las reglas vigentes. El pendiente de 24 h no se reinicia. Avisamos al cliente.',
    done: 'Reenviamos la solicitud al emparejamiento.',
  },
};
