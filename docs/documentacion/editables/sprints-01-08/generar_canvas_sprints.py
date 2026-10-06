"""Genera planificación documental. No implementa ni ejecuta pruebas del producto."""
from pathlib import Path
import csv
import json
import re
import zipfile

ROOT = Path(__file__).resolve().parent
SPRINTS = []

COMMON_DOD = [
 'Las historias comprometidas cumplen sus criterios positivos, alternativos y de autorización; las decisiones pendientes que condicionan su aceptación están resueltas y registradas. Un caso condicionado no se cuenta como aprobado por omisión.',
 'Código revisado y responsabilidades separadas conforme diseño modular/SOLID; contratos, migraciones, diccionario y trazabilidad actualizados para el incremento real, sin afirmar que todo el proyecto está terminado.',
 'Build y pruebas aplicables ejecutados en entorno aislado con versiones identificadas. Casos de servidor usan MySQL cuando se evalúa integridad/concurrencia; Cypress no sustituye la prueba de transacción.',
 'Sin secretos en el repositorio o artefactos. Autorización por rol/propiedad, validación y privacidad del nuevo flujo probadas; sin defectos bloqueantes de seguridad/integridad. Umbrales de defectos restantes se acuerdan en P21.',
 'Regresión de comportamientos afectados de sprints anteriores realizada; fallos y excepciones documentados con responsable y resolución. No marcar aprobado un escenario omitido ni un test deshabilitado.',
 'Evidencias vinculadas a TC, HU, RF/RNF, commit, entorno/versiones, dataset, resultado, fecha y defecto. Los informes del runner son evidencia; una captura aislada no demuestra integridad.',
 'Incremento integrado y demostrable en el entorno acordado; revisión con el asesor, observaciones y aceptación registradas. Retrospectiva identifica mejoras sin cambiar silenciosamente los ocho alcances.'
]

FOLDERS = [
 ('Frontend', 'frontend/web/src/features/{requests,matching,offers,service,ratings,administration}', 'Destino modular orientativo del diseño; adaptar componentes existentes sin sustituir el proyecto completo.'),
 ('Backend', 'backend/api/app/Modules/{ARequests,BMatching,COffers,DService,ERatings,FAdministration}', 'Separar HTTP, Application, Domain e Infrastructure cuando existan responsabilidades concretas; no crear capas vacías por formalidad.'),
 ('Persistencia', 'backend/api/database/migrations y seeders; database/', 'Migraciones MySQL versionadas como fuente ejecutable; database conserva documentación/referencia, no un segundo esquema contradictorio.'),
 ('Pruebas PHP', 'backend/api/tests/Unit y tests/Feature', 'Rutas de destino propuestas para Pest, API y MySQL; introducir carpetas por módulo al implementar.'),
 ('Pruebas navegador', 'frontend/web/cypress/e2e/sprint-NN', 'Ruta prevista para recorridos Cypress; los .feature entregados son especificaciones, no pruebas Cypress implementadas.'),
 ('Entorno', 'infrastructure/ y .devops/', 'Conservar las raíces existentes para Compose, despliegue y automatización; fijar un solo pipeline activo al implementar.'),
 ('Evidencia', 'docs/documentacion/evidencias/sprint-NN/', 'Ruta propuesta para informes, resultados, defectos y acta. Esta entrega no crea resultados ficticios.'),
 ('Documentación', 'docs/documentacion/editables/sprints-01-08/', 'CANVAS, escenarios y catálogo de pruebas previstos en esta entrega.')
]

def md_table(headers, rows):
    def cell(x): return str(x).replace('|', r'\|').replace('\n', '<br>')
    return '\n'.join(['| ' + ' | '.join(map(cell,headers)) + ' |', '| ' + ' | '.join(['---']*len(headers)) + ' |'] + ['| ' + ' | '.join(map(cell,row)) + ' |' for row in rows])

def source_note():
    return '''Fuentes: Fuente 0 y respuestas del usuario; [CANVAS de análisis](../CANVAS-Analisis-MVP-TecnicoYa.md), [diseño técnico](../CANVAS-Diseno-Tecnico-MVP-TecnicoYa.md), [diccionario MySQL](../CANVAS-Diccionario-Datos-MySQL-TecnicoYa.md), [clases del dominio](../CANVAS-Clases-Dominio-TecnicoYa.md) y plan de ocho sprints aprobado en el chat. El backlog técnico v2 de 29/09/2026 se consultó mediante su fuente editable `../v2/contenido.json` (documento 03): sus diez iteraciones, PostgreSQL/Python, tokens históricos y ampliaciones de chat/LLM no prevalecen sobre las decisiones actuales. Las HU de este documento derivan de las HU del análisis vigente, no de la numeración incompatible del backlog histórico.'''

def evidence_path(n, tc):
    return f'docs/documentacion/evidencias/sprint-{n:02}/{tc}/'

def automation_target(n, c):
    if c['level'].startswith('Manual'): return f'Protocolo con participantes y hoja de medición en {evidence_path(n,c["id"])}'
    if 'Cypress' in c['level']: return f'frontend/web/cypress/e2e/sprint-{n:02}/{c["id"].lower()}.cy.js (destino propuesto)'
    if 'Pest' in c['level']: return f'backend/api/tests/{"Unit" if c["level"].startswith("Unidad") else "Feature"}/Sprint{n:02}/{c["id"].replace("-", "")}.php (destino propuesto)'
    return f'Planificar script/protocolo en .devops/ o infrastructure/; evidencia: {evidence_path(n,c["id"])}'

