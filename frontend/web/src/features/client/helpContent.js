// Fase 4 del panel final: contenido estático de Ayuda y Premium, en español y revisable por el equipo.

export const HOW_IT_WORKS = [
  {icon: 'search', title: 'Cuéntanos qué se malogró',
    text: 'Escribe la falla o elige la especialidad. Puedes pedir varias en un mismo pedido y agregar fotos.'},
  {icon: 'users', title: 'Te mostramos técnicos verificados',
    text: 'Buscamos técnicos de tu zona que atienden lo que pediste. Cada uno revisa tu solicitud y decide si la acepta.'},
  {icon: 'check', title: 'Eliges con quién trabajar',
    text: 'Comparas experiencia, tarifa referencial y opiniones. La tarifa final la acuerdas con el técnico.'},
  {icon: 'star', title: 'Sigues la atención y calificas',
    text: 'Ves cada paso en Mis solicitudes y, al terminar, cuentas cómo te fue para ayudar a otros clientes.'},
];

export const FAQ = [
  ['¿Cuánto cuesta usar TécnicoYa?', 'Publicar una solicitud es gratis. La tarifa que ves es referencial: el monto final lo acuerdas con el técnico.', 'wallet'],
  ['¿Cómo sé que el técnico es confiable?', 'Todos los técnicos que ves pasaron la verificación de identidad que hace el administrador.', 'verify'],
  ['¿Cuántos pedidos puedo tener a la vez?', 'Hasta 3 pedidos activos. Cada pedido puede incluir varias especialidades.', 'requests'],
  ['¿Puedo cancelar una solicitud?', 'Sí, mientras el técnico no haya empezado la atención. Te pedimos el motivo para mejorar el servicio.', 'close'],
  ['¿Qué pasa si nadie acepta mi solicitud?', 'Seguimos buscando hasta 24 horas y te avisamos. También puedes buscar técnicos y elegir uno.', 'clock'],
  ['¿Quién ve mi dirección y mi teléfono?', 'Solo el técnico que atiende tu solicitud. El perfil público de los técnicos tampoco muestra sus datos de contacto.', 'lock'],
];

// Borrador basado en la Ley N.° 29733 de Protección de Datos Personales; lo revisa el equipo antes de publicarlo.
// Pulido final: cada bloque lleva su ícono y la página muestra la fecha de esta versión.
export const PRIVACY_VERSION = '2026-11-22';
export const PRIVACY = [
  ['Qué datos usamos', 'Tus nombres, correo, teléfono, distrito y las direcciones que guardes, para atender tus solicitudes. No pedimos datos de salud ni de discapacidad.', 'profile'],
  ['Para qué los usamos', 'Para conectar tu solicitud con técnicos de tu zona, avisarte del avance y mejorar el servicio.', 'check'],
  ['Con quién los compartimos', 'Solo con el técnico que atiende tu solicitud, y únicamente lo necesario para atenderla.', 'users'],
  ['Tus derechos', 'Puedes acceder, rectificar, cancelar u oponerte al uso de tus datos (derechos ARCO) desde tu cuenta o escribiendo al equipo.', 'verify'],
  ['Cuánto tiempo los guardamos', 'Mientras tu cuenta esté activa y el tiempo que exija la ley para el historial de las atenciones.', 'clock'],
];

export const PREMIUM_FEATURES = [
  ['monitor', 'Mis equipos', 'Registra tus refrigeradoras, vitrinas y computadoras con su historial de atenciones.'],
  ['sensor', 'Sensores IoT', 'Lecturas de temperatura y consumo de tus equipos (en esta versión, simuladas para la demostración).'],
  ['alert', 'Alertas', 'Te avisamos cuando una lectura sale de lo normal y puedes pedir un técnico desde la alerta.'],
  ['gift', 'Promociones', 'Ofertas de mantenimiento preventivo para tus equipos.'],
  ['verify', 'Garantías', 'Las garantías de cada atención en un solo lugar.'],
];
