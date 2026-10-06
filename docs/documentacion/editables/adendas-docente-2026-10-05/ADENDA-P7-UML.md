# CANVAS DE ADENDA · P7 · Selección de diagramas

**Fecha:** 5 de octubre de 2026. **Documentos afectados:** CANVAS de casos de uso, secuencia de autenticación y clases del dominio; listado de diagramas UML solicitado. E-R y flujos se revisan para corregir su clasificación, no para convertirlos en UML.

## Qué se agrega

### Evidencia localizada en las fuentes adjuntas

Se revisó el corpus registrado de 32 PDF de `Documents/articulos`, con 30 documentos distintos por hash. Se buscó terminología de UML y tipos de diagramas en el texto y se inspeccionaron las figuras relevantes de los trabajos de solución. **No se localizó una mención literal a «UML» en el texto extraído del corpus.** Esto no equivale a afirmar que ninguna figura utiliza símbolos UML: se distingue la denominación textual de la evidencia visual. Las páginas siguientes son posiciones del PDF.

| Fuente | Evidencia concreta | Tipos efectivamente documentados | Qué permite sostener |
|---|---|---|---|
| Rathod et al. (2025), *Cappie*, [A27](../../fuentes/articulos/A27.pdf), p. 2, §III | Declara haber desarrollado diagramas de casos de uso y E-R. La figura 1 visible está titulada *Flow Diagram*. | Casos de uso y E-R declarados; flujo mostrado. | Respaldo explícito del **tipo casos de uso**. No afirmar que la figura 1 sea un diagrama UML de actividades ni un caso de uso: es un flujo. E-R no es UML. |
| Bejarano Gavilanes (2022), [A30](../../fuentes/articulos/A30.pdf), pp. 51–55 y 56 (impresas 32–37) | §3.1.5 y gráficos 8–14 describen casos de uso; §3.2.1 llama «Diagrama de componentes» al gráfico 15; gráfico 16 es un modelo relacional. | Casos de uso, componentes según el autor y modelo relacional. La figura 15 combina símbolos de componentes y nodos. | **Antecedente complementario, es una tesis.** No presentarla como artículo ni convertir automáticamente su figura mixta en respaldo de un despliegue Docker. |
| Gothankar et al. (2024), *HomeServe*, [A25](../../fuentes/articulos/A25.pdf), pp. 3–4, figuras 1.0 y 1.1 | Figuras denominadas arquitectura existente/propuesta, con flujos entre usuario, proveedor y administración. | Esquemas de arquitectura/flujo. | No documenta explícitamente UML de clases, secuencia, estados, actividades o despliegue. La presencia de un actor dibujado no basta para clasificar toda la figura como UML. |
| Krishna Veni y Bharathkumarmr (2025), [A28](../../fuentes/articulos/A28.pdf), p. 3 | Enumera arquitectura, bloques y flujo de datos; figura 1 muestra arquitectura. | Arquitectura mostrada; bloques/DFD mencionados en metodología. | No acredita que use UML; un DFD no es un diagrama de actividades UML. |
| Anasune et al. (2026), *Reparo*, [A29](../../fuentes/articulos/A29.pdf), p. 3 | Describe capas, flujo de datos y modelo E-R en texto. | Descripción arquitectónica y modelo E-R textual. | No hay diagrama UML específico identificable en ese apartado. |
| Aji et al. (2022), *Quick Reacher*, [A23](../../fuentes/articulos/A23.pdf), pp. 3–7; Tambe et al. (2020), [A26](../../fuentes/articulos/A26.pdf), pp. 2–3 | Esquema/capturas y pantallas de funciones; no declaración de UML localizada. | Arquitectura funcional o capturas de interfaz. | No utilizarlos como respaldo de diagramas UML no mostrados ni declarados. |

En los demás documentos no se localizó evidencia textual específica que justifique añadir otro tipo UML a esta selección. La extracción presenta limitaciones de codificación en algunos PDF; esta es una conclusión sobre la evidencia localizada, no una certificación exhaustiva de ausencia. Si se aporta otra figura/artículo, registrar página y revisar la selección.

### Regla de selección académica

Con el criterio literal «solo los diagramas que los artículos respaldan», **conservar casos de uso en P7**. El diagrama de componentes tiene un antecedente explícito en una tesis: queda fuera de la selección estricta por artículos, con posible reincorporación si el docente acepta esa clase de fuente. La utilidad técnica de un diagrama y su admisibilidad bibliográfica son criterios diferentes.

