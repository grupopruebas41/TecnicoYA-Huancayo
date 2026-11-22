import React, {useCallback, useEffect, useId, useRef, useState} from 'react';
import {request} from '../administration/http';
import {Notice} from '../administration/forms';
import DismissBackdrop from '../../components/DismissBackdrop';
import Icon from '../panel/icons';
import {ClientPage, EmptyState, Illustration, LimitNotice, SampleTag, isLimitError, rise} from '../client/ui';
import {relativeTime, shortDate, shortDateTime} from '../../lib/format';
import './premium.css';

/**
 * Fase 6 del panel final (D-98 y D-99) y pulido final: «Mi hogar / Mi negocio» del cliente Premium. El sensor todavía no
 * existe: toda lectura es simulada y cada pantalla de sensores muestra la franja «Modo demostración: lecturas simuladas».
 * Estados siempre con color + ícono + texto; animaciones suaves que se apagan con «Reducir animaciones».
 */
export const STATUS = {
  normal: {label: 'Normal', icon: 'check', tone: 'is-success'},
  attention: {label: 'Atención', icon: 'alert', tone: 'is-warning'},
  failure: {label: 'Falla', icon: 'close', tone: 'is-danger'},
  // DEF-76: sin lecturas en las últimas 24 h no hay falla, hay «Sin datos».
  no_data: {label: 'Sin datos', icon: 'clock', tone: 'is-muted'},
};
export const SEVERITY = {info: 'Recordatorio', attention: 'Atención', failure: 'Falla'};
const SEVERITY_ORDER = {failure: 0, attention: 1, info: 2};
const METRIC_ICONS = {temperature: 'thermo', power: 'bolt', vibration: 'sensor', hours: 'clock'};
export {SAMPLE_TAG} from '../client/ui';
const load = path => Promise.resolve().then(() => request(path));
export const decimal = value => (value == null ? '—' : String(Math.round(Number(value) * 10) / 10).replace('.', ','));
/** «4 dic · 09:00» en hora de Lima. */
export const timeLabel = value => shortDateTime(value);

export function DemoStripe() {
  return <p className="premium-demo" role="note"><Icon name="sensor"/> Modo demostración: lecturas simuladas</p>;
}

export function StatusBadge({status}) {
  const meta = STATUS[status] || STATUS.no_data;
  return <span className={`cx-badge premium-status is-${status} ${meta.tone}`}><Icon name={meta.icon}/> {meta.label}</span>;
}

/** Gráfico de 24 h con área sombreada y la franja del rango normal; el resumen en texto lo describe (nunca solo el gráfico). */
export function Sparkline({readings, target, tolerance, unit, height = 72, label}) {
  const gradient = useId().replaceAll(':', '');
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
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--ty-accent)" stopOpacity="0.35"/><stop offset="1" stopColor="var(--ty-accent)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <rect className="premium-band" x="0" width="300" y={y(target + tolerance)} height={Math.max(1, y(target - tolerance) - y(target + tolerance))}/>
      {values.length > 1 && <polygon points={`0,${height} ${points} 300,${height}`} fill={`url(#${gradient})`}/>}
      {values.length > 1 && <polyline className="premium-line" points={points} fill="none"/>}
    </svg>
    <figcaption className="muted">{summary}</figcaption>
  </figure>;
}

/** Barra del rango con la zona normal en verde y la marca del valor actual (decorativa: el texto dice lo mismo). */
export function RangeGauge({value, target, tolerance}) {
  const low = target - 2.5 * tolerance;
  const high = target + 2.5 * tolerance;
  const at = value == null ? null : Math.min(100, Math.max(0, ((value - low) / (high - low)) * 100));
  return <div className="sensor-gauge" aria-hidden="true">
    <span className="sensor-gauge-normal" style={{left: '30%', width: '40%'}}/>
    {at != null && <span className="sensor-gauge-mark" style={{left: `${at}%`}}/>}
  </div>;
}

