import React from 'react';
import ClientOnboarding, {WELCOME_CARDS} from '../client/ClientOnboarding';
import Icon from '../panel/icons';
import {getOfferAlerts, loadOfferAlerts} from './offerAlerts';

/**
 * Fase T5 del panel del técnico: bienvenida «¿Cómo prefieres usar TécnicoYa?» con las tarjetas del cliente más «Avisos de
 * ofertas más notorios», y un tutorial de 5 pasos con el motor del cliente (desplaza solo, abre el menú o el cajón y la
 * burbuja nunca sale de la pantalla). Solo la primera vez; omitible; se repite desde Ayuda › Cómo funciona.
 * Se guardan los ajustes y los avisos elegidos, nunca la tarjeta (Ley 29733).
 */
export const TECHNICIAN_WELCOME_CARDS = [
  ...WELCOME_CARDS,
  ['avisos', 'Avisos de ofertas más notorios', 'Sonido, vibración y destello cuando llega una oferta.', {}, 'bell',
    {sound: true, vibration: true, flash: true}],
];

export const TECHNICIAN_TOUR_STEPS = [
  {title: 'Tus ofertas', text: 'Aquí llegan las ofertas. Tienes 10 minutos para aceptarlas o rechazarlas.',
    targets: ['.panel-sidebar nav .panel-nav-item[data-section="offers"]'], menu: true},
  {title: 'Primeros pasos', text: 'Completa estos pasos para empezar a recibir ofertas: perfil, documentos, zonas y servicios.',
    targets: ['.tech-first-steps', '.tech-progress']},
  {title: 'Mi negocio', text: 'Tu perfil, tus servicios con tarifa, tu portafolio, tus zonas y tu verificación.',
    targets: ['.panel-sidebar nav .panel-nav-item[data-section="profile-pro"]'], menu: true},
  {title: 'Campana y cuenta', text: 'La campana te avisa de ofertas y trabajos; en tu cuenta eliges cómo te avisamos.', targets: ['.panel-actions']},
  {title: 'Accesibilidad rápida', text: 'Con «Aa» cambias el tamaño de texto, el contraste o escuchas la pantalla.', targets: ['.panel-a11y-button']},
];

export default function TechnicianOnboarding({user, replay, onReplayEnd}) {
  return <ClientOnboarding user={user} replay={replay} onReplayEnd={onReplayEnd} cards={TECHNICIAN_WELCOME_CARDS}
    steps={TECHNICIAN_TOUR_STEPS} onAlerts={alerts => loadOfferAlerts({...getOfferAlerts(), ...alerts})}/>;
}

/**
 * «Primeros pasos» del Inicio (GET /technicians/me/home, first_steps): 4 pasos con su estado (ícono y texto) y «Hacerlo»
 * que lleva a la sección. Desaparece cuando están todos completos.
 */
export function FirstSteps({data, navigate}) {
  if (!data || data.done) return null;
  return <section className="panel-card tech-section tech-first-steps" aria-labelledby="tech-first-steps" style={{'--i': 1}}>
    <div className="tech-progress-head">
      <h3 id="tech-first-steps"><Icon name="flag"/> Primeros pasos</h3>
      <strong>{data.completed} de {data.total}</strong>
    </div>
    <p className="muted">Completa estos pasos para empezar a recibir ofertas.</p>
    <ol className="tech-first-list">
      {data.steps.map((step, index) => <li key={step.code} data-done={step.done}>
        <span className="tech-first-mark" aria-hidden="true">{step.done ? <Icon name="check"/> : index + 1}</span>
        <span className="tech-first-text">{step.label}
          <span className="tech-first-state">{step.done ? 'Hecho' : 'Pendiente'}</span></span>
        {!step.done && <button type="button" className="button outline tech-task-go" onClick={() => navigate(step.section)}>
          Hacerlo<span className="sr-only">: {step.label}</span></button>}
      </li>)}
    </ol>
  </section>;
}
