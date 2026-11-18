import React, {useEffect, useMemo, useState} from 'react';
import {request} from '../administration/http';
import Icon from '../panel/icons';
import {DAYS, FRANJAS, hasCustomSlots, legibleRange, matrixFrom, scheduleSummary, slotsFrom} from './format';
import './technician.css';

const STATUS = {assigned: 'Asignado', in_progress: 'En curso', completed: 'Completado'};
const MAX_DISTRICTS = 20;

/** Perfil propio y distritos activos para editar la disponibilidad (PUT /technicians/me/availability). */
function useAvailability(onSaved) {
  const [profile, setProfile] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [matrix, setMatrix] = useState(null);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState({});
  const [busy, setBusy] = useState(false);
  async function load() {
    try {
      const [me, catalog] = await Promise.all([request('/technicians/me/profile'), request('/catalog/districts')]);
      const availability = me?.data?.availability || {};
      setProfile(me?.data || null);
      setDistricts(Array.isArray(catalog?.data) ? catalog.data : []);
      setMatrix(matrixFrom(availability.slots || []));
      setSelected((availability.district_ids || []).map(Number));
      setError('');
    } catch (failure) { setError(failure?.message || 'No pudimos cargar tu disponibilidad.'); }
  }
  useEffect(() => { load(); }, []);
  function toggle(day, franja) {
    setNotice({});
    setMatrix(current => ({...current, [day]: {...current[day], [franja]: !current[day][franja]}}));
  }
  function toggleDistrict(id) {
    setNotice({});
    setSelected(current => (current.includes(id) ? current.filter(item => item !== id) : [...current, id]));
  }
  /** Doble validación: aquí las reglas de uso y en el servidor las de D-49 (franjas, distritos activos, máximo 20). */
  function validate() {
    if (!slotsFrom(matrix).length) return 'Marca al menos una franja en la semana para recibir ofertas.';
    if (!selected.length) return 'Elige al menos un distrito donde atiendes.';
    if (selected.length > MAX_DISTRICTS) return `Puedes elegir hasta ${MAX_DISTRICTS} distritos.`;
    return '';
  }
  async function save() {
    const invalid = validate();
    if (invalid) { setNotice({error: invalid}); return; }
    setBusy(true); setNotice({});
    try {
      // D-104: sin pausa por ahora; se guardan solo las franjas y las zonas.
      await request('/technicians/me/availability', {slots: slotsFrom(matrix), district_ids: selected, pause: null,
        expected_version: profile.version}, 'PUT');
      setNotice({success: 'Guardamos tu disponibilidad y tus zonas.'});
      await load();
      onSaved?.();
    } catch (failure) {
      if (failure?.status === 409) { await load(); setNotice({error: 'Tu perfil cambió en otra pestaña. Cargamos lo último; revisa y guarda otra vez.'}); }
      else setNotice({error: failure?.message || 'No pudimos guardar tu disponibilidad. Inténtalo de nuevo.'});
    } finally { setBusy(false); }
  }
  return {profile, districts, matrix, selected, error, notice, busy, toggle, toggleDistrict, save, reload: load};
}

/** Semana visual: 7 columnas (Lun a Dom) × 3 franjas. Editable, cada casilla es un botón grande que se activa con un clic. */
export function WeekGrid({matrix, editable = false, onToggle, visits = [], dates = null, today = null}) {
  return <div className={'tech-week' + (editable ? ' is-editable' : '')} role="group" aria-label={editable ? 'Disponibilidad por franja' : 'Semana'}>
    <span className="tech-week-corner" aria-hidden="true"/>
    {DAYS.map(([day, short], index) => <span key={day} className={'tech-week-day' + (dates?.[index] === today ? ' is-today' : '')} aria-hidden="true">
      {short}{dates && <small>{Number(dates[index].slice(8))}</small>}
    </span>)}
    {FRANJAS.map(franja => <React.Fragment key={franja.id}>
      <span className="tech-week-franja" data-franja={franja.id}><strong>{franja.label}</strong><small>{franja.start.slice(0, 2)}–{franja.end.slice(0, 2)}</small></span>
      {DAYS.map(([day, , long], index) => {
        const on = Boolean(matrix?.[day]?.[franja.id]);
        const count = dates ? visits.filter(visit => visit.date === dates[index] && visit.slot === franja.id).length : 0;
        const label = `${long}, ${franja.label} (${franja.start}–${franja.end}): ${on ? 'disponible' : 'no disponible'}`
          + (count ? `, ${count} ${count === 1 ? 'visita' : 'visitas'}` : '');
        const content = <>
          <Icon name={on ? 'check' : 'close'}/>
          {count > 0 && <span className="tech-week-visits">{count}</span>}
        </>;
        return editable
          ? <button key={day} type="button" className="tech-week-cell" data-on={on} data-franja={franja.id} aria-pressed={on} aria-label={label}
            onClick={() => onToggle(day, franja.id)}>{content}</button>
          : <span key={day} className="tech-week-cell" data-on={on} data-franja={franja.id} role="img" aria-label={label}>{content}</span>;
      })}
    </React.Fragment>)}
  </div>;
}

