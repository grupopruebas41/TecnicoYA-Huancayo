<?php

// D-94 (RECO-01): diccionario inicial del buscador «¿Qué se malogró?», por código de subcategoría (catalog.csv).
// Cada frase: [texto, tipo, peso]. objeto = el equipo o lugar (6), sintoma = lo que le pasa (4), general = frase
// ambigua que vale la mitad sin un objeto de la misma especialidad (3); las frases que combinan objeto y síntoma
// pesan 9. Español de Huancayo: «malogrado», «no prende», «chispea», «bota aire caliente».
return [
    'computo-hardware' => [
        ['laptop', 'objeto', 6], ['computadora', 'objeto', 6], ['pantalla', 'objeto', 5], ['teclado', 'objeto', 5],
        ['cargador de laptop', 'objeto', 6], ['laptop no prende', 'sintoma', 9], ['computadora no prende', 'sintoma', 9],
        ['pantalla negra', 'sintoma', 7], ['se apaga sola', 'sintoma', 4], ['no carga', 'sintoma', 4],
        ['se calienta mucho', 'sintoma', 4], ['no prende', 'general', 3], ['pantalla rota', 'sintoma', 7],
    ],
    'computo-mantenimiento' => [
        ['mantenimiento de computadora', 'objeto', 9], ['limpieza de laptop', 'objeto', 9], ['ventilador', 'objeto', 5],
        ['pasta termica', 'objeto', 6], ['hace mucho ruido', 'sintoma', 4], ['polvo', 'sintoma', 3],
        ['computadora lenta', 'sintoma', 6], ['mantenimiento', 'general', 3], ['limpieza', 'general', 3],
        ['computadora', 'objeto', 4], ['laptop', 'objeto', 4],
    ],
    'computo-software' => [
        ['instalar programa', 'sintoma', 7], ['instalar windows', 'sintoma', 9], ['formatear', 'sintoma', 7],
        ['formatear laptop', 'sintoma', 9], ['office', 'objeto', 6], ['programa no abre', 'sintoma', 7],
        ['sistema operativo', 'objeto', 6], ['windows', 'objeto', 6], ['actualizar', 'general', 3],
        ['licencia', 'objeto', 4], ['no abre', 'general', 3],
    ],
    'computo-redes' => [
        ['internet lento', 'sintoma', 9], ['sin internet', 'sintoma', 9], ['router', 'objeto', 6], ['modem', 'objeto', 6],
        ['internet', 'objeto', 6], ['red', 'objeto', 4], ['cableado de red', 'objeto', 8], ['se cae el internet', 'sintoma', 9],
        ['no conecta', 'sintoma', 4], ['repetidor', 'objeto', 5], ['senal debil', 'sintoma', 5], ['lento', 'general', 3],
    ],
    'computo-datos' => [
        ['recuperar archivos', 'sintoma', 9], ['recuperar fotos', 'sintoma', 9], ['disco duro', 'objeto', 6],
        ['usb', 'objeto', 5], ['memoria', 'objeto', 4], ['borre archivos', 'sintoma', 8], ['disco no reconoce', 'sintoma', 8],
        ['perdi mis archivos', 'sintoma', 9], ['respaldo', 'objeto', 5], ['backup', 'objeto', 5], ['no reconoce', 'general', 3],
    ],
    'computo-seguridad' => [
        ['virus', 'sintoma', 7], ['antivirus', 'objeto', 6], ['computadora lenta', 'sintoma', 5], ['pc lenta con virus', 'sintoma', 9],
        ['publicidad', 'sintoma', 4], ['hackeo', 'sintoma', 6], ['me hackearon', 'sintoma', 8], ['ventanas emergentes', 'sintoma', 6],
        ['malware', 'sintoma', 7], ['contrasena', 'objeto', 3], ['lenta', 'general', 3],
    ],
    'computo-remoto' => [
        ['soporte remoto', 'objeto', 9], ['asistencia remota', 'objeto', 9], ['ayuda a distancia', 'objeto', 8],
        ['configurar correo', 'sintoma', 7], ['correo', 'objeto', 4], ['anydesk', 'objeto', 6], ['teamviewer', 'objeto', 6],
        ['remoto', 'objeto', 5], ['configurar', 'general', 3], ['ayuda', 'general', 2], ['zoom', 'objeto', 4],
    ],
    'computo-impresoras' => [
        ['impresora', 'objeto', 6], ['impresora no imprime', 'sintoma', 9], ['atasco de papel', 'sintoma', 8],
        ['tinta', 'objeto', 5], ['toner', 'objeto', 5], ['escaner', 'objeto', 5], ['fotocopiadora', 'objeto', 6],
        ['no imprime', 'sintoma', 6], ['imprime manchado', 'sintoma', 7], ['multifuncional', 'objeto', 5], ['cartucho', 'objeto', 5],
    ],
    'computo-pos' => [
        ['punto de venta', 'objeto', 8], ['pos', 'objeto', 6], ['caja registradora', 'objeto', 7], ['lector de codigo', 'objeto', 7],
        ['impresora de ticket', 'objeto', 8], ['ticketera', 'objeto', 7], ['balanza', 'objeto', 5], ['sistema de ventas', 'objeto', 7],
        ['no imprime ticket', 'sintoma', 8], ['cajon de dinero', 'objeto', 6], ['caja', 'general', 2],
    ],
    'computo-cctv' => [
        ['camara de seguridad', 'objeto', 8], ['camaras', 'objeto', 5], ['cctv', 'objeto', 7], ['dvr', 'objeto', 6],
        ['videovigilancia', 'objeto', 7], ['camara no graba', 'sintoma', 9], ['no veo las camaras en el celular', 'sintoma', 9],
        ['instalar camaras', 'sintoma', 8], ['nvr', 'objeto', 6], ['camara', 'objeto', 4], ['no graba', 'sintoma', 4],
    ],
    'computo-facturacion' => [
        ['facturacion electronica', 'objeto', 9], ['factura electronica', 'objeto', 9], ['boleta electronica', 'objeto', 8],
        ['sunat', 'objeto', 7], ['comprobante', 'objeto', 5], ['emitir factura', 'sintoma', 8], ['no envia a sunat', 'sintoma', 9],
        ['facturador', 'objeto', 6], ['ruc', 'objeto', 4], ['factura', 'objeto', 5], ['boleta', 'objeto', 4],
    ],
    'frio-domestico' => [
        ['refrigeradora', 'objeto', 6], ['refrigeradora no enfria', 'sintoma', 9], ['nevera', 'objeto', 6],
        ['refrigeradora hace ruido', 'sintoma', 8], ['congelador de casa', 'objeto', 7], ['no enfria', 'sintoma', 4],
        ['gotea agua', 'sintoma', 4], ['hielo en el congelador', 'sintoma', 6], ['frigobar', 'objeto', 6], ['no congela', 'sintoma', 4],
        ['hace ruido', 'general', 2],
    ],
    'frio-vitrinas' => [
        ['vitrina', 'objeto', 6], ['vitrina con escarcha', 'sintoma', 9], ['vitrina no enfria', 'sintoma', 9],
        ['exhibidora', 'objeto', 6], ['vitrina de bebidas', 'objeto', 8], ['visicooler', 'objeto', 7], ['escarcha', 'sintoma', 4],
        ['vitrina de helados', 'objeto', 8], ['puerta no cierra', 'sintoma', 4], ['empana el vidrio', 'sintoma', 5],
        ['no enfria', 'sintoma', 3],
    ],
    'frio-camaras' => [
        ['camara de frio', 'objeto', 9], ['camara frigorifica', 'objeto', 9], ['cuarto frio', 'objeto', 8],
        ['camara de congelacion', 'objeto', 8], ['evaporador', 'objeto', 5], ['camara de frio no enfria', 'sintoma', 10],
        ['temperatura sube', 'sintoma', 5], ['puerta de camara', 'objeto', 5], ['alarma de temperatura', 'sintoma', 6],
        ['no mantiene el frio', 'sintoma', 5], ['frio', 'general', 2],
    ],
    'frio-congeladores' => [
        ['congeladora', 'objeto', 6], ['congeladora no enfria', 'sintoma', 9], ['congeladora no congela', 'sintoma', 9],
        ['congeladora horizontal', 'objeto', 8], ['conservadora', 'objeto', 6], ['congeladora industrial', 'objeto', 8],
        ['no congela', 'sintoma', 4], ['se descongela', 'sintoma', 5], ['hielo', 'general', 2], ['no enfria', 'sintoma', 4],
        ['congeladora bota agua', 'sintoma', 8],
    ],
    'frio-climatizacion' => [
        ['aire acondicionado', 'objeto', 8], ['aire acondicionado no enfria', 'sintoma', 10], ['split', 'objeto', 6],
        ['climatizacion', 'objeto', 7], ['bota aire caliente', 'sintoma', 7], ['aire gotea', 'sintoma', 7],
        ['instalar aire acondicionado', 'sintoma', 9], ['calefaccion', 'objeto', 5], ['ventilacion', 'objeto', 5],
        ['control remoto del aire', 'objeto', 6], ['aire', 'general', 2],
    ],
    'frio-refrigerante' => [
        ['carga de gas', 'sintoma', 9], ['recarga de gas', 'sintoma', 9], ['gas refrigerante', 'objeto', 9],
        ['fuga de gas', 'sintoma', 8], ['le falta gas', 'sintoma', 8], ['gas', 'objeto', 4], ['r134', 'objeto', 6],
        ['r600', 'objeto', 6], ['r410', 'objeto', 6], ['enfria poco', 'sintoma', 4], ['recargar', 'general', 2],
    ],
    'frio-compresores' => [
        ['compresor', 'objeto', 7], ['compresor no arranca', 'sintoma', 9], ['motor de refrigeradora', 'objeto', 8],
        ['motor', 'objeto', 4], ['hace clic y no prende', 'sintoma', 6], ['compresor quemado', 'sintoma', 9],
        ['rele', 'objeto', 5], ['capacitor', 'objeto', 5], ['compresor caliente', 'sintoma', 8], ['zumba', 'sintoma', 4],
        ['no arranca', 'general', 3],
    ],
    'frio-hielo' => [
        ['maquina de hielo', 'objeto', 9], ['fabricadora de hielo', 'objeto', 9], ['dispensador de agua', 'objeto', 8],
        ['dispensador', 'objeto', 5], ['no hace hielo', 'sintoma', 8], ['hielera', 'objeto', 6], ['dispensador de bebidas', 'objeto', 8],
        ['chopera', 'objeto', 6], ['no sale agua fria', 'sintoma', 7], ['hielo', 'objeto', 3], ['cubitos', 'objeto', 4],
    ],
    'frio-mantenimiento' => [
        ['mantenimiento de refrigeracion', 'objeto', 9], ['mantenimiento de vitrina', 'objeto', 9],
        ['mantenimiento de congeladora', 'objeto', 9], ['limpieza de condensador', 'sintoma', 8], ['condensador', 'objeto', 5],
        ['mantenimiento preventivo', 'objeto', 6], ['revision de equipos de frio', 'objeto', 8], ['limpieza de serpentin', 'sintoma', 8],
        ['mantenimiento', 'general', 3], ['revision', 'general', 2], ['limpieza', 'general', 2],
    ],
    'electricidad-residencial' => [
        ['enchufe', 'objeto', 6], ['enchufe que chispea', 'sintoma', 9], ['chispea', 'sintoma', 5], ['instalacion electrica', 'objeto', 8],
        ['cableado de casa', 'objeto', 8], ['interruptor', 'objeto', 5], ['huele a quemado', 'sintoma', 6], ['cortocircuito', 'sintoma', 7],
        ['cable pelado', 'sintoma', 6], ['instalar enchufe', 'sintoma', 8], ['electricista', 'general', 3], ['casa', 'general', 1],
    ],
    'electricidad-comercial' => [
        ['instalacion electrica de local', 'objeto', 9], ['instalacion industrial', 'objeto', 9], ['local comercial', 'objeto', 6],
        ['fabrica', 'objeto', 5], ['taller', 'objeto', 4], ['trifasico', 'objeto', 7], ['motor trifasico', 'objeto', 8],
        ['ampliar carga', 'sintoma', 6], ['cableado de tienda', 'objeto', 8], ['tienda', 'general', 2], ['negocio', 'general', 2],
    ],
    'electricidad-tableros' => [
        ['tablero electrico', 'objeto', 9], ['tablero', 'objeto', 6], ['llave termica', 'objeto', 7], ['breaker', 'objeto', 7],
        ['salta la llave', 'sintoma', 9], ['se baja la llave', 'sintoma', 9], ['corte de electricidad', 'sintoma', 8],
        ['sin electricidad', 'sintoma', 7], ['diferencial', 'objeto', 6], ['cuchilla', 'objeto', 5], ['se va la electricidad', 'sintoma', 8],
    ],
    'electricidad-iluminacion' => [
        ['foco', 'objeto', 6], ['focos', 'objeto', 6], ['iluminacion', 'objeto', 7], ['lampara', 'objeto', 6], ['reflector', 'objeto', 6],
        ['luminaria', 'objeto', 6], ['foco no prende', 'sintoma', 9], ['parpadea', 'sintoma', 5], ['led', 'objeto', 5],
        ['instalar focos', 'sintoma', 8], ['fluorescente', 'objeto', 6],
    ],
    'electricidad-tierra' => [
        ['puesta a tierra', 'objeto', 9], ['pozo a tierra', 'objeto', 9], ['pozo de tierra', 'objeto', 9],
        ['me da corriente', 'sintoma', 7], ['da choque', 'sintoma', 6], ['descarga electrica', 'sintoma', 6], ['tierra', 'objeto', 4],
        ['medicion de tierra', 'sintoma', 8], ['jabalina', 'objeto', 6], ['electricidad estatica', 'sintoma', 5], ['choque', 'general', 2],
    ],
    'electricidad-medidores' => [
        ['medidor', 'objeto', 7], ['medidor de electricidad', 'objeto', 9], ['certificado electrico', 'objeto', 8],
        ['certificacion', 'objeto', 6], ['recibo alto', 'sintoma', 7], ['consumo alto', 'sintoma', 6], ['electrocentro', 'objeto', 7],
        ['cambio de medidor', 'sintoma', 9], ['inspeccion electrica', 'objeto', 8], ['recibo', 'general', 2], ['consumo', 'general', 2],
    ],
    'electricidad-solar' => [
        ['panel solar', 'objeto', 9], ['paneles solares', 'objeto', 9], ['energia solar', 'objeto', 9], ['inversor', 'objeto', 6],
        ['bateria solar', 'objeto', 8], ['fotovoltaico', 'objeto', 8], ['terma solar', 'objeto', 7], ['controlador de carga', 'objeto', 7],
        ['solar', 'objeto', 5], ['panel no carga', 'sintoma', 8], ['bateria', 'general', 2],
    ],
    'electricidad-generadores' => [
        ['grupo electrogeno', 'objeto', 9], ['generador', 'objeto', 7], ['generador no arranca', 'sintoma', 10],
        ['motor generador', 'objeto', 7], ['transferencia automatica', 'objeto', 8], ['ups', 'objeto', 5], ['estabilizador', 'objeto', 5],
        ['respaldo de energia', 'objeto', 6], ['planta electrica', 'objeto', 7], ['no arranca', 'general', 3], ['apagon', 'general', 3],
    ],
    'electricidad-alarmas' => [
        ['cerco electrico', 'objeto', 9], ['alarma', 'objeto', 6], ['alarma de casa', 'objeto', 8], ['alarma suena sola', 'sintoma', 9],
        ['sensor de movimiento', 'objeto', 7], ['sirena', 'objeto', 5], ['cerco no funciona', 'sintoma', 9], ['electrificador', 'objeto', 7],
        ['seguridad', 'general', 2], ['intercomunicador', 'objeto', 6], ['portero electrico', 'objeto', 6],
    ],
    'electricidad-domotica' => [
        ['domotica', 'objeto', 9], ['casa inteligente', 'objeto', 9], ['automatizacion', 'objeto', 8], ['enchufe inteligente', 'objeto', 8],
        ['foco inteligente', 'objeto', 8], ['portón electrico', 'objeto', 7], ['motor de porton', 'objeto', 8], ['sensor', 'objeto', 4],
        ['control por celular', 'objeto', 7], ['temporizador', 'objeto', 5], ['automatizar', 'general', 3],
    ],
];
