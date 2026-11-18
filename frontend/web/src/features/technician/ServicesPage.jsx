import React, {useEffect, useMemo, useRef, useState} from 'react';
import {request} from '../administration/http';
import {validateRate} from '../administration/sprint02Validation';
import ConfirmDialog from '../../components/ConfirmDialog';
import {specialtyIcon} from '../client/specialtyIcon';
import Icon from '../panel/icons';
import {Alerts, CountedText, TechDialog, apiError, useOwnProfile} from './businessCommon';
import {soles} from './format';

export const INCLUDES_MAX = 300;
const plain = text => (text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/** Color de cada especialidad por su ícono: cómputo azul, refrigeración aguamarina y electricidad ámbar. */
const TONES = {monitor: 'computo', snow: 'frio', bolt: 'electricidad', catalog: 'otro'};
const toneOf = name => TONES[specialtyIcon(name)];
/** Lo que el técnico escribe con coma («95,50») se envía con punto; lo guardado se muestra con coma. */
const toInput = value => (value === '' || value === null || value === undefined ? '' : String(value).replace('.', ','));

/** Catálogo activo: especialidades y subcategorías (para el ícono de cada servicio y el selector). */
function useCatalog() {
  const [catalog, setCatalog] = useState({specialties: [], subcategories: [], error: '', loading: true});
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const specialties = (await request('/catalog/specialties'))?.data || [];
        const lists = await Promise.all(specialties.map(item => request(`/catalog/subcategories?specialty_id=${item.id}`)));
        if (active) setCatalog({specialties, subcategories: lists.flatMap(list => list?.data || []), error: '', loading: false});
      } catch (failure) { if (active) setCatalog(current => ({...current, loading: false, error: failure.message || 'No pudimos cargar el catálogo.'})); }
    })();
    return () => { active = false; };
  }, []);
  return catalog;
}

/** Doble validación de un servicio: tarifa de S/ 1 a S/ 5 000 con 2 decimales y «qué incluye» hasta 300 (D-48, D-101). */
export function validateService(service) {
  const errors = {};
  const rate = validateRate(String(service.reference_fee ?? '').replace(',', '.'));
  if (rate) errors.reference_fee = rate;
  if ((service.includes || '').length > INCLUDES_MAX) errors.includes = '«Qué incluye» admite hasta 300 caracteres.';
  return errors;
}

/** Tarifa y «Qué incluye». Con formId sus botones van fuera (al pie del diálogo); si no, lleva los suyos. */
function ServiceForm({service, title, onCancel, onSave, busy, formId, autoFocus = true, suggested}) {
  const [fee, setFee] = useState(toInput(service.reference_fee));
  const [includes, setIncludes] = useState(service.includes || '');
  const [errors, setErrors] = useState({});
  const first = useRef(null);
  useEffect(() => { if (autoFocus) first.current?.focus(); }, [autoFocus]);
  function submit(event) {
    event.preventDefault();
    const next = {...service, reference_fee: fee.trim().replace(',', '.'), includes};
    const invalid = validateService(next);
    setErrors(invalid);
    if (!Object.keys(invalid).length) onSave(next);
  }
  return <form id={formId} className="tech-service-form" onSubmit={submit} noValidate aria-label={title}>
    <p className="tech-service-form-title"><strong>{title}</strong></p>
    <label className="tech-field">
      <span className="tech-field-label">Tarifa referencial</span>
      {suggested && <small className="muted">La tarifa de referencia del catálogo empieza en {soles(suggested)}.</small>}
      <span className="tech-money"><span aria-hidden="true">S/</span>
        <input ref={first} type="text" inputMode="decimal" value={fee} aria-invalid={Boolean(errors.reference_fee)}
          aria-describedby={errors.reference_fee ? `${formId || 'service'}-fee-error` : undefined} onChange={event => setFee(event.target.value)}
          placeholder="80,00"/></span>
      {errors.reference_fee && <span className="error" id={`${formId || 'service'}-fee-error`}>{errors.reference_fee}</span>}
    </label>
    <CountedText label="Qué incluye" value={includes} max={INCLUDES_MAX} rows={3} error={errors.includes} onChange={setIncludes}
      placeholder="Ejemplo: diagnóstico, limpieza interna y prueba final."/>
    {!formId && <div className="tech-service-actions">
      <button type="button" className="button outline" onClick={onCancel} disabled={busy}>Cancelar</button>
      <button type="submit" className="button primary" disabled={busy} aria-busy={busy}>{busy ? 'Guardando…' : 'Guardar servicio'}</button>
    </div>}
  </form>;
}

