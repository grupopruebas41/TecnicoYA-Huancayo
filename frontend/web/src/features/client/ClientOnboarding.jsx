import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {request} from '../administration/http';
import Icon from '../panel/icons';
import {prefersReducedMotion, useAccessibilityContext} from '../panel/quickAccessibility';
import {useShell} from '../panel/shellContext';

/**
 * Fase 5 del panel final (D-97): bienvenida «¿Cómo prefieres usar TécnicoYa?» y mini tutorial de 4 pasos, solo la primera
 * vez. Las tarjetas están redactadas como preferencias y nunca se guarda cuál se eligió: solo los ajustes que aplica.
 * Omitir o guardar marca onboarding_completed; terminar u omitir el tutorial marca tour_completed. No vuelven a salir.
 */
export const WELCOME_CARDS = [
  ['grande', 'Letra grande y alto contraste', 'Texto al 130 % y colores más marcados.', {text_size: 130, high_contrast: true}, 'search'],
  ['lectura', 'Lectura más fácil', 'Fuente legible y botón para escuchar la pantalla.', {readable_font: true, read_aloud: true}, 'book'],
  ['teclado', 'Uso teclado o voz', 'Foco grueso y micrófono para dictar.', {strong_focus: true, dictation: true}, 'menu'],
  ['simple', 'Pantalla más simple', 'Botones grandes y menos adornos.', {simple_mode: true}, 'catalog'],
  ['movimiento', 'Menos movimiento', 'Sin carruseles ni transiciones.', {reduce_motion: true}, 'clock'],
];

export const TOUR_STEPS = [
  {title: 'Servicios', text: 'Servicios: pide, busca y sigue tus solicitudes.', targets: ['.panel-sidebar nav [role=group]'], menu: true},
  {title: 'Nueva solicitud', text: 'Nueva solicitud: cuéntanos qué se malogró y te conectamos con técnicos verificados.',
    targets: ['.panel-sidebar nav .panel-nav-item[data-section="new"]'], menu: true},
  {title: 'Campana y cuenta', text: 'Notificaciones, tu cuenta y accesibilidad.', targets: ['.panel-actions']},
  {title: 'Accesibilidad rápida', text: 'Con «Aa» cambias el tamaño de texto, el contraste o escuchas la pantalla.', targets: ['.panel-a11y-button']},
];

const save = body => Promise.resolve().then(() => request('/me/preferences', body, 'PUT')).catch(() => null);

