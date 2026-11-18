import React, {useEffect, useRef, useState} from 'react';
import {request} from '../administration/http';
import {useSubcategories} from '../administration/Sprint02Common';
import {validatePerformedOn} from '../administration/sprint02Validation';
import ConfirmDialog from '../../components/ConfirmDialog';
import Icon from '../panel/icons';
import {Alerts, CountedText, DropZone, SelectField, apiError, useOwnProfile} from './businessCommon';

export const CAPTION_MAX = 180;
const STAGES = {before: 'Antes', after: 'Después'};
const legibleDate = iso => (iso ? new Intl.DateTimeFormat('es-PE', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'})
  .format(new Date(`${iso.slice(0, 10)}T12:00:00Z`)) : '');

/** Doble validación del trabajo: título 2–160, de 1 a 5 imágenes, fecha no futura y texto alternativo en cada imagen nueva. */
export function validateWork(values, images) {
  const errors = {};
  if (values.title.trim().length < 2 || values.title.length > 160) errors.title = 'Escribe un título de 2 a 160 caracteres.';
  if (values.description.length > 2000) errors.description = 'La descripción admite hasta 2000 caracteres.';
  const date = validatePerformedOn(values.performed_on);
  if (date) errors.performed_on = date;
  if (images.length < 1 || images.length > 5) errors.images = 'Agrega de 1 a 5 fotos del trabajo.';
  images.forEach((image, index) => {
    const caption = (image.caption || '').trim();
    if (!caption) errors[`caption-${index}`] = 'Escribe el texto alternativo: qué se ve en la foto.';
    else if (caption.length > CAPTION_MAX) errors[`caption-${index}`] = 'El texto alternativo admite hasta 180 caracteres.';
  });
  return errors;
}

function WorkEditor({item, subcategories, onCancel, onSaved}) {
  const [values, setValues] = useState({title: item.title || '', description: item.description || '', performed_on: item.performed_on || '',
    subcategory_id: item.subcategory_id ? String(item.subcategory_id) : '', status: item.status || 'published'});
  const [images, setImages] = useState((item.images || []).map(image => ({media_id: image.media_id, url: image.url, stage: image.stage || '',
    caption: image.caption || ''})));
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState({});
  const [busy, setBusy] = useState(false);
  const title = useRef(null);
  useEffect(() => { title.current?.focus(); }, []);
  const set = (field, value) => setValues(current => ({...current, [field]: value}));
  const setImage = (index, field, value) => setImages(current => current.map((image, position) => (position === index ? {...image, [field]: value} : image)));
  function add(media) {
    setImages(current => (current.length >= 5 ? current : [...current, {media_id: media.id, url: media.url, caption: '',
      stage: current.some(image => image.stage === 'before') ? 'after' : current.length ? 'after' : 'before'}]));
  }
  async function save(event) {
    event.preventDefault();
    const invalid = validateWork(values, images);
    setErrors(invalid);
    if (Object.keys(invalid).length) { setNotice({error: 'Revisa los campos marcados antes de guardar.'}); return; }
    setBusy(true); setNotice({});
    try {
      await request(`/technicians/me/portfolio${item.id ? `/${item.id}` : ''}`, {
        title: values.title.trim(), description: values.description.trim() || null, performed_on: values.performed_on || null,
        subcategory_id: values.subcategory_id ? Number(values.subcategory_id) : null, status: values.status,
        media_ids: images.map(image => image.media_id), image_stages: images.map(image => image.stage || null),
        image_captions: images.map(image => image.caption.trim()),
        ...(item.id ? {expected_version: item.version} : {}),
      }, item.id ? 'PATCH' : 'POST');
      onSaved(item.id ? `Guardamos los cambios de «${values.title.trim()}».` : `Añadimos «${values.title.trim()}» a tu portafolio.`);
    } catch (failure) {
      setNotice({error: apiError(failure, 'No pudimos guardar el trabajo. Inténtalo de nuevo.')});
    } finally { setBusy(false); }
  }
  return <form className="panel-card tech-section tech-work-editor" onSubmit={save} noValidate aria-labelledby="work-editor-title">
    <h3 id="work-editor-title"><Icon name={item.id ? 'edit' : 'plus'}/> {item.id ? `Editar «${item.title}»` : 'Nuevo trabajo'}</h3>
    <div className="tech-biz-grid">
      <label className="tech-field"><span className="tech-field-label">Título del trabajo</span>
        <input ref={title} value={values.title} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'work-title-error' : undefined}
          onChange={event => set('title', event.target.value)} placeholder="Ejemplo: cambio de compresor en vitrina"/>
        {errors.title && <span className="error" id="work-title-error">{errors.title}</span>}</label>
      <label className="tech-field"><span className="tech-field-label">Fecha del trabajo</span>
        <input type="date" value={values.performed_on} aria-invalid={Boolean(errors.performed_on)} onChange={event => set('performed_on', event.target.value)}/>
        {errors.performed_on && <span className="error">{errors.performed_on}</span>}</label>
      <SelectField label="Subcategoría del trabajo" value={values.subcategory_id} onChange={value => set('subcategory_id', value)}>
        <option value="">Sin subcategoría</option>
        {item.subcategory_id && !subcategories.some(entry => entry.id === item.subcategory_id)
          && <option value={item.subcategory_id}>Subcategoría anterior (inactiva)</option>}
        {subcategories.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
      </SelectField>
      <fieldset className="tech-segmented"><legend className="tech-field-label">Estado</legend>
        {[['published', 'Publicado', 'Lo ven los clientes'], ['draft', 'Borrador', 'Solo lo ves tú']].map(([value, label, hint]) =>
          <button key={value} type="button" aria-pressed={values.status === value} onClick={() => set('status', value)}>
            <strong>{label}</strong><small>{hint}</small></button>)}
      </fieldset>
    </div>
    <CountedText label="Descripción" value={values.description} max={2000} rows={3} error={errors.description}
      onChange={value => set('description', value)} placeholder="Qué problema tenía y qué hiciste."/>
    <div className="tech-field">
      <span className="tech-field-label">Fotos del trabajo (antes y después)</span>
      <small className="muted">Cada foto necesita un texto alternativo: lo leen las personas que usan lector de pantalla.</small>
      {errors.images && <span className="error" role="alert">{errors.images}</span>}
      <ul className="tech-photo-list" aria-label="Fotos del trabajo">
        {images.map((image, index) => <li key={image.media_id} className="tech-photo">
          <img src={image.url} alt={image.caption || `Foto ${index + 1} sin texto alternativo`}/>
          <div className="tech-photo-fields">
            <fieldset className="tech-stage"><legend>Etapa de la foto {index + 1}</legend>
              {Object.entries(STAGES).map(([value, label]) => <button key={value} type="button" aria-pressed={image.stage === value}
                onClick={() => setImage(index, 'stage', image.stage === value ? '' : value)}>{label}</button>)}
            </fieldset>
            <label className="tech-field"><span className="tech-field-label">Texto alternativo de la foto {index + 1}</span>
              <input value={image.caption} maxLength={CAPTION_MAX + 20} aria-invalid={Boolean(errors[`caption-${index}`])}
                aria-describedby={errors[`caption-${index}`] ? `caption-${index}-error` : undefined}
                onChange={event => setImage(index, 'caption', event.target.value)} placeholder="Ejemplo: vitrina con el compresor nuevo"/>
              {errors[`caption-${index}`] && <span className="error" id={`caption-${index}-error`}>{errors[`caption-${index}`]}</span>}</label>
            <button type="button" className="button outline tech-danger" onClick={() => setImages(images.filter((_, position) => position !== index))}>
              <Icon name="trash"/> Quitar foto {index + 1}</button>
          </div>
        </li>)}
      </ul>
      {images.length < 5 && <DropZone purpose="portfolio" compact label={images.length ? 'Añadir otra foto (por ejemplo, el después)' : 'Sube la foto del antes'}
        onUploaded={add}/>}
    </div>
    <div className="tech-save">
      <Alerts notice={notice}/>
      <button type="button" className="button outline" onClick={onCancel} disabled={busy}>Cancelar</button>
      <button type="submit" className="button primary" disabled={busy} aria-busy={busy}>{busy ? 'Guardando…' : 'Guardar trabajo'}</button>
    </div>
  </form>;
}

/** Miniaturas del trabajo: la del antes y la del después, con su etiqueta. */
function BeforeAfter({images}) {
  const before = images.find(image => image.stage === 'before');
  const after = images.find(image => image.stage === 'after');
  const shown = before || after ? [before, after].filter(Boolean) : images.slice(0, 2);
  if (!shown.length) return <div className="tech-ba is-empty" aria-hidden="true"><Icon name="image"/></div>;
  return <div className="tech-ba">
    {shown.map(image => <figure key={image.media_id}>
      <img src={image.url} alt={image.caption || ''}/>
      {image.stage && <figcaption className="tech-ba-tag" data-stage={image.stage}>{STAGES[image.stage]}</figcaption>}
    </figure>)}
  </div>;
}

/**
 * Portafolio (Fase T4): trabajos en el orden que elige el técnico (Subir y Bajar, PATCH /technicians/me/portfolio/order),
 * fotos «antes» y «después» con texto alternativo obligatorio, y retiro con confirmación (el trabajo deja de verse).
 */
export default function PortfolioPage({onSaved}) {
  const own = useOwnProfile();
  const catalog = useSubcategories();
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [notice, setNotice] = useState({});
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState(null);
  const items = own.data?.portfolio || [];
  const ordered = order ? order.map(id => items.find(item => item.id === id)).filter(Boolean) : items;

  async function move(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= ordered.length) return;
    const next = ordered.map(item => item.id);
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next); setNotice({});
    try {
      await request('/technicians/me/portfolio/order', {ids: next}, 'PATCH');
      await own.reload();
      setOrder(null);
      setNotice({success: `Movimos «${ordered[index].title}» al puesto ${target + 1} de ${ordered.length}.`});
      onSaved?.();
    } catch (failure) {
      setOrder(null);
      await own.reload();
      setNotice({error: apiError(failure, 'No pudimos cambiar el orden. Inténtalo de nuevo.')});
    }
  }
  async function retire() {
    setBusy(true);
    try {
      await request(`/technicians/me/portfolio/${removing.id}`, undefined, 'DELETE');
      await own.reload();
      setNotice({success: `Quitamos «${removing.title}» de tu portafolio.`});
      onSaved?.();
    } catch (failure) {
      setNotice({error: apiError(failure, 'No pudimos quitar el trabajo. Inténtalo de nuevo.')});
    } finally { setBusy(false); setRemoving(null); }
  }

  return <section className="panel-page tech-page" aria-labelledby="tech-portfolio-title">
    <header className="client-page-head tech-head-row">
      <div><h2 id="tech-portfolio-title">Portafolio</h2>
        <p className="muted">Muestra trabajos reales con fotos del antes y del después. El orden de aquí es el de tu perfil público.</p></div>
      {!editing && <button type="button" className="button primary" onClick={() => { setNotice({}); setEditing({}); }}>
        <Icon name="plus"/> Añadir trabajo</button>}
    </header>
    <Alerts notice={notice}/>
    {own.error && <p className="error" role="alert">{own.error.message || 'No pudimos cargar tu portafolio.'}</p>}
    {!own.data && !own.error && <div className="panel-card tech-skeleton" role="status">Cargando tu portafolio…</div>}
    {editing && <WorkEditor key={editing.id || 'new'} item={editing} subcategories={catalog.data || []} onCancel={() => setEditing(null)}
      onSaved={async message => { setEditing(null); await own.reload(); setNotice({success: message}); onSaved?.(); }}/>}
    {own.data && !items.length && !editing && <div className="panel-card tech-empty-card">
      <span className="tech-card-icon" aria-hidden="true"><Icon name="image"/></span>
      <p><strong>Tu portafolio está vacío</strong></p>
      <p className="muted">Agrega 2 trabajos publicados para completar tu perfil.</p>
    </div>}
    {own.data && items.length > 0 && <ol className="tech-works" aria-label="Tus trabajos, en el orden de tu perfil">
      {ordered.map((item, index) => <li key={item.id} className="tech-work">
        <BeforeAfter images={item.images || []}/>
        <div className="tech-work-body">
          <div className="tech-card-head">
            <h3>{item.title}</h3>
            <span className="tech-status" data-tone={item.status === 'published' ? 'ok' : 'muted'}>
              <Icon name={item.status === 'published' ? 'check' : 'edit'}/>{item.status === 'published' ? 'Publicado' : 'Borrador'}</span>
          </div>
          {item.performed_on && <p className="muted tech-work-date"><Icon name="calendar"/> {legibleDate(item.performed_on)}</p>}
          {item.description && <p className="tech-work-text">{item.description}</p>}
          <div className="tech-work-actions">
            <span className="tech-work-position" aria-hidden="true">{index + 1}</span>
            <button type="button" className="button outline tech-icon-button" disabled={index === 0}
              aria-label={`Subir «${item.title}»`} onClick={() => move(index, -1)}><Icon name="chevron"/></button>
            <button type="button" className="button outline tech-icon-button is-down" disabled={index === ordered.length - 1}
              aria-label={`Bajar «${item.title}»`} onClick={() => move(index, 1)}><Icon name="chevron"/></button>
            <button type="button" className="button outline" onClick={() => { setNotice({}); setEditing(item); }}
              aria-label={`Editar «${item.title}»`}><Icon name="edit"/> Editar</button>
            <button type="button" className="button outline tech-danger" onClick={() => setRemoving(item)}
              aria-label={`Quitar «${item.title}»`}><Icon name="trash"/> Quitar</button>
          </div>
        </div>
      </li>)}
    </ol>}
    {removing && <ConfirmDialog title={`¿Quitar «${removing.title}»?`} busy={busy}
      description="El trabajo dejará de verse en tu perfil público. Las fotos no se borran." onCancel={() => setRemoving(null)} onConfirm={retire}/>}
  </section>;
}
