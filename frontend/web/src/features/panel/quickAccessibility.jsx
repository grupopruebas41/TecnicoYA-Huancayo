import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import React, {createContext, useContext, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {request} from '../administration/http';
import useDismiss from './useDismiss';
import Icon from './icons';

/**
 * Accesibilidad del cliente (Fase 4 «Aa»; Fase 5, D-97): ajustes guardados en la cuenta (GET/PUT /client/me/preferences)
 * y aplicados con atributos en <html> antes de pintar (useLayoutEffect), sin parpadeo. localStorage es solo el respaldo
 * del equipo, con try/catch. Nunca se pregunta ni se guarda qué discapacidad tiene la persona: solo preferencias de uso.
 */
export const TEXT_SIZES = [100, 115, 130, 150];
export const DEFAULT_PREFS = {
  text_size: 100, high_contrast: false, readable_font: false, reduce_motion: false,
  strong_focus: false, read_aloud: false, dictation: false, simple_mode: false,
};
export const TOGGLES = [
  ['high_contrast', 'Alto contraste', 'Colores con más contraste en todo el panel.'],
  ['readable_font', 'Fuente legible y más espacio', 'Letra Atkinson Hyperlegible, interlineado 1,6 y más espacio entre letras.'],
  ['reduce_motion', 'Reducir animaciones', 'Pausa los carruseles, los videos y las transiciones.'],
  ['strong_focus', 'Foco grueso y enlaces subrayados', 'Un contorno de 3 px marca dónde estás al usar el teclado.'],
  ['read_aloud', 'Leer en voz alta', 'Agrega un botón para escuchar la pantalla.'],
  ['dictation', 'Dictar por voz', 'Muestra un micrófono en «¿Qué se malogró?».'],
  ['simple_mode', 'Modo simple', 'Botones más grandes y menos elementos decorativos.'],
];
const KEY = 'tecnicoya.accesibilidad';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const write = value => { try { localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* sin almacenamiento */ } };
// Acepta también el formato de la Fase 4 ({textSize, contrast}).
export function sanitize(value = {}) {
  const legacy = {text_size: value.textSize, high_contrast: value.contrast};
  const merged = {...DEFAULT_PREFS, ...Object.fromEntries(Object.entries(legacy).filter(([, v]) => v !== undefined)), ...value};
  const result = {text_size: TEXT_SIZES.includes(Number(merged.text_size)) ? Number(merged.text_size) : 100};
  Object.keys(DEFAULT_PREFS).filter(key => key !== 'text_size').forEach(key => { result[key] = merged[key] === true; });
  return result;
}

export function applyAccessibility(prefs) {
  const root = document.documentElement;
  root.dataset.textSize = String(prefs.text_size);
  const flags = {contrast: prefs.high_contrast && 'high', font: prefs.readable_font && 'readable', motion: prefs.reduce_motion && 'reduce',
    focus: prefs.strong_focus && 'strong', simple: prefs.simple_mode && 'on'};
  Object.entries(flags).forEach(([name, value]) => { if (value) root.dataset[name] = value; else delete root.dataset[name]; });
}
const clear = () => ['textSize', 'contrast', 'font', 'motion', 'focus', 'simple'].forEach(name => delete document.documentElement.dataset[name]);

/** Movimiento reducido por ajuste de la cuenta o del sistema (carruseles, tutorial). */
export const prefersReducedMotion = () => document.documentElement.dataset.motion === 'reduce'
  || Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);

/** Estado compartido por «Aa», la pestaña Accesibilidad, la bienvenida y el dictado. save=false no escribe en la cuenta. */
export function useAccessibility(user = null) {
  // D-105: los tres roles guardan sus ajustes en la cuenta (/me/preferences); client_profile queda por compatibilidad.
  const server = user?.preferences?.accessibility || user?.client_profile?.preferences?.accessibility;
  const [prefs, setPrefs] = useState(() => sanitize(server || read()));
  const [error, setError] = useState('');
  useLayoutEffect(() => { applyAccessibility(prefs); write(prefs); }, [prefs]);
  useLayoutEffect(() => clear, []);
  function update(patch, {save = true} = {}) {
    setPrefs(current => sanitize({...current, ...patch}));
    if (!save || !user) return Promise.resolve();
    setError('');
    return Promise.resolve().then(() => request('/me/preferences', {accessibility: patch}, 'PUT'))
      .catch(failure => setError(failure?.message || 'Aplicamos el ajuste en este equipo, pero no pudimos guardarlo en tu cuenta.'));
  }
  return [prefs, update, error];
}

