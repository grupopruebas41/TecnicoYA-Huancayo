import React, {useEffect, useRef, useState} from 'react';
import {request} from '../administration/http';
import {Notice} from '../administration/forms';
import {useResource} from '../administration/Sprint02Common';
import ProfilePage from './ProfilePage';
import {AccessibilityControls} from './quickAccessibility';
import Icon from './icons';

export const ACCOUNT_TABS = [
  ['cuenta', 'Mi cuenta'], ['direcciones', 'Mis direcciones'], ['accesibilidad', 'Accesibilidad'],
  ['comunicacion', 'Comunicación'], ['apariencia', 'Apariencia'],
];
const KINDS = [['home', 'Casa'], ['business', 'Negocio'], ['other', 'Otra']];
const EMPTY = {kind: 'home', label: '', district_id: '', address: '', reference: '', is_default: false};

/** Valida una dirección como el servidor (Fase 4): tipo, nombre si es «Otra», distrito y dirección de 5 a 255. */
export function addressErrors(value) {
  const errors = {};
  if (!KINDS.some(([kind]) => kind === value.kind)) errors.kind = 'Elige el tipo de dirección: Casa, Negocio u Otra.';
  if (value.kind === 'other' && !value.label.trim()) errors.label = 'Ponle un nombre a la dirección (hasta 40 caracteres).';
  if (value.label.length > 40) errors.label = 'Ponle un nombre a la dirección (hasta 40 caracteres).';
  if (!value.district_id) errors.district_id = 'Elige un distrito.';
  const size = value.address.trim().length;
  if (size < 5 || size > 255) errors.address = 'La dirección debe tener de 5 a 255 caracteres.';
  if (value.reference.length > 255) errors.reference = 'La referencia admite hasta 255 caracteres.';
  return errors;
}

function Field({id, label, error, children}) {
  return <div className="form-field">
    <label htmlFor={id}>{label}</label>
    {React.cloneElement(children, {id, 'aria-invalid': !!error, 'aria-describedby': error ? `${id}-error` : undefined})}
    {error && <span className="field-error" id={`${id}-error`}>{error}</span>}
  </div>;
}

