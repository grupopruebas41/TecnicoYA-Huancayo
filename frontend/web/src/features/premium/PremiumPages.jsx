import React, {useCallback, useEffect, useRef, useState} from 'react';
import {request} from '../administration/http';
import {Notice} from '../administration/forms';
import Icon from '../panel/icons';
import './premium.css';

/**
 * Fase 6 del panel final (D-98 y D-99): «Mi hogar / Mi negocio» del cliente Premium. El sensor todavía no existe: toda
 * lectura es simulada y cada pantalla de sensores muestra la franja «Modo demostración: lecturas simuladas». Mismo estilo
 * que «Tu cuenta»: tarjetas, íconos con acento y animaciones suaves que se apagan con «Reducir animaciones».
 */
export const STATUS = {
  normal: {label: 'Normal', icon: 'check'},
  attention: {label: 'Atención', icon: 'alert'},
  failure: {label: 'Falla', icon: 'close'},
};
export const SEVERITY = {info: 'Recordatorio', attention: 'Atención', failure: 'Falla'};
export const SAMPLE_TAG = 'Ejemplo · datos de demostración';
const load = path => Promise.resolve().then(() => request(path));
export const decimal = value => (value == null ? '—' : String(Math.round(Number(value) * 10) / 10).replace('.', ','));
const LIMA = {timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit'};
export const timeLabel = value => new Date(value).toLocaleString('es-PE', {...LIMA, day: '2-digit', month: 'short'});

export function DemoStripe() {
  return <p className="premium-demo" role="note"><Icon name="sensor"/> Modo demostración: lecturas simuladas</p>;
}

function Page({id, title, intro, accent, icon, children, actions = null}) {
  return <section className="premium-page" aria-labelledby={`premium-${id}`}>
    <header className="premium-head" data-accent={accent}>
      <span className="premium-head-icon" aria-hidden="true"><Icon name={icon}/></span>
      <div><h2 id={`premium-${id}`}>{title}</h2><p className="muted">{intro}</p></div>
      {actions}
    </header>
    {children}
  </section>;
}

export function StatusBadge({status}) {
  const meta = STATUS[status] || STATUS.failure;
  return <span className={`premium-status is-${status}`}><Icon name={meta.icon}/> {meta.label}</span>;
}

/** Gráfico de línea de las lecturas con la franja del rango normal; el resumen en texto lo describe (nunca solo el gráfico). */
export function Sparkline({readings, target, tolerance, unit, height = 64, label}) {
  const values = readings.map(r => r.value);
  const low = Math.min(target - 2 * tolerance, ...values);
  const high = Math.max(target + 2 * tolerance, ...values);
  const y = value => height - 4 - ((value - low) / (high - low || 1)) * (height - 8);
  const step = readings.length > 1 ? 300 / (readings.length - 1) : 0;
  const points = readings.map((r, i) => `${(i * step).toFixed(1)},${y(r.value).toFixed(1)}`).join(' ');
  const summary = values.length
    ? `${label}: en las últimas 24 h, mínimo ${decimal(Math.min(...values))} ${unit}, máximo ${decimal(Math.max(...values))} ${unit} y ahora ${decimal(values.at(-1))} ${unit}. Rango normal ${decimal(target - tolerance)} a ${decimal(target + tolerance)} ${unit}.`
    : `${label}: todavía no hay lecturas.`;
  return <figure className="premium-chart">
    <svg viewBox={`0 0 300 ${height}`} preserveAspectRatio="none" role="img" aria-label={summary}>
      <rect className="premium-band" x="0" width="300" y={y(target + tolerance)} height={Math.max(1, y(target - tolerance) - y(target + tolerance))}/>
      {values.length > 1 && <polyline className="premium-line" points={points} fill="none"/>}
    </svg>
    <figcaption className="muted">{summary}</figcaption>
  </figure>;
}

export function SensorsPage({navigate, refreshMs = 30000}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);
  const refresh = useCallback(() => load('/client/iot/devices').then(r => { setData(r.data); setError(''); })
    .catch(e => setError(e.message || 'No pudimos leer los sensores.')), []);
  useEffect(() => { refresh(); const timer = setInterval(refresh, refreshMs); return () => clearInterval(timer); }, [refresh, refreshMs]);
  const items = data?.items || [];
  return <Page id="sensores" title="Sensores IoT" icon="sensor" accent="teal"
    intro="El estado de tus equipos en un vistazo. Se actualiza cada 30 segundos."
    actions={<button type="button" className="button outline" onClick={refresh}>Actualizar</button>}>
    <DemoStripe/>
    <Notice error={error}/>
    {data && !items.length && <div className="premium-empty"><p>Ningún equipo tiene sensor todavía.</p>
      <button type="button" className="button primary" onClick={() => navigate('equipment')}>Ver mis equipos</button></div>}
    <div className="premium-grid">
      {items.map(device => <article key={device.id} className={`premium-card sensor-card is-${device.status}`} aria-labelledby={`sensor-${device.id}`}>
        <header>
          <h3 id={`sensor-${device.id}`}>{device.equipment.name}</h3>
          <StatusBadge status={device.status}/>
        </header>
        <p className="sensor-value"><strong>{decimal(device.value)}</strong> <span>{device.unit}</span></p>
        <p className="muted">{device.metric_label} · normal {device.threshold_label}</p>
        <Sparkline readings={device.readings} target={device.target} tolerance={device.tolerance} unit={device.unit} label={device.equipment.name}/>
        <p className="sensor-meta muted">
          <span>{device.online ? 'En línea' : 'Sin señal'}</span> · <span>Batería {device.battery} %</span>
          {device.measured_at && <> · <span>Última lectura {timeLabel(device.measured_at)}</span></>}
        </p>
        <button type="button" className="button outline" onClick={() => setOpen(device)}>Ver detalle de {device.equipment.name}</button>
      </article>)}
    </div>
    {open && <SensorDetail device={open} onClose={() => setOpen(null)}/>}
  </Page>;
}

