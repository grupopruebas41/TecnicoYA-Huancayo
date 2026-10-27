import React, {useCallback, useEffect, useState} from 'react';
import {request} from '../administration/http';
import {Notice} from '../administration/forms';
import ReasonDialog from './ReasonDialog';
import UserForm from './UserForm';
import {REQUEST_STATUS_LABELS, ROLE_LABELS, USER_STATUS_LABELS, eventLabel, formatDateTime} from './adminRules';

/** Acciones con motivo (D-85). Cada una dice qué hace antes de confirmarla. */
const ACTIONS = {
  block: {label: 'Bloquear', title: 'Bloquear cuenta', confirm: 'Bloquear', danger: true, path: 'block', method: 'POST',
    description: 'La persona no podrá entrar ni enviar solicitudes, y se cierran sus sesiones. Las atenciones en curso siguen (D-32).', done: 'Cuenta bloqueada.'},
  unblock: {label: 'Desbloquear', title: 'Desbloquear cuenta', confirm: 'Desbloquear', path: 'unblock', method: 'POST',
    description: 'La persona podrá volver a entrar con su contraseña.', done: 'Cuenta desbloqueada.'},
  reset: {label: 'Restablecer acceso', title: 'Restablecer acceso', confirm: 'Restablecer', path: 'access-reset', method: 'POST',
    description: 'Su contraseña deja de funcionar, se cierran sus sesiones y recibe un enlace para elegir una nueva.', done: 'Acceso restablecido: le enviamos el enlace por correo.'},
  sessions: {label: 'Cerrar sesiones', title: 'Cerrar todas las sesiones', confirm: 'Cerrar sesiones', path: 'sessions', method: 'DELETE',
    description: 'Se cierran sus sesiones abiertas en todos los dispositivos. Puede volver a entrar con su contraseña.', done: 'Sesiones cerradas.'},
  activation: {label: 'Reenviar activación', title: 'Reenviar enlace de activación', confirm: 'Reenviar', path: 'activation-link', method: 'POST',
    description: 'Le enviamos un enlace nuevo que vence en 72 horas; el anterior deja de servir.', done: 'Enlace de activación reenviado.', noVersion: true},
  delete: {label: 'Eliminar', title: 'Eliminar cuenta', confirm: 'Eliminar cuenta', danger: true, method: 'DELETE', word: 'ELIMINAR',
    description: 'Se borran sus datos personales (nombre, correo, teléfono, direcciones) y no podrá entrar. Sus solicitudes se conservan sin datos personales. No se puede deshacer.', done: 'Cuenta eliminada: sus datos personales se anonimizaron.'},
};

function actionsFor(user) {
  if (user.status === 'anonymized') return [];
  const actions = ['edit'];
  if (user.status === 'blocked') actions.push('unblock'); else actions.push('block');
  if (user.status === 'pending_activation') actions.push('activation');
  return [...actions, 'reset', 'sessions', 'delete'];
}

