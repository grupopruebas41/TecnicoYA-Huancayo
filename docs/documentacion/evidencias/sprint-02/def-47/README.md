# DEF-47 · 2026-10-19

Rama feature/delgado/f-administracion/s02-catalog-edit desde main con PR #22 integrado. Rojo 84a0f63: 1 fallo esperado (PATCH contiene specialty_id), 3 aprobadas. Verde 25065ab: 154/154 pruebas, 22 archivos; líneas globales 84,49 %. Build salida 0, audit 0 vulnerabilidades. Logs con hash previo a confirmar los cambios; implementación validada en 25065ab.

CatalogAdmin.jsx ahora construye únicamente campos editables; specialty_id se añade solo al crear. Edición conserva imagen, tarifa y expected_version; el selector no permite cambiar el padre y muestra su valor incluso si la especialidad fue desactivada. Creación sigue validando la selección.

CatalogEdit.test.jsx conserva ID S02-TC-076 como complementos, sin inflar IDs: PATCH sin padre y con foto/version; POST requiere padre; PATCH de especialidades y distritos solo permite campos del contrato. El mock rechaza PATCH con specialty_id con 422 para reproducir la regla real. Contrato S2 §7 y Requests del backend inspeccionados en solo lectura: code está prohibido en especialidades/distritos y esos payloads ya lo omitían. No se modificó backend/. Sin Cypress ni Docker.

Revisor humano: [PENDIENTE].