function SensorDetail({device, onClose}) {
  const close = useRef(null);
  const opener = useRef(document.activeElement);
  useEffect(() => { close.current?.focus(); const back = opener.current; return () => back?.focus?.(); }, []);
  return <div className="premium-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <dialog open className="premium-dialog" aria-modal="true" aria-labelledby="sensor-detalle"
      onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } }}>
      <header className="premium-dialog-head">
        <h2 id="sensor-detalle">{device.equipment.name}</h2>
        <button ref={close} type="button" className="panel-icon-button" aria-label="Cerrar detalle" onClick={onClose}><Icon name="close"/></button>
      </header>
      <DemoStripe/>
      <StatusBadge status={device.status}/>
      <Sparkline readings={device.readings} target={device.target} tolerance={device.tolerance} unit={device.unit} height={180} label={device.equipment.name}/>
      <p className="muted">{device.name} · {device.metric_label} · rango normal {device.threshold_label}</p>
    </dialog>
  </div>;
}

export function AlertsPage({navigate}) {
  const [data, setData] = useState(null);
  const [notice, setNotice] = useState({});
  const [busy, setBusy] = useState(null);
  const refresh = () => load('/client/iot/alerts').then(r => setData(r.data)).catch(e => setNotice({error: e.message}));
  useEffect(() => { refresh(); }, []);
  async function send(alert) {
    setBusy(alert.id); setNotice({});
    try {
      const key = globalThis.crypto?.randomUUID?.() || `alerta-${alert.id}-${Date.now()}`;
      const r = await request(`/client/iot/alerts/${alert.id}/request`, {}, 'POST', {headers: {'Idempotency-Key': key}});
      setNotice({success: r.data.directed
        ? `Enviamos la solicitud #${r.data.request_id} a ${r.data.technician}, tu técnico de confianza.`
        : `Creamos la solicitud #${r.data.request_id} y estamos buscando técnicos disponibles.`});
      await refresh();
    } catch (e) { setNotice({error: e.message}); } finally { setBusy(null); }
  }
  const items = data?.items || [];
  return <Page id="alertas" title="Alertas" icon="alert" accent="orange"
    intro="Avisos de tus sensores y recordatorios de mantenimiento. También llegan a la campana.">
    <DemoStripe/>
    <Notice error={notice.error} success={notice.success}/>
    {data && !items.length && <div className="premium-empty"><p>No hay alertas. Tus equipos están bien.</p></div>}
    <ul className="premium-list">
      {items.map(alert => <li key={alert.id} className={`premium-alert is-${alert.severity}` + (alert.resolved_at ? ' is-resolved' : '')}>
        <span className="premium-alert-icon" aria-hidden="true"><Icon name={alert.kind === 'maintenance' ? 'clock' : 'alert'}/></span>
        <div>
          <p className="premium-alert-title"><span className="premium-severity">{SEVERITY[alert.severity]}</span> {alert.equipment.name}</p>
          <p>{alert.message}</p>
          <p className="muted">{timeLabel(alert.started_at)}{alert.resolved_at ? ` · Resuelta ${timeLabel(alert.resolved_at)}` : ' · Activa'}</p>
        </div>
        {alert.request_id
          ? <button type="button" className="button outline" onClick={() => navigate('requests', {open: alert.request_id})}>Ver solicitud #{alert.request_id}</button>
          : <button type="button" className="button primary" disabled={busy === alert.id} onClick={() => send(alert)}>Enviar a mi técnico de confianza</button>}
      </li>)}
    </ul>
  </Page>;
}

