import React, {useCallback, useEffect, useState} from 'react';
import {request} from '../administration/http';
import {ClientPage, EmptyState} from '../client/ui';
import Icon from '../panel/icons';
import {minutesLabel} from './homeFormat';
import {INTERVENTIONS, INTERVENTION_MIN, intervene} from './operations';
import ReasonDialog from './ReasonDialog';
import './admin.css';

/**
 * Alertas operativas (Fase A3, D-118): lista priorizada del servidor (lo que está por vencer primero, luego lo que espera,
 * las rondas vencidas y los sensores), cada alerta con color, ícono y texto, y su acción directa: abrir la solicitud,
 * reenviarla al emparejamiento (con motivo, D-116) o ir a los sensores.
 */
const TYPES = {
  pending_expiring: {tone: 'danger', icon: 'clock', title: () => 'Pendiente de 24 h por vencer', detail: item => `Vence en ${minutesLabel(item.minutes)}`},
  unassigned: {tone: 'warning', icon: 'search', title: item => `Sin técnico hace ${minutesLabel(item.minutes)}`, detail: () => 'Nadie aceptó todavía'},
  expired_chain: {tone: 'warning', icon: 'alert', title: item => `${item.rounds} rondas seguidas sin aceptación`, detail: () => 'Las ofertas vencieron o se rechazaron'},
  iot_unattended: {tone: 'info', icon: 'sensor', title: item => `Falla de sensor sin atender hace ${minutesLabel(item.minutes)}`,
    detail: item => `Alerta del sensor N.º ${item.alert_id}, sin solicitud`},
};

export default function AdmAlerts({navigate}) {
  const [state, setState] = useState({loading: true, data: null, error: ''});
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState('');
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
  return <ClientPage id="adm-alerts" icon="alert" tone="rose" title="Alertas operativas" className="adm-page adm-alerts"
    intro="Lo que necesita atención ahora, en orden de prioridad.">
    {notice && <p className="adm-notice" role="status"><Icon name="check"/>{notice}</p>}
    {state.error && <p className="error" role="alert">{state.error} <button type="button" className="text-button" onClick={load}>Reintentar</button></p>}
    {state.loading && !data && <p className="muted">Cargando las alertas…</p>}
    {data && !data.available && <p className="adm-note" role="note"><Icon name="info"/>
      Las reglas vigentes no traen los umbrales de las alertas (llegan con la versión 4). No mostramos alertas inventadas.</p>}
    {data?.available && data.items.length === 0 && <EmptyState icon="check" tone="green" title="Todo en orden" text="No hay alertas operativas por ahora."/>}
    {data?.items.length > 0 && <ol className="adm-alert-list" aria-label="Alertas operativas">
      {data.items.map(item => {
        const type = TYPES[item.type];
        return <li key={`${item.type}-${item.request_id ?? item.alert_id}`} className="adm-alert" data-tone={type.tone}>
          <span className="adm-alert-icon" aria-hidden="true"><Icon name={type.icon}/></span>
          <div className="adm-alert-body">
            <strong className="adm-alert-title">{type.title(item)}</strong>
            <span className="muted">{item.request_id ? `Solicitud N.º ${item.request_id} · ` : ''}{type.detail(item)}</span>
          </div>
          <div className="adm-alert-actions">
            {item.actions.includes('open') && <button type="button" className="button outline" aria-label={`Ver la solicitud ${item.request_id}`}
              onClick={() => navigate('requests', {request: item.request_id})}>Ver</button>}
            {item.actions.includes('rematch') && <button type="button" className="button outline" aria-label={`Reenviar la solicitud ${item.request_id}`}
              onClick={() => setDialog({id: item.request_id})}><Icon name="bolt"/>Reenviar</button>}
            {item.actions.includes('iot') && <button type="button" className="button outline" onClick={() => navigate('iot')}>Ver sensores</button>}
          </div>
        </li>;
      })}
    </ol>}
    {dialog && <ReasonDialog title={INTERVENTIONS.rematch.title(dialog.id)} description={INTERVENTIONS.rematch.description}
      confirmLabel={INTERVENTIONS.rematch.confirm} minLength={INTERVENTION_MIN} busy={dialog.busy} error={dialog.error}
      onCancel={() => setDialog(null)} onConfirm={confirm}/>}
  </ClientPage>;
}
