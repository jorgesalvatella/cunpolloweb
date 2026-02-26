# Variables de Entorno

Archivo de referencia: `.env.example`

## Requeridas para el sistema de pedidos

| Variable | Tipo | Descripción | Dónde obtener |
|----------|------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | URL del proyecto Supabase | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Anon key de Supabase | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Service role key de Supabase | Supabase Dashboard → Settings → API |
| `T1_PAGOS_API_KEY` | Secret | API key de T1 Pagos | Panel T1 Pagos |
| `T1_PAGOS_BASE_URL` | Server | Base URL de la API | `https://api.sandbox.t1pagos.com/v2` (sandbox) o `https://api.t1pagos.com/v2` (prod) |
| `ADMIN_PASSWORD` | Secret | Contraseña del dashboard admin | Definir manualmente |

## Notas

- Las variables `NEXT_PUBLIC_*` se exponen al browser — no poner secretos ahí
- `SUPABASE_SERVICE_ROLE_KEY` tiene acceso total a la DB — nunca exponerlo al cliente
- `T1_PAGOS_BASE_URL` por defecto usa sandbox si no se configura
- `ADMIN_PASSWORD` puede ser cualquier string, se usa para el login de `/admin`

## Setup local

```bash
cp .env.example .env.local
# Editar .env.local con los valores reales
```

## Setup Vercel

Agregar cada variable en Vercel Dashboard → Settings → Environment Variables:
- Marcar las `NEXT_PUBLIC_*` para todos los environments
- Marcar las secretas solo para Production y Preview
- Para producción, cambiar `T1_PAGOS_BASE_URL` a la URL de producción