const EMPTY = {name: '', specialty_id: '', subcategory_id: '', brand: '', model: '', year: '', address_id: '', notes: ''};
export function equipmentErrors(value) {
  const errors = {};
  const name = value.name.trim();
  if (name.length < 2 || name.length > 60) errors.name = 'El nombre del equipo debe tener de 2 a 60 caracteres.';
  if (!value.subcategory_id) errors.subcategory_id = 'Elige el tipo de equipo.';
  const year = Number(value.year);
  if (value.year !== '' && (!Number.isInteger(year) || year < 1980 || year > new Date().getFullYear() + 1)) errors.year = 'El año debe estar entre 1980 y el próximo año.';
  if (value.notes.length > 500) errors.notes = 'Las notas admiten hasta 500 caracteres.';
  return errors;
}

function Field({id, label, error, children}) {
  return <div className="form-field">
    <label htmlFor={id}>{label}</label>
    {React.cloneElement(children, {id, 'aria-invalid': !!error, 'aria-describedby': error ? `${id}-error` : undefined})}
    {error && <span className="field-error" id={`${id}-error`}>{error}</span>}
  </div>;
}

function EquipmentForm({initial, onCancel, onSaved}) {
  const [value, setValue] = useState({...EMPTY, ...initial});
  const [errors, setErrors] = useState({});
  const [catalog, setCatalog] = useState({specialties: [], subcategories: [], addresses: []});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([load('/catalog/specialties'), load('/client/addresses')])
      .then(([s, a]) => setCatalog(c => ({...c, specialties: s.data || [], addresses: a.data?.items || []}))).catch(() => {});
  }, []);
  useEffect(() => {
    if (!value.specialty_id) return;
    load('/catalog/subcategories?specialty_id=' + value.specialty_id).then(r => setCatalog(c => ({...c, subcategories: r.data || []}))).catch(() => {});
  }, [value.specialty_id]);
  const set = (name, next) => setValue(current => ({...current, [name]: next, ...(name === 'specialty_id' ? {subcategory_id: ''} : {})}));
  async function submit(event) {
    event.preventDefault();
    const found = equipmentErrors(value);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true); setError('');
    const body = {name: value.name.trim(), subcategory_id: Number(value.subcategory_id), brand: value.brand.trim() || null,
      model: value.model.trim() || null, year: value.year === '' ? null : Number(value.year),
      address_id: value.address_id ? Number(value.address_id) : null, notes: value.notes.trim() || null};
    try {
      if (initial?.id) await request(`/client/equipment/${initial.id}`, {...body, expected_version: initial.version}, 'PATCH');
      else await request('/client/equipment', body);
      onSaved(initial?.id ? 'Equipo actualizado.' : 'Equipo registrado.');
    } catch (e) {
      setErrors(Object.fromEntries(Object.entries(e.fields || {}).map(([k, v]) => [k, [].concat(v)[0]])));
      setError(e.message);
    } finally { setBusy(false); }
  }
  return <form className="premium-card premium-form" noValidate onSubmit={submit} aria-label={initial?.id ? 'Editar equipo' : 'Nuevo equipo'}>
    <Field id="equipo-nombre" label="Nombre" error={errors.name}><input value={value.name} onChange={e => set('name', e.target.value)}/></Field>
    <div className="premium-pair">
      <Field id="equipo-especialidad" label="Especialidad" error={null}>
        <select value={value.specialty_id} onChange={e => set('specialty_id', e.target.value)}>
          <option value="">Selecciona</option>{catalog.specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <Field id="equipo-tipo" label="Tipo de equipo" error={errors.subcategory_id}>
        <select value={value.subcategory_id} onChange={e => set('subcategory_id', e.target.value)}>
          <option value="">Selecciona</option>{catalog.subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
    </div>
    <div className="premium-pair">
      <Field id="equipo-marca" label="Marca (opcional)" error={errors.brand}><input value={value.brand} onChange={e => set('brand', e.target.value)}/></Field>
      <Field id="equipo-modelo" label="Modelo (opcional)" error={errors.model}><input value={value.model} onChange={e => set('model', e.target.value)}/></Field>
    </div>
    <div className="premium-pair">
      <Field id="equipo-anio" label="Año (opcional)" error={errors.year}><input inputMode="numeric" value={value.year} onChange={e => set('year', e.target.value)}/></Field>
      <Field id="equipo-ubicacion" label="Ubicación" error={errors.address_id}>
        <select value={value.address_id} onChange={e => set('address_id', e.target.value)}>
          <option value="">Sin dirección</option>{catalog.addresses.map(a => <option key={a.id} value={a.id}>{a.label} · {a.address}</option>)}
        </select>
      </Field>
    </div>
    <Field id="equipo-notas" label="Notas (opcional)" error={errors.notes}><textarea rows={2} value={value.notes} onChange={e => set('notes', e.target.value)}/></Field>
    <Notice error={error}/>
    <div className="premium-actions">
      <button type="submit" className="button primary" disabled={busy}>Guardar equipo</button>
      <button type="button" className="button outline" onClick={onCancel}>Cancelar</button>
    </div>
  </form>;
}

export function EquipmentPage({navigate}) {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(null);
  const [detail, setDetail] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [notice, setNotice] = useState({});
  const refresh = () => load('/client/equipment').then(r => setItems(r.data.items)).catch(e => { setItems([]); setNotice({error: e.message}); });
  useEffect(() => { refresh(); }, []);
  async function open(item) {
    if (detail?.id === item.id) { setDetail(null); return; }
    try { setDetail((await request(`/client/equipment/${item.id}`)).data); } catch (e) { setNotice({error: e.message}); }
  }
  async function remove(item) {
    try { await request(`/client/equipment/${item.id}`, undefined, 'DELETE'); setNotice({success: `Eliminaste «${item.name}».`}); setConfirm(null); refresh(); }
    catch (e) { setNotice({error: e.message}); }
  }
  return <Page id="equipos" title="Mis equipos" icon="monitor" accent="blue" intro="Tus equipos, su ubicación y su historial de servicios."
    actions={!form && <button type="button" className="button primary" onClick={() => setForm({})}>Agregar equipo</button>}>
    <Notice error={notice.error} success={notice.success}/>
    {form && <EquipmentForm initial={form} onCancel={() => setForm(null)} onSaved={message => { setForm(null); setNotice({success: message}); refresh(); }}/>}
    {items?.length === 0 && !form && <div className="premium-empty"><p>Aún no registras equipos.</p></div>}
    <div className="premium-grid">
      {items?.map(item => <article key={item.id} className="premium-card equipment-card" aria-labelledby={`equipo-${item.id}`}>
        <header>
          <h3 id={`equipo-${item.id}`}>{item.name}</h3>
          {item.has_sensor && <span className="premium-chip"><Icon name="sensor"/> Con sensor</span>}
        </header>
        <p className="muted">{item.specialty} · {item.subcategory}</p>
        <p>{[item.brand, item.model, item.year].filter(Boolean).join(' · ') || 'Sin marca ni modelo'}</p>
        {item.address && <p className="muted">{item.address}</p>}
        <div className="premium-actions">
          <button type="button" className="button primary" onClick={() => navigate('new', {preset: {specialty_id: item.specialty_id, subcategory_id: item.subcategory_id}})}>
            Pedir servicio para este equipo</button>
          <button type="button" className="button outline" aria-expanded={detail?.id === item.id} onClick={() => open(item)}>Historial</button>
          <button type="button" className="button outline" onClick={() => setForm({...item, specialty_id: String(item.specialty_id), subcategory_id: String(item.subcategory_id),
            brand: item.brand || '', model: item.model || '', year: item.year ? String(item.year) : '', address_id: item.address_id ? String(item.address_id) : '', notes: item.notes || ''})}>
            Editar <span className="sr-only">{item.name}</span></button>
          <button type="button" className="button outline is-danger" onClick={() => setConfirm(item.id)}>Eliminar <span className="sr-only">{item.name}</span></button>
        </div>
        {confirm === item.id && <div className="premium-confirm" role="group" aria-label={`Confirmar eliminación de ${item.name}`}>
          <span>¿Eliminar «{item.name}»? Su sensor y sus lecturas también se borran.</span>
          <button type="button" className="button danger" onClick={() => remove(item)}>Sí, eliminar</button>
          <button type="button" className="button outline" onClick={() => setConfirm(null)}>No</button>
        </div>}
        {detail?.id === item.id && <div className="premium-history">
          <h4>Historial de servicios</h4>
          {detail.history.length ? <ul>{detail.history.map(h => <li key={h.id}>Solicitud #{h.id} · {h.subcategory} · {timeLabel(h.created_at)}</li>)}</ul>
            : <p className="muted">Este equipo todavía no tiene servicios.</p>}
        </div>}
      </article>)}
    </div>
  </Page>;
}

export function PromotionsPage() {
  const [items, setItems] = useState(null);
  useEffect(() => { load('/client/promotions').then(r => setItems(r.data.items)).catch(() => setItems([])); }, []);
  return <Page id="promociones" title="Promociones" icon="gift" accent="violet" intro="Ofertas de mantenimiento para tus equipos.">
    <p className="premium-sample">{SAMPLE_TAG}</p>
    {items?.length === 0 && <div className="premium-empty"><p>No hay promociones por ahora.</p></div>}
    <div className="premium-grid">
      {items?.map(p => <article key={p.id} className="premium-card"><span className="premium-sample">{SAMPLE_TAG}</span><h3>{p.title}</h3><p>{p.body}</p></article>)}
    </div>
  </Page>;
}

export function WarrantiesPage() {
  const [items, setItems] = useState(null);
  useEffect(() => { load('/client/warranties').then(r => setItems(r.data.items)).catch(() => setItems([])); }, []);
  return <Page id="garantias" title="Garantías" icon="verify" accent="green" intro="La garantía de cada servicio terminado, en un solo lugar.">
    <p className="premium-sample">{SAMPLE_TAG}</p>
    {items?.length === 0 && <div className="premium-empty"><p>Todavía no tienes servicios terminados con garantía.</p></div>}
    <div className="premium-grid">
      {items?.map(w => <article key={w.request_id} className="premium-card">
        <h3>Solicitud #{w.request_id} · {w.subcategory}</h3>
        <p>{w.days} días de garantía · {w.active ? `vigente hasta ${timeLabel(w.valid_until)}` : 'vencida'}</p>
        <button type="button" className="button outline" disabled aria-describedby={`garantia-${w.request_id}`}>Usar garantía</button>
        <small id={`garantia-${w.request_id}`} className="muted">Disponible en el Sprint 6.</small>
      </article>)}
    </div>
  </Page>;
}