export default function UserDetail({id, currentUserId, onBack, onChanged}) {
  const [state, setState] = useState({loading: true, data: null, error: ''});
  const [editing, setEditing] = useState(false);
  const [action, setAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(() => {
    setState(current => ({...current, loading: true}));
    return request(`/admin/users/${id}`).then(result => setState({loading: false, data: result.data, error: ''}))
      .catch(failure => setState({loading: false, data: null, error: failure.message}));
  }, [id]);
  useEffect(() => { load(); }, [load]);
  const data = state.data;
  const own = data?.user.id === currentUserId;

  async function run(reason) {
    const spec = ACTIONS[action];
    setBusy(true); setError('');
    try {
      const body = {reason, ...(spec.noVersion ? {} : {expected_version: data.user.version}), ...(spec.word ? {confirmation: spec.word} : {})};
      await request(`/admin/users/${id}${spec.path ? `/${spec.path}` : ''}`, body, spec.method);
      setAction(null); setNotice(spec.done);
      await load(); onChanged?.();
    } catch (failure) {
      setError(failure.message);
    } finally { setBusy(false); }
  }

  return <section className="admin-detail" aria-busy={state.loading}>
    <button type="button" className="text-button" onClick={onBack}>← Volver a usuarios</button>
    {state.loading && !data && <p className="muted">Cargando usuario…</p>}
    <Notice error={state.error}/>
    {data && (editing
      ? <UserForm user={data.user} profile={data.client} onCancel={() => setEditing(false)}
        onSaved={async message => { setEditing(false); setNotice(message); await load(); onChanged?.(); }}/>
      : <>
        <header className="admin-detail-head">
          <div>
            <h3>{data.user.name}</h3>
            <p className="muted">{ROLE_LABELS[data.user.role]} · <span className={`admin-status is-${data.user.status}`}>{USER_STATUS_LABELS[data.user.status]}</span></p>
          </div>
          <div className="admin-actions" role="group" aria-label="Acciones de la cuenta">
            {actionsFor(data.user).map(name => <button key={name} type="button" className={'button ' + (name === 'delete' || name === 'block' ? 'outline is-danger' : 'outline')}
              disabled={own && name !== 'edit'} aria-describedby={own && name !== 'edit' ? 'admin-own-reason' : undefined}
              onClick={() => { setNotice(''); setError(''); if (name === 'edit') setEditing(true); else setAction(name); }}>
              {name === 'edit' ? 'Editar' : ACTIONS[name].label}</button>)}
          </div>
          {own && <p id="admin-own-reason" className="muted">Es tu propia cuenta: estas acciones se hacen desde Mi perfil.</p>}
        </header>
        <Notice success={notice} error={!action ? error : ''}/>
        <div className="admin-detail-grid">
          <section className="panel-card" aria-labelledby="user-data">
            <h4 id="user-data">Datos</h4>
            <dl className="admin-data">
              <div><dt>Correo</dt><dd>{data.user.email}</dd></div>
              <div><dt>Teléfono</dt><dd>{data.user.phone || '—'}</dd></div>
              <div><dt>Distrito</dt><dd>{data.user.district?.name || '—'}</dd></div>
              <div><dt>Alta</dt><dd>{formatDateTime(data.user.created_at)}</dd></div>
              {data.client && <div><dt>Tipo de cliente</dt><dd>{data.client.client_type === 'mype' ? `MYPE${data.client.business_name ? ` · ${data.client.business_name}` : ''}` : 'Hogar'}</dd></div>}
              {data.technician && <div><dt>Técnico</dt><dd>{data.technician.experience_years} años de experiencia · verificación {data.technician.verification_status}</dd></div>}
            </dl>
          </section>
          <section className="panel-card" aria-labelledby="user-requests">
            <h4 id="user-requests">Historial de solicitudes</h4>
            {!data.requests.length ? <p className="muted">Sin solicitudes.</p> : <table className="admin-table">
              <caption className="panel-sr">Últimas solicitudes de la cuenta</caption>
              <thead><tr><th scope="col">N.º</th><th scope="col">Servicio</th><th scope="col">Estado</th><th scope="col">Fecha</th></tr></thead>
              <tbody>{data.requests.map(item => <tr key={item.id}><td>{item.id}</td><td>{item.subcategory} · {item.district}</td>
                <td>{REQUEST_STATUS_LABELS[item.status] || item.status}</td><td>{formatDateTime(item.created_at)}</td></tr>)}</tbody>
            </table>}
          </section>
          <section className="panel-card admin-wide" aria-labelledby="user-audit">
            <h4 id="user-audit">Auditoría de la cuenta</h4>
            {!data.audit.length ? <p className="muted">Sin acciones registradas.</p> : <ol className="admin-timeline">
              {data.audit.map((entry, index) => <li key={index}><strong>{eventLabel(entry.action)}</strong>
                <span className="muted">{formatDateTime(entry.occurred_at)}{entry.actor ? ` · ${entry.actor}` : ''}</span>
                {entry.reason && <p>{entry.reason}</p>}</li>)}
            </ol>}
          </section>
        </div>
      </>)}
    {action && <ReasonDialog {...ACTIONS[action]} title={ACTIONS[action].title} description={ACTIONS[action].description}
      confirmLabel={ACTIONS[action].confirm} busy={busy} error={error} onCancel={() => { setAction(null); setError(''); }} onConfirm={run}/>}
  </section>;
}
