import React, {useEffect, useRef, useState} from 'react';
import useDismiss from './useDismiss';

/**
 * Fase 4 del panel final: accesibilidad rápida («Aa»). Tamaño de texto, alto contraste y leer en voz alta.
 * Se aplica con atributos en <html> y se recuerda en este equipo (localStorage con try/catch). La Fase 5 los guarda en la
 * cuenta (D-97). Nunca se pregunta ni se guarda qué discapacidad tiene la persona: solo preferencias de uso.
 */
export const TEXT_SIZES = [100, 115, 130, 150];
const KEY = 'tecnicoya.accesibilidad';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const write = value => { try { localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* sin almacenamiento */ } };
const sanitize = value => ({
  textSize: TEXT_SIZES.includes(Number(value.textSize)) ? Number(value.textSize) : 100,
  contrast: value.contrast === true,
});

export function applyAccessibility(prefs) {
  const root = document.documentElement;
  root.dataset.textSize = String(prefs.textSize);
  if (prefs.contrast) root.dataset.contrast = 'high'; else delete root.dataset.contrast;
}

/** Estado compartido por el botón «Aa» y la pestaña Accesibilidad del panel del avatar. */
export function useAccessibility() {
  const [prefs, setPrefs] = useState(() => sanitize(read()));
  useEffect(() => {
    applyAccessibility(prefs);
    write(prefs);
  }, [prefs]);
  useEffect(() => () => { delete document.documentElement.dataset.textSize; delete document.documentElement.dataset.contrast; }, []);
  return [prefs, patch => setPrefs(current => sanitize({...current, ...patch}))];
}

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

/** Controles reutilizables: tamaño de texto, alto contraste y, si el navegador puede, leer en voz alta. */
export function AccessibilityControls({prefs, onChange, reader}) {
  const [speaking, toggleReading] = reader;
  return <div className="a11y-controls">
    <fieldset className="a11y-sizes">
      <legend>Tamaño de texto</legend>
      <div role="group" aria-label="Tamaño de texto">
        {TEXT_SIZES.map(size => <button key={size} type="button" aria-pressed={prefs.textSize === size}
          onClick={() => onChange({textSize: size})}>{size} %</button>)}
      </div>
    </fieldset>
    <label className="a11y-switch">
      <input type="checkbox" role="switch" checked={prefs.contrast} onChange={event => onChange({contrast: event.target.checked})}/>
      <span>Alto contraste</span>
    </label>
    {canSpeak() && <button type="button" className="button outline a11y-read" aria-pressed={speaking} onClick={() => toggleReading()}>
      {speaking ? 'Detener la lectura' : 'Leer la pantalla en voz alta'}
    </button>}
  </div>;
}

/** Botón «Aa» de la barra superior con su panel desplegable. */
export function QuickAccessibility({prefs, onChange, reader}) {
  const [open, setOpen] = useState(false);
  const button = useRef(null);
  const root = useDismiss(open, () => setOpen(false));
  function close() { setOpen(false); button.current?.focus(); }
  return <div className="panel-a11y" ref={root} onKeyDown={event => { if (event.key === 'Escape' && open) close(); }}>
    <button ref={button} type="button" className="panel-icon-button panel-a11y-button" aria-label="Accesibilidad rápida"
      aria-expanded={open} aria-controls="panel-accesibilidad" onClick={() => setOpen(!open)}><span aria-hidden="true">Aa</span></button>
    {open && <section id="panel-accesibilidad" className="panel-popover panel-a11y-popover" aria-label="Accesibilidad rápida">
      <AccessibilityControls prefs={prefs} onChange={onChange} reader={reader}/>
      <p className="muted">Más ajustes en tu cuenta, pestaña Accesibilidad.</p>
    </section>}
  </div>;
}
