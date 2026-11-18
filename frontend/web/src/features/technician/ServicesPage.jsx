import React, {useEffect, useMemo, useRef, useState} from 'react';
import {request} from '../administration/http';
import {validateRate} from '../administration/sprint02Validation';
import ConfirmDialog from '../../components/ConfirmDialog';
import {specialtyIcon} from '../client/specialtyIcon';
import Icon from '../panel/icons';
import {Alerts, CountedText, apiError, useOwnProfile} from './businessCommon';

export const INCLUDES_MAX = 300;
const plain = text => (text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const money = value => `S/ ${Number(value).toLocaleString('es-PE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

/** Catálogo activo: especialidades y subcategorías (para el ícono de cada servicio y el buscador). */
function useCatalog() {
  const [catalog, setCatalog] = useState({specialties: [], subcategories: [], error: ''});
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const specialties = (await request('/catalog/specialties'))?.data || [];
        const lists = await Promise.all(specialties.map(item => request(`/catalog/subcategories?specialty_id=${item.id}`)));
        if (active) setCatalog({specialties, subcategories: lists.flatMap(list => list?.data || []), error: ''});
      } catch (failure) { if (active) setCatalog(current => ({...current, error: failure.message || 'No pudimos cargar el catálogo.'})); }
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

function ServiceForm({service, title, onCancel, onSave, busy}) {
  const [fee, setFee] = useState(service.reference_fee ? String(service.reference_fee) : '');
  const [includes, setIncludes] = useState(service.includes || '');
  const [errors, setErrors] = useState({});
  const first = useRef(null);
  useEffect(() => { first.current?.focus(); }, []);
  function submit(event) {
    event.preventDefault();
    const next = {...service, reference_fee: fee.replace(',', '.'), includes};
    const invalid = validateService(next);
    setErrors(invalid);
    if (!Object.keys(invalid).length) onSave(next);
  }
  return <form className="tech-service-form" onSubmit={submit} noValidate aria-label={title}>
    <p className="tech-service-form-title"><strong>{title}</strong></p>
    <label className="tech-field">
      <span className="tech-field-label">Tarifa referencial</span>
      <span className="tech-money"><span aria-hidden="true">S/</span>
        <input ref={first} type="text" inputMode="decimal" value={fee} aria-invalid={Boolean(errors.reference_fee)}
          aria-describedby={errors.reference_fee ? 'service-fee-error' : undefined} onChange={event => setFee(event.target.value)}
          placeholder="80.00"/></span>
      {errors.reference_fee && <span className="error" id="service-fee-error">{errors.reference_fee}</span>}
    </label>
    <CountedText label="Qué incluye" value={includes} max={INCLUDES_MAX} rows={3} error={errors.includes} onChange={setIncludes}
      placeholder="Ejemplo: diagnóstico, limpieza interna y prueba final."/>
    <div className="tech-service-actions">
      <button type="button" className="button outline" onClick={onCancel} disabled={busy}>Cancelar</button>
      <button type="submit" className="button primary" disabled={busy} aria-busy={busy}>{busy ? 'Guardando…' : 'Guardar servicio'}</button>
    </div>
  </form>;
}

/**
 * Servicios y tarifas (Fase T4): una tarjeta por servicio con el ícono de la especialidad, la tarifa en grande con «S/»,
 * «Qué incluye», Editar y Quitar (con confirmación); «Añadir servicio» busca entre las subcategorías activas.
 * Todo se guarda con PUT /technicians/me/services, que ya existe (versión del perfil y tarifa versionada, D-48).
 */
export default function ServicesPage({onSaved}) {
  const own = useOwnProfile();
  const catalog = useCatalog();
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [removing, setRemoving] = useState(null);
  const [notice, setNotice] = useState({});
  const [busy, setBusy] = useState(false);
  const services = (own.data?.services || []).filter(service => service.active !== false);
  const bySubcategory = useMemo(() => new Map(catalog.subcategories.map(item => [item.id, item])), [catalog.subcategories]);
  const specialtyOf = id => catalog.specialties.find(item => item.id === bySubcategory.get(id)?.specialty_id)?.name || '';
  const offered = new Set(services.map(service => service.subcategory_id));
  const declared = (own.data?.declared_subcategories || []).filter(item => !offered.has(item.subcategory_id));
  const results = catalog.subcategories.filter(item => !offered.has(item.id)
    && (!query.trim() || plain(`${item.name} ${specialtyOf(item.id)}`).includes(plain(query.trim())))).slice(0, 12);

  async function persist(list, success) {
    setBusy(true); setNotice({});
    try {
      await request('/technicians/me/services', {
        services: list.map(service => ({subcategory_id: service.subcategory_id, reference_fee: service.reference_fee,
          includes: (service.includes || '').trim() || null})),
        expected_version: own.data.version,
      }, 'PUT');
      await own.reload();
      setEditing(null); setAdding(false); setQuery('');
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
  const choose = item => { setEditing({subcategory_id: item.id ?? item.subcategory_id, subcategory_name: item.name ?? item.subcategory_name,
    reference_fee: '', includes: '', isNew: true}); };

  return <section className="panel-page tech-page" aria-labelledby="tech-services-title">
    <header className="client-page-head">
      <h2 id="tech-services-title">Servicios y tarifas</h2>
      <p className="muted">Tus trabajos con su tarifa referencial. El cliente la ve antes de pedirte; el precio final lo acuerdan en la visita.</p>
    </header>
    <Alerts notice={notice}/>
    {own.error && <p className="error" role="alert">{own.error.message || 'No pudimos cargar tus servicios.'}</p>}
    {catalog.error && <p className="error" role="alert">{catalog.error}</p>}
    {!own.data && !own.error && <div className="panel-card tech-skeleton" role="status">Cargando tus servicios…</div>}
    {own.data && <ul className="tech-services" aria-label="Tus servicios">
      {services.map(service => {
        const specialty = specialtyOf(service.subcategory_id);
        const isEditing = editing?.subcategory_id === service.subcategory_id && !editing.isNew;
        return <li key={service.subcategory_id} className="tech-service" data-editing={isEditing}>
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
              <strong>{money(service.reference_fee)}</strong></p>
            <div className="tech-includes">
              <span className="tech-fee-label">Qué incluye</span>
              {service.includes ? <p>{service.includes}</p> : <p className="muted">Todavía no lo describes. Los clientes eligen mejor si lo sabes.</p>}
            </div>
            <div className="tech-service-actions">
              <button type="button" className="button outline" onClick={() => { setAdding(false); setEditing(service); }}
                aria-label={`Editar ${service.subcategory_name}`}><Icon name="edit"/> Editar</button>
              <button type="button" className="button outline tech-danger" onClick={() => setRemoving(service)}
                aria-label={`Quitar ${service.subcategory_name}`}><Icon name="trash"/> Quitar</button>
            </div>
          </>}
        </li>;
      })}
      <li className="tech-service is-add">
        {editing?.isNew ? <ServiceForm service={editing} title={`Nuevo servicio: «${editing.subcategory_name}»`} busy={busy}
          onCancel={() => setEditing(null)} onSave={save}/>
          : adding ? <div className="tech-add-search">
            <label className="tech-search" htmlFor="service-search"><Icon name="search"/>
              <span className="tech-sr">Buscar subcategoría</span>
              <input id="service-search" type="search" autoFocus value={query} placeholder="Buscar: impresoras, vitrinas, tableros…"
                onChange={event => setQuery(event.target.value)}/></label>
            {declared.length > 0 && !query && <p className="muted">Declaraste estos rubros al registrarte:</p>}
            <ul className="tech-add-results" aria-label="Subcategorías disponibles">
              {(query ? results : [...declared.map(item => ({id: item.subcategory_id, name: item.subcategory_name})), ...results]
                .filter((item, index, all) => all.findIndex(other => other.id === item.id) === index).slice(0, 12))
                .map(item => <li key={item.id}><button type="button" className="tech-district" onClick={() => choose(item)}>
                  <Icon name={specialtyIcon(specialtyOf(item.id))}/>{item.name}</button></li>)}
            </ul>
            {query && !results.length && <p className="muted" role="status">No hay subcategorías que coincidan con «{query}».</p>}
            <button type="button" className="button outline" onClick={() => { setAdding(false); setQuery(''); }}>Cerrar</button>
          </div>
          : <button type="button" className="tech-add-card" onClick={() => { setEditing(null); setAdding(true); }}>
            <span className="tech-add-plus" aria-hidden="true"><Icon name="plus"/></span>
            <strong>Añadir servicio</strong>
            <small className="muted">Busca la subcategoría que atiendes</small>
          </button>}
      </li>
    </ul>}
    {own.data && !services.length && <p className="muted">Aún no tienes servicios. Sin un servicio con tarifa no recibes ofertas.</p>}
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
