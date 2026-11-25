import React, {useCallback, useEffect, useState} from 'react';
import {request} from '../administration/http';
import {ClientPage, EmptyState} from '../client/ui';
import Icon from '../panel/icons';
import {minutesLabel} from './homeFormat';
import {INTERVENTIONS, INTERVENTION_MIN, agoLabel, intervene, plural} from './operations';
import ReasonDialog from './ReasonDialog';
import './admin.css';

/**
 * Alertas operativas (Fase A3, D-118): lista priorizada del servidor, cada alerta con su acción directa: abrir la
 * solicitud, reenviarla al emparejamiento (con motivo, D-116), ir a los sensores o revisar el desempeño.
 * Revisión del #70: nivel con color, ícono y etiqueta («Urgente» rojo: sin técnico más de 24 h y fallas IoT; «Atención»
 * ámbar: más de 30 min sin técnico, pendientes por vencer y rondas vencidas; «Seguimiento» azul: desempeño bajo),
 * tiempos legibles («hace 27 días»), detalle del servicio en la segunda línea, grupos por tipo con contador y chips.
 */
const LEVELS = {urgent: ['danger', 'Urgente'], attention: ['warning', 'Atención'], follow_up: ['info', 'Seguimiento']};

const service = item => {
  if (!item.request) return '';
  const parts = [item.request.specialty, item.request.district];
  if (item.rounds_without_acceptance) parts.push(`${plural(item.rounds_without_acceptance, 'ronda', 'rondas')} sin aceptar`);
  return parts.join(' · ');
};

/** Grupo, ícono, título y segunda línea de cada tipo, en el orden de prioridad del servidor. */
const TYPES = {
  pending_expiring: {group: 'Pendientes por vencer', icon: 'clock', title: item => `Pendiente de 24 h: vence en ${minutesLabel(item.minutes)}`, detail: service},
  unassigned: {group: 'Sin técnico asignado', icon: 'search', title: item => `Sin técnico ${agoLabel(item.minutes)}`, detail: service},
  expired_chain: {group: 'Rondas vencidas en cadena', icon: 'alert', title: item => `${item.rounds} rondas seguidas sin aceptación`, detail: service},
  iot_unattended: {group: 'Sensores con falla', icon: 'sensor', title: item => `Falla de sensor sin atender ${agoLabel(item.minutes)}`,
    detail: item => [item.device, item.message].filter(Boolean).join(' · ') || `Alerta del sensor N.º ${item.alert_id}, sin solicitud`},
  low_performance: {group: 'Desempeño bajo', icon: 'chart', title: item => `Desempeño bajo: ${item.technician.name}`,
    detail: item => `${item.offers} ofertas en ${item.days ?? 30} días · ${plural(item.accepted, 'aceptada', 'aceptadas')} · ${plural(item.expired, 'vencida', 'vencidas')}`},
};
const ORDER = Object.keys(TYPES);

function Actions({item, navigate, onRematch}) {
  const primary = 'adm-btn adm-btn-primary';
  const secondary = 'adm-btn adm-btn-secondary';
  return <div className="adm-alert-actions">
    {item.actions.includes('rematch') && <button type="button" className={primary} aria-label={`Reenviar la solicitud ${item.request_id}`}
      onClick={() => onRematch(item.request_id)}><Icon name="search"/>Reenviar</button>}
    {item.actions.includes('iot') && <button type="button" className={primary} onClick={() => navigate('iot')}><Icon name="sensor"/>Ver sensores</button>}
    {item.actions.includes('review') && <button type="button" className={primary} aria-label={`Revisar el desempeño de ${item.technician.name}`}
      onClick={() => navigate('performance', {technician: item.technician.id})}><Icon name="chart"/>Revisar</button>}
    {item.actions.includes('open') && <button type="button" className={secondary} aria-label={`Ver la solicitud ${item.request_id}`}
      onClick={() => navigate('requests', {request: item.request_id})}>Ver</button>}
  </div>;
}