def generate():
    ordered = sorted(SPRINTS, key=lambda s:s['n'])
    assert [s['n'] for s in ordered] == list(range(1,9))
    features_dir = ROOT / 'bdd'
    features_dir.mkdir(exist_ok=True)
    all_cases, rf_rows, number = [], [], 0
    for s in ordered:
        n=s['n']; feature_lines=['# language: es', f'@sprint_{n:02} @planificado', f'Característica: Sprint {n} - {s["title"]}', '  Especificación BDD prevista; requiere implementación de pruebas y datos controlados.', '']
        tasks=[]; hu_text=[]; tc_text=[]; story_rows=[]
        for i,h in enumerate(s['stories'],1):
            hid=f'HU-S{n:02}-{i:02}'; h['id']=hid
            ids=[]
            for j,c in enumerate(h['cases'],1):
                number+=1; tc=f'TC-{number:03}'; ids.append(tc)
                c.update(id=tc,hu=hid,base=h['base'],rf=h['rf'],sprint=n,ac=f'AC-S{n:02}-{i:02}-{j:02}')
                c['status']='NO EJECUTADO — diseño condicionado' if c['pending'] else 'NO EJECUTADO — previsto'
                manual=c['level'].startswith('Manual')
                c['automation']='Protocolo manual; no automatizar la participación humana' if manual else 'Automatización prevista; todavía sin implementación'
                all_cases.append(c)
                tags=[f'@{tc.replace("-","_")}', f'@{hid.replace("-","_")}', '@manual' if manual else '@automatizar']
                tags += [f'@pendiente_{p}' for p in re.findall(r'P\d+',c['pending'])]
                feature_lines += ['  '+' '.join(tags), f'  Escenario: {tc} - {c["title"]}', f'    Dado {c["given"]}', f'    Cuando {c["when"]}', f'    Entonces {c["then"]}', '']
                tc_text += [f'### {tc} · {c["title"]}', '',
                    f'**Traza:** {h["rf"]} → {h["base"]} → {hid} → {c["ac"]}. **Prioridad:** alta por pertenecer al incremento comprometido.', '',
                    f'- **Precondición y datos:** {c["given"]}.', f'- **Pasos previstos:** preparar la precondición en el entorno aislado; {c["when"]}; consultar estado persistido y efectos observables.',
                    f'- **Resultado esperado:** {c["then"]}.', f'- **Nivel/herramienta:** {c["level"]}.',
                    f'- **Automatización:** {c["automation"]}. Destino: `{automation_target(n,c)}`.',
                    f'- **Dependencia de decisión:** {c["pending"] or "Ninguna adicional a las condiciones generales de entrada del sprint"}.',
                    f'- **Evidencia prevista:** `{evidence_path(n,tc)}` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.',
                    f'- **Estado actual:** {c["status"]}. Resultado real, responsable de ejecución y fecha: pendientes.', '']
            hu_text += [f'### {hid} · {h["title"]}', '', f'Como **{h["who"]}**, quiero **{h["want"]}**, para **{h["benefit"]}**.', '', f'**Fuente:** {h["base"]}. **Requerimientos:** {h["rf"]}.', '']
            for c in h['cases']:
                hu_text += [f'- **{c["ac"]} / {c["id"]}: Dado** {c["given"]}, **cuando** {c["when"]}, **entonces** {c["then"]}.' + (f' **Condicionado a {c["pending"]}.**' if c['pending'] else '')]
            hu_text += ['']
            tasks.append((f'T-S{n:02}-{i:02}',hid,h['work'],', '.join(ids)))
            story_rows.append((hid,h['base'],h['rf'],h['title']))
            for c in h['cases']: rf_rows.append((str(n),h['rf'],h['base'],hid,c['ac'],c['id'],c['level'],c['pending']))
        feature='\n'.join(feature_lines).rstrip()+'\n'
        (features_dir/f'sprint-{n:02}.feature').write_text(feature,encoding='utf-8')
        sprint_cases=[c for c in all_cases if c['sprint']==n]
        body=[f'# CANVAS · Sprint {n} — {s["title"]}', '',
            '**Versión:** 1.0 · **Fecha:** 5 de octubre de 2026 · **Estado:** planificación para desarrollo; no acredita implementación ni pruebas ejecutadas.', '',
            f'**Alcance aprobado:** {s["scope"]}', '',
            '**Control del plan:** se conservan las ocho iteraciones aprobadas. La Iteración 0 es una precondición y no se renumera. Duración, fechas, capacidad, responsables nominales y estimaciones se fijarán en la planificación; no se inventan en este CANVAS.', '',
            '## 1. Objetivo y resultado esperado', '', s['objective'], '',
            '## 2. Dependencias, límites y condiciones de entrada', '', s['dependencies'], '',
            '**Decisiones por resolver para las historias afectadas:** '+s['pending'], '',
            'Antes de comprometer una historia: identificar actor, datos y permisos; resolver decisiones que cambien su resultado esperado; preparar fixture y contrato; confirmar capacidad. Se puede trabajar lo independiente, pero una decisión pendiente no se transforma en aprobación por transcurso del sprint.', '',
            '## 3. Requerimientos funcionales y trazabilidad', '', md_table(['Historia del sprint','HU fuente','RF/RNF relacionados','Comportamiento'],story_rows), '',
            'Los RF-C desglosan funciones ya descritas en los paneles de la Fuente 0. Las HU-S son particiones de planificación, no reemplazan las HU originales. Un RF repetido entre sprints representa preparación, integración o endurecimiento, según el límite indicado.', '',
            '## 4. Requerimientos técnicos y ubicación del trabajo', '', md_table(['ID local','Requerimiento técnico'],s['technical']), '',
            md_table(['Área','Ruta relativa a la raíz del proyecto','Uso'],FOLDERS), '',
            'Raíz: `C:/Users/James/Documents/ChatGPT/Software TecnicoYa-Huancayo`. Las rutas modulares y de pruebas son destinos del diseño, no afirmaciones sobre implementación existente. La carpeta histórica `python/` se conserva, pero el diseño actual concentra matching en Laravel; no se migra ni elimina código en esta entrega documental.', '',
            '## 5. Tareas de la iteración', '',
            'Orden de trabajo: refinamiento y contrato → migración/modelo → dominio/caso de uso/API → interfaz → integración y pruebas → revisión y evidencia. Validar un flujo completo antes de extender al siguiente. No delegar permisos ni estados al navegador.', '',
            md_table(['Tarea','Historia','Trabajo por capa y entregable','Pruebas previstas'],tasks), '',
            f'**T-S{n:02}-QA:** preparar fixtures y reloj; implementar los casos de este CANVAS y regresión afectada; registrar resultados y defectos. **T-S{n:02}-DOC:** actualizar contratos y trazas, presentar incremento al asesor y registrar revisión/retrospectiva.', '',
            'Asignación y estimación: Developers distribuyen tareas según capacidad; el responsable del backlog aún debe identificarse (P04). El asesor revisa requerimientos y acepta el incremento según las fuentes. No se asignan nombres, horas ni story points ficticios.', '',
            '## 6. Historias y criterios de aceptación', '', *hu_text,
            '## 7. Escenarios BDD a automatizar', '',
            f'Archivo editable: [sprint-{n:02}.feature](bdd/sprint-{n:02}.feature). Cada escenario corresponde a un caso del catálogo y conserva su identificador.', '',
            'Pest cubrirá dominio/API/integridad; Cypress, recorridos de navegador. Gherkin describe el acuerdo de comportamiento: no se ejecuta por sí solo y esta entrega no instala un adaptador Cucumber. Implementar las pruebas correspondientes con los mismos TC. Los escenarios `@manual` exigen participantes; su registro puede automatizarse, pero no sustituir sus respuestas por datos inventados.', '',
            'Control del tiempo: reloj inyectado en backend y jobs ejecutados explícitamente en pruebas; el reloj de Cypress no cambia el de PHP/MySQL. Datos y utilidades de test solo en entornos aislados. Probar Reverb real cuando se exige tiempo real; mocks no acreditan esa integración.', '',
            '```gherkin',feature.rstrip(),'```','',
            f'## 8. Casos de prueba previstos ({len(sprint_cases)})', '',
            'Los casos siguientes son especificaciones. Ejecutarlos y registrar observaciones reales es parte del desarrollo posterior. Un TC puede tener varias variantes de datos, pero se cuenta una sola vez para la exigencia académica.', '', *tc_text,
            '## 9. Controles DevSecOps de la iteración', '',
            md_table(['Control','Aplicación y evidencia requerida'],[(f'SEC-S{n:02}-{i:02}',v+' Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada.') for i,v in enumerate(s['security'],1)]), '',
            'Transversal: detectar secretos y dependencias vulnerables, revisar entradas y permisos, usar datos sintéticos y conservar auditoría desde la primera acción sensible. La instrumentación se introduce junto al flujo; la interfaz completa y el endurecimiento permanecen en los sprints previstos.', '',
            '## 10. Definition of Done', '',
            '### DoD común del incremento', '', *['- [ ] '+x for x in COMMON_DOD], '',
            '### DoD específica de este sprint', '', *['- [ ] '+x for x in s['done']], '',
            'Estas casillas expresan condiciones de aceptación y quedan sin marcar. Si una historia no las cumple, se reporta incompleta y se informa al usuario antes de cambiar alcance u orden. No dividir, mover ni agregar sprints por cuenta propia.', '',
            '## 11. Entregables y evidencia de revisión', '',
            f'- Incremento del Sprint {n} implementado y demostrable cuando se desarrolle; este documento solo lo planifica.',
            '- Contratos/migraciones/catálogos afectados versionados; matriz RF → HU → AC → TC actualizada.',
            '- Reportes de ejecución, defectos y revisión de seguridad con resultados reales.',
            f'- Acta prevista en `docs/documentacion/evidencias/sprint-{n:02}/revision.md`: commit, historias aceptadas/no aceptadas, observaciones del asesor, decisiones y riesgos restantes.',
            '- Las decisiones Pxx se registran con aprobador, fecha, regla acordada y casos afectados; no reescribir las fuentes sin control de cambios.', '',
            '## 12. Marcos de trabajo y fuentes', '',
            'Scrum organiza el incremento y su revisión; BDD expresa comportamiento compartido; SOLID orienta responsabilidades. Como referencias del proyecto: ISO 9001 para control de proceso/documentación, ISO/IEC 25010 para atributos de calidad, ISO/IEC 27001 y 27701 para seguridad y privacidad, ISO/IEC/IEEE 29119-2/3/4 para planificación, especificación y evidencia de pruebas. Se documenta su aplicación prevista, sin afirmar cumplimiento normativo, interpretar cláusulas ni certificar el sistema.', '',source_note(), '']
        (ROOT/f'CANVAS-Sprint-{n:02}.md').write_text('\n'.join(body),encoding='utf-8')
    fields=['id','sprint','hu','base','rf','ac','title','given','when','then','level','pending','status','automation']
    with (ROOT/'Catalogo-TC-Sprints-01-08.csv').open('w',encoding='utf-8-sig',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=fields,extrasaction='ignore');writer.writeheader();writer.writerows(all_cases)
    with (ROOT/'Trazabilidad-Sprints-01-08.csv').open('w',encoding='utf-8-sig',newline='') as f:
        writer=csv.writer(f);writer.writerow(['Sprint','RF_RNF','HU_fuente','HU_sprint','AC','TC','Nivel','Decisiones']);writer.writerows(rf_rows)
    (ROOT/'Plan-Sprints-01-08.json').write_text(json.dumps(ordered,ensure_ascii=False,indent=2),encoding='utf-8')
    overview=[
        '# CANVAS maestro · Plan de Sprints 1 al 8', '',
        '**TécnicoYa Huancayo · 5 de octubre de 2026 · Versión 1.0 · Planificación, no ejecución.**', '',
        'Ocho CANVAS independientes, siguiendo el orden y alcance aprobados por el usuario. La Iteración 0 se mantiene como instalación/estructura previa. No se fijan fechas, duración ni puntos sin estimación del equipo.', '',
        '## Documentos por sprint', '',
        md_table(['Sprint','CANVAS','Alcance principal','Casos'],[(s['n'],f'[Abrir Sprint {s["n"]}](CANVAS-Sprint-{s["n"]:02}.md)',s['title'],len([c for c in all_cases if c['sprint']==s['n']])) for s in ordered]), '',
        '## Qué contiene cada CANVAS', '',
        'Objetivo; alcance aprobado; dependencias y pendientes; RF/RNF y requerimientos técnicos; tareas por capa y rutas; historias derivadas de las fuentes; criterios Dado/Cuando/Entonces; Gherkin; casos TC con precondiciones, pasos y resultados esperados; controles DevSecOps; DoD común/específica; entregables y evidencia futura.', '',
        f'**Catálogo nuevo de esta planificación:** {len(all_cases)} casos únicos, TC-001 a TC-{len(all_cases):03}; {sum(len(s["stories"]) for s in ordered)} historias derivadas; ocho archivos Gherkin. Todos están NO EJECUTADOS. Los identificadores pertenecen a esta versión del catálogo; no renumeran ensayos de documentos históricos.', '',
        '- [Catálogo de casos previstos](Catalogo-TC-Sprints-01-08.csv).',
        '- [Matriz RF/RNF → HU fuente → HU sprint → AC → TC](Trazabilidad-Sprints-01-08.csv).',
        '- [Datos editables estructurados](Plan-Sprints-01-08.json).',
        '- [Escenarios Gherkin](bdd/).', '',
        'Pest/Cypress todavía deben implementarse. No se ejecutan pruebas de la aplicación ni se acreditan resultados en este trabajo. Los estudios de usabilidad y beneficio tienen escenarios marcados manuales; requieren personas y datos observados. La exigencia final de más de 60 casos ejecutados no se satisface por tenerlos escritos.', '',
        '## Jerarquía de fuentes y límites', '',source_note(), '',
        'Últimas decisiones conservadas: React–Laravel–MySQL, sesión SPA propuesta, Reverb/Echo, Docker Compose, Pest/Cypress y SonarQube; ocho sprints exactos; pagos y comprobantes simulados. No se incluyen suscripciones comerciales, chat/LLM, geolocalización real, apps móviles ni procesamiento financiero.', '',
        'El Sprint 8 incorpora explícitamente historial y ganancias simuladas por la instrucción reciente. P02 sigue abierto solo en detalles de procedencia, fórmula, estados y constancia; no se interpreta como aprobación de cobros reales ni del antiguo flujo de confirmación financiera.', '',
        '## Dependencias que se deben gestionar', '',
        md_table(['Origen → destino','Dependencia y tratamiento dentro del plan'],[
            ('Iteración 0 → S1','Instalación/estructura listas; S1 conecta y valida los módulos reales sin destruir la implementación histórica.'),
            ('S1 → S2/S7','Administrador inicial restringido, RBAC y registro básico de auditoría; gestión completa de cuentas y consulta de auditoría en S7.'),
            ('S2 → S3/S4','Catálogo, habilitación, subcategorías, tarifas, zona y pausas; RF-07 se integra como filtro del matching en S4.'),
            ('S3 → S4','Solicitud de cinco pasos y origen automático/dirigido; no mostrar asignaciones ficticias antes de integrar el motor.'),
            ('S4 → S5/S7','Ofertas ≠ asignaciones; reserva mínima al elegir y generaciones/historial desde S4; agenda completa en S5 e intervención manual en S7.'),
            ('S4 ↔ S6','Tratamiento acordado de técnico nuevo y fixtures antes de reseñas reales; S6 actualiza agregados válidos para futuras evaluaciones.'),
            ('S5 → S6','Finalización y deadline individuales; como máximo principal y adicional vigentes; aceptar P13 antes del cierre global.'),
            ('S4 → S7','Reglas versionadas desde el motor; publicación administrativa con historial y vigencia se completa en S7.'),
            ('S7 → S8','Bandeja y backend de soporte con fixtures en S7; formulario cliente/técnico integrado en S8.'),
            ('S1–S7 → S8','Pruebas/seguridad acompañan cada historia; S8 concentra regresión total, hardening, Quality Gate y despliegue.')]), '',
        '## Forma de trabajo y control de cambios', '',
        '1. Refinar los Pxx que bloqueen el resultado esperado antes de comprometer la historia afectada.',
        '2. Estimar capacidad y repartir tareas; el plan no impone una duración ficticia ni cambia la meta académica de semana 12.',
        '3. Implementar comportamiento y pruebas por flujo vertical, con integración continua y permisos desde el inicio.',
        '4. Registrar resultados reales, defectos y trazas por commit; demostrar el incremento y obtener la revisión del asesor.',
        '5. Si la capacidad o una dependencia impide completar el alcance, avisar al usuario y registrar una propuesta; no alterar silenciosamente los ocho sprints.', '',
        'Las propuestas pendientes no se convierten en requisitos confirmados. Las pruebas con etiqueta pendiente conservan su especificación candidata pero no pueden declararse aprobadas hasta resolver la regla y ejecutar su versión acordada.', '',
        '## Registro de evidencias previsto', '',
        '`docs/documentacion/evidencias/sprint-NN/TC-XXX/`: caso, commit, entorno/versiones, dataset, reloj/fecha, resultado esperado/real, logs o protocolo, defecto y responsable. Las carpetas de resultados se crearán al ejecutar; aquí no se generan evidencias ficticias.', '',
        'Las normas se usan como referencias del proyecto para procesos, calidad, seguridad, privacidad y documentación de pruebas; esta planificación no acredita certificación ni cumplimiento legal.', '']
    (ROOT/'CANVAS-Plan-Sprints-01-08.md').write_text('\n'.join(overview),encoding='utf-8')
    # Validación documental, no tests de la aplicación.
    assert len(set(c['id'] for c in all_cases)) == len(all_cases)
    assert len(all_cases)>60
    for s in ordered:
        text=(ROOT/f'CANVAS-Sprint-{s["n"]:02}.md').read_text(encoding='utf-8')
        assert text.count('```')==2
        for c in [c for c in all_cases if c['sprint']==s['n']]:
            assert c['id'] in text and c['ac'] in text
        for h in s['stories']:
            assert all(f'HU-{i:02}' in (ROOT.parent/'CANVAS-Analisis-MVP-TecnicoYa.md').read_text(encoding='utf-8') for i in map(int,re.findall(r'HU-(\d+)',h['base'])))
    rf_covered=set(int(v) for c in all_cases for v in re.findall(r'RF-(\d+)',c['rf']))
    assert rf_covered==set(range(1,34)), sorted(set(range(1,34))-rf_covered)
    for s in ordered:
        feature=(features_dir/f'sprint-{s["n"]:02}.feature').read_text(encoding='utf-8')
        expected=[c for c in all_cases if c['sprint']==s['n']]
        for token in ['  Escenario:', '    Dado ', '    Cuando ', '    Entonces ']:
            assert feature.count(token)==len(expected), (s['n'], token)
        assert re.findall(r'  Escenario: (TC-\d+)',feature)==[c['id'] for c in expected]
    for path in ROOT.glob('*.md'):
        content=path.read_text(encoding='utf-8')
        for target in re.findall(r'\]\(([^)]+)\)',content):
            if not target.startswith(('http:', 'https:', '#')):
                assert (path.parent/target).exists(), (path.name,target)
    report={'sprints':len(ordered),'stories':sum(len(s['stories']) for s in ordered),'cases':len(all_cases),'functional_requirements':len(rf_covered),'manual_cases':sum(c['level'].startswith('Manual') for c in all_cases),'checks':['IDs únicos','Cobertura documental RF-01..RF-33','HU fuente existentes','Enlaces locales resueltos en el proyecto','Escenarios y pasos Gherkin correlacionados con TC','Bloques de código equilibrados'],'status':'documentary_checks_passed_not_product_tests','gherkin_note':'Verificación estructural de escenarios y pasos; no ejecución ni validación con un runner Gherkin.'}
    (ROOT/'Validacion-documental.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    archive=ROOT/'TecnicoYa-CANVAS-Sprints-01-08.zip'
    with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
        for path in sorted(ROOT.rglob('*')):
            if path.is_file() and path.suffix in {'.md','.feature','.csv','.json','.py'} and '__pycache__' not in path.parts:
                z.write(path,Path('sprints-01-08')/path.relative_to(ROOT))
    print(json.dumps(report,ensure_ascii=False))


def case(title, given, when, then, level='API / Pest + MySQL', pending=''):
    return dict(title=title, given=given, when=when, then=then, level=level, pending=pending)

def story(title, base, rf, who, want, benefit, work, *cases):
    return dict(title=title, base=base, rf=rf, who=who, want=want, benefit=benefit, work=work, cases=list(cases))

def sprint(n, title, scope, objective, dependencies, pending, technical, security, done, stories):
    SPRINTS.append(dict(n=n,title=title,scope=scope,objective=objective,dependencies=dependencies,pending=pending,technical=technical,security=security,done=done,stories=stories))

sprint(1, 'Base técnica, autenticación, roles y catálogo',
 'RF-28, RF-33; registro e inicio de sesión por rol (cliente, técnico, administrador), RBAC, perfiles básicos, estado de verificación del técnico, catálogo semilla de 3 especialidades y ~30 subcategorías, conexión React–Laravel–MySQL y rutas protegidas.',
 'Entregar acceso por identidad y permisos reales sobre la API y MySQL, con perfiles mínimos y catálogo inicial reproducible, para que los siguientes sprints trabajen sobre una base común.',
 'La Iteración 0 debe haber dejado instalación, estructura y entorno local operativos. Revisar las diferencias del código histórico antes de migrar; no borrar datos. El administrador inicial se aprovisiona por mecanismo restringido; su gestión completa corresponde al Sprint 7.',
 'P20: cuenta con un rol o varios; propuesta actual de un rol. P22: representación de revisión rechazada. P03/P16: catálogo de distritos y referencias económicas; no asignar valores de mercado inventados. Versiones compatibles y responsable del backlog P04 aún por registrar.',
 [
 ('RT-01', 'Mantener frontend/web y backend/api. Mapear el código existente a src/features/administration y app/Modules/FAdministration; las carpetas de destino son propuestas del diseño, no carpetas ya implementadas.'),
 ('RT-02', 'Conectar React al cliente HTTP común y Laravel a MySQL con migraciones/seeders versionados; verificar FK, unicidad de correo y relaciones de perfil con una BD de pruebas aislada.'),
 ('RT-03', 'Aplicar la sesión SPA propuesta: cookie de sesión HttpOnly, CSRF, rotación al autenticar y cierre invalidante. No guardar tokens de sesión en localStorage; React consulta /me para rol y permisos.'),
 ('RT-04', 'Contratos existentes del diseño: /sanctum/csrf-cookie, /api/v1/auth/register, /auth/login, /auth/logout, /me y /catalog/specialties|subcategories. Salvo CSRF, las rutas abreviadas llevan /api/v1.'),
 ('RT-05', 'Tablas foco: roles, permissions, users, role_permissions, user_permissions, client_profiles, technician_profiles, specialties, subcategories y sesiones. Inicializar audit_entries para acciones sensibles sin adelantar su panel del Sprint 7.'),
 ('RT-06', 'Semilla idempotente de tres rubros y 30 subcategorías de referencia (11/9/10); RNF-08/09/11/14. Probar build React, conexión, migraciones y permisos en CI; datos sintéticos y secretos fuera del repositorio.')],
 ['Registro público limitado a cliente/técnico: rechazar role=admin, permisos y verificación enviados por el navegador.', 'Validación del servidor, contraseñas con bcrypt según RNF-08, límites de intentos configurados y error genérico de acceso.', 'Probar permisos tanto en navegación como en API; ocultar un botón no es autorización.', 'Sesiones, hashes y secretos no aparecen en respuestas ni logs. Cookie Secure cuando el entorno usa HTTPS; CSRF probado en mutaciones.', 'Revisión de dependencias y secretos en cada cambio; registrar acceso y aprovisionamiento privilegiado sin incluir contraseñas.'],
 ['Registro y acceso de cliente/técnico funcionan; acceso de administrador aprovisionado funciona sin alta pública privilegiada.', 'Una cuenta técnica nueva queda pendiente de verificación y solo puede completar su perfil autorizado.', 'API deniega rutas administrativas a otros roles y datos de otro propietario.', 'Migraciones y semillas se reproducen en MySQL aislado; la segunda ejecución de semillas no duplica el catálogo.', 'Los tres roles recorren UI→API→MySQL con sesión real. La demo localStorage no se acepta como evidencia de este incremento.'],
 [
 story('Registro de cliente', 'HU-01', 'RF-28', 'cliente', 'crear mi cuenta', 'acceder a mis propios servicios',
 'FE: formulario con errores por campo; API: RegisterClient con validación y transacción; datos: users/client_profiles y correo único.',
 case('Alta válida', 'un correo sintético no registrado y datos de cliente válidos', 'el visitante confirma el formulario de registro', 'se crea exactamente un usuario cliente y su perfil, sin permisos administrativos', 'E2E / Cypress + API'),
 case('Correo duplicado', 'una cuenta ya registrada con el mismo correo normalizado', 'se intenta registrar otra cuenta con ese correo', 'la API rechaza el duplicado y no crea usuario ni perfil adicional')),
 story('Alta de técnico pendiente', 'HU-01, HU-02', 'RF-28, RF-33', 'técnico', 'registrarme y completar mis datos iniciales', 'solicitar posteriormente mi verificación',
 'FE: alta técnica y estado pendiente; API: RegisterTechnician; datos: perfil técnico con estado y verificación separados.',
 case('Técnico nuevo', 'datos de un técnico sin cuenta previa', 'se completa el registro técnico', 'el perfil queda Pendiente de verificación y permite editar únicamente sus datos básicos'),
 case('Autoactivación rechazada', 'una cuenta técnica pendiente', 'envía verificación aprobada, estado activo o permisos en la edición de perfil', 'se rechazan los campos privilegiados y el estado persistido no cambia')),
 story('Sesión y cierre por rol', 'HU-01', 'RF-28', 'usuario de cualquiera de los tres roles', 'iniciar y cerrar sesión', 'acceder a mi panel con una identidad comprobada',
 'FE: cliente HTTP, rutas y /me; API: login/logout con sesión y CSRF; datos: sesiones del servidor, sin credenciales persistidas en React.',
 case('Acceso de cada rol', 'una cuenta activa de cliente, técnico o administrador aprovisionado', 'inicia sesión con credenciales válidas y consulta /me', 'recibe su identidad y permisos y se abre el panel correspondiente al rol', 'E2E / Cypress + API'),
 case('Sesión cerrada', 'una sesión válida abierta', 'el usuario cierra sesión y reutiliza su cookie para consultar /me', 'la sesión anterior es inválida y la API responde 401')),
 story('Autorización efectiva', 'HU-24, HU-28', 'RF-33', 'administrador responsable', 'restringir cada operación a su rol y propietario', 'evitar acceso o cambios no autorizados',
 'FE: guardas de rutas y limpieza de caché al cambiar cuenta; API: Policies/permissions; datos: concesiones mínimas y auditoría de operaciones privilegiadas.',
 case('Ruta administrativa denegada', 'un usuario cliente autenticado', 'consulta directamente una ruta administrativa protegida', 'recibe 403 sin datos ni cambios administrativos'),
 case('Alta administrativa pública denegada', 'un visitante sin sesión privilegiada', 'solicita registro enviando account_type=admin', 'el alta es rechazada y no se crea ninguna cuenta administrativa')),
 story('Perfil básico propio', 'HU-24, HU-29', 'RF-28, RF-33, RF-C06', 'usuario', 'consultar y editar mis datos básicos', 'mantener mi información sin alterar mi rol',
 'FE: formulario Mi perfil; API: GET/PATCH /me con campos permitidos y expected_version; datos: actualización sin perder relación de perfil.',
 case('Edición propia', 'una cuenta con versión de perfil vigente', 'actualiza nombre y teléfono permitidos', 'se guardan esos campos y se incrementa la versión sin cambiar permisos'),
 case('Escritura obsoleta', 'el perfil cambió después de cargar el formulario', 'se envía una edición con expected_version anterior', 'la API informa conflicto 409 y conserva la edición más reciente')),
 story('Catálogo inicial y conexión', 'HU-05, HU-25', 'RF-C01, RF-28, RF-33', 'usuario', 'consultar el catálogo inicial desde la API', 'usar las mismas especialidades en todos los módulos',
 'FE: consumo del catálogo y estados carga/error/vacío; API: lectura pública solo de activos; datos: semilla única 3/30 y migraciones verificadas.',
 case('Semilla repetible', 'una base MySQL de pruebas migrada', 'se ejecuta dos veces la semilla inicial', 'existen tres especialidades y treinta subcategorías sin duplicados y con relaciones válidas'),
 case('Lectura real del catálogo', 'el entorno React–Laravel–MySQL está disponible', 'el navegador consulta especialidades y subcategorías', 'muestra el catálogo recibido por API y trata un fallo de red sin sustituirlo por datos ficticios silenciosos', 'E2E / Cypress + API'))
 ])

sprint(5, 'Atención, agenda y seguimiento',
 'RF-19 a RF-22; estados del servicio, Iniciar atención y Finalizar servicio, agenda técnica, reprogramación, coordinación de varios técnicos, línea de tiempo y WhatsApp tras asignación, cancelación.',
 'Permitir ejecutar y seguir cada atención desde la asignación hasta su reporte final, preservando acuerdos de horario, privacidad y la independencia de cada participante.',
 'Requiere asignaciones, reservas mínimas, eventos y reloj del Sprint 4. El Sprint 5 persiste completed_at y rating_due_at; la interfaz de calificación y su vencimiento se completan en Sprint 6. La reasignación automática consume el mecanismo del Sprint 4; la manual permanece en Sprint 7.',
 'P05/P16 franjas y duraciones; P06 máximo de reprogramaciones; P13 aceptación y cierre global de dos técnicos; P14 cancelación/reprogramación en casos límite. No activar coordinación múltiple con reglas parciales sin resolver P13.',
 [('RT-01','DService: máquina de estados y casos StartParticipation, CompleteParticipation, RequestReschedule, RespondReschedule, ProposeAdditionalTechnician y CancelRequest; React features/service y requests.'),
 ('RT-02','Tablas: participations, appointments, reschedule_requests/responses, service_reports/evidence, additional_technician_proposals, incidents/evidence, reassignment_records y request_events.'),
 ('RT-03','Contratos: /appointments, /requests/{id}/timeline y /cancellation; /participations/{id}/start|completion|withdrawal; /requests/{id}/reschedules, /reschedules/{id}/response y propuestas de adicional, según diseño.'),
 ('RT-04','Aceptación de reprogramación mueve reservas en transacción y vuelve a revisar conflictos. ExpireRescheduleProposal conserva fecha original al vencer 24 h sin respuesta; condiciones especiales según P14.'),
 ('RT-05','Finalización por participación con reporte; completed_at del servidor y ventana individual de 48 h. El cliente no confirma el cierre. No finalizar automáticamente al segundo técnico.'),
 ('RT-06','Agenda lista/calendario con rango acotado y zona America/Lima para presentación; persistir UTC. Eventos se emiten tras commit y el historial conserva actor, momento y motivo.')],
 ['Solo el técnico asignado inicia/finaliza su propia participación; no confiar en id de actor del cuerpo.', 'Datos de contacto y dirección exacta únicamente según relación autorizada tras asignación; revocación y estados posteriores conforme política acordada.', 'Control de versión y transacción para evitar inicio/cancelación o reprogramaciones incompatibles simultáneas.', 'Reportes y evidencias validados y privados; registrar incidencias sin convertir una denuncia no revisada en sanción automática.', 'Técnico adicional necesita propuesta, autorización del cliente y aceptación definida; no permite autoasignarse terceros.'],
 ['Agenda y detalle reflejan reservas y eventos consistentes para cada identidad.', 'Inicio/finalización respetan transiciones válidas, persisten reporte y abren ventana individual sin pedir confirmación extra al cliente.', 'Reprogramación requiere a la contraparte; vencimiento 24 h conserva cita original según política ratificada.', 'Principal más un adicional como máximo; cada finalización independiente y estado global conforme P13 aprobado.', 'Cancelación, retiro e incidencia conservan historial y activan solo los efectos autorizados.'],
 [
 story('Agenda personal', 'HU-06, HU-12', 'RF-19', 'técnico', 'ver mis citas en calendario y lista', 'organizar las atenciones asignadas',
 'FE: calendario/lista/filtros; API: consultas por titular y rango; datos: appointments y participations vigentes.',
 case('Citas propias', 'dos técnicos con citas diferentes en un mismo día', 'uno consulta su agenda en lista y calendario', 'ambas vistas muestran solo sus citas y los mismos horarios locales', 'E2E / Cypress + API'),
 case('Agenda ajena', 'un técnico sin permiso sobre otra cuenta', 'manipula el filtro para obtener citas del otro técnico', 'la API no devuelve ninguna cita privada ajena')),
 story('Inicio y finalización', 'HU-15', 'RF-19, RF-22', 'técnico asignado', 'registrar el inicio y el trabajo realizado', 'dejar constancia verificable de mi atención',
 'FE: acciones según estado y reporte; API: start/completion con versión; datos: reporte único, completed_at y rating_due_at.',
 case('Atención finalizada', 'una participación asignada al técnico autenticado', 'inicia la atención y después finaliza con reporte válido', 'queda finalizada con reporte y plazo de calificación a 48 horas del cierre individual, sin confirmación adicional del cliente'),
 case('Finalización repetida', 'una participación ya finalizada con reporte y fecha de cierre', 'se repite el mismo comando de finalización', 'no se duplica el reporte ni se renueva el plazo de calificación')),
 story('Reprogramación por acuerdo', 'HU-13', 'RF-20', 'cliente o técnico participante', 'proponer un nuevo horario a la otra parte', 'cambiar la cita solo por acuerdo',
 'FE: propuesta/respuesta; dominio: validar franja y contraparte; datos: anterior/propuesta/respuestas y nueva reserva atómica.',
 case('Aceptación por contraparte', 'una cita vigente y una propuesta de nueva franja libre', 'la contraparte acepta dentro del plazo', 'se libera la reserva anterior y se confirma la nueva en la misma transacción'),
 case('Propuesta sin respuesta', 'una propuesta pendiente durante 24 horas y una cita original futura', 'el scheduler vence la propuesta', 'la propuesta queda vencida y se mantiene la cita original sin nueva reserva')),
 story('Técnico adicional autorizado', 'HU-14', 'RF-21', 'cliente', 'autorizar un segundo técnico propuesto', 'coordinar un servicio que requiere apoyo',
 'FE: propuesta del principal/decisión del cliente; dominio: cupo y aceptación técnica; datos: additional_technician_proposals y participaciones distintas.',
 case('Finalizaciones independientes', 'una solicitud con principal y adicional autorizados y en atención', 'el principal registra su finalización', 'solo su participación finaliza y abre su plazo; el adicional continúa en atención', pending='P13'),
 case('Tercer participante vigente', 'una solicitud con principal y adicional vigentes', 'se propone incorporar un tercer técnico simultáneo', 'el sistema rechaza la incorporación y conserva las dos participaciones existentes')),
 story('Línea de tiempo y contacto', 'HU-12, HU-24', 'RF-19, RF-33', 'cliente titular', 'seguir la atención y acceder al contacto cuando corresponda', 'coordinar con el técnico asignado',
 'FE: timeline y enlace WhatsApp; API: proyecciones según estado y relación; datos: request_events sin exposición de motivos administrativos privados.',
 case('Contacto tras asignación', 'un cliente titular de una solicitud recién asignada', 'abre su detalle', 've la línea de tiempo autorizada y el WhatsApp del técnico asignado', 'E2E / Cypress + API'),
 case('Contacto antes de asignación', 'una oferta aceptada pero aún no elegida por el cliente', 'se consulta el detalle permitido', 'no se revela todavía el WhatsApp ni la dirección exacta al técnico')),
 story('Cancelación del cliente', 'HU-12', 'RF-19', 'cliente', 'cancelar antes de iniciarse la atención', 'detener una solicitud que ya no necesito',
 'FE: motivo/confirmación; dominio: transición permitida y reservas; datos: evento de cancelación sin borrado de solicitud.',
 case('Cancelación antes de atender', 'una solicitud Asignada cuya atención no ha empezado', 'el titular confirma cancelar con motivo', 'queda Cancelada, se liberan las reservas aplicables y se conserva el historial', pending='P14'),
 case('Cancelación durante atención', 'una solicitud con atención ya iniciada', 'el cliente usa la cancelación ordinaria previa a atención', 'la API informa conflicto y no marca la solicitud como cancelada')),
 story('Retiro e incidencia', 'HU-13', 'RF-19, RF-20', 'técnico o cliente afectado', 'registrar impedimentos e inasistencias', 'permitir una respuesta trazable',
 'FE: retiro con motivo/reportar incidencia; aplicación: diferencia retiro confirmado de denuncia; datos: incidents y vínculo a reasignación.',
 case('Retiro del técnico asignado', 'un técnico asignado antes de atención y una política de retiro aprobada', 'registra su retiro con motivo', 'se conserva la incidencia y se inicia la reasignación aplicable sin perder la participación anterior', pending='P14'),
 case('Reporte de inasistencia', 'un cliente reporta que el técnico no asistió', 'se registra el reporte', 'queda una incidencia para revisión y no se suspende ni reemplaza automáticamente por la sola denuncia'))
 ])

sprint(6, 'Calificación, historial y apelaciones',
 'RF-23 a RF-27; calificación en 48 h y edición, cierre sin calificar, reseñas públicas, historial, calificaciones recibidas, apelación y resolución administrativa, criterios de matching visibles.',
 'Cerrar el ciclo de cada participación con una evaluación versionada y mecanismos de revisión, ofreciendo un historial confiable y criterios transparentes de asignación.',
 'Depende de reportes/fechas individuales del Sprint 5 y matching versionado del Sprint 4. La pantalla administrativa de apelaciones se entrega aquí; no se retrasa hasta completar el panel en Sprint 7. Promedios válidos alimentan las nuevas evaluaciones, sin recalcular rankings históricos.',
 'P07 plazo de apelación, calendario y efectos de anulación; P13 cierre global con dos técnicos; P17 moderación/respuestas; P23 anclaje de edición. Las 48 h desde primera calificación sin reinicio son propuesta pendiente de ratificación.',
 [('RT-01','ERatings y React features/ratings; separar envío, edición, respuesta, apelación y resolución. Consulta de historial reutiliza solicitudes/participaciones sin duplicar registros.'),
 ('RT-02','Tablas: ratings, rating_versions, rating_replies, rating_appeals, appeal_evidence, rating_resolutions; participations.rating_status y deadlines individuales.'),
 ('RT-03','Aplicar contratos del módulo E del CANVAS técnico para calificar, editar, apelar y resolver. Exigir autor/participación/versión; no convertir cambios de calificación en edición libre de filas.'),
 ('RT-04','CloseUnratedParticipation es idempotente. Ediciones validan el reloj en cada petición aunque no exista un job que cierre la edición; la UI no decide vigencia.'),
 ('RT-05','Resolución sobre versión vigente con control de concurrencia; conservar versión apelada, revisada y resultante. RefreshRatingSummary recalcula desde datos válidos tras commit.'),
 ('RT-06','GET /technicians/me/matching-criteria muestra factores/pesos y tratamiento de ausencia de datos, sin exponer datos de competidores. RNF-12: cobertura ≥70% del alcance acordado de calificación; probar fronteras y jobs repetidos.')],
 ['Solo cliente autor de la participación puede calificarla; solo técnico afectado puede responder/apelar.', 'Puntaje entero 1..5, contenido tratado como texto y adjuntos privados; controles anti-XSS en reseñas y respuestas.', 'Administrador resolutor necesita permiso, motivo y auditoría atómica; una apelación no modifica sola la nota.', 'Rechazar decisiones sobre versiones obsoletas; preservar evidencia y acceso restringido al historial de moderación.', 'No publicar datos privados en historial público ni transformar el factor neutro del matching en una calificación inventada.'],
 ['Envío y edición respetan sus ventanas distintas con reloj del servidor y decisiones ratificadas.', 'Calificación única por participación, versiones conservadas y cierre Sin calificar idempotente.', 'Reseñas, respuestas y promedios corresponden solo a datos válidos y políticas de moderación acordadas.', 'Apelaciones se resuelven con motivo, versión vigente y auditoría; conflictos obligan a recargar.', 'Historial y criterios de matching son accesibles por rol y propiedad sin modificar evaluaciones históricas.'],
 [
 story('Calificar mi atención', 'HU-16', 'RF-23', 'cliente', 'calificar de 1 a 5 con comentario', 'compartir mi experiencia tras la atención',
 'FE: aviso/formulario; API: dueño y ventana; datos: calificación única y primera versión.',
 case('Envío en ventana válida', 'mi participación finalizó hace 24 horas y no tiene calificación', 'envío puntaje 4 y comentario válido', 'se registra una calificación con su primera versión y se marca la participación como calificada'),
 case('Nota fuera de rango', 'una participación propia dentro de la ventana', 'envío puntaje 6', 'la API rechaza el valor sin crear calificación')),
 story('Editar conservando versiones', 'HU-16', 'RF-23', 'cliente autor', 'corregir mi calificación dentro del plazo permitido', 'ajustar mi opinión manteniendo el historial',
 'FE: editar con límite visible; dominio: editar con versión/Clock; datos: rating_versions y fecha inicial inmutable.',
 case('Edición no renueva plazo', 'una calificación creada hace 12 horas y política P23 ratificada', 'su autor edita nota y comentario', 'se agrega una versión y el límite sigue a 48 horas de la primera calificación', pending='P23'),
 case('Edición vencida', 'una calificación cuya ventana de edición ya terminó', 'su autor intenta editar', 'se rechaza sin nueva versión ni cambio del promedio')),
 story('Cerrar sin calificar', 'HU-15', 'RF-24', 'cliente', 'ver el cierre cuando no califico a tiempo', 'tener un estado final claro',
 'Aplicación: job CloseUnratedParticipation; FE: estado final; datos: rating_status independiente por participación.',
 case('Vencimiento individual', 'una participación finalizada sin nota que alcanzó su plazo de 48 horas', 'se ejecuta dos veces el job de cierre', 'queda Sin calificar una sola vez sin crear una nota automática ni afectar otra participación', pending='P12, P13'),
 case('Ya fue calificada', 'una participación calificada válidamente antes del vencimiento', 'se ejecuta después un job atrasado de cierre sin calificar', 'se conserva la calificación y no cambia a Sin calificar')),
 story('Reseñas y respuestas públicas', 'HU-16, HU-18', 'RF-23, RF-25', 'técnico', 'ver mis reseñas y responder de forma identificada', 'dar contexto a mis futuros clientes',
 'FE: reseñas/promedio/respuesta; API: técnico afectado y texto seguro; datos: ratings válidas y rating_replies según política.',
 case('Promedio real', 'un técnico tiene dos calificaciones activas de 4 y 5 y una anulada de 1', 'se consulta el promedio bajo política aprobada de excluir anuladas', 'se muestra 4.5 calculado solo de las dos notas activas', pending='P07'),
 case('Texto no ejecutable', 'una respuesta de reseña contiene etiquetas de script', 'se muestra la respuesta en el perfil público', 'el contenido no se ejecuta como código en el navegador', 'E2E / Cypress')),
 story('Apelar una calificación', 'HU-17', 'RF-26', 'técnico afectado', 'presentar una apelación con motivo y evidencia', 'solicitar revisión sin cambiar la nota por mi cuenta',
 'FE: motivo/evidencia/estado; API: titular, plazo y política de duplicados; datos: rating_appeals y versión cuestionada.',
 case('Apelación admitida', 'una reseña propia dentro del plazo de apelación ratificado', 'el técnico presenta motivo y evidencia permitidos', 'se crea una apelación vinculada a la versión de la reseña sin modificar su nota', pending='P07, P17'),
 case('Apelación ajena', 'un técnico intenta apelar la reseña de otro prestador', 'envía el identificador de esa calificación', 'la API deniega y no crea apelación')),
 story('Resolución motivada', 'HU-17, HU-28', 'RF-26, RF-33', 'administrador resolutor', 'mantener, ajustar o anular una calificación con motivo', 'resolver disputas dejando evidencia',
 'FE: comparar versión/revisar/decidir; aplicación: transacción, auditoría y recálculo; datos: rating_resolutions y versiones.',
 case('Resolución válida', 'una apelación abierta y la versión vigente revisada por un administrador autorizado', 'resuelve mantener, ajustar o anular con motivo obligatorio', 'se conserva la decisión y las versiones correspondientes con auditoría y se actualizan agregados según política aprobada', pending='P07'),
 case('Reseña cambió al resolver', 'el administrador cargó una versión que el cliente editó después', 'intenta resolver usando la versión anterior', 'recibe conflicto y debe revisar la versión vigente sin sobrescribirla')),
 story('Historial y criterios transparentes', 'HU-18, HU-19', 'RF-25, RF-27', 'cliente o técnico', 'consultar mi historial y los criterios que me corresponden', 'comprender los servicios y el proceso de selección',
 'FE: filtros por estado/fecha y pantalla criterios; API: proyecciones por rol; datos: joins de historial y versión de reglas aplicada.',
 case('Historial propio filtrado', 'un usuario con participaciones de distintos estados y periodos', 'consulta su historial con filtros', 'recibe únicamente sus registros coincidentes y sus calificaciones vinculadas'),
 case('Criterios sin datos de competidores', 'un técnico autenticado consulta criterios de matching', 'se devuelve la explicación', 've pesos, elegibilidad y tratamiento sin historial sin direcciones, documentos ni puntajes privados de otros técnicos'))
 ])

sprint(7, 'Panel administrador completo',
 'RF-30 y RF-31; dashboard con métricas, gráficos y alertas; solicitudes con reasignación manual; clientes, soporte y bloqueo; reglas editables con historial; exportación Excel/PDF; cuentas de administrador y auditoría.',
 'Completar la supervisión operativa y el gobierno de parámetros y accesos, permitiendo intervenciones justificadas y reportes verificables sin alterar el historial.',
 'Consume los ciclos y datos de Sprints 1–6. Reutiliza catálogo/verificación/comunicados de Sprint 2 y apelaciones de Sprint 6. Backend y bandeja de soporte administrativo se completan aquí con tickets sintéticos; el acceso de ayuda/soporte del cliente y técnico se integra en Sprint 8.',
 'P18 efectos de bloqueo/suspensión sobre sesiones y servicios abiertos; P19 aplicación temporal de cambios; P21 fórmulas de dashboard y alertas, criterios de exportación y capacidad. Definir protección del último administrador responsable sin añadir un cuarto rol.',
 [('RT-01','React features/administration; FAdministration para supervisión/reportes/reglas/permisos. Una intervención delega a COffers/DService, no modifica estados por SQL directo.'),
 ('RT-02','Contratos: /admin/dashboard, /admin/requests, /admin/clients, /admin/rule-versions, /admin/reports, /admin/report-exports, /operations/{id}, /exports/{id}/download, /admin/accounts y /admin/audit.'),
 ('RT-03','Reasignar: POST /admin/requests/{id}/reassignments con replacement_technician_id, reason y expected_version. La propuesta vigente espera respuesta del reemplazo y elección/autorización definida; no forzar disponibilidad ni sustituir participación en silencio.'),
 ('RT-04','Tablas: reassignment_records, client_blocks, support_tickets/updates, rule_versions/values/weights, audit_entries, operations/export_files y permisos; preservar relaciones a eventos anteriores.'),
 ('RT-05','Publicar parámetros crea versión nueva y conserva pesos aplicados. Validar suma 100, rangos y motivo; vigencia sobre trabajo abierto resuelta en P19 antes de habilitar edición.'),
 ('RT-06','Exportar mediante cola de entrega con operación consultable, filtros persistidos y descarga privada. Reportes reproducibles: documentar fórmula, denominador, periodo y zona horaria; no deducir SLA de datos incompletos.'),
 ('RT-07','Alertas de SLA reiterado/calificación baja requieren umbrales aprobados; pendientes mayores de 20 h según fuente. Una alerta no ejecuta automáticamente una sanción.')],
 ['Permisos separados para reassign, rules.manage, reportes, soporte, admins.manage y audit.read; probar usuarios de administración sin cada concesión.', 'Toda acción sensible con actor, motivo, recurso, antes/después permitido y fecha; excluir contraseñas, cookies y archivos completos del log.', 'Auditoría obligatoria y cambio de negocio en una misma transacción: si falla el registro, no confirmar el cambio.', 'Exportaciones privadas con autorización vigente al descargar; neutralizar celdas interpretables como fórmulas y contenido activo en documentos.', 'Cuentas administrativas solo creadas por responsable; no contraseñas predeterminadas compartidas. Proteger último responsable operativo según política.', 'Filtrar/limitar consultas de auditoría y reportes; no ofrecer API de edición o borrado ordinario de auditoría.'],
 ['Dashboard, métricas/alertas y filtros coinciden con dataset y fórmulas aprobadas.', 'Reasignación manual valida elegibilidad, permisos, versión y generación y conserva al participante anterior.', 'Clientes y tickets se supervisan; bloqueo/desbloqueo conserva motivo e historial y respeta efectos acordados.', 'Reglas se versionan con validación y uso temporal explícito; pesos históricos permanecen intactos.', 'Excel/PDF coinciden con el reporte y solo los autorizados descargan.', 'Cuentas administrativas y consulta de auditoría funcionan sin escalamiento ni pérdida de trazabilidad.'],
 [
 story('Dashboard y alertas', 'HU-21', 'RF-30', 'administrador supervisor', 'consultar métricas por periodo, especialidad y zona', 'identificar trabajo pendiente y problemas de atención',
 'FE: tarjetas/gráficos/alertas; API: agregaciones con filtros; datos: fixture con resultados manualmente calculados y fórmula aprobada.',
 case('Métricas reproducibles', 'un dataset sintético con conteos esperados y definición de cumplimiento de SLA aprobada', 'el administrador aplica filtros de fecha y especialidad', 'tarjetas y gráficos coinciden con los resultados esperados del mismo conjunto', pending='P21'),
 case('Pendiente mayor de 20 horas', 'una solicitud pendiente de 21 horas y otra de 19 horas', 'se consulta el panel de alertas', 'solo la primera aparece en la alerta de pendientes de más de 20 horas')),
 story('Reasignación manual controlada', 'HU-21, HU-28', 'RF-30, RF-33', 'administrador con permiso de reasignación', 'intervenir una solicitud con motivo', 'resolver incidencias conservando trazabilidad',
 'FE: ficha/selección/revisión del motivo; aplicación: nuevo intento y generación mediante módulo dueño; datos: intervención, participación anterior y auditoría.',
 case('Intervención válida', 'una solicitud reasignable, un reemplazo elegible y política de respuesta aprobada', 'el administrador autorizado solicita reasignación con motivo y versión vigente', 'se registra la intervención y nueva generación con ofertas autorizadas, sin forzar asignación ni borrar al técnico anterior', pending='P11, P14'),
 case('Sin permiso de reasignación', 'un administrador que no tiene requests.reassign', 'invoca la operación manual', 'recibe 403 y no cambian solicitud, ofertas ni participantes')),
 story('Clientes y bloqueos', 'HU-21, HU-28', 'RF-30, RF-33, RF-C12', 'administrador autorizado', 'revisar historial y bloquear o desbloquear con motivo', 'controlar abusos conforme una política conocida',
 'FE: ficha/listado y acciones motivadas; aplicación: acceso de cuenta y efectos aprobados; datos: client_blocks e historial sin borrado.',
 case('Bloqueo conforme política', 'un cliente y una política de bloqueo/sesión ratificada', 'el administrador autorizado registra un bloqueo con motivo', 'se impiden las acciones definidas por esa política y se conserva historial de servicio y auditoría', pending='P18'),
 case('Bloqueo sin motivo', 'un administrador autorizado selecciona un cliente', 'solicita bloquearlo sin motivo', 'se rechaza la operación sin cambiar acceso ni crear un bloqueo activo')),
 story('Soporte administrativo', 'HU-30', 'RF-30, RF-C07', 'administrador de soporte', 'revisar y resolver tickets', 'atender incidencias con seguimiento',
 'FE: bandeja de tickets sintéticos y resolución; API: permiso/versión; datos: support_tickets/updates y acceso al contexto autorizado.',
 case('Resolución de ticket', 'un ticket sintético abierto y un administrador con permiso de soporte', 'registra una resolución válida', 'el ticket queda resuelto con autor, fecha y actualización de historial'),
 case('Resolución no autorizada', 'un usuario sin permiso de soporte administrativo', 'intenta resolver un ticket', 'la API deniega y el ticket permanece intacto')),
 story('Reglas e historial', 'HU-26', 'RF-C03, RF-30', 'administrador de reglas', 'editar parámetros mediante nuevas versiones', 'ajustar el negocio sin borrar decisiones previas',
 'FE: editor/rangos/suma/historial; dominio: validar y publicar; datos: versiones inmutables aplicadas al matching.',
 case('Publicación de versión válida', 'pesos 35, 20, 30 y 15 y plazos válidos con motivo', 'el administrador publica una nueva versión bajo la política de vigencia acordada', 'queda disponible la versión nueva y los rankings previos conservan la versión anterior', pending='P19'),
 case('Pesos que suman 95', 'una configuración vigente correcta', 'se intenta publicar pesos cuya suma es 95', 'la API rechaza y mantiene intacta la configuración vigente')),
 story('Reportes Excel y PDF', 'HU-22', 'RF-31', 'administrador de reportes', 'exportar cobertura y desempeño', 'entregar información verificable',
 'FE: filtros/estado de operación/descarga; aplicación: job de exportación con autor; datos: operations/export_files privados y métricas coherentes.',
 case('Exportaciones equivalentes', 'un reporte con filtros y resultados esperados aprobados', 'se generan sus exportaciones XLSX y PDF', 'ambas contienen el mismo periodo, filtros y cifras que la consulta y quedan vinculadas a su operación', pending='P21'),
 case('Descarga ajena', 'una exportación privada completada para un administrador', 'otro usuario sin permiso intenta descargarla por identificador', 'se deniega sin exponer el archivo ni una URL pública')),
 story('Administradores y auditoría', 'HU-28', 'RF-C05, RF-33', 'administrador responsable', 'gestionar cuentas privilegiadas y revisar acciones sensibles', 'mantener separación de funciones y rendición de cuentas',
 'FE: cuentas/permisos y auditoría de solo lectura; API: admins.manage/audit.read y transacción; datos: concesiones y registros inmutables para operaciones ordinarias.',
 case('Alta por responsable', 'un administrador con admins.manage y datos de una cuenta nueva', 'crea otro administrador con permisos explícitos', 'se crea la cuenta con esas concesiones y se registra quién autorizó el alta sin exponer su contraseña'),
 case('Fallo de auditoría', 'una acción administrativa sensible cuya escritura de auditoría falla', 'se intenta confirmar su transacción', 'se revierte todo el cambio de negocio y no se emite un evento de éxito'))
 ])

sprint(8, 'Pagos, notificaciones, endurecimiento y despliegue',
 'RF-32; método de pago y comprobante simulado sin dinero real, historial y ganancias del técnico, preferencias de notificación, ayuda y soporte; endurecimiento; regresión y pruebas no funcionales; SonarQube con Quality Gate; despliegue en servidor.',
 'Integrar los recorridos finales y demostrar un MVP desplegable y verificable, con simulación económica inequívoca, controles de seguridad revisados y evidencias reales de calidad.',
 'Integra Sprints 1–7: participaciones/tarifas históricas, notificaciones desde Sprint 4 y soporte administrativo desde Sprint 7. No posponer aquí la seguridad básica: se endurecen controles ya construidos. Servidor de demostración académica, no operación comercial ni cobros reales.',
 'P01 moneda; P02/P16 cálculo y procedencia de montos para ganancias simuladas y métodos; P08 retención/anonimización; P09 muestra/ventana de observación; P12 avisos obligatorios; P21 protocolo de carga, métricas de cobertura, defectos y fórmulas. El plan actual confirma historial/ganancias/comprobante simulados; no reactiva confirmación financiera ni validez tributaria de propuestas anteriores.',
 [('RT-01','FAdministration para métodos, registros simulados, preferencias y soporte; React paneles cliente/técnico. Documentar contratos faltantes de comprobante e historial simulado antes de implementarlos, sin atribuirlos al contrato anterior si no están allí.'),
 ('RT-02','Tablas: payment_methods, user_payment_methods, request_payment_methods, simulated_payments/events/receipts, notification_preferences y support_tickets/updates/attachments. No guardar PAN/CVV ni activar una pasarela.'),
 ('RT-03','Contratos existentes: /payment-methods, /requests/{id}/payment-method, /me/notification-preferences y /support-cases; completar consultas/descargas simuladas con Policies y trazabilidad.'),
 ('RT-04','Compose de demostración: gateway HTTPS/WSS, api, mysql interno, worker-domain, worker-delivery, scheduler y reverb; imágenes identificadas y configuración del servidor separada de frontend-dev y test-runner.'),
 ('RT-05','SonarQube en entorno de calidad restringido con almacenamiento compatible independiente. Quality Gate usa reportes reales de pruebas; no sustituye Pest, Cypress, pruebas de carga ni revisión de seguridad.'),
 ('RT-06','RNF-01..14: protocolo P21 con hardware/dataset/carga y estadístico antes de medir; matching ≤3 s, 200 concurrentes, SUS ≥70, cinco pasos y mediana ≤3 min, disponibilidad 99% en ventana acordada y cobertura ≥70% en matching/notificación/calificación.'),
 ('RT-07','Pipeline: revisión, detección de secretos/dependencias, build, Pest/MySQL, Cypress, informes y Quality Gate, artefactos identificados; no publicar un artefacto que falle controles obligatorios.'),
 ('RT-08','Despliegue: copia recuperable, migración controlada, salud y humo por roles, jobs/vencimientos/Reverb, observación y reversión. No usar migrate:fresh en datos persistentes ni asumir que bajar esquema es una reversión segura.')],
 ['TLS/WSS, sesión segura y CSRF, CORS/orígenes explícitos, depuración desactivada y errores sin trazas internas.', 'Secretos solo de servidor, sin inclusión en bundle React ni imágenes; MySQL no expuesto públicamente y usuario de ejecución con privilegios mínimos.', 'Comprobantes privados rotulados SIMULADO y SIN VALIDEZ TRIBUTARIA; ganancias rotuladas simuladas, no ingresos verificados.', 'Preferencias no desactivan avisos obligatorios sin la política P12; proveedores externos limitados a sandbox.', 'Regresión de acceso por rol/propiedad, archivos, XSS, escalamiento, concurrencia e idempotencia; revisar dependencias, imágenes y hallazgos de seguridad.', 'Respaldos y restauración probados, auditoría preservada, plan de incidente y observabilidad de colas, fallos, SLA y disponibilidad.', 'Retención/anonimización y grabaciones solo conforme decisiones aprobadas; citar normas como referencias de trabajo, sin afirmar certificación ni cumplimiento legal validado.'],
 ['Métodos, comprobantes e historial/ganancias simulados tienen trazabilidad por participación y rótulos inequívocos; no se procesa dinero.', 'Preferencias y soporte de cliente/técnico se integran con backend real y bandeja administrativa.', 'Regresión completa de casos aceptados de Sprints 1–8, resultados y defectos registrados; se cumple la exigencia de más de 60 casos ejecutados distintos, no solo redactados.', 'Quality Gate configurado y aprobado para el commit candidato; cobertura y hallazgos reportados con alcance y límites.', 'Pruebas RNF y evaluación de uso ejecutadas según protocolo aprobado; objetivos no alcanzados se reportan, no se marcan cumplidos por un build correcto.', 'Servidor académico con HTTPS/WSS, datos sintéticos, salud, recuperación, smoke por roles y evidencia de reversión. Ventana de disponibilidad observada antes de declarar su RNF cerrado.'],
 [
 story('Métodos y comprobante simulado', 'HU-23', 'RF-32, RF-C11', 'cliente', 'registrar un método y consultar una constancia simulada', 'conservar el registro sin efectuar un pago real',
 'FE: selección/aviso/descarga; API: propietario e idempotencia; datos: método por solicitud, registro y comprobante simulado por participación.',
 case('Constancia inequívoca', 'una participación propia con registro económico sintético permitido', 'el cliente selecciona método y obtiene el comprobante', 'la selección se conserva y el archivo dice simulado y sin validez tributaria sin iniciar un cobro', pending='P01, P02, P16'),
 case('Comprobante ajeno', 'un comprobante privado de otro cliente', 'se intenta descargar usando su identificador', 'se deniega sin revelar montos ni archivo')),
 story('Historial y ganancias simuladas', 'HU-23, HU-18', 'RF-32, RF-C11', 'técnico', 'consultar el resumen económico simulado por periodo', 'demostrar la trazabilidad de mis atenciones',
 'FE: totales/historial/exportación propia; API: fórmula y estados aprobados; datos: registros simulados sin mezclar tarifas actuales con importes históricos.',
 case('Total conforme fórmula', 'registros sintéticos propios de 50 y 70 incluidos por la fórmula aprobada y otro de un tercero', 'el técnico consulta su periodo', 'el resumen muestra 120 como ganancia simulada y excluye al tercero', pending='P02, P21'),
 case('Tarifa actual no cambia historial', 'una atención con importe simulado histórico 50 y tarifa actual actualizada a 80', 'se consulta el historial de la atención', 'se conserva el importe histórico 50 y no se presenta 80 como pago ocurrido')),
 story('Preferencias y bandeja de avisos', 'HU-20', 'RF-C09, RF-29', 'usuario', 'elegir preferencias y revisar mis avisos', 'recibir información según las opciones permitidas',
 'FE: preferencias/bandeja/marcar leída; API: dueño y avisos obligatorios; datos: preferencias y entregas sandbox.',
 case('Preferencia opcional respetada', 'un usuario desactiva un canal opcional conforme política aprobada', 'se genera una notificación opcional de ese canal', 'no se entrega por el canal desactivado y se conserva el aviso interno aplicable', pending='P12'),
 case('Aviso ajeno no editable', 'una notificación dirigida a otro usuario', 'se intenta marcarla como leída por identificador', 'la API deniega y su estado no cambia')),
 story('Ayuda y soporte de usuarios', 'HU-30', 'RF-C07', 'cliente o técnico', 'consultar ayuda y enviar un ticket propio', 'recibir soporte sin un chat adicional',
 'FE: FAQ, contacto institucional y formulario; API: /support-cases con propiedad de solicitud; datos: tickets vinculados a la bandeja de Sprint 7.',
 case('Ticket integrado', 'un cliente autenticado con una solicitud propia', 'envía un ticket válido y soporte lo resuelve', 'puede consultar su ticket y la resolución registrada en la bandeja administrativa', 'E2E / Cypress + API'),
 case('Solicitud ajena en soporte', 'un usuario conoce el identificador de una solicitud ajena', 'lo adjunta como contexto de un ticket', 'se deniega el vínculo y no se revela información de esa solicitud')),
 story('Regresión y endurecimiento', 'HU-24, HU-28, HU-32', 'RF-33; RNF-08, RNF-09, RNF-10', 'equipo', 'verificar el sistema integrado y sus límites de acceso', 'entregar un incremento sin regresiones conocidas críticas',
 'QA: suite acumulada, matriz de abuso y archivos; infraestructura: configuración de seguridad; datos: sintéticos y evidencias por commit.',
 case('Recorrido completo por roles', 'un entorno integrado con cliente, técnico verificado y administrador de prueba', 'se ejecuta solicitud, oferta, elección, atención, calificación y consulta administrativa', 'cada etapa se persiste una sola vez y solo los roles autorizados pueden intervenir', 'E2E / Cypress + API + Reverb'),
 case('Configuración expuesta insegura', 'el artefacto candidato y la configuración del servidor de demostración', 'se inspeccionan bundle, imagen, puertos, depuración y cookies bajo HTTPS', 'no contienen secretos, MySQL no es público, debug está desactivado y la sesión usa protecciones acordadas', 'Automatización de seguridad / CI')),
 story('Quality Gate y cobertura', 'HU-32', 'RNF-11, RNF-12', 'equipo', 'evaluar el código y las pruebas con una puerta de calidad', 'impedir la entrega de una versión que incumpla controles acordados',
 'CI: reportes Pest/Cypress y cobertura real, scanner y gate; datos: commit, configuración del gate y resultados archivados.',
 case('Puerta de calidad válida', 'un commit con suites obligatorias aprobadas e informes auténticos', 'SonarQube evalúa los umbrales aprobados y cobertura del núcleo', 'el pipeline solo habilita la entrega si el gate pasa y conserva métricas y alcance', 'Automatización de calidad / CI', 'P21'),
 case('Gate fallido bloquea entrega', 'un análisis cuya puerta de calidad falla', 'el pipeline intenta continuar al despliegue', 'se bloquea la promoción del artefacto y se conserva el motivo del fallo', 'Automatización de calidad / CI')),
 story('Rendimiento y concurrencia', 'HU-32', 'RNF-01, RNF-02', 'equipo', 'medir tiempos bajo carga representativa', 'contrastar los objetivos con datos reproducibles',
 'QA: herramienta de carga a seleccionar/documentar, dataset fijo y perfil de 200 usuarios; API: métricas separadas de duración de matching y transporte.',
 case('Matching bajo carga', 'un servidor, dataset, mezcla de operaciones y estadístico temporal aprobados', 'se ejecuta el protocolo con 200 usuarios concurrentes y solicitudes de matching', 'se registra la distribución completa y se verifica matching ≤3 s bajo el criterio acordado sin ocultar errores', 'Carga automatizada / herramienta por fijar', 'P21'),
 case('Carga no duplica reservas', 'solicitudes concurrentes que compiten por franjas de técnicos de prueba', 'se ejecuta la carga y se inspeccionan invariantes de MySQL', 'no existen reservas incompatibles dobles ni ofertas activas por encima del límite', 'Carga automatizada / herramienta por fijar', 'P16, P21')),
 story('Usabilidad y beneficio académico', 'HU-31, HU-32', 'RNF-03, RNF-04, RNF-05', 'asesor y equipo', 'evaluar experiencia y tiempo de búsqueda', 'contrastar los objetivos sin inventar resultados',
 'QA: recorridos en Chrome/Edge/Firefox y tamaños acordados; evaluación con participantes aprobados, SUS, cronometraje y comparación informal/plataforma.',
 case('Medición de uso', 'participantes y protocolo aprobados, con autorización de evidencias', 'completan la solicitud de cinco pasos y el cuestionario SUS', 'se reportan SUS y tiempos y se verifica SUS ≥70 y mediana ≤3 min incluyendo fallos según protocolo', 'Manual / estudio con participantes', 'P09, P21'),
 case('Reducción de búsqueda', 'tres escenarios por especialidad y participantes aprobados con orden alternado', 'se comparan búsquedas informales y en TécnicoYa hasta técnico confirmado', 'se reportan medianas y limitaciones y se contrasta reducción ≥30% sin declararla alcanzada si falla', 'Manual / estudio con participantes', 'P09, P21')),
 story('Despliegue, respaldo y recuperación', 'HU-32', 'RNF-06, RNF-10, RNF-13, RNF-14', 'operador del entorno académico', 'desplegar y recuperar una versión identificable', 'mantener una demostración controlada y verificable',
 'Infraestructura: Compose/healthchecks/TLS, copia, migración y smoke; QA: restauración aislada y monitoreo en ventana aprobada; datos: manifiesto y bitácora.',
 case('Restauración y humo', 'un respaldo de base/archivos de prueba y una imagen identificada compatible', 'se restaura en entorno aislado y se ejecutan smoke de sesión, solicitud, jobs y Reverb', 'los datos y relaciones esperadas se recuperan y el flujo básico funciona sin borrar la base de demostración', 'Integración operativa / scripts + revisión'),
 case('Disponibilidad observada', 'una ventana y horario de monitoreo ratificados y servidor desplegado', 'se recopilan todas las observaciones de salud y fallos durante esa ventana', 'se calcula disponibilidad con el protocolo acordado y solo se declara RNF cumplido si alcanza 99%', 'Monitoreo automatizado / ventana real', 'P09, P21'))
 ])

sprint(3, 'Solicitud y búsqueda de técnicos',
 'RF-01 a RF-04; Nueva solicitud en 5 pasos con evidencias y tarifa referencial; Buscar técnicos con filtros y perfil público; Solicitar servicio con técnico precargado; Mis solicitudes (estructura base).',
 'Permitir que el cliente describa, revise y envíe su necesidad de forma segura y consulte técnicos por especialidad, conservando la distinción entre búsqueda automática y solicitud dirigida.',
 'Requiere catálogo activo, perfiles, cobertura y tarifas de Sprint 2 y sesiones de Sprint 1. La emisión de ofertas, ranking y cronómetro se conectarán en Sprint 4; este incremento no debe mostrar asignaciones ficticias. Reseñas públicas se conectarán en Sprint 6, manteniendo estados vacíos honestos.',
 'P03 cobertura; P05 franja inmediata; P10 máximo de solicitudes activas; P16 duración de citas y relación de tarifas; P17 política de evidencias; P22 estado Registrada/Enviada. No declarar aprobadas decisiones de negocio aún abiertas.',
 [('RT-01','React: features/requests y búsqueda/perfil en features/matching, formularios reutilizables y API común; separar estado de pasos de datos persistidos.'),
 ('RT-02','Laravel: ARequests para CreateRequest/SubmitRequest y evidencias; BMatching solo consulta de técnicos en este sprint; no implementar ranking prematuramente.'),
 ('RT-03','Contratos: POST /requests; POST/DELETE /requests/{id}/attachments; POST /requests/{id}/submission; GET /requests, /requests/{id}; GET /technicians y /technicians/{id}, bajo /api/v1.'),
 ('RT-04','Tablas: service_requests, request_attachments, request_events y media_files; precargar source=profile y target_technician_id cuando corresponda. Validar relaciones en servidor.'),
 ('RT-05','Cinco pasos exactos: especialidad; subcategoría; descripción/fotos; ubicación y modalidad/horario; resumen/envío. No añadir un sexto paso para agenda.'),
 ('RT-06','Persistir envío e identificador idempotente para no duplicar por doble clic o reintento. Conexión futura a PrepareMatching documentada, sin marcar una búsqueda simulada como real. RNF-03/05: probar pasos/teclado y preparar medición de mediana ≤3 min con protocolo P21.')],
 ['Propiedad de solicitud y archivos comprobada en cada acceso, no solo en el listado.', 'No serializar dirección exacta, teléfono ni documentos en búsquedas/perfiles públicos.', 'Validar subcategoría activa, coherencia con rubro, distrito permitido y técnico objetivo en backend.', 'Límites de archivos, nombres generados y almacenamiento privado; sin aceptar rutas arbitrarias ni vínculos a archivos de otra cuenta.', 'Consultas parametrizadas, filtros permitidos y paginación; idempotencia ligada al usuario, operación y contenido.'],
 ['Flujo de cinco pasos permite volver sin perder datos y revisar antes del envío.', 'Evidencias y tarifa referencial aparecen en el resumen y quedan asociadas al titular.', 'Listado y detalle muestran únicamente solicitudes propias; errores/carga/vacío son utilizables.', 'Búsqueda por rubro, subcategoría, zona y calificación mínima; sin reseñas se muestra ausencia de datos.', 'Solicitud dirigida conserva el técnico elegido para Sprint 4; el flujo de matching aún no se declara terminado.'],
 [
 story('Solicitud en cinco pasos', 'HU-03', 'RF-01, RF-02', 'cliente', 'registrar y revisar mi solicitud en cinco pasos', 'explicar la falla sin omitir información',
 'FE: asistente y resumen editable; API: validación, creación y envío separados; datos: request y eventos con propietario de sesión.',
 case('Recorrido con corrección', 'un cliente autenticado y catálogo activo', 'completa los cinco pasos, vuelve a corregir la descripción y confirma', 'se guarda la descripción corregida y se envía una sola solicitud con resumen consistente', 'E2E / Cypress + API'),
 case('Datos obligatorios ausentes', 'el cliente omite la subcategoría o la descripción requerida', 'intenta enviar el resumen', 'el sistema identifica los campos incompletos y no envía una solicitud inválida', 'E2E / Cypress + API')),
 story('Evidencias privadas', 'HU-04', 'RF-03, RF-33', 'cliente', 'adjuntar fotos de la falla', 'facilitar su evaluación sin exponerlas a terceros',
 'FE: selección, vista previa y retirar antes de enviar; API: finalidad/propiedad y tipo; datos: adjunto privado de solicitud.',
 case('Foto propia vinculada', 'una solicitud registrada propia y una imagen válida', 'el cliente adjunta la imagen y consulta el resumen', 'la foto queda vinculada solo a esa solicitud y visible al propietario autorizado'),
 case('Referencia de archivo ajeno', 'un archivo privado perteneciente a otro cliente', 'se intenta vincular su identificador a una solicitud propia', 'la API deniega la asociación y el archivo sigue privado')),
 story('Tarifa y ubicación', 'HU-03, HU-05', 'RF-01, RF-04, RF-C02', 'cliente', 'conocer la referencia económica y confirmar la zona y horario', 'enviar una necesidad dentro de la cobertura',
 'FE: paso 4 con modalidad y franja; API: tarifa desde fuente autorizada y cobertura; datos: instantánea referencial y zona, no importe final de cobro.',
 case('Tarifa referencial visible', 'una subcategoría con tarifa referencial de prueba aprobada', 'el cliente selecciona el servicio y revisa el resumen', 'se muestra el monto como referencial y se conserva su procedencia sin tratarlo como pago'),
 case('Fuera de cobertura', 'un distrito que no pertenece al catálogo activo', 'el cliente intenta confirmar una solicitud para ese distrito', 'se informa fuera de cobertura y no se envía la solicitud')),
 story('Búsqueda y perfil público', 'HU-29, HU-05', 'RF-C06', 'cliente', 'filtrar técnicos y revisar sus perfiles públicos', 'comparar especialidad, zona y experiencia',
 'FE: filtros combinables y tarjetas paginadas; API: GET technicians con proyección pública; datos: servicios activos, portafolio y medias de prueba o ausencia de historial.',
 case('Filtros combinados', 'técnicos de prueba con distintos rubros, zonas y calificaciones', 'el cliente combina especialidad, subcategoría, distrito y calificación mínima', 'recibe únicamente técnicos que cumplen todos los filtros y un estado vacío si no hay coincidencias'),
 case('Perfil sin datos privados', 'un técnico con bio pública, documentos privados y teléfono de contacto', 'un cliente consulta su perfil antes de asignación', 'recibe bio y portafolio público pero no documentos privados ni WhatsApp')),
 story('Solicitud desde perfil', 'HU-10, HU-29', 'RF-01, RF-02, RF-C06', 'cliente', 'solicitar a un técnico elegido desde su perfil', 'mantener mi elección durante el registro',
 'FE: CTA con técnico precargado y opción clara de revisar; API: validar target_technician_id y servicio ofrecido; datos: source y objetivo persistidos.',
 case('Origen dirigido preservado', 'un cliente abre un técnico que ofrece la subcategoría seleccionada', 'pulsa Solicitar servicio y confirma los cinco pasos', 'la solicitud conserva source=profile y ese técnico objetivo sin generar una asignación automática'),
 case('Objetivo incompatible', 'el técnico precargado no ofrece la subcategoría enviada', 'se intenta enviar esa combinación manipulada', 'la API rechaza la incompatibilidad sin sustituir silenciosamente al técnico')),
 story('Mis solicitudes y envío repetido', 'HU-03, HU-12, HU-24', 'RF-01, RF-02, RF-33', 'cliente', 'ver mis solicitudes sin duplicados', 'recuperar el estado después de una interrupción',
 'FE: listado base/detalle y manejo de reintento; API: filtro por titular e idempotencia; datos: evento único de envío y versión.',
 case('Reintento del mismo envío', 'una solicitud propia y una clave de idempotencia ya confirmada para su envío', 'se repite el mismo comando tras perder la respuesta', 'se obtiene el mismo resultado y no se duplica solicitud ni evento de envío'),
 case('Solicitud ajena', 'dos clientes con solicitudes diferentes', 'uno consulta por identificador el detalle de la solicitud del otro', 'se deniega sin descripción privada, dirección ni evidencias'))
 ])

sprint(4, 'Matching, notificación, SLA y reasignación',
 'RF-06 a RF-18 y RF-29; parámetros y pesos del matching; algoritmo; notificación a 3 técnicos; SLA de 10 minutos; reasignación automática; Pendiente de disponibilidad de 24 h; Reverb/Echo; solicitudes entrantes con cronómetro.',
 'Transformar una solicitud enviada en ofertas trazables y una asignación elegida por el cliente, respetando elegibilidad, límites temporales, concurrencia y recuperación de fallos.',
 'Requiere Sprints 1–3 y datos de disponibilidad/tarifas. El historial real llegará en Sprint 6: usar tratamiento de técnico nuevo acordado y fixtures, sin inventar reseñas. La reserva mínima al asignar pertenece a este sprint para impedir dobles asignaciones; el calendario y gestión de citas completos permanecen en Sprint 5. Edición administrativa de reglas y reasignación manual quedan en Sprint 7.',
 'P05/P16 franjas y duración; P11 momento y plazo de elección; P12 fronteras temporales, recuperación y avisos; P15 normalización/estimaciones/empate residual; P19 vigencia de reglas. Propuestas: oferta válida mientras now < deadline y reloj 24 h sin reinicio por job. No aprobar esos escenarios condicionados hasta ratificar sus decisiones.',
 [('RT-01','BMatching: elegibilidad, normalización, scorer y ranking con snapshot; COffers: rondas, respuestas y elección. Interfaces Clock y acceso a candidatos permiten pruebas sin esperar plazos reales.'),
 ('RT-02','Tablas: rule_parameters/versions/values, matching_weights/runs/candidates, offer_rounds/offers, participations, appointments, notifications, outbox_events/deliveries e idempotency_records.'),
 ('RT-03','Pesos iniciales 35/20/30/15 y suma 100; distancia aproximada por distrito; tiempo estimado según evidencia o referencia de subcategoría. No introducir geolocalización real ni un microservicio Python como dependencia nueva.'),
 ('RT-04','Contratos: GET /offers y /requests/{id}/candidates; POST /offers/{id}/response, /requests/{id}/selection y /requests/{id}/alternative-searches. Ranking y apertura de rondas son casos de uso internos.'),
 ('RT-05','Jobs PrepareMatching, OpenOfferRound, ExpireOfferRound, RetryPendingMatching, ExpirePendingRequest, DeliverNotification y PublishOutboxEvent. Worker-domain, worker-delivery y scheduler del diseño; cola inicial MySQL.'),
 ('RT-06','Bloquear solicitud y técnicos en orden estable; comprobar versión y generación. Auditoría y outbox en transacción; publicar solo después del commit. Reintentos deben tener efecto único aunque el job se ejecute varias veces.'),
 ('RT-07','Reverb transporta eventos mínimos por canales privados; Echo deduplica evento/versión y consulta API al reconectar. El cronómetro usa expires_at y server_time; nunca autoriza por el reloj del navegador.'),
 ('RT-08','RNF-01/07/12: medir matching ≤3 s bajo protocolo; hasta 3 reintentos de entrega según fuente, distinguiendo intento inicial de reintento; cobertura ≥70% del alcance definido de matching/notificación. Probar MySQL y Reverb reales además de dobles unitarios.')],
 ['No aceptar pesos, estados, score, identidad del destinatario ni deadlines confiando en React.', 'Canales privados autorizados por identidad y relación; minimizar payload y revalidar al consultar.', 'Un técnico solo responde su propia oferta; un cliente solo elige dentro de su propia solicitud.', 'Caducidad verificada al recibir el comando aun con worker atrasado; generación evita jobs obsoletos.', 'No transmitir dirección exacta antes de asignación. Notificaciones externas solo en sandbox; reintentos acotados y errores sin secretos.', 'Separar trabajadores de entrega para que un transporte caído no bloqueé vencimientos; registrar fallos recuperables.'],
 ['Ranking reproducible y explicación interna conservan reglas/datos; técnicos no elegibles nunca reciben oferta.', 'Máximo tres ofertas automáticas simultáneas; la ruta dirigida contacta solo al elegido antes de alternativas autorizadas.', 'Aceptación no asigna; elección del titular revalida disponibilidad y evita doble reserva.', 'Plazos 10 min/24 h y reintentos se verifican con reloj de pruebas y condiciones ratificadas.', 'Echo/Reverb real muestran cambios tras commit; reconexión recupera estado y no duplica avisos.', 'Jobs repetidos/atrasados y rollback no crean rondas, asignaciones ni eventos de éxito extra.'],
 [
 story('Elegibilidad y subcategoría', 'HU-06, HU-07', 'RF-06, RF-07, RF-10', 'cliente', 'recibir candidatos habilitados para mi necesidad', 'evitar propuestas que no puedan atenderla',
 'FE: estados de búsqueda; API/dominio: filtrar categoría, verificación, estado, zona, franja y pausa; datos: snapshot de exclusiones.',
 case('Elegible en su servicio', 'un técnico verificado activo que ofrece la subcategoría y cubre zona/franja sin pausa', 'se ejecuta el matching de esa solicitud', 'el técnico queda elegible con snapshot y puede ser evaluado por el ranking'),
 case('Mejor puntaje pero suspendido', 'un técnico suspendido con un puntaje potencial mayor al de los activos', 'se filtran los candidatos', 'se excluye por suspensión y nunca recibe oferta')),
 story('Puntuación y desempate', 'HU-07', 'RF-06, RF-08, RF-09', 'cliente', 'obtener un orden de candidatos consistente', 'comparar las mejores alternativas según reglas conocidas',
 'Dominio: fórmula y desempate; datos: pesos versionados/factores; pruebas: fixtures numéricos sin incertidumbre de normalización.',
 case('Puntuación ponderada', 'factores normalizados 1, 0.5, 0.8 y 0.4 con pesos 35, 20, 30 y 15', 'se calcula el puntaje', 'el resultado es 75 sobre 100 y conserva los cuatro aportes', 'Unidad / Pest'),
 case('Desempate por calificación', 'dos candidatos elegibles con igual puntaje y promedios reales 4.8 y 4.2', 'se ordena el ranking', 'el candidato con promedio 4.8 precede al de 4.2', 'Unidad / Pest')),
 story('Estimaciones y técnico nuevo', 'HU-08', 'RF-11, RF-12', 'cliente y técnico', 'distinguir estimaciones de datos reales', 'interpretar distancia y experiencia sin falsa precisión',
 'FE: rótulos de aproximación/nuevo; dominio: política de datos ausentes; datos: referencia de distrito, duración y procedencia.',
 case('Distancia aproximada por zona', 'una matriz sintética aprobada de distancias entre distritos', 'se calcula y muestra una distancia de un candidato', 'se rotula distancia aproximada por zona y no se presenta como geolocalización exacta'),
 case('Perfil sin historial', 'un técnico elegible sin servicios ni calificaciones y la política de nuevos aprobada', 'se evalúan historial y tiempo estimado', 'se usa factor de historial neutro 0.5 y se muestra Nuevo y estimación general sin publicar una reseña ficticia', pending='P15')),
 story('Ronda y notificaciones', 'HU-09, HU-20', 'RF-13, RF-15, RF-29', 'técnico', 'recibir una oferta persistida', 'responder una necesidad dentro del plazo',
 'FE: bandeja entrante; aplicación: OpenOfferRound/outbox; datos: ofertas/destinatarios únicos y plazos persistidos.',
 case('Tres ofertas como máximo', 'cinco candidatos elegibles ordenados y una solicitud automática enviada', 'se abre la primera ronda', 'se generan exactamente tres ofertas a los tres primeros y ningún cuarto destinatario'),
 case('Rollback no notifica éxito', 'una apertura de ronda cuya transacción falla antes del commit', 'el worker de entrega busca mensajes publicables', 'no publica avisos de ofertas que no quedaron confirmadas en la base')),
 story('Respuesta y límite del SLA', 'HU-09', 'RF-15, RF-16', 'técnico destinatario', 'aceptar o rechazar una oferta a tiempo', 'participar sin decisiones contradictorias',
 'FE: cronómetro/aceptar/rechazar; API: respuesta con versión/reloj; datos: estado de oferta separado de participación.',
 case('Aceptación dentro de plazo', 'una oferta propia pendiente cuyo plazo termina dentro de un minuto', 'el técnico acepta', 'la oferta pasa a aceptada sin asignación ni participación automática'),
 case('Aceptación en el límite exacto', 'una oferta propia pendiente y el reloj del servidor igual a expires_at', 'el técnico intenta aceptar aunque el job no se ejecutó', 'la API responde conflicto por vencimiento y no acepta la oferta', pending='P12')),
 story('Elección y concurrencia', 'HU-10', 'RF-18', 'cliente', 'elegir una oferta aceptada válida', 'confirmar un técnico disponible',
 'FE: candidatos aceptados y confirmación; aplicación: AssignTechnician con bloqueo/revalidación; datos: participación/cita única y eventos.',
 case('Elección válida', 'una oferta aceptada de mi solicitud y un técnico aún disponible', 'confirmo mi elección', 'se crea una participación principal y la reserva aplicable con tarifa notificada y estado Asignada'),
 case('Dos reservas incompatibles', 'dos clientes eligen simultáneamente al mismo técnico para la misma franja incompatible', 'ambas transacciones intentan confirmar', 'solo una reserva se confirma y la otra informa conflicto sin doble ocupación')),
 story('Reasignación y ruta dirigida', 'HU-09, HU-10', 'RF-16, RF-17', 'cliente', 'recibir alternativas cuando no hay respuesta', 'continuar la búsqueda manteniendo mi decisión',
 'Dominio: ExpireOfferRound y ruta automática/directa; datos: generación/rondas históricas; FE: alternativas requieren autorización en ruta directa.',
 case('Siguiente ronda única', 'tres ofertas sin aceptación vencidas y otros tres candidatos válidos', 'se ejecuta dos veces el job de expiración', 'se abre una sola nueva ronda de hasta tres ofertas y se conserva el historial'),
 case('Fallo de solicitud directa', 'una solicitud desde perfil cuyo único técnico no respondió dentro del SLA', 'vence su oferta', 'se ofrecen alternativas al cliente y no se contacta ni asigna a otro técnico sin su autorización')),
 story('Pendiente durante 24 horas', 'HU-11', 'RF-14', 'cliente', 'conocer el resultado cuando no hay técnicos disponibles', 'evitar una espera indefinida',
 'FE: aviso/fecha límite; dominio: RetryPendingMatching/ExpirePendingRequest; datos: pendienteVenceEn estable y generación.',
 case('Agotamiento de candidatos', 'una solicitud sin candidatos elegibles en ninguna ronda restante', 'termina la búsqueda', 'queda Pendiente de disponibilidad con su fecha límite de 24 horas registrada'),
 case('Expiración idempotente', 'una solicitud aún pendiente que alcanzó su límite de 24 horas', 'se repite el job de expiración', 'se registra una sola transición a Expirada sin renovar el límite ni abrir nuevas rondas', pending='P12')),
 story('Tiempo real y recuperación', 'HU-20', 'RF-29', 'usuario autorizado', 'recibir cambios sin perder el estado tras desconexión', 'seguir la solicitud de forma consistente',
 'FE: Echo con event_id/version y recuperación API; API: canales privados; infraestructura: Reverb real y outbox.',
 case('Evento repetido tras reconexión', 'un cliente autorizado reconecta y recibe dos copias del mismo evento confirmado', 'Echo procesa ambas y consulta el estado actual', 'muestra una sola notificación lógica y la versión vigente', 'Integración / Cypress + Reverb real'),
 case('Canal ajeno denegado', 'un cliente sin relación con una solicitud', 'intenta suscribirse a su canal privado', 'Laravel deniega la autorización y no recibe eventos privados', 'Integración / Pest + Reverb real')),
 story('Entrega y reintentos controlados', 'HU-09, HU-20', 'RF-15, RF-29; RNF-07', 'operador del entorno de prueba', 'recuperar entregas fallidas sin duplicarlas', 'mantener trazabilidad de las ofertas',
 'Infraestructura: sender sandbox/inyección de fallos; datos: notification_attempts y claves de evento; scheduler recupera sin mover deadlines.',
 case('Límite de reintentos', 'una notificación sandbox cuya entrega falla siempre', 'se ejecuta el intento inicial y hasta tres reintentos configurados', 'se registra fallo definitivo sin un cuarto reintento y sin extender el SLA de la oferta'),
 case('Job antiguo', 'una solicitud cuya generación cambió tras una operación confirmada', 'se ejecuta un job de ronda con generación anterior', 'no altera la generación vigente ni crea ofertas obsoletas'))
 ])

sprint(2, 'Landing, administración de catálogo y perfil del técnico',
 'Landing de 10 secciones; administración de categorías/subcategorías y foto de carrusel, comunicados y verificación de técnicos; perfil y portafolio técnico, disponibilidad, zona, servicios ofrecidos, tarifas y pausa temporal (RF-05, RF-07).',
 'Hacer visible la oferta del marketplace y permitir que el administrador y los técnicos preparen información verificable que alimentará la búsqueda y el matching.',
 'Depende de identidad, RBAC y catálogo del Sprint 1. RF-07 se prepara aquí mediante datos de habilitación; su filtro integrado se valida en Sprint 4. No se incorpora todavía el motor de matching ni la búsqueda completa del Sprint 3.',
 'P03 distritos; P05/P16 duración y compatibilidad de franjas; P17 límites y formatos de archivos; P18 efectos de suspensión; P19 cambios de catálogo sobre solicitudes futuras/activas; P22 rechazo de verificación. Resolver la política aplicable antes de aceptar cada historia afectada.',
 [('RT-01','Frontend: conservar paleta y carruseles existentes; features/administration para gestión y perfiles; src/components para campos, galería y estados reutilizables.'),
 ('RT-02','Laravel: FAdministration para catálogo, revisión y comunicados; ARequests para disponibilidad/oferta profesional, con Policies en los controladores y reglas en casos de uso.'),
 ('RT-03','Contratos de referencia: /admin/specialties, /admin/subcategories, /admin/districts, /admin/announcements, /admin/technicians/{id}/reviews; /technicians/me/profile|portfolio|documents|availability|services y /media.'),
 ('RT-04','Tablas foco: technician_reviews, technician_documents, review_documents, media_files, portfolio_items/images, technician_services, service_rate_versions, technician_districts, availability_slots, technician_pauses, announcements/audiences.'),
 ('RT-05','Diferenciar archivos privados de imágenes públicas aprobadas. Eliminar del CRUD de catálogo significa desactivar, conservando referencias; comunicado eliminado se retira con auditoría.'),
 ('RT-06','RNF-03 y accesibilidad: móvil sin desbordamiento, teclado y foco visible, movimiento reducido y pausa de animaciones fuera de pantalla. Carrusel conserva intervalo aprobado de 2,5 s cuando la reproducción está habilitada.')],
 ['Autorizar propiedad en toda edición técnica y permiso específico en verificación/catálogo; un técnico no se habilita a sí mismo.', 'Validar contenido real, tamaño y finalidad del archivo según política acordada; impedir ejecución, rutas de disco arbitrarias y descarga de documentos privados.', 'Escapar texto de bio/comunicados y permitir solo enlaces con esquemas aceptados; no interpretar HTML aportado como código.', 'Auditar revisión, cambios de estado y tarifas. Una suspensión no borra trabajos ni evidencia.', 'Marcar cifras y testimonios sintéticos como ejemplos académicos; no presentar reseñas o resultados ficticios como evidencia real.'],
 ['Las diez secciones de landing existen y sus CTA llevan al flujo disponible con teclado/móvil y movimiento reducido.', 'Administrador gestiona catálogo, fotos, comunicados y revisión técnica con permisos y trazabilidad.', 'Técnico gestiona únicamente su portafolio, disponibilidad, cobertura, servicios, tarifas y pausa.', 'Tarifas conservan versiones; documentos privados no se exponen en el perfil público.', 'Datos de elegibilidad quedan preparados para Sprint 4 sin afirmar matching implementado.'],
 [
 story('Landing y carrusel', 'HU-31', 'RF-C08', 'visitante', 'entender el servicio y navegar hacia registro o búsqueda', 'identificar la especialidad que necesito',
 'FE: Header, Hero, Especialidades, Cómo funciona, Confianza, Testimonios, CTA técnicos, FAQ, CTA final y Footer; API: catálogo público; datos: solo contenido sintético rotulado.',
 case('Diez secciones navegables', 'un visitante abre la landing en móvil y escritorio', 'recorre sus diez secciones y usa los CTA de acceso', 'lee los títulos completos, llega a la cuenta correcta y no encuentra paneles privados dentro de la landing', 'E2E / Cypress'),
 case('Carrusel accesible', 'el carrusel está visible y el usuario ha solicitado movimiento reducido', 'se carga la sección y navega con teclado', 'la reproducción automática permanece pausada y los controles permiten cambiar de tarjeta con foco visible', 'E2E / Cypress')),
 story('Catálogo administrable', 'HU-25', 'RF-C01, RF-C02', 'administrador de catálogo', 'gestionar subcategorías y fotos', 'mantener una oferta clara sin perder referencias',
 'FE: tablas/formularios/foto; API: altas y cambios autorizados; datos: relación rubro-subcategoría, imagen y activación lógica, distritos aprobados.',
 case('Alta de subcategoría', 'un administrador autorizado y una especialidad activa', 'crea una subcategoría con imagen validada', 'la subcategoría aparece en su especialidad y la foto aprobada se ofrece al carrusel'),
 case('Desactivar conserva historial', 'una subcategoría referenciada por un servicio de prueba', 'el administrador la desactiva', 'deja de ofrecerse para nuevos registros pero conserva su identidad y referencias anteriores')),
 story('Comunicados por audiencia', 'HU-27', 'RF-C04, RF-C09', 'administrador de comunicaciones', 'publicar avisos con audiencia y vigencia', 'informar solo a los usuarios correspondientes',
 'FE: editor con vista previa, duplicar y retirar; API: validar audiencia/fechas/enlace; datos: announcements y audiencias sin publicación automática de duplicados.',
 case('Audiencia vigente', 'un comunicado vigente dirigido solo a técnicos', 'un cliente y un técnico consultan sus comunicados', 'solo el técnico recibe ese comunicado'),
 case('Duplicado en borrador', 'un comunicado publicado', 'el administrador lo duplica', 'se crea una copia en borrador que no aparece aún en ningún panel')),
 story('Verificación administrativa', 'HU-02', 'RF-07, RF-30, RF-33', 'administrador verificador', 'revisar los datos y evidencias del técnico', 'habilitar solo perfiles revisados',
 'FE: bandeja pendiente/ficha/decisión/motivo; API: ReviewTechnician con versión y permiso; datos: revisión y vínculos documentales auditados.',
 case('Aprobación documentada', 'un perfil pendiente con los datos y evidencias exigidos por la política aprobada', 'el administrador autorizado aprueba la revisión', 'se registra la decisión, su autor y fecha y el perfil adquiere la habilitación prevista'),
 case('Documento ajeno denegado', 'un técnico intenta consultar el documento privado de otro técnico', 'solicita su URL por identificador', 'se deniega la descarga sin revelar el contenido')),
 story('Perfil y portafolio', 'HU-29', 'RF-C06, RF-33', 'técnico', 'publicar mi experiencia y trabajos autorizados', 'presentar mi especialización a futuros clientes',
 'FE: bio y galería con estados; API: pertenencia y validación de archivos; datos: media privada/pública y portafolio separado de documentos.',
 case('Trabajo publicado', 'un técnico propietario de una imagen permitida para portafolio', 'publica un trabajo con título y descripción', 'el trabajo aparece en su galería pública sin incluir documentos de verificación'),
 case('Archivo no permitido', 'un archivo cuyo contenido no cumple la política de imágenes aprobada', 'se intenta subir como foto de portafolio', 'se rechaza y no queda disponible para descarga pública', pending='P17')),
 story('Disponibilidad, zona y pausa', 'HU-06', 'RF-05, RF-07', 'técnico', 'configurar franjas y cobertura y pausar temporalmente mi oferta', 'controlar cuándo puedo recibir solicitudes',
 'FE: editor de franjas/distritos/pausa; API: intervalos válidos y versión; datos: slots, cobertura y pausas, diferenciados del estado de verificación.',
 case('Configuración válida', 'un técnico habilitado y distritos de prueba aprobados', 'guarda horarios y activa una pausa temporal válida', 'se conservan horarios y zona y la pausa queda disponible para el filtro de elegibilidad'),
 case('Intervalo inválido', 'un técnico con horario previamente guardado', 'envía una franja cuyo fin es anterior al inicio', 'recibe validación de error y el horario anterior no se altera')),
 story('Servicios y tarifas', 'HU-05, HU-06', 'RF-05, RF-07, RF-C06', 'técnico', 'seleccionar las subcategorías que ofrezco y sus tarifas referenciales', 'mostrar condiciones consistentes',
 'FE: selector por rubro y tarifa por servicio; API: categorías activas y ámbito verificado; datos: technician_services y service_rate_versions.',
 case('Nueva versión de tarifa', 'un servicio técnico con tarifa referencial de prueba 50 y versión 1', 'su propietario cambia la referencia a 60', 'se crea versión 2 y la versión 1 conserva el valor 50 sin sobrescritura'),
 case('Tarifa negativa', 'un técnico editando su propio servicio', 'envía una tarifa referencial negativa', 'la API rechaza el valor y no crea una versión de tarifa'))
 ])

if __name__ == '__main__':
    generate()