/**
 * Diálogo «Añadir servicio»: buscador, filtros por especialidad (con su ícono y color), tarjetas iguales agrupadas por
 * especialidad (2 columnas; 1 en el celular), «Ya lo ofreces» en las que ya tiene y, al elegir una, la tarifa y «Qué
 * incluye» debajo. Las tarjetas son un grupo de opciones: las flechas mueven el foco y Enter o Espacio eligen.
 */
export function AddServiceDialog({catalog, offered, declared, busy, onClose, onSave}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const cards = useRef({});
  const form = useRef(null);
  const words = plain(query.trim());
  const specialties = catalog.specialties.filter(item => catalog.subcategories.some(entry => entry.specialty_id === item.id));
  const groups = specialties.filter(item => filter === 'all' || item.id === filter).map(specialty => ({
    specialty,
    items: catalog.subcategories.filter(entry => entry.specialty_id === specialty.id
      && (!words || plain(`${entry.name} ${entry.description || ''} ${specialty.name}`).includes(words))),
  })).filter(group => group.items.length);
  const order = groups.flatMap(group => group.items).filter(item => !offered.has(item.id));
  const current = order.find(item => item.id === selected?.id) || order[0];
  const choose = item => { setSelected(item); requestAnimationFrame(() => form.current?.scrollIntoView?.({block: 'nearest', behavior: 'smooth'})); };
  function keys(event, item) {
    const step = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1}[event.key];
    if (step) {
      event.preventDefault();
      const index = order.findIndex(entry => entry.id === item.id);
      cards.current[order[(index + step + order.length) % order.length].id]?.focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      choose(item);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      cards.current[(event.key === 'Home' ? order[0] : order[order.length - 1]).id]?.focus();
    }
  }
  // El formulario aparece debajo del grupo de la tarjeta elegida (o al final si un filtro la oculta).
  const pickForm = selected && <div ref={form} className="tech-pick-form">
    <ServiceForm key={selected.id} formId="add-service-form" autoFocus={false} busy={busy} suggested={selected.reference_fee}
      title={`Tu tarifa para «${selected.name}»`}
      service={{subcategory_id: selected.id, subcategory_name: selected.name, reference_fee: '', includes: ''}} onSave={onSave}/>
  </div>;
  const footer = <>
    <button type="button" className="button outline" onClick={onClose} disabled={busy}>Cancelar</button>
    <button type="submit" form="add-service-form" className="button primary" disabled={busy || !selected} aria-busy={busy}>
      {busy ? 'Guardando…' : 'Guardar servicio'}</button>
  </>;
  return <TechDialog title="Añadir servicio" icon="plus" onClose={onClose} footer={footer} busy={busy}>
    <label className="tech-search" htmlFor="service-search"><Icon name="search"/>
      <span className="tech-sr">Buscar subcategoría</span>
      <input id="service-search" type="search" data-autofocus value={query} placeholder="Buscar: impresoras, vitrinas, tableros…"
        onChange={event => setQuery(event.target.value)}/></label>
    <div className="tech-filters" role="group" aria-label="Filtrar por especialidad">
      <button type="button" className="tech-filter" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
        <Icon name="catalog"/> Todas</button>
      {specialties.map(item => <button key={item.id} type="button" className="tech-filter" data-tone={toneOf(item.name)}
        aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}><Icon name={specialtyIcon(item.name)}/> {item.name}</button>)}
    </div>
    {catalog.loading && <p className="muted" role="status">Cargando las subcategorías…</p>}
    {!catalog.loading && !groups.length && <p className="tech-no-results" role="status">
      No encontramos “{query.trim()}”. Prueba con otra palabra.</p>}
    <div className="tech-picker">
      {groups.map(({specialty, items}) => <section key={specialty.id} className="tech-picker-group" aria-labelledby={`picker-${specialty.id}`}>
        <h3 id={`picker-${specialty.id}`} data-tone={toneOf(specialty.name)}><span className="tech-picker-dot" aria-hidden="true">
          <Icon name={specialtyIcon(specialty.name)}/></span>{specialty.name}</h3>
        <div className="tech-picker-grid" role="radiogroup" aria-labelledby={`picker-${specialty.id}`}>
          {items.map(item => {
            const taken = offered.has(item.id);
            const checked = selected?.id === item.id;
            const wasDeclared = declared.has(item.id);
            return <button key={item.id} ref={element => { cards.current[item.id] = element; }} type="button" role="radio"
              className="tech-pick" data-tone={toneOf(specialty.name)} aria-checked={checked} disabled={taken}
              tabIndex={!taken && current?.id === item.id ? 0 : -1} onClick={() => choose(item)} onKeyDown={event => keys(event, item)}>
              <span className="tech-pick-icon" aria-hidden="true"><Icon name={checked ? 'check' : specialtyIcon(specialty.name)}/></span>
              <span className="tech-pick-text">
                <strong>{item.name}</strong>
                {taken ? <span className="tech-pick-tag">Ya lo ofreces</span>
                  : item.description ? <small>{item.description}</small>
                    : item.reference_fee ? <small>Tarifa sugerida desde {soles(item.reference_fee)}</small> : null}
                {!taken && wasDeclared && <span className="tech-pick-tag is-declared">Lo declaraste al registrarte</span>}
              </span>
            </button>;
          })}
        </div>
        {selected?.specialty_id === specialty.id && items.some(item => item.id === selected.id) && pickForm}
      </section>)}
    </div>
    {selected && !groups.some(group => group.items.some(item => item.id === selected.id)) && pickForm}
  </TechDialog>;
}

