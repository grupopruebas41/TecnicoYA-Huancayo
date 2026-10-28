import React from 'react';

// Pasos visibles para el cliente (revisión del PR #39). La fase del S4 decide el paso actual.
const STEPS = ['Registrada', 'Enviada', 'Buscando técnicos', 'Ofertas recibidas', 'Elige a tu técnico', 'Asignada'];
const CURRENT = {registered: 0, sent: 1, matching: 2, pending_availability: 2, awaiting_responses: 3, direct_declined: 3,
  awaiting_choice: 4, assigned: 5, in_progress: 5};
const NEXT = {
  registered: 'Tu solicitud está guardada como borrador. Revisa el resumen y envíala para empezar la búsqueda.',
  sent: 'Recibimos tu solicitud y estamos preparando la búsqueda.',
  matching: 'Estamos enviando tu pedido a técnicos verificados; te avisaremos cuando acepten.',
  awaiting_responses: 'Los técnicos ya recibieron tu pedido. Espera a que respondan o venza el plazo; te avisaremos.',
  pending_availability: 'Ahora no hay técnicos libres para tu pedido. Seguiremos buscando y te avisaremos.',
  direct_declined: 'El técnico que elegiste no respondió a tiempo. Puedes autorizar la búsqueda de otros técnicos.',
  awaiting_choice: 'Uno o más técnicos aceptaron. Compara sus tarifas y distancias y elige al que prefieras.',
  assigned: 'Tu técnico está asignado. Te avisaremos cualquier cambio en tu solicitud.',
  in_progress: 'Tu técnico está atendiendo la solicitud.',
  expired: 'La búsqueda venció sin técnico asignado. Puedes crear una nueva solicitud cuando quieras.',
};

/**
 * Progreso del seguimiento: pasos (horizontales en escritorio, verticales en móvil) y la tarjeta «¿Qué pasa ahora?»
 * con la acción que le toca al cliente. children agrega acciones propias (por ejemplo, continuar el borrador).
 */
export default function RequestProgress({record, onChoose, children}) {
  const phase = record.phase || record.status;
  const current = CURRENT[phase] ?? -1;
  const done = current >= 0 ? current : phase === 'expired' ? 2 : 0;
  return <div className="client-progress">
    <ol className="client-stepper" aria-label="Progreso de la solicitud">
      {STEPS.map((label, index) => <li key={label} aria-current={index === current ? 'step' : undefined}
        className={index < done ? 'is-done' : undefined}>{label}</li>)}
    </ol>
    <section className="client-next" aria-label="¿Qué pasa ahora?">
      <h3>¿Qué pasa ahora?</h3>
      <p>{NEXT[phase] || 'Estamos actualizando el estado de tu solicitud.'}</p>
      {phase === 'awaiting_choice' && onChoose &&
        <button type="button" className="button primary" onClick={onChoose}>Ver técnicos que aceptaron</button>}
      {children}
    </section>
  </div>;
}