function AddressesTab() {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState({});
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const districts = useResource('/catalog/districts');
  const load = () => Promise.resolve().then(() => request('/client/addresses')).then(r => setItems(r.data.items)).catch(e => { setItems([]); setNotice({error: e.message}); });
  useEffect(() => { load(); }, []);
  const set = (name, value) => setForm(current => ({...current, [name]: value}));
  async function save(event) {
    event.preventDefault();
    const found = addressErrors(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true); setNotice({});
    const body = {kind: form.kind, label: form.label.trim() || null, district_id: Number(form.district_id), address: form.address.trim(),
      reference: form.reference.trim() || null, is_default: form.is_default};
    try {
      if (form.id) await request('/client/addresses/' + form.id, {...body, expected_version: form.version}, 'PATCH');
      else await request('/client/addresses', body);
      setNotice({success: form.id ? 'Dirección actualizada.' : 'Dirección guardada.'});
      setForm(null); await load();
    } catch (error) {
      setErrors(Object.fromEntries(Object.entries(error.fields || {}).map(([key, value]) => [key, [].concat(value)[0]])));
      setNotice({error: error.message});
    } finally { setBusy(false); }
  }
  async function remove(address) {
    setBusy(true); setNotice({});
    try { await request('/client/addresses/' + address.id, undefined, 'DELETE'); setNotice({success: `Eliminaste «${address.label}».`}); await load(); }
    catch (error) { setNotice({error: error.message}); }
    finally { setBusy(false); setConfirm(null); }
  }
  return <div className="account-addresses">
    <Notice error={notice.error} success={notice.success}/>
    {items === null && <p className="muted">Cargando tus direcciones…</p>}
    {items?.length === 0 && !form && <p className="muted">Aún no guardas direcciones. Agrega Casa o Negocio para elegirlas rápido al pedir.</p>}
    <ul className="account-address-list">
      {items?.map(address => <li key={address.id} className="account-address">
        <span className="account-address-icon" aria-hidden="true"><Icon name={address.kind === 'business' ? 'catalog' : 'home'}/></span>
        <div>
          <strong>{address.label}</strong>{address.is_default && <span className="client-chip">Predeterminada</span>}
          <p className="muted">{address.address} · {address.district_name}{address.reference ? ` · ${address.reference}` : ''}</p>
        </div>
        {confirm === address.id
          ? <div className="account-confirm" role="group" aria-label={`Confirmar eliminación de ${address.label}`}>
            <span>¿Eliminar «{address.label}»?</span>
            <button type="button" className="button danger" disabled={busy} onClick={() => remove(address)}>Sí, eliminar</button>
            <button type="button" className="button outline" onClick={() => setConfirm(null)}>No</button>
          </div>
          : <div className="account-address-actions">
            <button type="button" className="button outline" onClick={() => { setErrors({}); setForm({...EMPTY, ...address, reference: address.reference || '', district_id: String(address.district_id)}); }}>
              Editar <span className="sr-only">{address.label}</span></button>
            <button type="button" className="button outline" onClick={() => setConfirm(address.id)}>
              Eliminar <span className="sr-only">{address.label}</span></button>
          </div>}
      </li>)}
    </ul>
    {!form && items && items.length < 5 && <button type="button" className="button primary" onClick={() => { setErrors({}); setForm({...EMPTY}); }}>
      Agregar dirección</button>}
    {!form && items?.length >= 5 && <p className="muted">Llegaste al máximo de 5 direcciones.</p>}
    {form && <form className="account-address-form" noValidate onSubmit={save} aria-label={form.id ? 'Editar dirección' : 'Nueva dirección'}>
      <fieldset className="account-kinds">
        <legend>Tipo</legend>
        {KINDS.map(([kind, label]) => <label key={kind} className={'account-kind' + (form.kind === kind ? ' is-checked' : '')}>
          <input type="radio" name="kind" value={kind} checked={form.kind === kind} onChange={() => set('kind', kind)}/> <span>{label}</span>
        </label>)}
      </fieldset>
      {errors.kind && <span className="field-error">{errors.kind}</span>}
      {form.kind === 'other' && <Field id="address-label" label="Nombre de la dirección" error={errors.label}>
        <input value={form.label} maxLength={40} onChange={e => set('label', e.target.value)}/></Field>}
      <Field id="address-district" label="Distrito" error={errors.district_id}>
        <select value={form.district_id} onChange={e => set('district_id', e.target.value)}>
          <option value="">Selecciona</option>
          {districts.data?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </Field>
      <Field id="address-text" label="Dirección" error={errors.address}>
        <input value={form.address} autoComplete="street-address" onChange={e => set('address', e.target.value)}/></Field>
      <Field id="address-reference" label="Referencia (opcional)" error={errors.reference}>
        <input value={form.reference} onChange={e => set('reference', e.target.value)}/></Field>
      <label className="a11y-switch"><input type="checkbox" checked={form.is_default} onChange={e => set('is_default', e.target.checked)}/>
        <span>Usar como predeterminada</span></label>
      <div className="account-form-actions">
        <button type="submit" className="button primary" disabled={busy}>Guardar dirección</button>
        <button type="button" className="button outline" onClick={() => setForm(null)}>Cancelar</button>
      </div>
    </form>}
  </div>;
}

function CommunicationTab() {
  const [prefs, setPrefs] = useState(null);
  const [notice, setNotice] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { Promise.resolve().then(() => request('/client/me/communication')).then(r => setPrefs(r.data)).catch(e => setNotice({error: e.message})); }, []);
  async function save(event) {
    event.preventDefault();
    setBusy(true); setNotice({});
    try { const r = await request('/client/me/communication', prefs, 'PUT'); setPrefs(r.data); setNotice({success: 'Preferencias de comunicación guardadas.'}); }
    catch (error) { setNotice({error: error.message}); }
    finally { setBusy(false); }
  }
  if (!prefs) return <Notice error={notice.error}/>;
  return <form className="account-communication" onSubmit={save} noValidate>
    <fieldset>
      <legend>¿Cómo prefieres que te contacte el técnico?</legend>
      {[['app', 'Por mensajes en la app'], ['call', 'Por llamada'], ['whatsapp', 'Por WhatsApp']].map(([value, label]) =>
        <label key={value} className="account-kind"><input type="radio" name="contact_channel" value={value}
          checked={prefs.contact_channel === value} onChange={() => setPrefs({...prefs, contact_channel: value})}/> <span>{label}</span></label>)}
    </fieldset>
    <label className="a11y-switch"><input type="checkbox" checked={prefs.prefer_messages}
      onChange={e => setPrefs({...prefs, prefer_messages: e.target.checked})}/><span>Prefiero mensajes antes que llamadas</span></label>
    <label className="a11y-switch"><input type="checkbox" checked={prefs.notify_before_arrival}
      onChange={e => setPrefs({...prefs, notify_before_arrival: e.target.checked})}/><span>Avisar antes de llegar</span></label>
    <p className="muted">El técnico verá estas preferencias cuando atienda tu solicitud. No pedimos datos de salud.</p>
    <Notice error={notice.error} success={notice.success}/>
    <button type="submit" className="button primary" disabled={busy}>Guardar preferencias</button>
  </form>;
}

