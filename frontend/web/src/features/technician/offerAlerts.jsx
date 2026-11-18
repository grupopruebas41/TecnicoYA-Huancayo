import React, {useEffect, useRef, useState, useSyncExternalStore} from 'react';
import {request} from '../administration/http';
import {useOffers} from '../offers/OffersInbox';
import Icon from '../panel/icons';
import {canSpeak, prefersReducedMotion} from '../panel/quickAccessibility';
import {soles} from './format';

/**
 * Fase T5 (D-112): avisos de una oferta nueva. Sonido corto (Web Audio), vibración si el equipo la tiene, destello en
 * pantalla (fijo, sin parpadeo, con «Reducir animaciones») y lectura de la oferta en voz alta (es-PE). Se guardan en la
 * cuenta (PUT /me/preferences, offer_alerts). Nada cambia el plazo de 10 minutos para responder.
 */
export const ALERT_DEFAULTS = {sound: false, vibration: false, flash: true, speak: false};
export const ALERT_OPTIONS = [
  ['sound', 'Sonido', 'Un sonido corto de dos tonos cuando llega una oferta.', 'announcements'],
  ['vibration', 'Vibración', 'El celular vibra dos veces, si tu equipo lo permite.', 'bolt'],
  ['flash', 'Destello en pantalla', 'Un borde de color alrededor de la pantalla; con «Reducir animaciones» no parpadea.', 'alert'],
  ['speak', 'Leer la oferta en voz alta', 'Lee el trabajo, el distrito, la tarifa y el tiempo para responder.', 'chat'],
];

let current = {...ALERT_DEFAULTS};
const listeners = new Set();
const emit = () => listeners.forEach(listener => listener());
export const sanitizeAlerts = value => Object.fromEntries(Object.keys(ALERT_DEFAULTS).map(key => [key, typeof value?.[key] === 'boolean' ? value[key] : ALERT_DEFAULTS[key]]));
/** Carga los avisos de la cuenta (al entrar el técnico). */
export function loadOfferAlerts(value) { current = sanitizeAlerts(value); emit(); }
export const getOfferAlerts = () => current;
export function useOfferAlertPrefs() {
  return useSyncExternalStore(listener => { listeners.add(listener); return () => listeners.delete(listener); }, () => current);
}
/** Guarda un cambio parcial en la cuenta; si falla, vuelve al valor anterior y propaga el error. */
export async function saveOfferAlerts(patch) {
  const previous = current;
  current = {...current, ...patch}; emit();
  try {
    const result = await request('/me/preferences', {offer_alerts: patch}, 'PUT');
    if (result?.data?.offer_alerts) { current = sanitizeAlerts(result.data.offer_alerts); emit(); }
  } catch (failure) { current = previous; emit(); throw failure; }
}

const vibrationAvailable = () => typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
const audioClass = () => (typeof window === 'undefined' ? null : window.AudioContext || window.webkitAudioContext || null);

/** Sonido corto de dos tonos (880 Hz y 1320 Hz, 0,15 s cada uno) con volumen bajo. */
export function playChime() {
  const Audio = audioClass();
  if (!Audio) return false;
  const context = new Audio();
  [[880, 0], [1320, 0.18]].forEach(([frequency, delay]) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.12;
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.start(context.currentTime + delay);
    oscillator.stop(context.currentTime + delay + 0.15);
  });
  return true;
}

/** Texto que se lee de una oferta: trabajo, distrito, tarifa y minutos que quedan para responder. */
export function offerSpeech(offer, now = Date.now()) {
  const request = offer.request || {};
  const work = (request.subcategories?.length ? request.subcategories : [request.subcategory].filter(Boolean)).map(item => item.name).join(', ')
    || request.specialty?.name || 'un trabajo';
  const minutes = Math.max(0, Math.ceil((Date.parse(offer.expires_at) - now) / 60000));
  return [`Nueva oferta: ${work}`, request.district?.name ? `en ${request.district.name}` : '',
    offer.reference_fee?.amount ? `. Tarifa referencial: ${soles(offer.reference_fee.amount).replace('S/', '').trim()} soles` : '',
    `. Tienes ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} para responder.`].join(' ').replace(/\s+\./g, '.').replace(/\s+/g, ' ').trim();
}

/** Lee la oferta en voz alta en español del Perú. Devuelve false si el navegador no puede. */
export function speakOffer(offer, now) {
  if (!canSpeak()) return false;
  window.speechSynthesis.cancel();
  const utterance = new window.SpeechSynthesisUtterance(offerSpeech(offer, now));
  utterance.lang = 'es-PE';
  window.speechSynthesis.speak(utterance);
  return true;
}

