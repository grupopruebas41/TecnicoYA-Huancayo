"""Backlog documental estimado: no cambia sprints ni implementa el producto."""
from pathlib import Path
import csv
import json
import re
from collections import Counter

ROOT = Path(__file__).resolve().parent
EDITABLES = ROOT.parent
SOURCE = EDITABLES/'sprints-01-08/Plan-Sprints-01-08.json'
PLAN = json.loads(SOURCE.read_text(encoding='utf-8'))

# Configuración explícita: puntos D/B/F/V, prioridad, dependencias de historias, RNF.
# D: datos/contrato; B: backend/regla; F: frontend/integración; V: verificación.
CONFIG = {
 '01-01': ([2,3,2,2],'Must','BASE-01','08 09 11 14'),
 '01-02': ([2,2,2,2],'Must','BASE-01','08 09 11 14'),
 '01-03': ([1,3,3,3],'Must','01-01 01-02','03 08 09 10'),
 '01-04': ([2,3,2,3],'Must','01-03','09 11'),
 '01-05': ([1,2,2,2],'Must','01-04','03 09 14'),
 '01-06': ([2,1,1,2],'Must','BASE-01','03 11 14'),
 '02-01': ([1,1,5,3],'Should','01-03 02-02','03 04'),
 '02-02': ([2,3,3,2],'Must','01-04 01-06 BASE-02','03 09 14'),
 '02-03': ([2,3,3,2],'Should','01-04 BASE-02','03 09 14'),
 '02-04': ([2,3,3,3],'Must','01-02 01-04 BASE-02','09 14'),
 '02-05': ([2,3,3,3],'Should','01-05 BASE-02','03 09 14'),
 '02-06': ([3,3,3,3],'Must','02-02 02-04','03 09 14'),
 '02-07': ([2,3,2,2],'Must','02-02 02-04','09 14'),
 '03-01': ([3,3,5,3],'Must','01-04 02-02','03 05 09 14'),
 '03-02': ([1,3,2,3],'Must','03-01 BASE-02','03 09 14'),
 '03-03': ([2,3,2,2],'Must','03-01 02-06 02-07','03 05 09'),
 '03-04': ([1,3,3,3],'Must','02-04 02-05 02-06 02-07','03 09'),
 '03-05': ([1,2,2,2],'Must','03-01 03-04','03 09'),
 '03-06': ([2,3,3,3],'Must','03-01 03-02 03-03','03 09 11'),
 '04-01': ([2,5,1,3],'Must','03-06 02-06 02-07 BASE-04','01 09 11 12'),
 '04-02': ([3,5,2,3],'Must','04-01','01 11 12 14'),
 '04-03': ([2,3,2,3],'Must','04-02','01 03 12'),
 '04-04': ([3,5,3,3],'Must','04-02 04-03 BASE-04','07 09 12 14'),
 '04-05': ([1,3,3,3],'Must','04-04','03 09 12'),
 '04-06': ([3,5,3,5],'Must','04-05','02 09 12 14'),
 '04-07': ([2,5,2,5],'Must','04-05 03-05','07 09 12'),
 '04-08': ([2,3,2,3],'Must','04-07','07 12'),
 '04-09': ([1,3,3,5],'Must','04-04 04-05 BASE-04','03 09 10 12'),
 '04-10': ([2,3,1,3],'Must','04-04 BASE-04','07 12'),
 '05-01': ([1,2,3,2],'Must','04-06','03 09'),
 '05-02': ([2,3,3,3],'Must','04-06 05-01','03 09 14'),
 '05-03': ([3,5,3,5],'Must','05-01','03 09 14'),
 '05-04': ([3,5,3,5],'Must','05-02 04-07','09 11 14'),
 '05-05': ([1,2,3,3],'Must','04-06 04-09 05-02','03 09'),
 '05-06': ([1,3,2,3],'Must','04-06 05-02','09 14'),
 '05-07': ([2,3,2,3],'Must','05-02 04-07','09 14'),
 '06-01': ([2,3,3,3],'Must','05-02','03 09 12 14'),
 '06-02': ([2,3,2,3],'Must','06-01','09 12 14'),
 '06-03': ([1,3,2,3],'Must','06-01 05-04 BASE-04','09 12'),
 '06-04': ([2,3,3,3],'Should','06-01 06-02','03 09 12'),
 '06-05': ([3,3,3,3],'Must','06-02 BASE-02','09 12 14'),
 '06-06': ([3,5,3,5],'Must','06-05','09 12 14'),
 '06-07': ([1,3,3,2],'Must','06-01 04-03','03 09'),
 '07-01': ([2,3,5,3],'Should','04-08 05-02 06-01','03 09'),
 '07-02': ([2,5,3,5],'Must','04-06 04-07 05-07','09 12 14'),
 '07-03': ([2,3,3,3],'Must','01-04 05-06','09 14'),
 '07-04': ([2,3,3,2],'Should','01-04 03-06','03 09 14'),
 '07-05': ([1,5,3,5],'Must','04-02 04-08','09 12 14'),
 '07-06': ([2,5,3,3],'Should','07-01 04-10','03 09 14'),
 '07-07': ([1,5,3,5],'Must','01-04 07-02 07-03 07-05','09 11 14'),
 '08-01': ([3,3,3,3],'Must','05-02 01-04','03 09 14'),
 '08-02': ([1,3,3,2],'Should','08-01 06-07','03 09'),
 '08-03': ([2,3,2,3],'Should','04-09 04-10','03 07 09'),
 '08-04': ([1,2,3,2],'Should','07-04 BASE-02','03 09'),
 '08-05': ([3,5,5,3],'Must','08-01 08-02 08-03 08-04 07-07 06-06','08 09 10 11'),
 '08-06': ([2,3,3,2],'Must','08-05','11 12'),
 '08-07': ([3,5,3,3],'Must','08-05','01 02 12'),
 '08-08': ([3,5,3,3],'Must','08-05','03 04 05'),
 '08-09': ([3,5,5,3],'Must','08-06 08-07 08-08','06 10 13 14'),
}