export const AccessibilityContext = createContext({prefs: DEFAULT_PREFS, update: () => Promise.resolve()});
export const useAccessibilityContext = () => useContext(AccessibilityContext);

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';

/** Lee en voz alta el contenido de la sección (es-PE) con el sintetizador del navegador; un segundo toque lo detiene. */
export function useReader() {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => () => { if (canSpeak()) window.speechSynthesis.cancel(); }, []);
  function toggle(selector = '.panel-content') {
    if (!canSpeak()) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const node = document.querySelector(selector);
    const text = (node?.innerText || node?.textContent || '').trim();
    if (!text) return;
    const utterance = new window.SpeechSynthesisUtterance(text.slice(0, 4000));
    utterance.lang = 'es-PE';
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }
  return [speaking, toggle];
}

/** Tamaño de texto, alto contraste y leer en voz alta; con full, todos los ajustes con su descripción. */
export function AccessibilityControls({prefs, onChange, reader, full = false}) {
  const [speaking, toggleReading] = reader;
  const toggles = full ? TOGGLES : TOGGLES.filter(([key]) => key === 'high_contrast');
  return <div className="a11y-controls">
    <fieldset className="a11y-sizes">
      <legend>Tamaño de texto</legend>
      <div role="group" aria-label="Tamaño de texto">
        {TEXT_SIZES.map(size => <button key={size} type="button" aria-pressed={prefs.text_size === size}
          onClick={() => onChange({text_size: size})}>{size} %</button>)}
      </div>
    </fieldset>
    {toggles.map(([key, label, help]) => <label key={key} className="a11y-switch">
      <input type="checkbox" role="switch" checked={prefs[key]} aria-describedby={full ? `ayuda-${key}` : undefined}
        onChange={event => onChange({[key]: event.target.checked})}/>
      <span>{label}{full && <small id={`ayuda-${key}`} className="muted">{help}</small>}</span>
    </label>)}
    {/* Corrección del #57: botón real y visible, con ícono de parlante; mientras lee cambia a «Detener lectura». */}
    {!full && <button type="button" className={'a11y-read' + (speaking ? ' is-active' : '')} aria-pressed={speaking}
      disabled={!canSpeak()} onClick={() => toggleReading()}>
      <Icon name="announcements"/><span>{speaking ? 'Detener lectura' : 'Leer la pantalla en voz alta'}</span>
    </button>}
    {!full && !canSpeak() && <p className="muted a11y-note">Tu navegador no permite leer en voz alta.</p>}
  </div>;
}

/** Botón «Aa» de la barra superior con su panel desplegable. */
export function QuickAccessibility({prefs, onChange, reader, onMore}) {
  const [open, setOpen] = useState(false);
  const button = useRef(null);
  const root = useDismiss(open, () => setOpen(false));
  function close() { setOpen(false); button.current?.focus(); }
  return <div className="panel-a11y" ref={root} onKeyDown={event => { if (event.key === 'Escape' && open) close(); }}>
    <button ref={button} type="button" className="panel-icon-button panel-a11y-button" aria-label="Accesibilidad rápida"
      aria-expanded={open} aria-controls="panel-accesibilidad" onClick={() => setOpen(!open)}><span aria-hidden="true">Aa</span></button>
    {open && <section id="panel-accesibilidad" className="panel-popover panel-a11y-popover" aria-label="Accesibilidad rápida">
      <AccessibilityControls prefs={prefs} onChange={onChange} reader={reader}/>
      {onMore
        ? <button type="button" className="text-button a11y-more" onClick={() => { setOpen(false); onMore(); }}>Más ajustes en tu cuenta</button>
        : <p className="muted">Más ajustes en tu cuenta, pestaña Accesibilidad.</p>}
    </section>}
  </div>;
}