/** Dispara los avisos elegidos; flash recibe una función que muestra el destello. */
export function alertOffer(offer, prefs, {flash} = {}) {
  const done = [];
  if (prefs.sound && playChime()) done.push('sound');
  if (prefs.vibration && vibrationAvailable()) { navigator.vibrate([250, 120, 250]); done.push('vibration'); }
  if (prefs.flash && flash) { flash(); done.push('flash'); }
  if (prefs.speak && offer && speakOffer(offer)) done.push('speak');
  return done;
}

/** Botón «Leer la oferta en voz alta» de la tarjeta de la oferta. */
export function SpeakOfferButton({offer}) {
  if (!canSpeak()) return null;
  return <button type="button" className="button outline offer-speak" onClick={() => speakOffer(offer)}>
    <Icon name="announcements"/> Leer la oferta en voz alta</button>;
}

const FLASH_MS = 1800;
/**
 * Vigila las ofertas pendientes desde cualquier página del panel: la primera carga no avisa; cada oferta nueva dispara
 * los avisos elegidos y un mensaje para lectores de pantalla. El destello no tapa nada (pointer-events: none).
 */
export function OfferAlertWatcher() {
  const prefs = useOfferAlertPrefs();
  const {rows, loading} = useOffers(null, {status: 'pending'});
  const seen = useRef(null);
  const [flash, setFlash] = useState(0);
  const [announce, setAnnounce] = useState('');
  useEffect(() => {
    if (loading) return;
    const pending = rows.filter(row => row.status === 'pending');
    if (seen.current === null) { seen.current = new Set(pending.map(row => row.id)); return; }
    const fresh = pending.filter(row => !seen.current.has(row.id));
    pending.forEach(row => seen.current.add(row.id));
    if (!fresh.length) return;
    alertOffer(fresh[0], prefs, {flash: () => setFlash(Date.now())});
    setAnnounce(fresh.length === 1 ? 'Llegó una oferta nueva. Tienes 10 minutos para responder.' : `Llegaron ${fresh.length} ofertas nuevas.`);
  }, [rows, loading]);
  useEffect(() => {
    if (!flash) return undefined;
    const timer = setTimeout(() => setFlash(0), FLASH_MS);
    return () => clearTimeout(timer);
  }, [flash]);
  return <>
    {flash > 0 && <div className="tech-offer-flash" data-static={prefersReducedMotion() || undefined} aria-hidden="true"/>}
    <p className="sr-only" role="status" aria-live="polite">{announce}</p>
  </>;
}

/** Pestaña «Avisos» de la cuenta del técnico: cuatro interruptores, «Probar el aviso» y alertas de éxito y error. */
export function OfferAlertsTab() {
  const prefs = useOfferAlertPrefs();
  const [notice, setNotice] = useState({});
  const [preview, setPreview] = useState(0);
  useEffect(() => {
    if (!preview) return undefined;
    const timer = setTimeout(() => setPreview(0), FLASH_MS);
    return () => clearTimeout(timer);
  }, [preview]);
  const unavailable = {vibration: !vibrationAvailable() && 'Tu equipo no permite vibrar.', speak: !canSpeak() && 'Tu navegador no permite leer en voz alta.',
    sound: !audioClass() && 'Tu navegador no permite reproducir el sonido.'};
  async function change(key, value) {
    setNotice({});
    try { await saveOfferAlerts({[key]: value}); setNotice({success: 'Guardamos tus avisos de ofertas.'}); }
    catch (failure) { setNotice({error: failure?.message || 'No pudimos guardar tus avisos. Inténtalo de nuevo.'}); }
  }
  const sample = {id: 0, expires_at: new Date(Date.now() + 600000).toISOString(), reference_fee: {amount: '80.00'},
    request: {subcategories: [{id: 0, name: 'Mantenimiento preventivo (ejemplo)'}], district: {name: 'Huancayo'}}};
  return <section className="account-card tech-alerts-tab">
    {ALERT_OPTIONS.map(([key, label, help, icon]) => <label key={key} className="a11y-switch">
      <input type="checkbox" role="switch" checked={prefs[key]} aria-describedby={`aviso-${key}`} onChange={event => change(key, event.target.checked)}/>
      <span><span className="tech-alert-label"><Icon name={icon}/> {label}</span>
        <small id={`aviso-${key}`} className="muted">{help}{unavailable[key] ? ` ${unavailable[key]}` : ''}</small></span>
    </label>)}
    <button type="button" className="button outline" onClick={() => { setNotice({}); alertOffer(sample, prefs, {flash: () => setPreview(Date.now())}); }}>
      <Icon name="bell"/> Probar el aviso</button>
    <p className="muted">El plazo para responder una oferta sigue siendo de 10 minutos. En «Modo simple», Aceptar y Rechazar se ven extragrandes.</p>
    {notice.success && <p className="notice" role="status">{notice.success}</p>}
    {notice.error && <p className="error" role="alert">{notice.error}</p>}
    {preview > 0 && <div className="tech-offer-flash" data-static={prefersReducedMotion() || undefined} aria-hidden="true"/>}
  </section>;
}
