import React, {useCallback, useEffect, useId, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {request, uploadWithProgress} from '../administration/http';
import {validateUpload} from '../administration/sprint02Validation';
import Icon from '../panel/icons';
import './business.css';

/** Perfil propio (GET /technicians/me/profile) con recarga; lo comparten las páginas de Mi negocio (Fase T4). */
export function useOwnProfile() {
  const [state, setState] = useState({data: null, error: null, loading: true});
  const load = useCallback(async () => {
    try {
      const result = await request('/technicians/me/profile');
      setState({data: result?.data || null, error: null, loading: false});
      return result?.data || null;
    } catch (error) {
      setState(current => ({...current, error, loading: false}));
      return null;
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  return {...state, reload: load};
}

/** Tarjeta de una sección con su ícono en un círculo de color y su título, igual que el Inicio. */
export function SectionCard({icon, title, id, tone, children, className = '', actions = null}) {
  return <section className={'panel-card tech-section tech-biz-card ' + className} aria-labelledby={id} data-tone={tone}>
    <div className="tech-biz-head">
      <span className="tech-card-icon" aria-hidden="true"><Icon name={icon}/></span>
      <h3 id={id}>{title}</h3>
      {actions}
    </div>
    {children}
  </section>;
}

/** Contador de caracteres asociado al campo: avisa cerca del límite y al pasarlo (solo entonces lo anuncia). */
export function CharCounter({id, value, max, min = 0}) {
  const length = value.length;
  const state = length > max ? 'over' : length >= max * 0.9 ? 'near' : min && length < min ? 'short' : 'ok';
  const text = `${length} de ${max} caracteres` + (state === 'over' ? ` · te pasaste por ${length - max}` : '')
    + (state === 'short' ? ` · mínimo ${min} para completar tu perfil` : '');
  return <span id={id} className="tech-counter" data-state={state} aria-live={state === 'over' ? 'polite' : 'off'}>{text}</span>;
}

/** Campo de texto largo con su etiqueta, ayuda, contador y error. */
export function CountedText({label, value, onChange, max, min, rows = 4, hint, error, name, placeholder}) {
  const id = useId();
  return <label className="tech-field" htmlFor={id}>
    <span className="tech-field-label">{label}</span>
    {hint && <small className="muted" id={`${id}-hint`}>{hint}</small>}
    <textarea id={id} name={name} rows={rows} value={value} placeholder={placeholder} aria-invalid={Boolean(error) || value.length > max}
      aria-describedby={`${id}-count${hint ? ` ${id}-hint` : ''}${error ? ` ${id}-error` : ''}`} onChange={event => onChange(event.target.value)}/>
    <CharCounter id={`${id}-count`} value={value} max={max} min={min}/>
    {error && <span className="error" id={`${id}-error`}>{error}</span>}
  </label>;
}

/** Alertas de éxito y de error de cada operación (definición de terminado). */
export function Alerts({notice}) {
  return <>
    {notice?.error && <p className="error tech-alert" role="alert"><Icon name="alert"/> {notice.error}</p>}
    {notice?.success && <p className="notice tech-alert" role="status"><Icon name="check"/> {notice.success}</p>}
  </>;
}

/**
 * Zona de arrastrar y soltar (o elegir con el teclado) con el nombre del archivo y una barra de progreso real de la
 * subida. Valida tipo y tamaño antes de subir (doble validación con POST /media). onUploaded recibe el archivo subido.
 */
export function DropZone({purpose, label, onUploaded, disabled = false, compact = false}) {
  const input = useRef(null);
  const hintId = useId();
  const [over, setOver] = useState(false);
  const [state, setState] = useState({name: '', progress: null, error: ''});
  const accept = purpose === 'document' ? '.pdf,.jpg,.jpeg,.png' : '.jpg,.jpeg,.png,.webp';
  async function take(file) {
    if (!file || disabled) return;
    const invalid = validateUpload(file, purpose);
    if (invalid) { setState({name: file.name, progress: null, error: invalid}); return; }
    setState({name: file.name, progress: 0, error: ''});
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('purpose', purpose);
      const result = await uploadWithProgress(form, progress => setState(current => ({...current, progress})));
      setState({name: file.name, progress: 100, error: ''});
      onUploaded?.({...result.data, file_name: file.name, preview: purpose === 'document' ? null : result.data.url});
    } catch (error) {
      setState({name: file.name, progress: null, error: error.message || 'No pudimos subir el archivo.'});
    } finally {
      if (input.current) input.current.value = '';
    }
  }
  const uploading = state.progress !== null && state.progress < 100;
  return <div className={'tech-drop' + (over ? ' is-over' : '') + (compact ? ' is-compact' : '')} data-disabled={disabled || uploading}
    onDragOver={event => { event.preventDefault(); if (!disabled) setOver(true); }} onDragLeave={() => setOver(false)}
    onDrop={event => { event.preventDefault(); setOver(false); take(event.dataTransfer?.files?.[0]); }}>
    <span className="tech-drop-icon" aria-hidden="true"><Icon name="upload"/></span>
    <p className="tech-drop-text"><strong>{label}</strong>
      <span id={hintId} className="muted">Arrastra el archivo aquí o elígelo. {purpose === 'document' ? 'PDF, JPG o PNG' : 'JPG, PNG o WebP'}, hasta 5 MB.</span></p>
    <button type="button" className="button outline" disabled={disabled || uploading} aria-describedby={hintId}
      onClick={() => input.current?.click()}>Elegir archivo</button>
    <input ref={input} type="file" className="tech-file-input" accept={accept} tabIndex={-1} aria-hidden="true"
      data-testid={`drop-${purpose}`} onChange={event => take(event.target.files?.[0])}/>
    {state.name && <p className="tech-drop-file"><Icon name={purpose === 'document' ? 'news' : 'image'}/> <span>{state.name}</span></p>}
    {state.progress !== null && <div className="tech-progress" role="progressbar" aria-label={`Subida de ${state.name}`}
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={state.progress}>
      <span style={{width: `${state.progress}%`}}/>
      <small>{state.progress < 100 ? `Subiendo… ${state.progress} %` : 'Archivo subido'}</small>
    </div>}
    {state.error && <p className="error" role="alert">{state.error}</p>}
  </div>;
}

/** Botón de paso para el número de años (sin las flechas grises del navegador). */
export function Stepper({label, value, onChange, min = 0, max = 60, error}) {
  const id = useId();
  const number = Number.parseInt(value, 10);
  const set = next => onChange(String(Math.max(min, Math.min(max, next))));
  return <div className="tech-field">
    <label className="tech-field-label" htmlFor={id}>{label}</label>
    <div className="tech-stepper">
      <button type="button" aria-label={`Restar un año a ${label.toLowerCase()}`} disabled={!(number > min)}
        onClick={() => set((Number.isNaN(number) ? min : number) - 1)}>−</button>
      <input id={id} type="text" inputMode="numeric" value={value} aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined} onChange={event => onChange(event.target.value.replace(/[^0-9]/g, '').slice(0, 2))}/>
      <button type="button" aria-label={`Sumar un año a ${label.toLowerCase()}`} disabled={number >= max}
        onClick={() => set((Number.isNaN(number) ? min : number) + 1)}>+</button>
    </div>
    {error && <span className="error" id={`${id}-error`}>{error}</span>}
  </div>;
}

/** Lista desplegable con estilo propio (sin el control gris del navegador). */
export function SelectField({label, value, onChange, children, error, hint}) {
  const id = useId();
  return <label className="tech-field" htmlFor={id}>
    <span className="tech-field-label">{label}</span>
    {hint && <small className="muted">{hint}</small>}
    <span className="tech-selectbox"><select id={id} value={value} aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined} onChange={event => onChange(event.target.value)}>{children}</select>
      <Icon name="chevron"/></span>
    {error && <span className="error" id={`${id}-error`}>{error}</span>}
  </label>;
}

/** Mensaje legible de un error de la API (409: el perfil cambió en otra pestaña). */
export function apiError(failure, fallback) {
  if (failure?.status === 409) return 'Tu perfil cambió en otra pestaña. Cargamos lo último; revisa y guarda otra vez.';
  const fields = failure?.fields && Object.values(failure.fields).flat()[0];
  return fields || failure?.message || fallback;
}

const FOCUSABLE = 'button:not(:disabled), input:not(:disabled):not([tabindex="-1"]), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]';

/**
 * Diálogo centrado y sobrepuesto (como «Tu cuenta»): fondo oscurecido y desenfocado, entrada con escala y algo de
 * profundidad (se apaga con «Reducir animaciones»), hasta 760 px de ancho con desplazamiento interno y pantalla completa
 * en el celular. Foco atrapado; Esc o el fondo lo cierran y el foco vuelve al botón que lo abrió. El pie queda fijo.
 */
export function TechDialog({title, icon = 'plus', onClose, footer, children, busy = false}) {
  const titleId = useId();
  const root = useRef(null);
  const [opener] = useState(() => (typeof document === 'undefined' ? null : document.activeElement));
  useEffect(() => {
    const target = root.current?.querySelector('[data-autofocus]') || root.current?.querySelector(FOCUSABLE);
    target?.focus();
    document.body.classList.add('tech-dialog-open');
    return () => { document.body.classList.remove('tech-dialog-open'); opener?.focus?.(); };
  }, [opener]);
  function keys(event) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); if (!busy) onClose(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...root.current.querySelectorAll(FOCUSABLE)].filter(element => !element.closest('[hidden]'));
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  return createPortal(<div className="tech-dialog-overlay" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <div ref={root} className="tech-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={keys}>
      <header className="tech-dialog-head">
        <span className="tech-card-icon" aria-hidden="true"><Icon name={icon}/></span>
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="tech-dialog-close" aria-label="Cerrar" onClick={onClose} disabled={busy}><Icon name="close"/></button>
      </header>
      <div className="panel-content tech-dialog-body">{children}</div>
      {footer && <footer className="panel-content tech-dialog-foot">{footer}</footer>}
    </div>
  </div>, document.body);
}