EPICS = {
 1:('EP-01','Identidad, permisos y base del producto','Acceso real por rol y catálogo inicial reproducible.'),
 2:('EP-02','Oferta profesional y presentación pública','Técnicos revisados, oferta configurable y landing integrada.'),
 3:('EP-03','Captura de necesidades y descubrimiento','Solicitud en cinco pasos y búsqueda con privacidad.'),
 4:('EP-04','Matching, ofertas y asignación confiable','Selección reproducible, respuesta temporal y elección segura.'),
 5:('EP-05','Atención, agenda y coordinación','Ejecución trazable por participación y cambios controlados.'),
 6:('EP-06','Reputación e historial','Calificación versionada, cierre y revisión de apelaciones.'),
 7:('EP-07','Supervisión y gobierno administrativo','Intervenciones, reglas y reportes con permisos y auditoría.'),
 8:('EP-08','Servicios finales y entrega del MVP','Simulación económica, calidad y demostración recuperable.'),
}

BASES = [
 dict(id='BT-BASE-01',sprint=1,epic='EP-01',points=3,priority='Must',dependencies=['ITER-0'],rf='RF-28, RF-33',rnf='RNF-11, RNF-13, RNF-14',area='Integración inicial',title='Contrastar la implementación histórica, fijar versiones compatibles y comprobar React–Laravel–MySQL',detail='Reutilizar estructura de Iteración 0; configurar base aislada, migraciones de identidad/permisos/sesión/auditoría compartidos y prueba de humo de conexión. Documentar diferencias antes de migrar datos. Esta tarea es propietaria de la base compartida; las historias solo la amplían.',result='Conexión real y esquema compartido reproducibles; versión de herramientas y estrategia de migración registradas.'),
 dict(id='BT-BASE-02',sprint=2,epic='EP-02',points=5,priority='Must',dependencies=['HU-S01-04'],rf='RF-33, RF-C01, RF-C06',rnf='RNF-09, RNF-11, RNF-14',area='Archivos compartidos',title='Implementar almacenamiento y acceso seguro a medios públicos y privados',detail='Crear media_files y adaptador de almacenamiento; validar contenido, finalidad y límites aprobados, generar nombres internos, autorizar subidas/descargas y separar galería pública de documentos privados. Las historias añaden vínculos y pantallas, no otro servicio de archivos.',result='Archivo propio permitido, descarga ajena denegada y contenido no permitido rechazado; P17 resuelto para formatos/límites.'),
 dict(id='BT-BASE-04',sprint=4,epic='EP-04',points=5,priority='Must',dependencies=['HU-S03-06'],rf='RF-15, RF-16, RF-17, RF-29',rnf='RNF-07, RNF-11, RNF-12, RNF-13',area='Tiempo y trabajo asíncrono',title='Preparar Clock, colas MySQL, workers, scheduler y outbox compartido',detail='Implementar infraestructura reutilizable y reloj de prueba; separar colas de dominio/entrega, registro de trabajo fallido y publicación tras commit. Los jobs de negocio y Reverb se implementan en sus historias; no se estiman dos veces aquí.',result='Job de prueba recuperable e idempotente; rollback sin publicación; entorno apto para los plazos del Sprint 4.')
]

