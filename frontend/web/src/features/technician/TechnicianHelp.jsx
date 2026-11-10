import React from 'react';
import Icon from '../panel/icons';
import '../client/pages.css';

// Fase T2 del panel del técnico: Ayuda propia del técnico (el cliente tiene la suya en ClientPages).
const STEPS = [
  {icon: 'bell', title: 'Te llega una oferta', text: 'Cuando un cliente de tu zona pide un trabajo que haces, te avisamos en la campana y en tu Inicio.'},
  {icon: 'clock', title: 'Tienes 10 minutos para responder', text: 'Revisa el trabajo, el distrito, la franja y la tarifa referencial. Acepta o rechaza antes de que venza.'},
  {icon: 'users', title: 'El cliente elige', text: 'Si aceptas, el cliente compara a los técnicos que aceptaron y elige. Te avisamos si te eligió.'},
  {icon: 'map', title: 'Atiendes la visita', text: 'Con el trabajo asignado ves la dirección exacta y lo encuentras en Mi día.'},
];

const FAQ = [
  ['¿Qué pasa si no respondo una oferta?', 'Vence a los 10 minutos y pasa a otro técnico. No te penaliza, pero responder rápido suma la insignia «Respuesta rápida».'],
  ['¿Por qué no veo la dirección del cliente?', 'Por privacidad, la dirección exacta solo aparece cuando el cliente te elige y el trabajo queda asignado a ti.'],
  ['¿Cómo recibo más ofertas?', 'Completa tu perfil, define tus zonas y horarios, agrega tus servicios con tarifa y sube trabajos a tu portafolio.'],
  ['¿Quién ve mis documentos de verificación?', 'Solo tú y el equipo de TécnicoYa que los revisa. Nunca se muestran a los clientes ni a otros técnicos.'],
  ['¿La tarifa es el precio final?', 'No. Es referencial: el precio final se acuerda con el cliente después del diagnóstico.'],
  ['¿Puedo dejar de recibir ofertas por un tiempo?', 'Por ahora no hay pausa: ajusta tus horarios en Zonas y disponibilidad para recibir ofertas solo cuando puedas atender.'],
];

function Page({title, intro, children}) {
  const id = 'pagina-tecnico-' + title.normalize('NFD').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
  return <section className="client-page" aria-labelledby={id}>
    <header className="client-page-head"><h2 id={id}>{title}</h2>{intro && <p className="muted">{intro}</p>}</header>
    {children}
  </section>;
}

export function TechnicianHowItWorks({navigate}) {
  return <Page title="Cómo funciona" intro="Así llegan y se atienden los trabajos en TécnicoYa.">
    <ol className="how-steps">
      {STEPS.map((step, index) => <li key={step.title}>
        <span className="how-illustration" data-step={index + 1} aria-hidden="true"><Icon name={step.icon}/></span>
        <div><p className="kicker">Paso {index + 1}</p><h3>{step.title}</h3><p>{step.text}</p></div>
      </li>)}
    </ol>
    <div className="how-actions">
      <button type="button" className="button primary" onClick={() => navigate('offers')}>Ver mis ofertas</button>
      <button type="button" className="button outline" onClick={() => navigate('profile-pro')}>Completar mi perfil</button>
    </div>
  </Page>;
}

export function TechnicianFaq() {
  return <Page title="Preguntas frecuentes" intro="Dudas comunes de los técnicos.">
    <div className="faq-list">
      {FAQ.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
    </div>
  </Page>;
}
