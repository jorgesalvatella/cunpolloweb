# Variables de Entorno

Archivo de referencia: `.env.example`

## Requeridas para el sistema de pedidos

| Variable | Tipo | Descripción | Dónde obtener |
|----------|------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | URL del proyecto Supabase | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Anon key de Supabase | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Service role key de Supabase | Supabase Dashboard → Settings → API |
| `T1_PAGOS_API_KEY` | Secret | API Key de T1 Pagos | Panel admin T1 Pagos |
| `T1_PAGOS_BASE_URL` | Server | Base URL de la API | `https://api.sandbox.t1pagos.com/v2` (sandbox) o `https://api.t1pagos.com/v2` (prod) |
| `T1_WEBHOOK_USER` | Secret | Usuario Basic Auth para webhook | Definir manualmente, configurar en panel T1 |
| `T1_WEBHOOK_PASS` | Secret | Password Basic Auth para webhook | Definir manualmente, configurar en panel T1 |
| `ADMIN_PASSWORD` | Secret | Contraseña del dashboard admin | Definir manualmente |

## Twilio WhatsApp

| Variable | Tipo | Descripción | Dónde obtener |
|----------|------|-------------|---------------|
| `TWILIO_ACCOUNT_SID` | Secret | Account SID de Twilio | Twilio Console → Account Info |
| `TWILIO_AUTH_TOKEN` | Secret | Auth Token de Twilio | Twilio Console → Account Info |
| `TWILIO_WHATSAPP_FROM` | Server | Numero de WhatsApp remitente | Formato: `whatsapp:+14155238886` (sandbox) |
| `ADMIN_WHATSAPP_PHONES` | Server | Numeros WhatsApp del equipo | Separados por coma: `whatsapp:+521234567890,whatsapp:+529876543210` |

## Vercel Blob Storage

| Variable | Tipo | Descripcion | Donde obtener |
|----------|------|-------------|---------------|
| `BLOB_READ_WRITE_TOKEN` | Secret | Token de lectura/escritura para Vercel Blob | Vercel Dashboard → Storage → Blob Store → Settings |

## Notas

- Las variables `NEXT_PUBLIC_*` se exponen al browser — no poner secretos ahí
- `SUPABASE_SERVICE_ROLE_KEY` tiene acceso total a la DB — nunca exponerlo al cliente
- `T1_PAGOS_BASE_URL` por defecto usa sandbox v2 si no se configura
- `T1_WEBHOOK_USER` y `T1_WEBHOOK_PASS` son opcionales — si no se configuran, el webhook acepta todo
- `ADMIN_PASSWORD` puede ser cualquier string, se usa para el login de `/admin`
- Las variables de Twilio son opcionales — si no se configuran, las notificaciones se desactivan silenciosamente
- `TWILIO_WHATSAPP_FROM` usa el numero sandbox de Twilio por defecto (`+14155238886`)
- `ADMIN_WHATSAPP_PHONES` soporta multiples numeros separados por coma

## Setup local

```bash
cp .env.example .env.local
# Editar .env.local con los valores reales
```

## Setup Vercel

Agregar cada variable en Vercel Dashboard → Settings → Environment Variables:
- Marcar las `NEXT_PUBLIC_*` para todos los environments
- Marcar las secretas solo para Production y Preview
- Para produccion, cambiar `T1_PAGOS_BASE_URL` a `https://api.t1pagos.com/v2`