# Descomposición particular donde no corresponde inventar una pantalla o una migración.
OVERRIDES = {
 '04-02': [('Datos','Crear versiones de reglas, pesos y snapshot de factores con suma 100 y referencias preservadas'),('Dominio','Implementar scorer y ordenamiento, desempate por promedio y política pendiente de empate residual'),('Integración','Conectar el scorer a la ejecución interna del matching y devolver ranking explicable; sin pantalla nueva'),('Pruebas','Automatizar cálculo 75/100, desempates y rechazo de configuración inválida con fixtures deterministas')],
 '04-10': [('Datos','Persistir intentos, evento lógico y límite de reintentos reutilizando outbox'),('Backend','Implementar entrega sandbox, recuperación y descarte de generación obsoleta sin extender SLA'),('Integración','Conectar el sender a worker-delivery y registrar fallos útiles para operación; sin panel adicional'),('Pruebas','Automatizar caída permanente, límite de tres reintentos, duplicados y ejecución de job antiguo')],
 '08-05': [('Preparación QA','Consolidar fixtures, matriz de abusos y regresión acumulada de los ocho sprints'),('Seguridad','Revisar y corregir autorización, CSRF, archivos, XSS, secretos y configuración de ejecución'),('Integración','Ejecutar recorridos completos por rol y comprobar persistencia, concurrencia y recuperación'),('Evidencia','Registrar resultados y defectos, corregir/reprobar y vincular revisión al commit candidato')],
 '08-06': [('Calidad','Definir alcance de cobertura y condiciones del Quality Gate según P21'),('CI','Integrar informes reales, scanner y acceso restringido a SonarQube'),('Integración','Bloquear promoción si falla la puerta y publicar informes de cobertura por módulo'),('Verificación','Ejecutar casos de gate aprobado/fallido y conservar configuración e informes identificables')],
 '08-07': [('Protocolo','Aprobar dataset, hardware, carga de 200 usuarios, duración y estadístico de aceptación'),('Carga','Implementar escenarios de carga y medición de matching con herramienta por fijar'),('Integridad','Verificar reservas, ofertas y estado de MySQL después de la carga concurrente'),('Evidencia','Conservar distribución de tiempos, errores y cuellos de botella; reportar metas alcanzadas o fallidas')],
 '08-08': [('Protocolo','Acordar participantes, consentimiento, escenarios, tamaños y navegadores de prueba'),('Evaluación','Ejecutar estudio con participantes: cinco pasos, tiempo de solicitud, SUS y búsqueda comparada'),('Compatibilidad','Verificar recorridos en Chrome, Edge y Firefox y móvil/escritorio con teclado'),('Evidencia','Analizar medianas, SUS, fallos y limitaciones; no sustituir resultados humanos por datos inventados')],
 '08-09': [('Preparación','Validar configuración, manifiesto de imágenes, respaldos y migraciones compatibles en Compose'),('Despliegue','Publicar en servidor académico con gateway HTTPS/WSS y servicios internos; ejecutar humo por roles'),('Recuperación','Restaurar base y archivos en entorno aislado, verificar jobs/Reverb y ensayar reversión compatible'),('Observación','Monitorear disponibilidad durante la ventana aprobada y documentar operación y aceptación')],
}