function SensorCard({device, index, onOpen}) {
  const noData = device.status === 'no_data';
  return <article className={`cx-card premium-card sensor-card is-${device.status} cx-rise`} style={rise(index)} aria-labelledby={`sensor-${device.id}`}>
    <header className="sensor-head">
      <span className="cx-dot" data-tone={device.metric === 'power' ? 'amber' : 'teal'} aria-hidden="true"><Icon name={METRIC_ICONS[device.metric] || 'sensor'}/></span>
      <div className="sensor-title">
        <h3 id={`sensor-${device.id}`}>{device.equipment.name}</h3>
        <p className="muted">{device.metric_label}</p>
      </div>
      <StatusBadge status={device.status}/>
    </header>
    {noData
      ? <p className="sensor-empty"><Icon name="clock"/> Sin lecturas en las últimas 24 h. Revisa que el sensor tenga batería y señal.</p>
      : <p className="sensor-value"><strong>{decimal(device.value)}</strong> <span>{device.unit}</span></p>}
    <RangeGauge value={device.value} target={device.target} tolerance={device.tolerance}/>
    <p className="muted sensor-range">Rango normal {device.threshold_label}</p>
    <Sparkline readings={device.readings} target={device.target} tolerance={device.tolerance} unit={device.unit} label={device.equipment.name}/>
    <ul className="sensor-meta">
      <li><Icon name="clock"/> {device.measured_at ? `Última lectura ${relativeTime(device.measured_at)}` : 'Sin lecturas recientes'}</li>
      <li><Icon name="battery"/> Batería {device.battery} %</li>
      <li className={device.online ? 'is-online' : 'is-offline'}><Icon name="sensor"/> {device.online ? 'En línea' : 'Sin señal'}</li>
    </ul>
    <button type="button" className="button outline sensor-detail" onClick={() => onOpen(device)}>Ver detalle<span className="sr-only"> de {device.equipment.name}</span></button>
  </article>;
}

export function SensorsPage({navigate, refreshMs = 30000}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);
  const refresh = useCallback(() => load('/client/iot/devices').then(r => { setData(r.data); setError(''); })
    .catch(e => setError(e.message || 'No pudimos leer los sensores.')), []);
  useEffect(() => { refresh(); const timer = setInterval(refresh, refreshMs); return () => clearInterval(timer); }, [refresh, refreshMs]);
  const items = data?.items || [];
  return <ClientPage id="sensores" title="Sensores IoT" icon="sensor" tone="teal"
    intro="El estado de tus equipos en un vistazo. Se actualiza cada 30 segundos."
    actions={<button type="button" className="button outline" onClick={refresh}>Actualizar</button>}>
    <DemoStripe/>
    <Notice error={error}/>
    {data && !items.length && <EmptyState icon="sensor" tone="teal" title="Ningún equipo tiene sensor todavía"
      text="Cuando un equipo tenga sensor, verás aquí su lectura y su estado.">
      <button type="button" className="button primary" onClick={() => navigate('equipment')}>Ver mis equipos</button>
    </EmptyState>}
    <div className="cx-grid">
      {items.map((device, index) => <SensorCard key={device.id} device={device} index={index} onOpen={setOpen}/>)}
    </div>
    {open && <SensorDetail device={open} onClose={() => setOpen(null)}/>}
  </ClientPage>;
}

function SensorDetail({device, onClose}) {
  const close = useRef(null);
  const opener = useRef(document.activeElement);
  useEffect(() => { close.current?.focus(); const back = opener.current; return () => back?.focus?.(); }, []);
  // Cierre S4-S5 (Sonar S6847/S6848): el fondo es un botón nativo (DismissBackdrop) y el diálogo es <dialog> nativo.
  return <div className="cx-overlay">
    <DismissBackdrop onClose={onClose}/>
    <dialog open className="cx-dialog premium-dialog" aria-modal="true" aria-labelledby="sensor-detalle"
      onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } }}>
      <header className="cx-dialog-head">
        <h2 id="sensor-detalle">{device.equipment.name}</h2>
        <button ref={close} type="button" className="cx-icon-button" aria-label="Cerrar detalle" onClick={onClose}><Icon name="close"/></button>
      </header>
      <DemoStripe/>
      <div className="cx-badges"><StatusBadge status={device.status}/></div>
      {device.value != null && <p className="sensor-value"><strong>{decimal(device.value)}</strong> <span>{device.unit}</span></p>}
      <RangeGauge value={device.value} target={device.target} tolerance={device.tolerance}/>
      <Sparkline readings={device.readings} target={device.target} tolerance={device.tolerance} unit={device.unit} height={180} label={device.equipment.name}/>
      <p className="muted">{device.name} · {device.metric_label} · rango normal {device.threshold_label}</p>
    </dialog>
  </div>;
}