// Rediseño de «Tu cuenta»: cada pestaña con su ícono, su color de acento y una descripción breve.
export const TAB_META = {
  cuenta: {icon: 'profile', accent: 'blue', description: 'Tu foto, nombres, teléfono y contraseña.'},
  direcciones: {icon: 'home', accent: 'green', description: 'Casa, negocio u otras direcciones para pedir más rápido.'},
  accesibilidad: {icon: 'a11y', accent: 'violet', description: 'Tamaño de texto, contraste, lectura y movimiento. Se guardan en tu cuenta.'},
  comunicacion: {icon: 'chat', accent: 'orange', description: 'Cómo prefieres que te contacte el técnico.'},
  apariencia: {icon: 'theme', accent: 'teal', description: 'Elige el tema claro u oscuro del panel.'},
};

const initialsOf = user => {
  const parts = user.given_names ? [user.given_names, user.family_names] : (user.name || '').split(/\s+/);
  return parts.filter(Boolean).slice(0, 2).map(part => Array.from(part.trim())[0] || '').join('').toUpperCase() || '·';
};

function TabIntro({id, label}) {
  const meta = TAB_META[id];
  return <div className="account-intro" data-accent={meta.accent}>
    <span className="account-intro-icon" aria-hidden="true"><Icon name={meta.icon}/></span>
    <div><h3>{label}</h3><p className="muted">{meta.description}</p></div>
  </div>;
}

/** Apariencia: dos tarjetas grandes con una miniatura del panel en cada tema (radiogroup con flechas). */
function ThemeCards({theme, onTheme}) {
  const options = [['light', 'Claro', 'Fondo claro y texto oscuro.'], ['dark', 'Oscuro', 'Fondo oscuro, cómodo de noche.']];
  function keys(event) {
    if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) { event.preventDefault(); onTheme(); }
  }
  return <div className="theme-cards" role="radiogroup" aria-label="Tema" onKeyDown={keys}>
    {options.map(([value, label, text]) => <button key={value} type="button" role="radio" aria-checked={theme === value}
      tabIndex={theme === value ? 0 : -1} className="theme-card" data-preview={value} onClick={() => { if (theme !== value) onTheme(); }}>
      <span className="theme-mini" aria-hidden="true"><span className="theme-mini-side"/><span className="theme-mini-main">
        <span/><span/><span/></span></span>
      <span className="theme-card-text"><strong>{label}</strong><small>{text}</small></span>
      <span className="theme-card-check" aria-hidden="true">{theme === value && <Icon name="check"/>}</span>
    </button>)}
  </div>;
}

/**
 * Panel «Tu cuenta» (Fase 4; rediseño a pedido de Pimentel el 2026-11-10): diálogo centrado de hasta 880 px con el fondo
 * oscurecido y desenfocado (pantalla completa en el celular). Encabezado con avatar, nombre, correo y plan; columna de
 * pestañas con ícono y acento (cuadrícula de 2 columnas en el celular); contenido en tarjetas. Atrapa el foco, Esc cierra
 * y devuelve el foco al avatar, las flechas cambian de pestaña. Las animaciones se apagan con «Reducir animaciones».
 */