function Alert({item, navigate, onRematch}) {
  const type = TYPES[item.type];
  const [tone, label] = LEVELS[item.level] || LEVELS.attention;
  return <li className="adm-alert" data-tone={tone} data-level={item.level}>
    <span className="adm-alert-icon" aria-hidden="true"><Icon name={type.icon}/></span>
    <div className="adm-alert-body">
      <div className="adm-alert-head">
        <strong className="adm-alert-title">{type.title(item)}</strong>
        <span className="adm-level" data-tone={tone}>{label}</span>
      </div>
      <span className="adm-alert-detail">{item.request_id ? `N.º ${item.request_id} · ` : ''}{type.detail(item)}</span>
    </div>
    <Actions item={item} navigate={navigate} onRematch={onRematch}/>
  </li>;
}

export default function AdmAlerts({navigate}) {
  const [state, setState] = useState({loading: true, data: null, error: ''});
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('all');
  const load = useCallback(() => {
    setState(current => ({...current, loading: true, error: ''}));
    request('/admin/alerts').then(result => setState({loading: false, data: result.data, error: ''}))
      .catch(failure => setState({loading: false, data: null, error: failure.message}));
  }, []);
  useEffect(load, [load]);
  async function confirm(reason) {
    setDialog(current => ({...current, busy: true, error: ''}));
    try {
      const {data} = await request(`/admin/requests/${dialog.id}`);
      await intervene(dialog.id, 'rematch', reason, data.request.version);
      setNotice(INTERVENTIONS.rematch.done);
      setDialog(null);
      load();
    } catch (failure) {
      setDialog(current => ({...current, busy: false, error: failure.message}));
    }
  }
  const data = state.data;
  const items = (data?.items || []).filter(item => TYPES[item.type]);
  const groups = ORDER.map(type => ({type, items: items.filter(item => item.type === type)})).filter(group => group.items.length);
  const shown = filter === 'all' ? groups : groups.filter(group => group.type === filter);
  return <ClientPage id="adm-alerts" icon="alert" tone="rose" title="Alertas operativas" className="adm-page adm-alerts"
    intro="Lo que necesita atención ahora, en orden de prioridad.">
    {notice && <p className="adm-notice" role="status"><Icon name="check"/>{notice}</p>}
    {state.error && <p className="error" role="alert">{state.error} <button type="button" className="text-button" onClick={load}>Reintentar</button></p>}
    {state.loading && !data && <p className="muted">Cargando las alertas…</p>}
    {data && !data.available && <p className="adm-note" role="note"><Icon name="info"/>
      Las reglas vigentes no traen los umbrales de las alertas (llegan con la versión 4). No mostramos alertas inventadas.</p>}
    {data?.available && items.length === 0 && <EmptyState icon="check" tone="green" title="Todo en orden" text="No hay alertas operativas por ahora."/>}
    {items.length > 0 && <>
      <div className="adm-chips" role="group" aria-label="Filtrar alertas">
        <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>Todas ({items.length})</button>
        {groups.map(group => <button key={group.type} type="button" aria-pressed={filter === group.type} onClick={() => setFilter(group.type)}>
          {TYPES[group.type].group} ({group.items.length})</button>)}
      </div>
      {shown.map(group => <section key={group.type} className="adm-alert-group" aria-label={TYPES[group.type].group}>
        <h3>{TYPES[group.type].group}<span className="adm-live-count" aria-hidden="true">{group.items.length}</span></h3>
        <ol className="adm-alert-list" aria-label={`Alertas: ${TYPES[group.type].group}`}>
          {group.items.map(item => <Alert key={`${item.type}-${item.request_id ?? item.alert_id ?? item.technician?.id}`} item={item}
            navigate={navigate} onRematch={id => setDialog({id})}/>)}
        </ol>
      </section>)}
    </>}
    {dialog && <ReasonDialog title={INTERVENTIONS.rematch.title(dialog.id)} description={INTERVENTIONS.rematch.description}
      confirmLabel={INTERVENTIONS.rematch.confirm} minLength={INTERVENTION_MIN} busy={dialog.busy} error={dialog.error}
      onCancel={() => setDialog(null)} onConfirm={confirm}/>}
  </ClientPage>;
}