function DistrictChips({options, selected, onToggle}) {
  return <fieldset className="tech-districts">
    <legend>Distritos donde atiendes <span className="muted">({selected.length} de {MAX_DISTRICTS})</span></legend>
    <div className="tech-chip-group">
      {options.map(district => {
        const on = selected.includes(district.id);
        return <button key={district.id} type="button" className="tech-district" aria-pressed={on} onClick={() => onToggle(district.id)}>
          <Icon name={on ? 'check' : 'map'}/>{district.name}
        </button>;
      })}
    </div>
  </fieldset>;
}

function Preview({profile, matrix, options, selected}) {
  const names = options.filter(district => selected.includes(district.id)).map(district => district.name);
  const summary = scheduleSummary(matrix);
  return <aside className="panel-card tech-preview" aria-labelledby="tech-preview">
    <p className="kicker" id="tech-preview">Así te ven los clientes</p>
    <div className="tech-preview-card">
      <span className="tech-card-icon" aria-hidden="true"><Icon name="profile"/></span>
      <div>
        <strong>{profile?.display_name || 'Tu perfil'}</strong>
        <p className="muted"><Icon name="map"/> Atiende en: {names.length ? names.join(', ') : 'sin distritos todavía'}</p>
        <p className="muted"><Icon name="clock"/> Horario: {summary || 'sin franjas todavía'}</p>
      </div>
    </div>
    <p className="muted">Los clientes no ven tu dirección ni tus citas; solo tus zonas y tus franjas.</p>
  </aside>;
}

/** Editor de franjas y zonas (Zonas y disponibilidad, y «Editar» de Mi agenda). */
export function AvailabilityEditor({onSaved, compact = false}) {
  const state = useAvailability(onSaved);
  if (state.error) return <div className="panel-card" role="alert"><p>{state.error}</p>
    <button type="button" className="button outline" onClick={state.reload}>Reintentar</button></div>;
  if (!state.matrix) return <div className="panel-card tech-skeleton" role="status">Cargando tu disponibilidad…</div>;
  const custom = hasCustomSlots(state.profile?.availability?.slots || []);
  return <div className={'tech-availability' + (compact ? ' is-compact' : '')}>
    <div className="tech-availability-main">
      <section className="panel-card tech-section" aria-labelledby="tech-week-title">
        <h3 id="tech-week-title"><Icon name="calendar"/> Tus franjas de la semana</h3>
        <p className="muted">Toca una casilla para activarla o quitarla. Recibes ofertas solo en las franjas activas.</p>
        {custom && <p className="notice">Tienes horarios personalizados que no coinciden con las franjas; al guardar se ajustarán a ellas.</p>}
        <WeekGrid matrix={state.matrix} editable onToggle={state.toggle}/>
      </section>
      <section className="panel-card tech-section">
        <DistrictChips options={state.districts} selected={state.selected} onToggle={state.toggleDistrict}/>
      </section>
      <div className="tech-save">
        {state.notice.error && <p className="error" role="alert">{state.notice.error}</p>}
        {state.notice.success && <p className="notice" role="status">{state.notice.success}</p>}
        <button type="button" className="button primary" disabled={state.busy} aria-busy={state.busy} onClick={state.save}>
          {state.busy ? 'Guardando…' : 'Guardar disponibilidad'}</button>
      </div>
    </div>
    {!compact && <Preview profile={state.profile} matrix={state.matrix} options={state.districts} selected={state.selected}/>}
  </div>;
}

export function ZonesPage({onSaved}) {
  return <section className="panel-page tech-page" aria-labelledby="tech-zones-title">
    <header className="client-page-head">
      <h2 id="tech-zones-title">Zonas y disponibilidad</h2>
      <p className="muted">Los distritos que atiendes y tus franjas: Mañana 08–12, Tarde 12–18 y Noche 18–21.</p>
    </header>
    <AvailabilityEditor onSaved={onSaved}/>
  </section>;
}

