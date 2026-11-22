// Contenido del Inicio del cliente que define el equipo (revisión del PR #39). Cambiarlo no requiere tocar componentes.

/**
 * D-93/D-94: atajos de «¿Qué se malogró?»; bajo el buscador son chips que rellenan la búsqueda. Cada uno apunta al código
 * de una subcategoría real del catálogo (database/seeders/data/catalog.csv); si no existe o está inactiva, no se
 * muestra.
 */
export const PROBLEMS = [
  {key: 'laptop', label: 'Laptop no prende', subcategory: 'computo-hardware'},
  {key: 'internet', label: 'Internet lento', subcategory: 'computo-redes'},
  {key: 'virus', label: 'PC lenta o con virus', subcategory: 'computo-seguridad'},
  {key: 'impresora', label: 'Impresora no imprime', subcategory: 'computo-impresoras'},
  {key: 'congeladora', label: 'Congeladora no enfría', subcategory: 'frio-congeladores'},
  {key: 'vitrina', label: 'Vitrina con escarcha', subcategory: 'frio-vitrinas'},
  {key: 'luz', label: 'Corte de luz', subcategory: 'electricidad-tableros'},
  {key: 'enchufe', label: 'Enchufe que chispea', subcategory: 'electricidad-residencial'},
];

/** Consejo del mes: uno por mes (enero = 0), según la fecha de Lima. */
export const TIPS = [
  'Limpia los filtros de la congeladora y deja espacio detrás para que el motor respire.',
  'Antes de llamar al técnico, anota cuándo empezó la falla y qué estabas haciendo: ahorra tiempo de diagnóstico.',
  'Desconecta los equipos durante las tormentas eléctricas para protegerlos de picos de tensión.',
  'Haz una copia de tus archivos importantes una vez al mes, en la nube o en un disco externo.',
  'Revisa que tus enchufes no estén calientes ni sueltos: es una señal temprana de riesgo eléctrico.',
  'Mantén la vitrina lejos del sol directo y de fuentes de calor para que consuma menos energía.',
  'En invierno, revisa la humedad cerca de tableros y tomacorrientes; el agua y la electricidad no se mezclan.',
  'Actualiza el sistema y el antivirus de tu computadora: corrige fallas y te protege de ataques.',
  'No sobrecargues una sola regleta con muchos equipos de alto consumo.',
  'Descongela tu congeladora cuando la escarcha supere medio centímetro: enfriará mejor y gastará menos.',
  'Reinicia tu router una vez por semana y ubícalo en un lugar alto y despejado para mejorar la señal.',
  'Antes de las fiestas, revisa luces y extensiones: cambia las que tengan cables pelados.',
];

/**
 * Pulido final: «Otro consejo» rota por estos consejos de ejemplo por especialidad (después del consejo del mes).
 * Contenido revisable por el equipo; cambiarlo no requiere tocar componentes.
 */
export const SPECIALTY_TIPS = [
  {specialty: 'Refrigeración', tone: 'refrigeracion', icon: 'snow', text: 'Revisa que el burlete de la puerta cierre bien: si pasa una hoja de papel, el frío se escapa.'},
  {specialty: 'Cómputo', tone: 'computo', icon: 'monitor', text: 'Limpia el polvo de las rejillas de tu computadora cada 3 meses para evitar que se caliente.'},
  {specialty: 'Electricidad', tone: 'electricidad', icon: 'bolt', text: 'Si el interruptor diferencial salta seguido, no lo fuerces: es una señal de fuga a tierra.'},
  {specialty: 'Refrigeración', tone: 'refrigeracion', icon: 'snow', text: 'No metas alimentos calientes a la vitrina: el motor trabaja el doble y gasta más energía.'},
  {specialty: 'Cómputo', tone: 'computo', icon: 'monitor', text: 'Usa un estabilizador para la computadora de caja: los picos de tensión dañan la fuente.'},
  {specialty: 'Electricidad', tone: 'electricidad', icon: 'bolt', text: 'Rotula cada interruptor del tablero: en una emergencia sabrás qué cortar sin dudar.'},
  {specialty: 'Refrigeración', tone: 'refrigeracion', icon: 'snow', text: 'Anota la temperatura de la congeladora cada mañana: un cambio brusco avisa de una falla.'},
  {specialty: 'Cómputo', tone: 'computo', icon: 'monitor', text: 'Cambia la contraseña del wifi del negocio cada cierto tiempo y no la compartas con clientes.'},
];

/** «Tu seguridad»: avisos fijos del equipo. */
export const SAFETY = [
  'Tu dirección solo la ve el técnico asignado.',
  'No pagues por adelantado fuera de la app.',
];
