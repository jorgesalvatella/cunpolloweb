# CUNPOLLO Web — Instrucciones para Claude

## Regla de Documentación (OBLIGATORIO)
**Cada vez que se complete una acción significativa** (nueva feature, cambio de arquitectura, nueva ruta, nuevo componente, cambio de config, fix importante), **se DEBE actualizar la documentación correspondiente en `docs/`**. Esto incluye:
- Agregar el archivo nuevo al mapa en `docs/architecture.md`
- Actualizar `docs/api.md` si se agrega/modifica una ruta API
- Actualizar `docs/env-vars.md` si se agrega una variable de entorno
- Actualizar `docs/setup.md` si cambia el proceso de setup
- Actualizar `docs/features.md` si se agrega/modifica una feature
- Actualizar `docs/database.md` si cambia el schema
- Actualizar el `MEMORY.md` solo si el cambio es un patrón estable o preferencia

No dejar documentación desactualizada. Si no sabes qué archivo actualizar, actualiza `docs/changelog.md`.

## Stack
- Next.js 15 + App Router + next-intl (ES/EN, default: es)
- Tailwind CSS v4 (tokens en globals.css)
- Framer Motion + React Three Fiber
- Supabase (DB + Realtime)
- Openpay (pasarela de pago México)
- pnpm como package manager
- Deploy: Vercel

## Convenciones
- Colores: rojo dominante + dorado + blanco. NO fondos oscuros/negros
- NO gradientes — colores solidos
- NO emojis en código a menos que el usuario lo pida
- Traducciones en `src/messages/{es,en}.json` con namespaces
- Feature flags en `src/lib/constants.ts` (FEATURES object)
- Rutas admin fuera del sistema i18n (`/admin`, no `/[locale]/admin`)
- API routes en `/api/` (excluidas del middleware i18n)

## Documentación del proyecto
Ver carpeta `docs/` para documentación técnica completa:
- `docs/architecture.md` — Mapa de archivos y estructura
- `docs/features.md` — Features implementadas y su estado
- `docs/api.md` — Referencia de API routes
- `docs/database.md` — Schema de Supabase
- `docs/env-vars.md` — Variables de entorno requeridas
- `docs/setup.md` — Guía de setup local y deploy
- `docs/changelog.md` — Log de cambios significativos