INTEGRATION = {
 '02-01':'Reutilizar API pública del catálogo y conectar imágenes/textos de landing, sin duplicar endpoints',
 '04-01':'Conectar elegibilidad al caso de uso de matching y comunicar estado de búsqueda a React',
}

def task_parts(h, key):
    if key in OVERRIDES: return OVERRIDES[key]
    data=[]; backend=[]; front=[]
    for segment in h['work'].rstrip('.').split(';'):
        label, sep, text=segment.strip().partition(':')
        if not sep: backend.append(segment.strip()); continue
        if label.lower()=='datos': data.append(text.strip())
        elif label.lower()=='fe': front.append(text.strip())
        else: backend.append(label.strip()+': '+text.strip())
    return [
        ('Datos/contrato','Preparar o ampliar '+('; '.join(data) if data else 'el contrato y fixtures de '+h['title'].lower())+'; reutilizar esquema compartido y versionar cambios necesarios'),
        ('Backend',INTEGRATION.get(key,'Implementar '+('; '.join(backend) if backend else 'los casos de uso y acceso autorizados de '+h['title'].lower()))),
        ('Frontend/integración','Construir y conectar '+('; '.join(front) if front else 'la integración con los consumidores existentes, sin añadir una pantalla fuera del alcance')),
        ('Pruebas y evidencia','Implementar y ejecutar '+', '.join(c['id']+' ('+c['title']+')' for c in h['cases'])+'; cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales')
    ]

def tbl(headers, rows):
    def esc(v): return str(v).replace('|',r'\|').replace('\n','<br>')
    return '\n'.join(['| '+' | '.join(map(esc,headers))+' |','| '+' | '.join('---' for _ in headers)+' |']+['| '+' | '.join(map(esc,r))+' |' for r in rows])

def dep_id(short):
    return 'BT-'+short if short.startswith('BASE-') else 'HU-S'+short