export default function AccountPanel({user, onUpdate, onExpired, onClose, onLogout, busy, theme, onTheme, a11y, reader, returnFocus}) {
  const [tab, setTab] = useState('cuenta');
  const root = useRef(null);
  const tabs = useRef({});
  const index = ACCOUNT_TABS.findIndex(([id]) => id === tab);
  const label = ACCOUNT_TABS[index][1];
  const plan = user.client_profile?.plan === 'premium' ? 'Premium' : 'Free';
  useEffect(() => {
    tabs.current.cuenta?.focus();
    return () => returnFocus?.focus?.();
  }, [returnFocus]);
  function keys(event) {
    if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...root.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]')]
      .filter(el => el.tabIndex !== -1);
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  function arrows(event) {
    const step = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1}[event.key];
    if (!step) return;
    event.preventDefault();
    const next = ACCOUNT_TABS[(index + step + ACCOUNT_TABS.length) % ACCOUNT_TABS.length][0];
    setTab(next); tabs.current[next]?.focus();
  }
  return <div className="account-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <dialog open ref={root} className="account-panel" aria-modal="true" aria-labelledby="account-title" onKeyDown={keys}>
      <header className="account-head">
        <span className="account-avatar" aria-hidden="true">
          {user.avatar_url ? <img src={user.avatar_url} alt=""/> : initialsOf(user)}
        </span>
        <div className="account-identity">
          <h2 id="account-title">Tu cuenta</h2>
          <p className="account-name">{user.name}</p>
          {user.email && <p className="muted account-email">{user.email}</p>}
        </div>
        <span className={'account-plan' + (plan === 'Premium' ? ' is-premium' : '')}>Plan {plan}</span>
        <button type="button" className="panel-icon-button account-close" aria-label="Cerrar panel de la cuenta" onClick={onClose}><Icon name="close"/></button>
      </header>
      <div className="account-layout">
        <div className="account-tabs" role="tablist" aria-label="Secciones de la cuenta" aria-orientation="vertical" onKeyDown={arrows}
          style={{'--tab-index': index}}>
          <span className="account-tab-indicator" aria-hidden="true"/>
          {ACCOUNT_TABS.map(([id, text]) => <button key={id} ref={el => { tabs.current[id] = el; }} type="button" role="tab"
            id={`account-tab-${id}`} aria-selected={tab === id} aria-controls={`account-panel-${id}`} tabIndex={tab === id ? 0 : -1}
            data-accent={TAB_META[id].accent} onClick={() => setTab(id)}>
            <span className="account-tab-icon" aria-hidden="true"><Icon name={TAB_META[id].icon}/></span>{text}
          </button>)}
        </div>
        <div className="account-body panel-content" role="tabpanel" id={`account-panel-${tab}`} aria-labelledby={`account-tab-${tab}`}>
          <div className="account-pane" key={tab}>
            <TabIntro id={tab} label={label}/>
            {tab === 'cuenta' && <ProfilePage user={user} onUpdate={onUpdate} onExpired={onExpired}/>}
            {tab === 'direcciones' && <AddressesTab/>}
            {tab === 'accesibilidad' && <>
              <section className="account-card"><AccessibilityControls prefs={a11y[0]} onChange={a11y[1]} reader={reader} full/></section>
              <div className="a11y-preview account-card" aria-label="Vista previa">
                <p className="kicker">Vista previa</p>
                <p><strong>Tu técnico llega hoy entre las 3 y las 5 p. m.</strong></p>
                <p>Así se verán los textos del panel con los ajustes que elijas.</p>
              </div>
            </>}
            {tab === 'comunicacion' && <CommunicationTab/>}
            {tab === 'apariencia' && <ThemeCards theme={theme} onTheme={onTheme}/>}
          </div>
        </div>
      </div>
      <footer className="account-foot panel-content">
        <button type="button" className="button account-logout" data-cy="logout" disabled={busy} onClick={onLogout}>
          <Icon name="logout"/><span>Cerrar sesión</span></button>
      </footer>
    </dialog>
  </div>;
}