const alertIcon = alert => (alert.kind === 'maintenance' ? 'wrench' : METRIC_ICONS[alert.metric] || 'alert');
const bySeverity = (a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3) || Date.parse(b.started_at) - Date.parse(a.started_at);

function AlertRow({alert, index, busy, onSend, navigate}) {
  const resolved = Boolean(alert.resolved_at);
  return <li className={`premium-alert is-${alert.severity}` + (resolved ? ' is-resolved' : '') + ' cx-rise'} style={rise(index)}>
    <span className="premium-alert-icon" aria-hidden="true"><Icon name={alertIcon(alert)}/></span>
    <div className="premium-alert-body">
      <p className="premium-alert-title">
        <span className={`cx-badge premium-severity ${STATUS[alert.severity]?.tone || 'is-info'}`}>
          <Icon name={alert.severity === 'info' ? 'wrench' : STATUS[alert.severity]?.icon || 'alert'}/> {SEVERITY[alert.severity]}</span>{' '}
        <span>{alert.equipment.name}</span>
      </p>
      {alert.value != null && alert.range
        ? <p className="alert-reading"><strong className="alert-value">{decimal(alert.value)} {alert.unit}</strong> fuera del rango normal {decimal(alert.range.min)} a {decimal(alert.range.max)} {alert.unit}</p>
        : <p>{alert.message}</p>}
      <p className="muted alert-when"><Icon name="clock"/> <time dateTime={alert.started_at}>{timeLabel(alert.started_at)}</time> · {relativeTime(alert.started_at)}
        {resolved ? <> · Atendida el {timeLabel(alert.resolved_at)}</> : ' · Activa'}</p>
    </div>
    {alert.request_id
      ? <button type="button" className="button outline" onClick={() => navigate('requests', {open: alert.request_id})}>Ver solicitud #{alert.request_id}</button>
      : !resolved && <button type="button" className="button primary" disabled={busy === alert.id} onClick={() => onSend(alert)}>Enviar a mi técnico de confianza</button>}
  </li>;
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
    } catch (e) { setNotice(isLimitError(e) ? {limit: true} : {error: e.message}); } finally { setBusy(null); }
  }
  const items = data?.items || [];
  const groups = [['activas', 'Activas', items.filter(a => !a.resolved_at).sort(bySeverity)],
    ['atendidas', 'Atendidas', items.filter(a => a.resolved_at).sort(bySeverity)]];
  return <ClientPage id="alertas" title="Alertas" icon="alert" tone="orange"
    intro="Avisos de tus sensores y recordatorios de mantenimiento. También llegan a la campana.">
    <DemoStripe/>
    <Notice error={notice.error} success={notice.success}/>
    {notice.limit && <LimitNotice onList={() => navigate('requests')}/>}
    {data && !items.length && <EmptyState icon="check" tone="green" title="No hay alertas" text="Tus equipos están bien. Te avisaremos si una lectura sale de lo normal."/>}
    {groups.map(([id, title, rows]) => rows.length > 0 && <section key={id} className="alert-group" aria-labelledby={`alertas-${id}`}>
      <h3 id={`alertas-${id}`} className="alert-group-title">{title} <span className="cx-badge is-muted">{rows.length}</span></h3>
      <ul className="premium-list">
        {rows.map((alert, index) => <AlertRow key={alert.id} alert={alert} index={index} busy={busy} onSend={send} navigate={navigate}/>)}
      </ul>
    </section>)}
  </ClientPage>;
}

// Imagen por tipo de equipo (las genera el equipo en public/img/equipos/). Si falta, una ilustración propia, nunca una rota.
const EQUIPMENT_IMAGES = {
  'frio-domestico': 'refrigeradora', 'frio-vitrinas': 'vitrina-bebidas', 'frio-camaras': 'camara-frio', 'frio-congeladores': 'congeladora',
  'frio-hielo': 'congeladora', 'computo-impresoras': 'impresora', 'computo-redes': 'router-redes', 'computo-cctv': 'router-redes',
  'electricidad-tableros': 'tablero-electrico', 'electricidad-medidores': 'tablero-electrico', 'electricidad-comercial': 'tablero-electrico',
  'electricidad-residencial': 'tablero-electrico', 'electricidad-tierra': 'tablero-electrico', 'electricidad-iluminacion': 'iluminacion',
};
const EQUIPMENT_ICONS = {computo: 'monitor', frio: 'snow', electricidad: 'bolt'};
const EQUIPMENT_TONES = {computo: 'computo', frio: 'refrigeracion', electricidad: 'electricidad'};