def generate():
    stories=[]; tasks=[]
    for b in BASES:
        tasks.append({**b,'story':'Habilitador compartido','base':'HU-01, HU-24, HU-32' if b['sprint']==1 else 'HU-24, HU-32' if b['sprint']==2 else 'HU-09, HU-20, HU-32','tc':'Verificación de integración definida en el resultado; vincular ejecución al sprint','status':'Propuesto; no evaluado como implementado','pending':'P17' if b['sprint']==2 else 'P12' if b['sprint']==4 else 'Versiones y compatibilidad de Iteración 0'})
    for s in PLAN:
        for h in s['stories']:
            key=h['id'].removeprefix('HU-S'); pts,priority,deps,rnf=CONFIG[key]
            dependencies=[dep_id(x) for x in deps.split()]
            rnfs=', '.join('RNF-'+v for v in rnf.split())
            decisions=sorted(set(re.findall(r'P\d+',s['pending'])))
            critical=sorted(set(p for c in h['cases'] for p in re.findall(r'P\d+',c['pending'])))
            rec={**h,'epic':EPICS[s['n']][0],'sprint':s['n'],'priority':priority,'points':sum(pts),'dependencies':dependencies,'rnf':rnfs,'pending':critical,'sprint_pending':decisions}
            stories.append(rec)
            previous=None
            for i,((area,title),p) in enumerate(zip(task_parts(h,key),pts),1):
                tid=f'BT-S{key}-{i:02}'
                taskdeps=dependencies if previous is None else [previous]
                tasks.append(dict(id=tid,story=h['id'],base=h['base'],epic=rec['epic'],sprint=s['n'],points=p,priority=priority,dependencies=taskdeps,rf=h['rf'],rnf=rnfs,area=area,title=title,detail='Ejecutar respetando contrato, propiedad del recurso y decisiones de la historia; no repetir el trabajo compartido ya entregado.',result='Cumple los criterios de la historia y su entregable por capa; ver TC vinculados.',tc=', '.join(c['id'] for c in h['cases']),status='Propuesto; no evaluado como implementado',pending=', '.join(critical)))
                previous=tid
    assert len(stories)==59 and len(CONFIG)==59
    ids={x['id'] for x in tasks+stories}
    assert len(ids)==len(tasks)+len(stories)
    # La dependencia de una HU exige todas sus tareas terminadas; detectar ciclos reales.
    graph={t['id']:t['dependencies'] for t in tasks}
    graph.update({h['id']:[t['id'] for t in tasks if t['story']==h['id']] for h in stories})
    visiting=set(); complete=set()
    def visit(node):
        if node=='ITER-0':return
        assert node in graph,node
        if node in complete:return
        assert node not in visiting, 'Ciclo: '+node
        visiting.add(node)
        for dep in graph[node]:visit(dep)
        visiting.remove(node);complete.add(node)
    for x in graph:visit(x)
    sprint_by_id={x['id']:x['sprint'] for x in tasks+stories}
    for t in tasks:
        assert all(d=='ITER-0' or sprint_by_id[d]<=t['sprint'] for d in t['dependencies'])
        assert t['points'] in (1,2,3,5,8)
    rf=set(int(x) for h in stories for x in re.findall(r'RF-(\d+)',h['rf']))
    rnfs=set(int(x) for h in stories for x in re.findall(r'RNF-(\d+)',h['rnf']))
    assert rf==set(range(1,34)) and rnfs==set(range(1,15))
    totals={s['n']:sum(t['points'] for t in tasks if t['sprint']==s['n']) for s in PLAN}
    global_total=sum(totals.values())
    body=['# CANVAS · Backlog Técnico de Implementación', '', '**TécnicoYa Huancayo · Versión 1.0 · 5 de octubre de 2026**', '',
        '**Estado:** propuesta de priorización y estimación para refinamiento. Conserva los ocho sprints aprobados y sus 59 historias. No acredita implementación, ejecución de pruebas ni aceptación académica.', '',
        '## 1. Objetivo y decisiones de planificación', '',
        'Convertir el plan aprobado en trabajo implementable para un equipo junior: datos y contrato → lógica de backend → interfaz conectada → pruebas y evidencia, entregando recorridos completos dentro de cada sprint. La Iteración 0 es instalación/estructura previa y no forma parte de los puntos de esta entrega.', '',
        'Arquitectura de referencia: React; API REST Laravel modular; MySQL; Reverb/Echo; Docker Compose; Pest y Cypress; SonarQube. Se preservan las raíces frontend/web, backend/api, database, infrastructure y .devops. La arquitectura histórica de PostgreSQL/Python permanece como antecedente y no añade servicios al diseño vigente.', '',
        'El diccionario completo orienta el esquema, pero las migraciones se implementan por incremento. La reserva mínima necesaria para evitar doble asignación se entrega en Sprint 4; agenda completa en Sprint 5. Auditoría de acciones sensibles desde que existen; consulta administrativa completa en Sprint 7. Seguridad y pruebas acompañan cada sprint; Sprint 8 concentra endurecimiento y regresión final.', '',
        '## 2. Convenciones de puntos y MoSCoW', '',
        '**Puntos:** estimación inicial relativa de esfuerzo, complejidad e incertidumbre, propuesta por el asistente. Escala por tarea: 1, 2, 3, 5, 8. Un punto no equivale a una hora o día. El equipo debe calibrar los valores con trabajo conocido; no se atribuyen estas cifras a una exigencia de Scrum.', '',
        'Se puntúan las tareas porque así se solicita. Los puntos de cada historia, épica y sprint son únicamente la suma de sus tareas: no son una segunda estimación ni deben volver a sumarse. Los habilitadores compartidos se cuentan una sola vez. Si después se estima directamente en story points por historia, se sustituye este método y se recalibran los totales.', '',
        tbl(['Prioridad','Interpretación en este backlog'],[
        ('Must have','Núcleo del flujo, integridad, seguridad o requisito necesario para aceptar el incremento.'),
        ('Should have','Funcionalidad aprobada de valor complementario que se prioriza después de las dependencias críticas dentro de su mismo sprint. Sigue incluida; no se retira automáticamente.'),
        ('Could have','No se agregan mejoras opcionales nuevas a esta línea base. Toda candidata requiere registrar alcance y estimación antes de incorporarla.'),
        ("Won’t have en este MVP",'Chat/LLM, pagos reales, suscripción comercial, aplicación móvil nativa, geolocalización real y multitenencia empresarial ampliada. Sin sprint ni puntos asignados.')]), '',
        'Las prioridades y puntos son propuestas revisables. La asignación de sprint reproduce la aprobada por el usuario. Si la capacidad no alcanza, presentar el conflicto antes de cambiar alcance u orden; una prioridad Should no autoriza omitir un requisito aprobado.', '',
        '## 3. Épicas y resumen de capacidad', '',
        tbl(['Épica','Resultado','Sprint','Historias','Tareas','Puntos agregados'],[(EPICS[s['n']][0]+' · '+EPICS[s['n']][1],EPICS[s['n']][2],s['n'],len(s['stories']),len([t for t in tasks if t['sprint']==s['n']]),totals[s['n']]) for s in PLAN]), '',
        f'**Total propuesto:** {len(stories)} historias, {len(tasks)} tareas y **{global_total} puntos de tarea**. Incluye {len(BASES)} habilitadores técnicos compartidos. Cobertura documental: RF-01..RF-33 y RNF-01..RNF-14. Los RF-C conservan el desglose complementario de las fuentes.', '',
        'No existe velocidad medida ni duración acordada de sprint: estos totales no prueban que el alcance quepa en ocho periodos de una duración determinada. Revisar especialmente los Sprints 4 y 8 por concurrencia, incertidumbre y verificación. La observación de disponibilidad y los estudios con participantes tienen tiempo de calendario que los puntos no representan.', '',
        '## 4. Dependencias e infraestructura compartida', '',
        'Una dependencia HU exige sus criterios de aceptación terminados; una dependencia BT exige el entregable técnico señalado. ITER-0 es la única precondición externa al grafo. Las decisiones Pxx son condiciones de refinamiento y se listan aparte; no se consideran resueltas por tener una dependencia de código cumplida.', '',
        tbl(['ID','Sprint / épica','Tarea compartida','Puntos / prioridad','Dependencias','RF / RNF'],[(b['id'],f'{b["sprint"]} / {b["epic"]}',b['title'],f'{b["points"]} / {b["priority"]}',', '.join(b['dependencies']),b['rf']+'; '+b['rnf']) for b in BASES]), '',
        *[f'- **{b["id"]}:** {b["detail"]} **Salida verificable:** {b["result"]}' for b in BASES], '',
        'React y Laravel se conectan desde Sprint 1. Medios públicos/privados compartidos aparecen en Sprint 2. Workers, scheduler y outbox se habilitan en Sprint 4; Reverb/Echo se integran en HU-S04-09. Exportaciones reutilizan las colas en Sprint 7. SonarQube y el despliegue de demostración se completan en Sprint 8. Echo es una biblioteca frontend; los workers ejecutan código del mismo backend.', '',
        '## 5. Backlog detallado por sprint', '']
    for s in PLAN:
        n=s['n']; hs=[h for h in stories if h['sprint']==n]; ts=[t for t in tasks if t['sprint']==n]
        local_nodes={h['id']:h for h in hs}
        local_nodes.update({b['id']:b for b in BASES if b['sprint']==n})
        local_order=[]
        while len(local_order)<len(local_nodes):
            available=[x for x in local_nodes if x not in local_order and all(d not in local_nodes or d in local_order for d in local_nodes[x]['dependencies'])]
            assert available
            # Catálogo semilla temprano; después resolver Must antes de Should entre opciones listas.
            chosen=min(available,key=lambda x:(0 if x.startswith('BT-BASE') or x=='HU-S01-06' else 1,0 if local_nodes[x]['priority']=='Must' else 1,x))
            local_order.append(chosen)
        body += [f'### Sprint {n} · {s["title"]}', '',
            f'**Épica:** {EPICS[n][0]}. **Objetivo:** {s["objective"]}', '',f'**Alcance aprobado:** {s["scope"]}', '',
            f'**Total:** {totals[n]} puntos agregados de {len(ts)} tareas. **Dependencias del incremento:** {s["dependencies"]}', '',
            '**Decisiones del sprint:** '+s['pending'], '',
            '**Orden sugerido dentro del sprint, una vez disponibles las dependencias anteriores:** '+ ' → '.join(local_order)+'. Las actividades independientes pueden prepararse en paralelo; cada HU se entrega con sus cuatro tareas.', '',
            f'**Fuente de criterios y DoD:** [CANVAS Sprint {n}](sprints-01-08/CANVAS-Sprint-{n:02}.md).', '',
            tbl(['Historia','Título','MoSCoW','Puntos agregados','Dependencias','RF / RNF'],[(h['id'],h['title'],h['priority'],h['points'],', '.join(h['dependencies']),h['rf']+'; '+h['rnf']) for h in hs]), '']
        for h in hs:
            subtasks=[t for t in ts if t['story']==h['id']]
            body += [f'#### {h["id"]} · {h["title"]}', '',f'Como **{h["who"]}**, quiero **{h["want"]}**, para **{h["benefit"]}**.', '',
                f'**Traza:** {h["base"]} → {h["id"]} → '+', '.join(c['id'] for c in h['cases'])+'.', '',
                '**Condiciones específicas de pruebas:** '+(', '.join(h['pending']) if h['pending'] else 'Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint.')+' Estado: propuesto; ejecución pendiente.', '',
                tbl(['Tarea','Área / entregable','Puntos','MoSCoW','Dependencias'],[(t['id'],t['area']+': '+t['title'],t['points'],t['priority'],', '.join(t['dependencies'])) for t in subtasks]), '',
                f'Todas las tareas anteriores pertenecen a **{h["epic"]}, Sprint {n}** y trazan a **{h["rf"]}; {h["rnf"]}**. La matriz adjunta repite estos campos por tarea para importación o filtrado.', '',
                '**Aceptación vinculada:**', '']
            for c in h['cases']:
                body += [f'- **{c["ac"]} / {c["id"]}: Dado** {c["given"]}, **cuando** {c["when"]}, **entonces** {c["then"]}.'+(f' Condicionado a {c["pending"]}.' if c['pending'] else '')]
            body += ['']
    body += ['## 6. Reglas para ejecutar este backlog', '',
        '1. Refinar las decisiones que afectan a la historia y acordar sus criterios BDD; no inventar plazos, umbrales o políticas pendientes.',
        '2. Confirmar dependencias y revisar el código real: no se ha descontado trabajo existente porque este backlog no es una auditoría de implementación. Reestimar según lo validado, conservando el ID y la trazabilidad.',
        '3. Preparar contrato/datos; implementar reglas y autorización; conectar React; automatizar y ejecutar los TC. El orden de las cuatro tareas es una secuencia de referencia, no una prohibición de preparar UI y pruebas en paralelo con un contrato acordado.',
        '4. Crear o ampliar una migración una sola vez. Los datos/servicios ya introducidos se reutilizan; los puntos de una historia posterior cubren sus cambios, no su reconstrucción.',
        '5. Mantener campos de seguimiento por tarea: responsable, estado, estimación revisada, fecha, commit/PR, evidencia y defecto. En esta entrega permanecen sin asignación ni resultados ficticios.',
        '6. Revisar incremento con el asesor; presentar lo completado y lo que no cumple DoD. Antes de mover una historia de sprint, informar al usuario y registrar la decisión.', '',
        '## 7. Definition of Ready y Definition of Done', '',
        '**Ready:** actor/valor y RF/RNF identificados; dependencias disponibles; reglas relevantes acordadas; datos de prueba y contrato definidos; puntos revisados por Developers y capacidad discutida. No toda decisión del proyecto debe resolverse para iniciar una historia independiente.', '',
        '**Done:** comportamiento y permisos cumplen los criterios; código revisado; migraciones y contratos actualizados; pruebas pertinentes y regresión ejecutadas; defectos/seguridad tratados según umbral aprobado; evidencia vinculada al commit; documentación y revisión del incremento registradas. El detalle específico permanece en cada CANVAS de sprint.', '',
        'Una tarea técnica completada no significa que su historia esté aceptada. Los 118 TC son casos previstos de los CANVAS anteriores; aquí se vinculan, no se duplican ni se declaran ejecutados. La cobertura documental no equivale a cobertura de código ni a cumplir los RNF.', '',
        '## 8. Control de incertidumbre y riesgos de estimación', '',
        '- Matching: cerrar normalización, tratamiento sin historial y desempate residual (P15); fixtures no equivalen a calibración real.',
        '- Relojes/elección/reservas: P11, P12 y P16 afectan tareas de concurrencia y pueden cambiar puntos.',
        '- Dos técnicos/cancelación: P13/P14 afectan estado global y sustitución; no aprobar escenarios con reglas parciales.',
        '- Reglas/sanciones: P18/P19 deben definir efecto en sesiones y servicios vigentes antes de habilitar intervenciones.',
        '- Pagos: historial y ganancias son simulados por el plan reciente; P01/P02/P16/P21 concretan moneda, fórmula y datos, sin procesamiento financiero.',
        '- Calidad: P09/P21 determinan muestra, ventana, carga, medición y umbrales; los tiempos de espera reales no se reducen por asignar menos puntos.',
        '- Privacidad: P08 sigue abierto. Refinamiento y controles de datos pertenecen a HU-S08-05; no se programa borrado o anonimización automática sin una política acordada.', '',
        '## 9. Archivos y fuentes', '',
        '- [Matriz de tareas, puntos, dependencias y RF/RNF](backlog-tecnico/Backlog-Tareas.csv).',
        '- [Matriz de historias y estimaciones agregadas](backlog-tecnico/Backlog-Historias.csv).',
        '- [Datos estructurados del backlog](backlog-tecnico/Backlog-Tecnico.json).',
        '- [Plan aprobado de ocho sprints](sprints-01-08/CANVAS-Plan-Sprints-01-08.md).',
        '- [CANVAS de análisis](CANVAS-Analisis-MVP-TecnicoYa.md), [diseño técnico](CANVAS-Diseno-Tecnico-MVP-TecnicoYa.md) y [diccionario MySQL](CANVAS-Diccionario-Datos-MySQL-TecnicoYa.md).',
        '- Fuente 0 y respuestas aportadas por el usuario, leídas durante la planificación; las instrucciones posteriores del chat prevalecen en alcance y tecnologías.',
        '- Backlog anterior: documento 03 de `v2/contenido.json`. Se conserva como antecedente; no se reutilizan sus diez iteraciones ni numeración antigua de historias.', '',
        'ISO 9001, ISO/IEC 25010, 27001, 27701 y 29119-2/3/4 permanecen como referencias de proceso, calidad, seguridad, privacidad y evidencia. Esta estimación no acredita cumplimiento, certificación ni capacidad medida del equipo.', '']
    destination=EDITABLES/'CANVAS-Backlog-Tecnico-Implementacion-TecnicoYa.md'
    destination.write_text('\n'.join(body),encoding='utf-8')
    for filename,rows,fields in [
        ('Backlog-Tareas.csv',tasks,['id','epic','story','base','sprint','area','title','points','priority','dependencies','rf','rnf','tc','pending','status','result']),
        ('Backlog-Historias.csv',stories,['id','epic','sprint','title','base','rf','rnf','points','priority','dependencies','pending'])]:
        with (ROOT/filename).open('w',encoding='utf-8-sig',newline='') as f:
            writer=csv.DictWriter(f,fieldnames=fields,extrasaction='ignore');writer.writeheader()
            for row in rows:writer.writerow({k:', '.join(map(str,v)) if isinstance(v,list) else v for k,v in row.items() if k in fields})
    (ROOT/'Backlog-Tecnico.json').write_text(json.dumps(dict(version='1.0',status='proposed_not_executed',estimation='Task points; story/sprint totals are rollups, not additional estimates',epics=EPICS,stories=stories,tasks=tasks,sprint_points=totals,total_points=global_total),ensure_ascii=False,indent=2),encoding='utf-8')
    report=dict(stories=len(stories),tasks=len(tasks),task_points=global_total,sprint_points=totals,moscow=dict(Counter(h['priority'] for h in stories)),checks=['59 historias conservadas','8 sprints sin reasignación','RF-01..RF-33 y RNF-01..RNF-14','IDs únicos','Dependencias existentes, acíclicas y sin sprint futuro','Puntos de tarea válidos y totales sin doble conteo'],product_tests_executed=False)
    for link in re.findall(r'\]\(([^)]+)\)',destination.read_text(encoding='utf-8')):
        assert (destination.parent/link).exists(),link
    (ROOT/'Validacion-Backlog.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(report,ensure_ascii=True))

if __name__=='__main__':generate()
