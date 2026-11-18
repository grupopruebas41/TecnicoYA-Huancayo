import React, {useCallback, useEffect, useRef, useState} from 'react';
import {request} from '../administration/http';
import Icon from '../panel/icons';
import {Alerts, DropZone, SectionCard, SelectField, apiError} from './businessCommon';

/** Color e ícono de cada estado (D-106): el estado siempre va con ícono y texto. */
export const DOCUMENT_TONE = {
  received: ['info', 'upload'], in_review: ['warn', 'clock'], approved: ['ok', 'check'], observed: ['danger', 'alert'],
  missing: ['warn', 'plus'], not_needed: ['muted', 'check'],
};
const GENERAL = {
  approved: ['ok', 'verify', 'Tu perfil está verificado. Los clientes ven la insignia «Verificado».'],
  in_review: ['info', 'clock', 'El equipo está revisando tus documentos. Te avisaremos en la campana.'],
  missing: ['warn', 'alert', 'Sube los documentos que faltan para que podamos revisar tu perfil.'],
  observed: ['danger', 'alert', 'El equipo dejó una observación. Corrige lo indicado y pide una nueva revisión.'],
};
const ICONS = {identity: 'profile', certificate: 'book'};
const when = iso => new Intl.DateTimeFormat('es-PE', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Lima'}).format(new Date(iso));

/** Doble validación del adjunto: tipo de la lista y archivo ya subido; el servidor vuelve a validar (DocumentFile). */
export function validateDocument(type, media, types, limits) {
  if (!types.some(item => item.value === type)) return 'Elige el tipo de documento de la lista.';
  if (!media) return 'Sube el archivo del documento.';
  if (limits && limits.current >= limits.max) return `Ya tienes ${limits.max} documentos vigentes; no puedes agregar más.`;
  return '';
}

function StateTag({state, label}) {
  const [tone, icon] = DOCUMENT_TONE[state] || ['muted', 'help'];
  return <span className="tech-status" data-tone={tone}><Icon name={icon}/>{label}</span>;
}

/**
 * Verificación (Fase T4, D-106 y D-107): una tarjeta por documento obligatorio con su estado (Recibido, En revisión,
 * Aprobado u Observado con la nota), «Tipo de documento» como lista y subida con arrastrar y soltar y barra de progreso.
 * El estado general es el mismo del menú. Los documentos solo los ven el técnico y el equipo que los revisa.
 */
export default function VerificationPage({onSaved}) {
  const [state, setState] = useState({data: null, error: null});
  const [type, setType] = useState('');
  const [media, setMedia] = useState(null);
  const [notice, setNotice] = useState({});
  const [busy, setBusy] = useState(false);
  const [uploader, setUploader] = useState(0);
  const form = useRef(null);
  const load = useCallback(async () => {
    try { setState({data: (await request('/technicians/me/verification'))?.data || null, error: null}); }
    catch (error) { setState(current => ({...current, error})); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const data = state.data;
  const types = data?.types || [];

  function prepare(label) {
    setType(types.find(item => item.value === label)?.value || '');
    setNotice({});
    form.current?.scrollIntoView?.({block: 'start'});
    form.current?.querySelector('select')?.focus();
  }
  async function attach(event) {
    event.preventDefault();
    const invalid = validateDocument(type, media, types, data?.limits);
    if (invalid) { setNotice({error: invalid}); return; }
    setBusy(true); setNotice({});
    try {
      await request('/technicians/me/documents', {media_id: media.id, document_type: type});
      setMedia(null); setType(''); setUploader(value => value + 1);
      await load();
      setNotice({success: `Recibimos tu «${type}». Lo verás como «Recibido» hasta que el equipo lo revise.`});
      onSaved?.();
    } catch (failure) {
      setNotice({error: apiError(failure, 'No pudimos adjuntar el documento. Inténtalo de nuevo.')});
    } finally { setBusy(false); }
  }
  async function requestReview() {
    setBusy(true); setNotice({});
    try {
      await request('/technicians/me/verification-request', {expected_version: data.version});
      await load();
      setNotice({success: 'Pediste una nueva revisión. Te avisaremos en la campana cuando el equipo decida.'});
      onSaved?.();
    } catch (failure) {
      await load();
      setNotice({error: apiError(failure, 'No pudimos pedir la revisión. Inténtalo de nuevo.')});
    } finally { setBusy(false); }
  }

  const [tone, icon, explanation] = GENERAL[data?.state] || GENERAL.missing;
  return <section className="panel-page tech-page" aria-labelledby="tech-verification-title">
    <header className="client-page-head">
      <h2 id="tech-verification-title">Verificación</h2>
      <p className="muted"><Icon name="lock"/> Tus documentos solo los ves tú y el equipo que los revisa. Nunca aparecen en tu perfil público.</p>
    </header>
    {state.error && <p className="error" role="alert">{state.error.message || 'No pudimos cargar tu verificación.'}</p>}
    {!data && !state.error && <div className="panel-card tech-skeleton" role="status">Cargando tu verificación…</div>}
    {data && <>
      <div className="panel-card tech-verify-banner" data-tone={tone}>
        <span className="tech-card-icon" aria-hidden="true"><Icon name={icon}/></span>
        <div>
          <p className="tech-verify-state">Estado: <strong>{data.label}</strong></p>
          <p className="muted">{explanation}</p>
          {data.last_review && data.state === 'observed' && <p className="tech-verify-note"><strong>Observación del equipo:</strong> {data.last_review.reason}</p>}
        </div>
        {data.can_request_review && <button type="button" className="button primary" disabled={busy} onClick={requestReview}>Pedir nueva revisión</button>}
      </div>
      <Alerts notice={notice}/>
      <ul className="tech-docs" aria-label="Documentos obligatorios">
        {data.required.map(item => <li key={item.key} className="tech-doc" data-state={item.state}>
          <div className="tech-doc-head">
            <span className="tech-card-icon" aria-hidden="true"><Icon name={ICONS[item.key] || 'news'}/></span>
            <div><h3>{item.label}</h3><small className="muted">Obligatorio</small></div>
            <StateTag state={item.state} label={item.state_label}/>
          </div>
          {item.document ? <p className="tech-doc-file"><Icon name="news"/>
            <a href={item.document.url} target="_blank" rel="noreferrer">{item.document.file_name || item.document.document_type}</a>
            <span className="muted">· subido el {when(item.document.uploaded_at)}</span></p>
            : <p className="muted">{item.state === 'not_needed' ? 'Tu perfil ya está verificado; no hace falta subirlo.' : 'Todavía no lo subes.'}</p>}
          {item.note && <p className="tech-doc-note"><Icon name="alert"/> {item.note}</p>}
          {['missing', 'observed'].includes(item.state) && <button type="button" className="button outline" onClick={() => prepare(item.label)}>
            <Icon name="upload"/> {item.state === 'observed' ? 'Subir otra vez' : 'Subir documento'}</button>}
        </li>)}
      </ul>
      {data.others.length > 0 && <SectionCard icon="news" title="Otros documentos" id="tech-other-docs">
        <ul className="tech-doc-list">
          {data.others.map(document => <li key={document.id}>
            <a href={document.url} target="_blank" rel="noreferrer">{document.document_type}</a>
            <span className="muted">· {when(document.uploaded_at)}</span>
            <StateTag state={document.state} label={document.state_label}/>
            {document.note && <span className="tech-doc-note"><Icon name="alert"/> {document.note}</span>}
          </li>)}
        </ul>
      </SectionCard>}
      <form ref={form} className="panel-card tech-section tech-doc-upload" onSubmit={attach} noValidate aria-labelledby="tech-upload-title">
        <h3 id="tech-upload-title"><Icon name="upload"/> Adjuntar un documento</h3>
        <p className="muted">Llevas {data.limits.current} de {data.limits.max} documentos vigentes.</p>
        <SelectField label="Tipo de documento" value={type} onChange={value => { setType(value); setNotice({}); }}
          hint={types.find(item => item.value === type)?.hint}>
          <option value="">Elige el tipo de documento</option>
          {types.map(item => <option key={item.value} value={item.value}>{item.value}{item.required ? ' (obligatorio)' : ''}</option>)}
        </SelectField>
        <DropZone key={uploader} purpose="document" label="Archivo del documento" onUploaded={file => { setMedia(file); setNotice({}); }}
          disabled={data.limits.current >= data.limits.max}/>
        <div className="tech-save">
          <button type="submit" className="button primary" disabled={busy || !media} aria-busy={busy}>{busy ? 'Adjuntando…' : 'Adjuntar documento'}</button>
        </div>
      </form>
    </>}
  </section>;
}