## Qué se modifica

| Documento/diagrama existente o solicitado | Cambio en la entrega P7 | Motivo y destino del conocimiento |
|---|---|---|
| [CANVAS de casos de uso](../CANVAS-Casos-Uso-General-TecnicoYa.md) y `Casos-Uso-General-TecnicoYa.puml/.svg` | **Conservar**; añadir Rathod et al. (2025), p. 2, como respaldo del tipo de diagrama. | Los actores, casos, permisos e include/extend concretos son elaboración propia a partir de Fuente 0; no copiarlos del artículo. |
| [CANVAS de secuencia 01](../CANVAS-Secuencia-01-Autenticacion-Perfil-TecnicoYa.md) y su `.puml/.svg` | **Omitir de P7**. | No se localizó artículo del corpus que utilice o declare diagramas de secuencia. Conservar contratos de autenticación y pruebas en P2/P11-B; no eliminar comportamiento. |
| Secuencias 02–06 antes solicitadas | **No incorporarlas a P7**. No se localizaron archivos individuales en la carpeta editable vigente. | Mismo motivo; no afirmar que existen o se eliminaron archivos no encontrados. |
| [CANVAS de clases](../CANVAS-Clases-Dominio-TecnicoYa.md) y `Clases-Dominio-TecnicoYa.puml/.svg` | **Omitir de P7**. | Un E-R no respalda por equivalencia un diagrama de clases. Mantener entidades/invariantes en el diccionario y P2. |
| Componentes alineados a los 16 componentes conceptuales, solicitado previamente | **Omitir de P7 bajo el criterio estricto de artículos**. Si se acepta tesis, conservar con Bejarano Gavilanes (2022), p. 56, identificando la adaptación propia. | El antecedente no sustenta el número 16 ni nombres particulares. No se localizó archivo UML independiente de componentes en la carpeta vigente. La arquitectura por capas/módulos continúa en P2. |
| Estados de la solicitud | **Omitir el diagrama UML de P7**. | No hay respaldo explícito localizado para este tipo. La tabla de estados, transiciones e invariantes de negocio permanece obligatoria. No se localizó archivo independiente vigente. |
| Actividades del matching | **Omitir el diagrama UML de P7**. | Un *Flow Diagram* genérico no demuestra el uso de actividades UML. Conservar fórmula, pseudocódigo y escenarios BDD. No se localizó archivo independiente vigente. |
| Despliegue Docker Compose | **Omitir el diagrama UML de P7**. | No se localizó artículo con ese tipo UML. Mantener topología, servicios y configuración textual de despliegue en P2/P10. No se localizó archivo UML independiente vigente. |
| [E-R, tres diagramas Mermaid](../CANVAS-Diagramas-ER-TecnicoYa.md) | **Conservar en modelado de datos, fuera de P7-UML**. | Rathod et al. (2025), p. 2, declara E-R. Sus tablas/cardinalidades son propias de TécnicoYa. |
| [Flujo del negocio](../CANVAS-Flujo-Negocio-TecnicoYa.md) | **Conservar como flujo, fuera de UML**. | Referencia de tipo: figura 1 de Rathod et al. (2025), p. 2. El flujo específico conserva reglas de Fuente 0. |
| [Flujo técnico](../CANVAS-Flujo-Tecnico-Aplicativo-TecnicoYa.md) | **Conservar en P2 como esquema técnico, fuera de UML**. | Antecedentes de capas: Anasune et al. (2026), p. 3. No presentarlo como UML por usar Mermaid. |

## Qué se elimina

- De la **selección de la entrega académica P7**, los tipos sin respaldo descritos arriba; no se borran sus fuentes ni archivos históricos.
- La equiparación «Mermaid/PlantUML = UML»: son herramientas/sintaxis y admiten distintas notaciones.
- Cualquier afirmación de que las reglas, 16 componentes, clases o secuencias de TécnicoYa fueron validados por esos artículos.

**Impacto:** cambia el conjunto de diagramas presentado, no los RF, entidades, estados, permisos ni funcionalidades. Las referencias a clases/secuencias en documentos de sprints quedan como material técnico auxiliar histórico, no como evidencia bibliográfica de P7.