/**
 * Servicios y tarifas (Fase T4): una tarjeta por servicio con el ícono de la especialidad, la tarifa en grande con «S/»
 * (formato peruano, «S/ 120,00»), «Qué incluye», Editar y Quitar (con confirmación); «Añadir servicio» abre un diálogo.
 * Todo se guarda con PUT /technicians/me/services, que ya existe (versión del perfil y tarifa versionada, D-48).
 */
export default function ServicesPage({onSaved}) {
  const own = useOwnProfile();
  const catalog = useCatalog();
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [notice, setNotice] = useState({});
  const [busy, setBusy] = useState(false);
  const services = (own.data?.services || []).filter(service => service.active !== false);
  const bySubcategory = useMemo(() => new Map(catalog.subcategories.map(item => [item.id, item])), [catalog.subcategories]);
  const specialtyOf = id => catalog.specialties.find(item => item.id === bySubcategory.get(id)?.specialty_id)?.name || '';
  const offered = new Set(services.map(service => service.subcategory_id));
  const declared = new Set((own.data?.declared_subcategories || []).map(item => item.subcategory_id));

  async function persist(list, success) {
    setBusy(true); setNotice({});
    try {
      await request('/technicians/me/services', {
        services: list.map(service => ({subcategory_id: service.subcategory_id, reference_fee: service.reference_fee,
          includes: (service.includes || '').trim() || null})),
        expected_version: own.data.version,
      }, 'PUT');
      await own.reload();
      setEditing(null); setAdding(false);
      setNotice({success});
      onSaved?.();
      return true;
    } catch (failure) {
      if (failure?.status === 409) await own.reload();
      setNotice({error: apiError(failure, 'No pudimos guardar tus servicios. Inténtalo de nuevo.')});
      return false;
    } finally { setBusy(false); }
  }
  const save = service => {
    const exists = services.some(item => item.subcategory_id === service.subcategory_id);
    const list = exists ? services.map(item => (item.subcategory_id === service.subcategory_id ? service : item)) : [...services, service];
    return persist(list, exists ? `Actualizamos «${service.subcategory_name}».` : `Añadimos «${service.subcategory_name}» a tus servicios.`);
  };

  return <section className="panel-page tech-page" aria-labelledby="tech-services-title">
    <header className="client-page-head">
      <h2 id="tech-services-title">Servicios y tarifas</h2>
      <p className="muted">Tus trabajos con su tarifa referencial. El cliente la ve antes de pedirte; el precio final lo acuerdan en la visita.</p>
    </header>
    <Alerts notice={notice}/>
    {own.error && <p className="error" role="alert">{own.error.message || 'No pudimos cargar tus servicios.'}</p>}
    {catalog.error && <p className="error" role="alert">{catalog.error}</p>}
    {!own.data && !own.error && <div className="panel-card tech-skeleton" role="status">Cargando tus servicios…</div>}
    {own.data && <ul className="tech-svc-list" aria-label="Tus servicios">
      {services.map(service => {
        const specialty = specialtyOf(service.subcategory_id);
        const isEditing = editing?.subcategory_id === service.subcategory_id;
        return <li key={service.subcategory_id} className="tech-service" data-editing={isEditing} data-tone={specialty ? toneOf(specialty) : undefined}>
          <div className="tech-service-top">
            <span className="tech-card-icon" aria-hidden="true"><Icon name={specialtyIcon(specialty)}/></span>
            <div className="tech-service-name">
              <h3>{service.subcategory_name}</h3>
              {specialty && <small className="muted">{specialty}</small>}
            </div>
          </div>
          {isEditing ? <ServiceForm service={service} title={`Editar «${service.subcategory_name}»`} busy={busy}
            onCancel={() => setEditing(null)} onSave={save}/> : <>
            <p className="tech-fee"><span className="tech-fee-label">Tarifa referencial</span>
              <strong>{soles(service.reference_fee)}</strong></p>
            <div className="tech-includes">
              <span className="tech-fee-label">Qué incluye</span>
              {service.includes ? <p>{service.includes}</p> : <p className="muted">Todavía no lo describes. Los clientes eligen mejor si lo sabes.</p>}
            </div>
            <div className="tech-service-actions">
              <button type="button" className="button outline" onClick={() => setEditing(service)}
                aria-label={`Editar ${service.subcategory_name}`}><Icon name="edit"/> Editar</button>
              <button type="button" className="button outline tech-danger" onClick={() => setRemoving(service)}
                aria-label={`Quitar ${service.subcategory_name}`}><Icon name="trash"/> Quitar</button>
            </div>
          </>}
        </li>;
      })}
      <li className="tech-service is-add">
        <button type="button" className="tech-add-card" onClick={() => { setEditing(null); setNotice({}); setAdding(true); }}>
          <span className="tech-add-plus" aria-hidden="true"><Icon name="plus"/></span>
          <strong>Añadir servicio</strong>
          <small className="muted">Elige la subcategoría que atiendes</small>
        </button>
      </li>
    </ul>}
    {own.data && !services.length && <p className="muted">Aún no tienes servicios. Sin un servicio con tarifa no recibes ofertas.</p>}
    {adding && <AddServiceDialog catalog={catalog} offered={offered} declared={declared} busy={busy}
      onClose={() => setAdding(false)} onSave={save}/>}
    {removing && <ConfirmDialog title={`¿Quitar «${removing.subcategory_name}»?`} busy={busy}
      description="Dejarás de recibir ofertas de este servicio y ya no aparecerá en tu perfil. Puedes volver a añadirlo cuando quieras."
      onCancel={() => setRemoving(null)}
      onConfirm={async () => {
        const name = removing.subcategory_name;
        await persist(services.filter(item => item.subcategory_id !== removing.subcategory_id), `Quitamos «${name}» de tus servicios.`);
        setRemoving(null);
      }}/>}
  </section>;
}