/** Archivo de imagen del equipo según su subcategoría (y «laptop» por el nombre en cómputo). */
export function equipmentImage(item) {
  const code = item.subcategory_code || '';
  if (EQUIPMENT_IMAGES[code]) return EQUIPMENT_IMAGES[code];
  if (code.startsWith('computo-')) return /laptop|port[aá]til/i.test(item.name || '') ? 'laptop' : 'computadora-escritorio';
  return 'equipo-generico';
}

function EquipmentImage({item}) {
  const [failed, setFailed] = useState(false);
  const family = (item.subcategory_code || '').split('-')[0];
  const source = item.photo_url || `/img/equipos/${equipmentImage(item)}.webp`;
  return <div className="equipment-media" data-tone={EQUIPMENT_TONES[family] || 'slate'}>
    {failed
      ? <Illustration icon={EQUIPMENT_ICONS[family] || 'monitor'} tone={EQUIPMENT_TONES[family] || 'slate'} className="equipment-art" cover/>
      : <img src={source} alt={item.photo_url ? `Foto de ${item.name}` : `Imagen referencial de ${item.subcategory || 'equipo'}`}
        loading="lazy" onError={() => setFailed(true)}/>}
    <div className="equipment-overlay">
      {item.has_sensor && <span className="cx-badge is-info"><Icon name="sensor"/> Con sensor</span>}
      {item.has_sensor && item.sensor_status && <StatusBadge status={item.sensor_status}/>}
    </div>
  </div>;
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
      setErrors(Object.fromEntries(Object.entries(e.fields || {}).map(([k, v]) => [k, [v].flat()[0]])));
      setError(e.message);
    } finally { setBusy(false); }
  }
  return <form className="cx-card premium-form" noValidate onSubmit={submit} aria-label={initial?.id ? 'Editar equipo' : 'Nuevo equipo'}>
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

const editable = item => ({...item, specialty_id: String(item.specialty_id), subcategory_id: String(item.subcategory_id), brand: item.brand || '',
  model: item.model || '', year: item.year ? String(item.year) : '', address_id: item.address_id ? String(item.address_id) : '', notes: item.notes || ''});

