import React from 'react';
import ClientOnboarding, {WELCOME_CARDS} from '../client/ClientOnboarding';

/**
 * D-117 (ADM-12): bienvenida corta y tutorial de 5 pasos del administrador, con el mismo motor del cliente y del técnico
 * (desplaza solo, abre el menú o el cajón y la burbuja nunca sale de la pantalla). Solo la primera vez, omitible y
 * repetible desde Ayuda › Cómo funciona el panel. Se guardan los ajustes elegidos, nunca la tarjeta (Ley 29733).
 * Si la sección de un paso no está (por permisos), el paso señala el siguiente destino de su lista.
 */
const item = id => `.panel-sidebar nav .panel-nav-item[data-section="${id}"]`;

export const ADMIN_TOUR_STEPS = [
  {title: 'El menú', text: 'El menú agrupa el panel por tareas: Operación, Personas, Negocio, Contenido y Control.',
    targets: ['.panel-sidebar nav [role=group]'], menu: true},
  {title: 'Inicio y tareas pendientes', text: 'En Inicio ves los indicadores del día y las tareas que esperan una acción tuya.',
    targets: [item('home'), '.panel-sidebar nav [role=group]'], menu: true},
  {title: 'Solicitudes y emparejamiento', text: 'Sigue cada solicitud y su búsqueda de técnico. Los números del menú te avisan de lo pendiente.',
    targets: [item('requests'), item('live')], menu: true},
  {title: 'Usuarios y verificación', text: 'Administra las cuentas y revisa los documentos de los técnicos antes de habilitarlos.',
    targets: [item('users'), item('verification')], menu: true},
  {title: '«Aa» y tu cuenta', text: 'Con «Aa» cambias el tamaño de texto o el contraste; en tu cuenta, tu perfil, la seguridad y la accesibilidad.',
    targets: ['.panel-a11y-button', '.panel-actions']},
];

export default function AdminOnboarding({user, replay, onReplayEnd}) {
  return <ClientOnboarding user={user} replay={replay} onReplayEnd={onReplayEnd} cards={WELCOME_CARDS} steps={ADMIN_TOUR_STEPS}/>;
}
