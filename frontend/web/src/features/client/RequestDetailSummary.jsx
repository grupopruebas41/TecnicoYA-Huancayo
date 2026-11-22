import React from 'react';
import Icon from '../panel/icons';
import {phases} from '../requests/RequestPhase';
import {soles} from '../../lib/format';
import {phaseIcon, statusTone, whenLabel} from './clientRules';
import {specialtySlug} from '../matching/technicianView';
import './polish.css';

// La API puede devolver la franja como en la base (UTC, «2026-10-29 20:00:00.000000») o en ISO.
const iso = value => (value && !String(value).includes('T') ? String(value).replace(' ', 'T') + 'Z' : value);
const TONE_BADGES = {'is-draft': 'is-muted', 'is-search': 'is-info', 'is-choice': 'is-warning', 'is-assigned': 'is-success', 'is-closed': 'is-muted'};

function Row({icon, label, children}) {
  return <div className="detail-row">
    <dt><span className="cx-dot" aria-hidden="true"><Icon name={icon}/></span>{label}</dt>
    <dd>{children}</dd>
  </div>;
}

/**
 * Pulido final del cliente: resumen del detalle en «Mis solicitudes» como tarjeta con filas ícono + etiqueta + valor. Si la
 * solicitud nació de una alerta del sensor lleva la insignia «Desde alerta IoT». Sin tarifa referencial, explica que la
 * propone el técnico al aceptar. El asistente de la solicitud sigue usando RequestSummary (con su envío).
 */
export default function RequestDetailSummary({record}) {
  const phase = record.phase || record.status;
  const specialty = record.specialty?.name;
  const subcategories = record.subcategories?.map(item => item.name).join(', ') || record.subcategory?.name;
  const tone = statusTone(record);
  return <section className="cx-card detail-summary" data-tone={specialtySlug(specialty || '')} aria-label="Resumen de solicitud">
    <header className="detail-summary-head">
      <span className="detail-summary-icon" aria-hidden="true"><Icon name="requests"/></span>
      <div>
        <p className="kicker">Resumen</p>
        <h3>Solicitud #{record.id}</h3>
      </div>
      <div className="cx-badges">
        <span className={`cx-badge ${TONE_BADGES[tone] || 'is-info'}`}><Icon name={phaseIcon(phase)}/> {phases[phase] || 'Estado pendiente de consulta'}</span>
        {record.from_iot_alert && <span className="cx-badge is-warning"><Icon name="sensor"/> Desde alerta IoT</span>}
      </div>
    </header>
    <dl className="detail-rows">
      <Row icon="catalog" label="Especialidad y subcategoría">{[specialty, subcategories].filter(Boolean).join(' · ')}</Row>
      <Row icon="pin" label="Distrito y dirección">
        {record.district?.name}{record.address ? ` · ${record.address}` : ''}
        {record.address_reference && <small className="muted detail-sub">Referencia: {record.address_reference}</small>}
      </Row>
      <Row icon="calendar" label="Franja">{record.mode === 'scheduled' ? `Atención programada · ${whenLabel({...record, preferred_start_at: iso(record.preferred_start_at), preferred_end_at: iso(record.preferred_end_at)})}` : 'Lo antes posible'}</Row>
      <Row icon="alert" label="Urgencia">{record.urgency === 'urgente' ? 'Urgente' : 'Normal'}</Row>
      <Row icon="wallet" label="Tarifa">
        {record.reference_fee?.amount != null
          ? <><strong>Referencial {soles(record.reference_fee.amount)}</strong><small className="muted detail-sub">Orientativa. No representa un cobro.</small></>
          : <><strong>Sin tarifa referencial</strong><small className="muted detail-sub">La tarifa la propone el técnico al aceptar.</small></>}
      </Row>
      {record.source === 'profile' && <Row icon="profile" label="Técnico elegido">Solicitud dirigida a un técnico de tu elección</Row>}
      {record.description && <Row icon="chat" label="Descripción"><span className="detail-description">{record.description}</span></Row>}
    </dl>
  </section>;
}