function EquipmentCard({item, index, detail, confirming, onRequest, onHistory, onEdit, onAskDelete, onDelete, onCancelDelete}) {
  return <article className="cx-card equipment-card cx-rise" style={rise(index)} aria-labelledby={`equipo-${item.id}`}>
    <EquipmentImage item={item}/>
    <div className="equipment-body">
      <h3 id={`equipo-${item.id}`}>{item.name}</h3>
      <p className="muted equipment-kind">{item.specialty} · {item.subcategory}</p>
      <p className="equipment-model">{[item.brand, item.model, item.year].filter(Boolean).join(' · ') || 'Sin marca ni modelo'}</p>
      {item.address && <p className="equipment-line"><Icon name="pin"/> {item.address}</p>}
      <p className="equipment-line"><Icon name="wrench"/> {item.last_service_at ? `Último servicio: ${shortDate(item.last_service_at)}` : 'Sin servicios todavía'}</p>
    </div>
    <div className="equipment-actions">
      <button type="button" className="button primary" onClick={onRequest}>Pedir servicio<span className="sr-only"> para este equipo</span></button>
      <button type="button" className="cx-icon-button" data-tip="Historial" aria-label={`Historial de ${item.name}`} aria-expanded={detail?.id === item.id} onClick={onHistory}><Icon name="clock"/></button>
      <button type="button" className="cx-icon-button" data-tip="Editar" aria-label={`Editar ${item.name}`} onClick={onEdit}><Icon name="edit"/></button>
      <button type="button" className="cx-icon-button is-danger" data-tip="Eliminar" aria-label={`Eliminar ${item.name}`} onClick={onAskDelete}><Icon name="trash"/></button>
    </div>
    {confirming && <div className="premium-confirm" role="group" aria-label={`Confirmar eliminación de ${item.name}`}>
      <span>¿Eliminar «{item.name}»? Su sensor y sus lecturas también se borran.</span>
      <button type="button" className="button danger" onClick={onDelete}>Sí, eliminar</button>
      <button type="button" className="button outline" onClick={onCancelDelete}>No</button>
    </div>}
    {detail?.id === item.id && <div className="premium-history">
      <h4>Historial de servicios</h4>
      {detail.history.length ? <ul>{detail.history.map(h => <li key={h.id}>Solicitud #{h.id} · {h.subcategory} · {timeLabel(h.created_at)}</li>)}</ul>
        : <p className="muted">Este equipo todavía no tiene servicios.</p>}
    </div>}
  </article>;
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
  return <ClientPage id="equipos" title="Mis equipos" icon="monitor" tone="blue" intro="Tus equipos, su ubicación y su historial de servicios."
    actions={!form && <button type="button" className="button primary" onClick={() => setForm({})}>Agregar equipo</button>}>
    <Notice error={notice.error} success={notice.success}/>
    {form && <EquipmentForm initial={form} onCancel={() => setForm(null)} onSaved={message => { setForm(null); setNotice({success: message}); refresh(); }}/>}
    {items?.length === 0 && !form && <EmptyState icon="monitor" tone="blue" title="Aún no registras equipos"
      text="Registra tu refrigeradora, vitrina o computadora para pedir servicio más rápido y ver su historial.">
      <button type="button" className="button primary" onClick={() => setForm({})}>Agregar mi primer equipo</button>
    </EmptyState>}
    <div className="cx-grid">
      {items?.map((item, index) => <EquipmentCard key={item.id} item={item} index={index} detail={detail} confirming={confirm === item.id}
        onRequest={() => navigate('new', {preset: {specialty_id: item.specialty_id, subcategory_id: item.subcategory_id}})}
        onHistory={() => open(item)} onEdit={() => setForm(editable(item))} onAskDelete={() => setConfirm(item.id)}
        onDelete={() => remove(item)} onCancelDelete={() => setConfirm(null)}/>)}
    </div>
  </ClientPage>;
}

const PROMO_TONES = [[/refrigera|fr[ií]o|congela|vitrina/i, 'refrigeracion', 'Refrigeración comercial', 'snow'],
  [/c[oó]mputo|computadora|laptop|impresora|red/i, 'computo', 'Cómputo', 'monitor'], [/electric|tablero|luz/i, 'electricidad', 'Electricidad', 'bolt']];
/** Especialidad de una promoción según su texto (las promociones de ejemplo no la guardan aparte). */
export function promotionSpecialty(promotion) {
  const text = `${promotion.title} ${promotion.body || ''}`;
  const found = PROMO_TONES.find(([pattern]) => pattern.test(text));
  return found ? {tone: found[1], name: found[2], icon: found[3]} : {tone: 'violet', name: 'Todas las especialidades', icon: 'gift'};
}
const benefitOf = promotion => promotion.title.match(/(\d{1,2})\s?%/)?.[1];

export function PromotionsPage() {
  const [items, setItems] = useState(null);
  useEffect(() => { load('/client/promotions').then(r => setItems(r.data.items)).catch(() => setItems([])); }, []);
  return <ClientPage id="promociones" title="Promociones" icon="gift" tone="violet" intro="Ofertas de mantenimiento para tus equipos.">
    <SampleTag/>
    {items?.length === 0 && <EmptyState icon="gift" tone="violet" title="No hay promociones por ahora" text="Cuando el equipo publique una oferta para tus equipos, la verás aquí."/>}
    <div className="cx-grid is-wide">
      {items?.map((p, index) => {
        const specialty = promotionSpecialty(p);
        const percent = benefitOf(p);
        return <article key={p.id} className="cx-card coupon cx-rise" style={rise(index)} aria-labelledby={`promo-${p.id}`}>
          <div className="coupon-art" data-tone={specialty.tone}>
            <Illustration icon={specialty.icon} tone={specialty.tone} className="coupon-illustration"/>
            <span className="coupon-benefit">{percent ? `−${percent} %` : 'Beneficio'}</span>
          </div>
          <div className="coupon-body">
            <div className="cx-badges">
              <span className="cx-badge" data-tone={specialty.tone}><Icon name={specialty.icon}/> {specialty.name}</span>
              {p.ends_at && <span className="cx-badge is-muted"><Icon name="calendar"/> Hasta el {shortDate(p.ends_at)}</span>}
            </div>
            <h3 id={`promo-${p.id}`}>{p.title}</h3>
            {p.body && <p>{p.body}</p>}
            <p className="coupon-terms">Condiciones: promoción de demostración, sin valor comercial. Aplica a clientes Premium en Huancayo y sujeta a la disponibilidad del técnico.</p>
            <button type="button" className="button primary" disabled aria-describedby={`promo-${p.id}-nota`}>Usar promoción</button>
            <small id={`promo-${p.id}-nota`} className="muted">Disponible próximamente</small>
          </div>
        </article>;
      })}
    </div>
  </ClientPage>;
}

function WarrantyCard({w, index}) {
  const used = w.days - w.days_left;
  return <article className="cx-card warranty-card cx-rise" style={rise(index)} aria-labelledby={`garantia-titulo-${w.request_id}`}>
    <header className="warranty-head">
      <span className="cx-dot" data-tone="green" aria-hidden="true"><Icon name="verify"/></span>
      <div>
        <h3 id={`garantia-titulo-${w.request_id}`}>{w.subcategory}</h3>
        <p className="muted">Solicitud #{w.request_id}{w.technician ? ` · ${w.technician}` : ''}</p>
      </div>
      <span className="cx-badge is-success"><Icon name="check"/> Vigente</span>
    </header>
    <div className="warranty-progress">
      <p><strong>Quedan {w.days_left} de {w.days} días</strong></p>
      <div className="warranty-bar" role="progressbar" aria-label={`Garantía de la solicitud #${w.request_id}`} aria-valuemin={0}
        aria-valuemax={w.days} aria-valuenow={w.days_left} aria-valuetext={`Quedan ${w.days_left} de ${w.days} días`}>
        <span style={{width: `${Math.max(4, (w.days_left / w.days) * 100)}%`}}/>
      </div>
      <p className="muted">Servicio terminado el {shortDate(w.closed_at)} · vence el {shortDate(w.valid_until)} ({used} días usados)</p>
    </div>
    <button type="button" className="button outline" disabled aria-describedby={`garantia-${w.request_id}`}>Usar garantía</button>
    <small id={`garantia-${w.request_id}`} className="muted">Disponible en el Sprint 6.</small>
  </article>;
}

export function WarrantiesPage() {
  const [items, setItems] = useState(null);
  const [tab, setTab] = useState('active');
  useEffect(() => { load('/client/warranties').then(r => setItems(r.data.items)).catch(() => setItems([])); }, []);
  const active = (items || []).filter(w => w.active);
  const expired = (items || []).filter(w => !w.active);
  const tabs = [['active', 'Vigentes', active.length], ['expired', 'Vencidas', expired.length]];
  return <ClientPage id="garantias" title="Garantías" icon="verify" tone="green" intro="La garantía de cada servicio terminado, en un solo lugar.">
    <SampleTag/>
    {items?.length === 0 && <EmptyState icon="verify" tone="green" title="Todavía no tienes servicios terminados con garantía"
      text="Cuando un técnico termine un servicio, aquí verás sus 30 días de garantía."/>}
    {items?.length > 0 && <>
      <div className="cx-tabs" role="tablist" aria-label="Estado de las garantías">
        {tabs.map(([key, label, count]) => <button key={key} type="button" role="tab" id={`garantias-${key}`} aria-selected={tab === key}
          aria-controls="garantias-panel" tabIndex={tab === key ? 0 : -1} onClick={() => setTab(key)}
          onKeyDown={event => { if (['ArrowLeft', 'ArrowRight'].includes(event.key)) { const next = key === 'active' ? 'expired' : 'active'; setTab(next); document.getElementById(`garantias-${next}`)?.focus(); } }}>
          {label} ({count})</button>)}
      </div>
      <div id="garantias-panel" role="tabpanel" aria-labelledby={`garantias-${tab}`}>
        {tab === 'active' && (active.length
          ? <div className="cx-grid">{active.map((w, index) => <WarrantyCard key={w.request_id} w={w} index={index}/>)}</div>
          : <EmptyState icon="clock" tone="slate" title="No tienes garantías vigentes" text="Las garantías duran 30 días desde que termina el servicio."/>)}
        {tab === 'expired' && <ul className="warranty-expired">
          {expired.map(w => <li key={w.request_id}>
            <Icon name="clock"/>
            <span><strong>{w.subcategory}</strong> · Solicitud #{w.request_id}{w.technician ? ` · ${w.technician}` : ''}</span>
            <span className="cx-badge is-muted">Vencida el {shortDate(w.valid_until)}</span>
          </li>)}
        </ul>}
      </div>
    </>}
  </ClientPage>;
}