/** Atrapa Tab dentro del diálogo y cierra con Esc. */
function trap(root, onEscape) {
  return event => {
    if (event.key === 'Escape') { event.preventDefault(); onEscape(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...root.current.querySelectorAll('button:not(:disabled)')];
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
}

export function WelcomeDialog({onDone}) {
  const {update} = useAccessibilityContext();
  const [chosen, setChosen] = useState([]);
  const root = useRef(null);
  useEffect(() => { root.current?.querySelector('.welcome-card')?.focus(); }, []);
  const toggle = id => setChosen(current => (current.includes(id) ? current.filter(item => item !== id) : [...current, id]));
  async function finish(apply) {
    const settings = apply ? Object.assign({}, ...WELCOME_CARDS.filter(([id]) => chosen.includes(id)).map(card => card[3])) : {};
    if (Object.keys(settings).length) update(settings, {save: false});
    await save({...(Object.keys(settings).length ? {accessibility: settings} : {}), onboarding_completed: true});
    onDone();
  }
  return <div className="onboarding-overlay">
    <dialog open ref={root} className="welcome-dialog" aria-modal="true" aria-labelledby="welcome-title" aria-describedby="welcome-help"
      onKeyDown={trap(root, () => finish(false))}>
      <h2 id="welcome-title">¿Cómo prefieres usar TécnicoYa?</h2>
      <p id="welcome-help" className="muted">Elige lo que te acomode; puedes marcar varias. Lo cambias cuando quieras en tu cuenta, pestaña Accesibilidad.</p>
      <div className="welcome-cards" role="group" aria-label="Preferencias de uso">
        {WELCOME_CARDS.map(([id, title, text, , icon]) => <button key={id} type="button" className="welcome-card" aria-pressed={chosen.includes(id)}
          onClick={() => toggle(id)}>
          <span className="welcome-icon" aria-hidden="true"><Icon name={icon}/></span>
          <span><strong>{title}</strong><small>{text}</small></span>
          <span className="welcome-check" aria-hidden="true">{chosen.includes(id) ? <Icon name="check"/> : null}</span>
        </button>)}
        <button type="button" className="welcome-card is-none" aria-pressed={chosen.length === 0} onClick={() => setChosen([])}>
          <span className="welcome-icon" aria-hidden="true"><Icon name="check"/></span>
          <span><strong>Ninguna, continuar</strong><small>Usar TécnicoYa como viene.</small></span>
        </button>
      </div>
      <div className="welcome-actions">
        <button type="button" className="button outline" onClick={() => finish(false)}>Omitir</button>
        <button type="button" className="button primary" onClick={() => finish(true)}>Guardar y continuar</button>
      </div>
    </dialog>
  </div>;
}

function visibleTarget(selectors) {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    const box = element?.getBoundingClientRect();
    if (box && box.width > 0 && box.height > 0) return element;
  }
  return null;
}

const MARGIN = 12;
/**
 * Coloca la burbuja junto a la zona sin salir de la pantalla: abajo si cabe, si no arriba, si no a la derecha o a la
 * izquierda; en el último caso, centrada en la parte visible.
 */
export function placeBubble(box, size, viewport = {width: window.innerWidth, height: window.innerHeight}) {
  const {width: w, height: h} = size;
  const clampLeft = left => Math.max(MARGIN, Math.min(left, viewport.width - w - MARGIN));
  const clampTop = top => Math.max(MARGIN, Math.min(top, viewport.height - h - MARGIN));
  if (!box) return {top: clampTop((viewport.height - h) / 2), left: clampLeft((viewport.width - w) / 2), side: 'center'};
  if (box.bottom + MARGIN + h <= viewport.height - MARGIN) return {top: box.bottom + MARGIN, left: clampLeft(box.left), side: 'below'};
  if (box.top - MARGIN - h >= MARGIN) return {top: box.top - MARGIN - h, left: clampLeft(box.left), side: 'above'};
  if (box.right + MARGIN + w <= viewport.width - MARGIN) return {top: clampTop(box.top), left: box.right + MARGIN, side: 'right'};
  if (box.left - MARGIN - w >= MARGIN) return {top: clampTop(box.top), left: box.left - MARGIN - w, side: 'left'};
  return {top: clampTop((viewport.height - h) / 2), left: clampLeft((viewport.width - w) / 2), side: 'center'};
}

/**
 * Tutorial (Fase 5; ajustes del 2026-11-10): en cada paso expande el menú contraído y abre el cajón del celular si la zona
 * está en el menú, desplaza la zona a la vista con scrollIntoView({block: 'center'}) (menú y página) y recalcula el
 * recuadro y la burbuja con resize y scroll. El fondo queda bloqueado; con «Reducir animaciones» todo es instantáneo.
 */
export function Tour({onDone, persist = true}) {
  const shell = useShell();
  const [step, setStep] = useState(0);
  const [box, setBox] = useState(null);
  const [place, setPlace] = useState(null);
  const root = useRef(null);
  const next = useRef(null);
  const current = TOUR_STEPS[step];
  useEffect(() => {
    shell.setTourMode(true);
    document.body.classList.add('is-touring');
    return () => { shell.setTourMode(false); shell.setTourDrawer(false); document.body.classList.remove('is-touring'); };
  }, []);
  useEffect(() => {
    const reduce = prefersReducedMotion();
    shell.setTourDrawer(Boolean(current.menu && window.innerWidth < 760));
    let last = '';
    const measure = () => {
      const rect = visibleTarget(current.targets)?.getBoundingClientRect();
      const next = rect ? {top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height} : null;
      const key = JSON.stringify(next);
      if (key !== last) { last = key; setBox(next); }
    };
    // Visto en las capturas: el cajón entra deslizándose y el menú se desplaza con suavidad, así que la zona se mide en
    // cada cuadro mientras el tutorial está abierto (solo actualiza si cambió). Cubre también resize y scroll.
    let frame;
    const loop = () => { measure(); frame = requestAnimationFrame(loop); };
    const start = requestAnimationFrame(() => {
      visibleTarget(current.targets)?.scrollIntoView?.({block: 'center', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth'});
      loop();
    });
    return () => { cancelAnimationFrame(start); cancelAnimationFrame(frame); };
  }, [current]);
  useLayoutEffect(() => {
    const size = {width: root.current?.offsetWidth || 320, height: root.current?.offsetHeight || 180};
    setPlace(placeBubble(box, size));
  }, [box, step]);
  useEffect(() => { next.current?.focus(); }, [step]);
  async function end() {
    if (persist) await save({tour_completed: true});
    onDone();
  }
  return <div className="tour-layer">
    {box && <div className="tour-highlight" aria-hidden="true"
      style={{top: box.top - 6, left: box.left - 6, width: box.width + 12, height: box.height + 12}}/>}
    <dialog open ref={root} className={'tour-bubble is-' + (place?.side || 'center')} style={place ? {top: place.top, left: place.left} : undefined}
      aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-text" onKeyDown={trap(root, end)}>
      <p className="tour-step" aria-live="polite">Paso {step + 1} de {TOUR_STEPS.length}</p>
      <h2 id="tour-title">{current.title}</h2>
      <p id="tour-text">{current.text}</p>
      <div className="tour-actions">
        <button type="button" className="text-button" onClick={end}>Omitir tutorial</button>
        <span>
          <button type="button" className="button outline" disabled={step === 0} onClick={() => setStep(step - 1)}>Atrás</button>
          <button ref={next} type="button" className="button primary"
            onClick={() => (step === TOUR_STEPS.length - 1 ? end() : setStep(step + 1))}>
            {step === TOUR_STEPS.length - 1 ? 'Terminar' : 'Siguiente'}</button>
        </span>
      </div>
    </dialog>
  </div>;
}

/** Muestra la bienvenida y luego el tutorial, solo si la cuenta no los marcó; replay repite el tutorial sin marcarlo. */
export default function ClientOnboarding({user, replay = false, onReplayEnd = () => {}}) {
  // D-105: preferencias comunes en /me; client_profile.preferences queda por compatibilidad.
  const prefs = user.preferences || user.client_profile?.preferences;
  const [stage, setStage] = useState(() => (!prefs ? null : !prefs.onboarding_completed_at ? 'welcome' : !prefs.tour_completed_at ? 'tour' : null));
  if (replay) return <Tour persist={false} onDone={onReplayEnd}/>;
  if (stage === 'welcome') return <WelcomeDialog onDone={() => setStage(prefs?.tour_completed_at ? null : 'tour')}/>;
  if (stage === 'tour') return <Tour onDone={() => setStage(null)}/>;
  return null;
}
