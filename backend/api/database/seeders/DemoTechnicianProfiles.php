<?php

namespace Database\Seeders;

/**
 * Fase 3 del panel final (D-101, propuesta): dos técnicos de demostración bien elaborados para el perfil público.
 * Personas, negocios y opiniones ficticias; correos @example.test (los pone DemoSeeder). Las reseñas son de ejemplo y el
 * panel las rotula «Ejemplo · datos de demostración». Las fotos del portafolio se leen de database/seeders/demo-media/
 * si el equipo las deja ahí (<alias>-<n>-antes.webp y <alias>-<n>-despues.webp, también .png o .jpg).
 */
final class DemoTechnicianProfiles
{
    public const PROFILES = [
        'refrigeracion' => [
            'given' => 'Rosa', 'family' => 'Quispe', 'name' => 'Rosa Quispe', 'years' => 9, 'base' => 'EL-TAMBO',
            'districts' => ['EL-TAMBO', 'HUANCAYO', 'CHILCA'],
            'bio' => 'Técnica en refrigeración comercial con nueve años atendiendo bodegas, minimarkets y restaurantes de Huancayo. '
                .'Reparo vitrinas, cámaras de frío y compresores, y ayudo a cada negocio a planificar su mantenimiento para que no pierda mercadería.',
            'work_style' => 'Primero hago un diagnóstico y te explico qué falla antes de cotizar. Llevo repuestos comunes, '
                .'trabajo con el equipo desconectado y dejo el área limpia. Al terminar te muestro las lecturas de temperatura.',
            'warranty' => 'Garantía de 30 días en la mano de obra y la que da el fabricante en los repuestos.',
            'services' => [
                'frio-vitrinas' => ['120.00', 'Revisión de temperatura, limpieza del condensador, ajuste del termostato y prueba de fugas.'],
                'frio-mantenimiento' => ['90.00', 'Limpieza de serpentines y ventiladores, revisión eléctrica y control de la carga de gas.'],
                'frio-camaras' => ['150.00', 'Diagnóstico de la cámara, revisión de burletes y puertas, y regulación del sistema de frío.'],
                'frio-compresores' => ['180.00', 'Pruebas de arranque y consumo, cambio de relé o protector y prueba de funcionamiento.'],
            ],
            'slots' => [[1, '08:00', '18:00'], [2, '08:00', '18:00'], [3, '08:00', '18:00'], [4, '08:00', '18:00'], [5, '08:00', '18:00'], [6, '08:00', '13:00']],
            'portfolio' => [
                ['Vitrina de lácteos recuperada', 'frio-vitrinas', 'La vitrina no bajaba de 12 °C; se cambió el ventilador del condensador y quedó en 4 °C.', 12],
                ['Mantenimiento de cámara de carnes', 'frio-camaras', 'Limpieza completa, cambio de burletes y ajuste del termostato digital.', 25],
                ['Compresor de congelador reemplazado', 'frio-compresores', 'Compresor quemado por variaciones de voltaje; se instaló uno nuevo con protector.', 40],
                ['Mantenimiento preventivo en minimarket', 'frio-mantenimiento', 'Tres vitrinas y un congelador revisados en una sola visita, fuera del horario de atención.', 58],
                ['Fuga de gas en vitrina de bebidas', 'frio-vitrinas', 'Se localizó la fuga en una soldadura, se reparó y se recargó el refrigerante.', 75],
            ],
            'reviews' => [
                [5, 'Bodega en El Tambo', 'Llegó a la hora acordada y la vitrina quedó enfriando el mismo día. Explicó todo con calma.', 6],
                [5, 'Restaurante en Huancayo', 'Hizo el mantenimiento de la cámara sin parar la cocina. Muy ordenada.', 14],
                [4, 'Minimarket en Chilca', 'Buen trabajo con el compresor. Tardó un día más por el repuesto, pero avisó.', 27],
                [5, 'Panadería en El Tambo', 'Nos dejó un plan de mantenimiento y desde entonces no hemos tenido fallas.', 41],
                [4, 'Juguería en Huancayo', 'Resolvió la fuga y nos enseñó a revisar la temperatura cada mañana.', 63],
            ],
        ],
        'computo' => [
            'given' => 'Diego', 'family' => 'Huamán', 'name' => 'Diego Huamán', 'years' => 7, 'base' => 'HUANCAYO',
            'districts' => ['HUANCAYO', 'EL-TAMBO'],
            'bio' => 'Técnico en cómputo con siete años de experiencia en hogares, estudios contables y pequeñas oficinas. '
                .'Reparo laptops y computadoras de escritorio, configuro redes wifi y dejo los equipos listos para trabajar sin sorpresas.',
            'work_style' => 'Reviso el equipo contigo, te digo qué encontré y cuánto costaría antes de tocar nada. '
                .'Respaldo tus archivos antes de cualquier cambio y te dejo anotado lo que hice.',
            'warranty' => 'Garantía de 15 días en la reparación; si la falla vuelve, la reviso sin costo.',
            'services' => [
                'computo-hardware' => ['60.00', 'Diagnóstico, limpieza interna, cambio de pasta térmica y prueba de componentes.'],
                'computo-mantenimiento' => ['45.00', 'Limpieza de polvo, revisión de ventiladores, actualización del sistema y prueba de temperatura.'],
                'computo-redes' => ['80.00', 'Instalación o ajuste del router, cobertura wifi en la casa u oficina y prueba de velocidad.'],
                'computo-software' => ['50.00', 'Instalación del sistema y programas con licencia, controladores y respaldo de archivos.'],
            ],
            'slots' => [[1, '09:00', '20:00'], [2, '09:00', '20:00'], [3, '09:00', '20:00'], [4, '09:00', '20:00'], [5, '09:00', '20:00'], [6, '09:00', '13:00']],
            'portfolio' => [
                ['Laptop que se apagaba sola', 'computo-hardware', 'Ventilador obstruido y pasta térmica seca; tras la limpieza la temperatura bajó 25 °C.', 9],
                ['Red wifi para un estudio contable', 'computo-redes', 'Router nuevo y un repetidor para cubrir dos pisos con seis equipos.', 21],
                ['Computadora de escritorio más rápida', 'computo-hardware', 'Cambio a disco de estado sólido y más memoria; el arranque pasó de 3 minutos a 30 segundos.', 36],
                ['Mantenimiento de cinco equipos de oficina', 'computo-mantenimiento', 'Limpieza, actualizaciones y respaldo de archivos en una mañana.', 50],
                ['Reinstalación del sistema con respaldo', 'computo-software', 'Se respaldaron fotos y documentos antes de reinstalar; todo volvió a su lugar.', 70],
                ['Impresora compartida en la red', 'computo-redes', 'Se configuró la impresora para que la usen las tres computadoras de la oficina.', 88],
            ],
            'reviews' => [
                [5, 'Estudio contable en Huancayo', 'Dejó la red funcionando en todos los equipos y nos explicó cómo reiniciarla.', 5],
                [5, 'Hogar en El Tambo', 'Mi laptop ya no se calienta. Respaldó mis fotos antes de empezar.', 16],
                [5, 'Librería en Huancayo', 'Rápido y claro con el presupuesto. Volvería a llamarlo.', 30],
                [4, 'Hogar en Huancayo', 'Buen servicio; tuvo que volver al día siguiente por una pieza, sin costo extra.', 47],
                [5, 'Oficina en El Tambo', 'El mantenimiento de los cinco equipos fue ordenado y sin interrumpir el trabajo.', 66],
            ],
        ],
    ];
}
