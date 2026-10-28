// Contenido del Inicio del cliente que define el equipo (revisión del PR #39). Cambiarlo no requiere tocar componentes.

/**
 * D-93 (RECO-00): atajos de «¿Qué se malogró?» mientras el buscador con IA está en pausa. Cada atajo apunta al código
 * de una subcategoría real del catálogo (database/seeders/data/catalog.csv); si no existe o está inactiva, no se
 * muestra. icon es un símbolo decorativo.
 */
export const PROBLEMS = [
  {key: 'laptop', label: 'Laptop no prende', icon: '💻', subcategory: 'computo-hardware'},
  {key: 'internet', label: 'Internet lento', icon: '📶', subcategory: 'computo-redes'},
  {key: 'virus', label: 'PC lenta o con virus', icon: '🛡', subcategory: 'computo-seguridad'},
  {key: 'impresora', label: 'Impresora no imprime', icon: '🖨', subcategory: 'computo-impresoras'},
  {key: 'congeladora', label: 'Congeladora no enfría', icon: '❄', subcategory: 'frio-congeladores'},
  {key: 'vitrina', label: 'Vitrina con escarcha', icon: '🧊', subcategory: 'frio-vitrinas'},
  {key: 'luz', label: 'Corte de luz', icon: '⚡', subcategory: 'electricidad-tableros'},
  {key: 'enchufe', label: 'Enchufe que chispea', icon: '🔌', subcategory: 'electricidad-residencial'},
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

/** «Tu seguridad»: avisos fijos del equipo. */
export const SAFETY = [
  'Tu dirección solo la ve el técnico asignado.',
  'No pagues por adelantado fuera de la app.',
];