const isoDate = date => date.toISOString().slice(0, 10);
const addDays = (iso, days) => { const date = new Date(`${iso}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return isoDate(date); };
const limaToday = () => new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Lima'}).format(new Date());

/**
 * Mi agenda (Fase T3): semana visual con las franjas activas y las visitas programadas (GET /technicians/me/agenda),
 * navegación por semanas y lista de visitas por día. «Editar disponibilidad y zonas» abre el mismo editor.
 */
export function AgendaPage({onSaved}) {
  const [week, setWeek] = useState(null);
  const [state, setState] = useState({data: null, error: null, loading: true});
  const [slots, setSlots] = useState(null);
  const [editing, setEditing] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let active = true;
    setState(current => ({...current, loading: true}));
    Promise.all([request(`/technicians/me/agenda${week ? `?week=${week}` : ''}`), request('/technicians/me/profile')])
      .then(([agenda, me]) => { if (active) { setState({data: agenda?.data, error: null, loading: false}); setSlots(me?.data?.availability?.slots || []); } })
      .catch(error => { if (active) setState(current => ({...current, error, loading: false})); });
    return () => { active = false; };
  }, [week, tick]);
  const data = state.data;
  const dates = useMemo(() => (data ? Array.from({length: 7}, (_, index) => addDays(data.week_start, index)) : null), [data]);
  const matrix = useMemo(() => matrixFrom(slots || []), [slots]);
  const today = limaToday();
  const range = data ? `${legibleRange(`${data.week_start}T17:00:00Z`).split(' · ')[0]} al ${legibleRange(`${data.week_end}T17:00:00Z`).split(' · ')[0]}` : '';
  return <section className="panel-page tech-page" aria-labelledby="tech-agenda-title">
    <header className="client-page-head">
      <h2 id="tech-agenda-title">Mi agenda</h2>
      <p className="muted">Tus visitas de la semana y las franjas en las que recibes ofertas.</p>
    </header>
    <div className="tech-weeknav" role="group" aria-label="Cambiar de semana">
      <button type="button" className="button outline" disabled={!data} onClick={() => setWeek(addDays(data.week_start, -7))}>‹ Semana anterior</button>
      <strong aria-live="polite">{range}</strong>
      <button type="button" className="button outline" disabled={!data} onClick={() => setWeek(addDays(data.week_start, 7))}>Semana siguiente ›</button>
      {week && <button type="button" className="text-button" onClick={() => setWeek(null)}>Esta semana</button>}
    </div>
    {state.error && <p className="error" role="alert">{state.error.message || 'No pudimos cargar tu agenda.'}</p>}
    {state.loading && !data && <div className="panel-card tech-skeleton" role="status">Cargando tu agenda…</div>}
    {data && <section className="panel-card tech-section" aria-label="Semana">
      <WeekGrid matrix={matrix} visits={data.visits} dates={dates} today={today}/>
      <p className="muted tech-legend"><span className="tech-legend-on"><Icon name="check"/> Disponible</span>
        <span className="tech-legend-off"><Icon name="close"/> Sin franja</span>
        <span><span className="tech-week-visits">1</span> Visitas</span></p>
    </section>}
    {data && <section className="panel-card tech-section" aria-labelledby="tech-visits-title">
      <h3 id="tech-visits-title">Visitas de la semana</h3>
      {!data.visits.length && <p className="muted">No tienes visitas programadas esta semana.</p>}
      <ul className="tech-visit-list">
        {data.visits.map(visit => <li key={visit.request_id} className="tech-visit-row" data-status={visit.status}>
          <span className="tech-visit-when"><strong>{legibleRange(visit.starts_at, visit.ends_at)}</strong></span>
          <span><strong>{visit.specialty}</strong> · {visit.subcategory}</span>
          <span className="muted"><Icon name="map"/> {visit.district}</span>
          <span className="tech-chip">{STATUS[visit.status] || visit.status}</span>
        </li>)}
      </ul>
    </section>}
    <div className="tech-edit-toggle">
      <button type="button" className={'button ' + (editing ? 'outline' : 'primary')} aria-expanded={editing} aria-controls="agenda-editor"
        onClick={() => setEditing(!editing)}><Icon name="edit"/> {editing ? 'Cerrar la edición' : 'Editar disponibilidad y zonas'}</button>
    </div>
    {editing && <div id="agenda-editor"><AvailabilityEditor compact onSaved={() => { setTick(value => value + 1); onSaved?.(); }}/></div>}
  </section>;
}
