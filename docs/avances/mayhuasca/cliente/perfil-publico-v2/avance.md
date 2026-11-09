# Avance · Fase 3 del panel final: API de búsqueda, favoritos y perfil público moderno

| Campo | Valor |
|---|---|
| Integrante | Mayhuasca Huanca, Karen Jandre |
| Sprint | 5 (adelanto, D-87) |
| Módulo | `b-matching` (búsqueda y favoritos) y `f-administration` (perfil del técnico) |
| HU/RF y tarea | HU-S03-04 (RF-C06), HU-S02-05 (RF-33) y HU-S02-04: búsqueda por precio, experiencia y «Disponible hoy», favoritos, perfil público ampliado y técnicos de demostración |
| Rama | `feature/mayhuasca/cliente/perfil-publico-v2`, desde `main` `1554edc` |
| Commit/PR | Ver el historial de la rama y su PR |
| Fecha | 2026-11-09 |
| Revisor | [PENDIENTE] |
| Enlace a SonarQube | No aplica todavía: SonarQube corre al cierre del sprint (regla 12b) |
| Decisiones | D-101, propuesta y pendiente de confirmar ([DECISIONES.md](../../../../documentacion/sprints/DECISIONES.md)); contrato S5 §11 |

## Cambios

- **Migración `000033`:**
  - forma de trabajo, garantía y «qué incluye»;
  - etapa de cada imagen del portafolio;
  - `client_favorite_technicians` y `technician_review_samples`.

  Los CHECK son solo de MySQL.
- **`GET /technicians`:**
  - `sort=price|experience` y `available_today`;
  - la tarjeta suma `specialties`, `verified`, `favorite` y `sample_rating`.
- **`GET /technicians/{id}`:**
  - forma de trabajo, garantía, «qué incluye», especialidades y distritos;
  - semana por franjas, «Disponible hoy», favorito y reseñas de ejemplo con sus barras.
  - Sigue sin contacto, dirección ni documentos.
- **Favoritos:** `GET`, `PUT` y `DELETE /client/favorites`, solo del cliente titular; guardar y quitar son idempotentes.
- **Edición del técnico:**
  - `work_style`, `warranty_text` y `services[].includes`, con límites y mensajes en español;
  - `image_stages` en el portafolio.
- **DemoSeeder:**
  - Rosa Quispe (refrigeración) y Diego Huamán (cómputo), con 4 servicios, 2 o 3 distritos, 5 o 6 trabajos y 5 reseñas de ejemplo;
  - las fotos se leen de `database/seeders/demo-media/` si existen.

## Pruebas

| Prevista | Ejecutada | Resultado |
|---|---|---|
| Rojo S05-TC-181 a 196 | `3b85eea` | 16 en rojo |
| Verde | `2b08829` | 16 en verde |
| Pest completo | Slot A, sobre `2b08829` | 462/462 |
| `composer audit` | Local | Sin avisos |

**Pruebas cambiadas, con motivo:**

- **S05-TC-194 (nueva):** compara las versiones de tarifa antes y después, porque la fábrica ya crea una.
- **S03-TC-045 y S05-TC-007:** la lista exacta de claves de la tarjeta suma las cuatro nuevas de D-101.

## Registro de uso de IA

| Campo | Valor |
|---|---|
| Herramienta y modelo | Claude Code, Claude Opus 5.5 |
| Fecha | 2026-11-09 |
| Qué se aceptó | [PENDIENTE] |
| Qué se corrigió | [PENDIENTE] |
| Quién lo revisó | [PENDIENTE] |
