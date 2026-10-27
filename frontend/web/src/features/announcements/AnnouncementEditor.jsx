import React, {useEffect, useRef, useState} from 'react';
import {request} from '../administration/http';
import {Field, Notice} from '../administration/forms';
import AnnouncementCarousel from './AnnouncementCarousel';
import {readImage, encodeCrop} from './imageTools';
import {
  AUDIENCE_OPTIONS, IMAGE_GUIDE, KIND_LABELS, MAX_BYTES, MOBILE_GUIDE, addPeriod, analyzeImage, audienceOf, cropRect,
  normalizeGenially, outputSize, phaseOf, toLocalInput, toPayload, validateCarousel,
} from './announcementRules';

const SOURCES = [
  {value: 'image', label: 'Imagen', hint: 'Banner ancho JPG o WebP que rota en el carrusel.'},
  {value: 'genially', label: 'Genially', hint: 'Presentación interactiva de view.genially.com en un marco 3:1.'},
];
const SECTIONS = [['content', '1 Contenido'], ['audience', '2 Audiencia'], ['schedule', '3 Vigencia y orden'], ['link', '4 Enlace']];
const SECTION_FIELDS = {content: ['title', 'kind', 'alt_text', 'image_media_id', 'mobile_media_id', 'genially_url'], audience: ['audiences'],
  schedule: ['starts_at', 'ends_at'], link: ['link_url', 'link_label']};
const PERIODS = [['week', '1 semana'], ['two-weeks', '2 semanas'], ['month', '1 mes']];

function initialValue(item) {
  const now = new Date();
  now.setSeconds(0, 0);
  const starts = item?.starts_at ? toLocalInput(new Date(item.starts_at)) : toLocalInput(now);
  return {
    source: item?.source === 'genially' ? 'genially' : 'image', kind: item?.kind || '', title: item?.title || '',
    alt_text: item?.alt_text || '', body: item?.body || '',
    image: item?.image_media_id ? {id: item.image_media_id, url: item.image_url} : null,
    mobile: item?.mobile_media_id ? {id: item.mobile_media_id, url: item.mobile_image_url} : null,
    genially_url: item?.genially_url || '', audience: audienceOf(item?.audiences),
    starts_at: starts, ends_at: item?.ends_at ? toLocalInput(new Date(item.ends_at)) : addPeriod(starts, 'week'),
    link_url: item?.link_url || '', link_label: item?.link_label || '',
  };
}

const FieldError = ({errors, name}) => errors[name] ? <p className="field-error" id={`${name}-error`}>{errors[name].join(' ')}</p> : null;

/**
 * Imagen principal, móvil o portada (D-83): muestra la guía, lee las medidas, rechaza las menores al mínimo y, si
 * la proporción no es la pedida, ofrece un recorte con encuadre ajustable. Sube el resultado a /media.
 */
