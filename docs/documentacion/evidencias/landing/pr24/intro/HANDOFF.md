# Intro recuperada · PR #24

Fecha: 2026-10-20. Rama: feature/delgado/landing/rediseno-landing.
Base de implementación: 49487ea (pruebas en rojo: 2 fallidas, 2 aprobadas).

Referencia: tag v0.3-antes-retiro-prototipo, commit cced99e; frontend/web/src/VideoExperience.jsx, video-timing.js y styles.css. Se recuperan cue 4 + 19/24 segundos, transición de overlay de .8s ease y espera de 12000 ms. El zoom/retroceso está en habitacion.mp4, no había keyframe de zoom CSS que restaurar. Se conserva el archivo original sin transformaciones artificiales.

Primero video solo sin overlay. En el cue comienza el overlay; tras 800 ms se habilita contenido y scroll. Cabecera antes de pill, título, subtítulo y botones, con fade/translate escalonado. Estado de intro completada conservado en App. Error/autoplay bloqueado revela contenido de inmediato; falta de avance/carga lo hace como máximo en 12 s con poster. Movimiento reducido muestra contenido y poster inmediatamente. Se mantiene el observer del hero y la reanudación desde currentTime sin volver a la intro al hacer scroll. Limpieza de timers, observer, eventos y overflow.

Pruebas: npm run test -- --maxWorkers=2: 174/174, 24 archivos. npm run lint y npm run build: aprobados. Sin Cypress ni backend. La prueba existente de diez secciones usa movimiento reducido para verificar el contenido ya visible; los nuevos casos verifican explícitamente la espera y la transición con reloj falso, sin relajar aserciones.

Uso de IA: Codex para implementación y verificación. Revisor: [PENDIENTE]. Pendientes funcionales de esta tarea: ninguno.
https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/24