function ImageSlot({slot, title, label, guide, value, onChange, disabled}) {
  const [loaded, setLoaded] = useState(null);
  const [frame, setFrame] = useState({x: 0.5, y: 0.5, zoom: 1});
  const [info, setInfo] = useState('');
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  async function upload(file, size) {
    const form = new FormData();
    form.append('purpose', 'announcement');
    form.append('file', file);
    const media = await request('/media', form);
    onChange({id: media.data.id, url: media.data.url, width: size.width, height: size.height});
    setSuccess(`Imagen lista: ${size.width} × ${size.height} px.`);
    setLoaded(null);
  }
  async function encodeAndUpload(source, rect) {
    const size = outputSize(rect, slot);
    const blob = await encodeCrop(source.image, rect, size, MAX_BYTES);
    if (!blob) throw new Error('No pudimos dejar la imagen en 600 KB. Prueba con otra imagen.');
    await upload(new File([blob], `comunicado.${blob.type === 'image/webp' ? 'webp' : 'jpg'}`, {type: blob.type}), size);
  }
  async function run(task) {
    setBusy(true);
    try { await task(); } catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }
  async function choose(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setError(''); setWarning(''); setSuccess(''); setInfo(''); setLoaded(null);
    if (!file) return;
    await run(async () => {
      const image = await readImage(file);
      const result = analyzeImage({width: image.width, height: image.height, size: file.size, type: file.type}, slot);
      setInfo(`Medidas: ${result.summary}`);
      if (result.error) { setError(result.error); return; }
      setWarning(result.warning);
      if (result.crop) { setFrame({x: 0.5, y: 0.5, zoom: 1}); setLoaded(image); return; }
      if (result.encode) await encodeAndUpload(image, cropRect(image.width, image.height, slot));
      else await upload(file, {width: image.width, height: image.height});
    });
  }
  const rect = loaded && cropRect(loaded.width, loaded.height, slot, frame);
  const widest = loaded && cropRect(loaded.width, loaded.height, slot);
  const zoomLimit = loaded ? widest.width / cropRect(loaded.width, loaded.height, slot, {zoom: 100}).width : 1;
  const percent = (part, whole) => `${(part / whole) * 100}%`;
  const id = `announcement-${slot}-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return <div className="image-slot" aria-busy={busy}>
    <div className="image-slot-head">
      <span className="image-slot-title">{title}</span>
      <p className="muted">{guide}</p>
    </div>
    <div className="image-slot-row">
      {value?.url ? <img className="image-slot-thumb" src={value.url} alt=""/> : <span className="image-slot-thumb is-empty" aria-hidden="true">{slot === 'mobile' ? '3:2' : '3:1'}</span>}
      <label className="button outline image-slot-pick" htmlFor={id}>{value ? 'Cambiar imagen' : 'Elegir imagen'}</label>
      <input id={id} className="sr-only" type="file" aria-label={label} accept="image/jpeg,image/webp,image/png" disabled={disabled || busy} onChange={choose}/>
      {value && <button type="button" className="text-button" disabled={busy} onClick={() => { onChange(null); setSuccess(''); }}>Quitar imagen</button>}
    </div>
    {busy && <output className="muted">Procesando imagen…</output>}
    {info && <p className="muted">{info}</p>}
    {warning && <p className="image-slot-warning">{warning}</p>}
    {error && <p className="error" role="alert">{error}</p>}
    {success && <output className="notice">{success}</output>}
    {loaded && <div className="image-crop">
      <div className="image-crop-stage" style={{aspectRatio: `${loaded.width} / ${loaded.height}`, maxWidth: `${(360 * loaded.width) / loaded.height}px`}}>
        <img src={loaded.url} alt=""/>
        <div className="image-crop-frame" style={{left: percent(rect.x, loaded.width), top: percent(rect.y, loaded.height),
          width: percent(rect.width, loaded.width), height: percent(rect.height, loaded.height)}}><span>Recorte {slot === 'mobile' ? '3:2' : '3:1'}</span></div>
      </div>
      <div className="image-crop-controls">
        <label>Encuadre horizontal<input type="range" min="0" max="1" step="0.01" value={frame.x} disabled={rect.width >= loaded.width}
          onChange={event => setFrame({...frame, x: Number(event.target.value)})}/></label>
        <label>Encuadre vertical<input type="range" min="0" max="1" step="0.01" value={frame.y} disabled={rect.height >= loaded.height}
          onChange={event => setFrame({...frame, y: Number(event.target.value)})}/></label>
        <label>Acercar<input type="range" min="1" max={zoomLimit} step="0.01" value={frame.zoom} disabled={zoomLimit <= 1}
          onChange={event => setFrame({...frame, zoom: Number(event.target.value)})}/></label>
        <p className="muted">Recorte de {rect.width} × {rect.height} px; se guarda en {outputSize(rect, slot).width} × {outputSize(rect, slot).height} px.</p>
        <button type="button" className="button primary" disabled={busy} onClick={() => run(() => encodeAndUpload(loaded, rect))}>Usar este recorte</button>
      </div>
    </div>}
  </div>;
}

function ChoiceGroup({name, label, options, value, onChange, cards = true}) {
  return <div role="radiogroup" aria-label={label} className={cards ? 'choice-cards' : 'choice-chips'}>
    {options.map(option => <label key={option.value} className={'choice' + (value === option.value ? ' is-selected' : '')}>
      <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)}/>
      <strong>{option.label}</strong>{option.hint && <small>{option.hint}</small>}
    </label>)}
  </div>;
}

/** Editor en dos columnas (D-83): formulario por secciones y vista previa en vivo del carrusel. */
export default function AnnouncementEditor({item, onClose, onSaved}) {
  const [v, setV] = useState(() => initialValue(item));
  const [saved, setSaved] = useState(item?.id ? item : null);
  const [open, setOpen] = useState({content: true, audience: true, schedule: true, link: true});
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [viewport, setViewport] = useState('desktop');
  const [restored, setRestored] = useState(false);
  const heading = useRef(null);
  // Al abrir el editor desde un listado con scroll, el foco va al título: se ve el inicio y el lector de pantalla lo anuncia.
  useEffect(() => { heading.current?.focus(); }, []);
  const set = (name, value) => setV(current => ({...current, [name]: value}));
  const bind = name => ({value: v[name], onChange: event => set(name, event.target.value)});
  // D-84: el publicado se edita con «Guardar cambios»; el retirado queda en solo lectura hasta restaurarlo.
  const phase = saved ? phaseOf(saved) : 'draft';
  const retired = phase === 'retired';
  const published = ['active', 'scheduled', 'expired'].includes(phase);

  async function restore() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const result = await request(`/admin/announcements/${saved.id}/restoration`, {expected_version: saved.version});
      setSaved(result.data);
      setRestored(true);
    } catch (failure) {
      setError(failure.message);
    } finally { setBusy(false); }
  }

  async function save(publish) {
    if (busy) return;
    const invalid = validateCarousel(v);
    setErrors(invalid); setError('');
    if (Object.keys(invalid).length) {
      setError('Revisa los campos indicados.');
      setOpen(current => Object.fromEntries(Object.entries(current).map(([key, state]) => [key, state || SECTION_FIELDS[key].some(field => invalid[field])])));
      return;
    }
    setBusy(true);
    try {
      const payload = toPayload(v);
      const result = saved?.id ? await request(`/admin/announcements/${saved.id}`, {...payload, expected_version: saved.version}, 'PATCH')
        : await request('/admin/announcements', payload, 'POST');
      setSaved(result.data);
      if (publish) await request(`/admin/announcements/${result.data.id}/publication`, {expected_version: result.data.version});
      onSaved(publish ? 'Comunicado publicado.' : published ? 'Cambios guardados.' : 'Borrador guardado.');
    } catch (failure) {
      setErrors(failure.fields || {});
      setError(failure.message);
    } finally { setBusy(false); }
  }

  const preview = {id: 'vista-previa', source: v.source, kind: v.kind, title: v.title, alt_text: v.alt_text,
    image_url: v.image?.url || null, mobile_image_url: v.source === 'image' ? v.mobile?.url || null : null,
    genially_url: v.source === 'genially' ? normalizeGenially(v.genially_url) : null, link_url: v.link_url || null, link_label: v.link_label || null};
  const section = (key, title, children) => <details key={key} open={open[key]} onToggle={event => { const state = event.currentTarget.open; setOpen(current => ({...current, [key]: state})); }}>
    <summary>{title}</summary><div className="announcement-section">{children}</div>
  </details>;

  return <section className="s02-panel announcement-editor-page" aria-labelledby="announcement-editor-title">
    <header className="announcement-editor-head">
      <button type="button" className="text-button" onClick={onClose}>← Volver al listado</button>
      <h2 id="announcement-editor-title" ref={heading} tabIndex={-1}>{item?.id ? 'Editar comunicado' : 'Crear comunicado'}</h2>
    </header>
    <div className="announcement-editor-layout">
      <form className="announcement-editor-form" noValidate aria-busy={busy} onSubmit={event => { event.preventDefault(); if (!retired) save(false); }}>
        {retired && <div className="announcement-state-note is-retired" role="note">
          <p>Este comunicado está retirado. Restáuralo como borrador para corregirlo y publicarlo de nuevo.</p>
          <button type="button" className="button primary" disabled={busy} onClick={restore}>Restaurar como borrador</button>
        </div>}
        {phase === 'active' && <p className="announcement-state-note is-live" role="note">Los cambios se verán de inmediato en los paneles.</p>}
        <Notice success={restored && !retired ? 'Restaurado como borrador: ya puedes corregirlo y publicarlo.' : ''}/>
        <fieldset className="announcement-editor-fields" disabled={retired}>
        {section('content', SECTIONS[0][1], <>
          <span className="choice-label">Origen</span>
          <ChoiceGroup name="source" label="Origen del comunicado" options={SOURCES} value={v.source} onChange={value => set('source', value)}/>
          <Field name="title" label="Título interno" errors={errors} maxLength={120} {...bind('title')}/>
          <p className="muted field-help">Solo lo ve el equipo de administración.</p>
          <span className="choice-label">Tipo</span>
          <ChoiceGroup name="kind" label="Tipo" cards={false} value={v.kind} onChange={value => set('kind', value)}
            options={Object.entries(KIND_LABELS).map(([value, label]) => ({value, label}))}/>
          <FieldError errors={errors} name="kind"/>
          {v.source === 'image' ? <>
            <ImageSlot slot="main" title="Imagen principal" label="Imagen principal" guide={IMAGE_GUIDE} value={v.image} disabled={busy} onChange={value => set('image', value)}/>
            <FieldError errors={errors} name="image_media_id"/>
            <ImageSlot slot="mobile" title="Imagen móvil (opcional)" label="Imagen móvil" guide={MOBILE_GUIDE} value={v.mobile} disabled={busy} onChange={value => set('mobile', value)}/>
            <FieldError errors={errors} name="mobile_media_id"/>
          </> : <>
            <Field name="genially_url" label="Enlace de Genially" errors={errors} type="url" inputMode="url" placeholder="https://view.genially.com/…" {...bind('genially_url')}/>
            <p className="muted field-help">Solo se aceptan enlaces https://view.genially.com/&lt;código&gt;. Rota cada 12 s.</p>
            <ImageSlot slot="main" title="Imagen de portada (opcional)" label="Imagen de portada" value={v.image} disabled={busy} onChange={value => set('image', value)}
              guide="Se muestra mientras carga o si la presentación no carga. Mismas medidas que la imagen principal (3:1)."/>
            <FieldError errors={errors} name="image_media_id"/>
          </>}
          <Field name="alt_text" label="Texto alternativo" errors={errors}>
            <textarea rows={2} maxLength={250} {...bind('alt_text')}/>
          </Field>
          <p className="muted field-help">Escribe lo que dice la imagen: lo leen los lectores de pantalla.</p>
        </>)}
        {section('audience', SECTIONS[1][1], <>
          <ChoiceGroup name="audience" label="Audiencia" options={AUDIENCE_OPTIONS} value={v.audience} onChange={value => set('audience', value)}/>
          <FieldError errors={errors} name="audiences"/>
        </>)}
        {section('schedule', SECTIONS[2][1], <>
          <div className="announcement-dates-row">
            <Field name="starts_at" label="Inicio de vigencia" type="datetime-local" errors={errors} {...bind('starts_at')}/>
            <Field name="ends_at" label="Fin de vigencia" type="datetime-local" errors={errors} {...bind('ends_at')}/>
          </div>
          <div className="announcement-shortcuts" role="group" aria-label="Atajos de vigencia">
            {PERIODS.map(([period, label]) => <button key={period} type="button" onClick={() => set('ends_at', addPeriod(v.starts_at || toLocalInput(new Date()), period))}>{label}</button>)}
          </div>
          <p className="muted field-help">El lugar en el carrusel se ajusta en la pestaña «Orden del carrusel»; los nuevos entran al final.</p>
        </>)}
        {section('link', SECTIONS[3][1], <>
          <Field name="link_url" label="Enlace (opcional)" type="url" errors={errors} placeholder="https://…" {...bind('link_url')}/>
          <Field name="link_label" label="Etiqueta del botón" errors={errors} maxLength={40} {...bind('link_label')}/>
          <p className="muted field-help">Con enlace, un clic en la imagen lo abre en otra pestaña.</p>
        </>)}
        </fieldset>
        <Notice error={error}/>
        {!retired && <div className="announcement-editor-actions">
          {published
            ? <button type="submit" className="button primary" disabled={busy}>Guardar cambios</button>
            : <>
              <button type="submit" className="button outline" disabled={busy}>Guardar borrador</button>
              <button type="button" className="button primary" disabled={busy} onClick={() => save(true)}>Publicar</button>
            </>}
        </div>}
      </form>
      <aside className="announcement-preview-pane" role="region" aria-label="Vista previa">
        <div className="announcement-preview-head">
          <strong>Vista previa</strong>
          <div className="announcement-viewports">
            {[['desktop', 'Escritorio'], ['mobile', 'Móvil']].map(([value, label]) =>
              <button key={value} type="button" aria-pressed={viewport === value} onClick={() => setViewport(value)}>{label}</button>)}
          </div>
        </div>
        <div className={'announcement-preview-frame is-' + viewport}>
          <AnnouncementCarousel items={[preview]} preview viewport={viewport} safeZone label="Vista previa del carrusel"/>
        </div>
        <p className="muted">Así se verá en el Inicio de {AUDIENCE_OPTIONS.find(option => option.value === v.audience)?.hint.toLowerCase() || 'la audiencia elegida'}. La zona punteada marca el 80 % central.</p>
      </aside>
    </div>
  </section>;
}
