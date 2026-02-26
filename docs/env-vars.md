# Variables de Entorno

Archivo de referencia: `.env.example`

## Requeridas para el sistema de pedidos

| Variable | Tipo | Descripción | Dónde obtener |
|----------|------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | URL del proyecto Supabase | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Anon key de Supabase | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Service role key de Supabase | Supabase Dashboard → Settings → API |
| `T1_PAGOS_BEARER_TOKEN` | Secret | Bearer token de T1 Pagos (ClaroPagos) | Panel admin ClaroPagos |
| `T1_PAGOS_BASE_URL` | Server | Base URL de la API | `https://api.sandbox.claropagos.com/v1` (sandbox) o `https://api.claropagos.com/v1` (prod) |
| `ADMIN_PASSWORD` | Secret | Contraseña del dashboard admin | Definir manualmente |

## Twilio WhatsApp

| Variable | Tipo | Descripción | Dónde obtener |
|----------|------|-------------|---------------|
| `TWILIO_ACCOUNT_SID` | Secret | Account SID de Twilio | Twilio Console → Account Info |
| `TWILIO_AUTH_TOKEN` | Secret | Auth Token de Twilio | Twilio Console → Account Info |
| `TWILIO_WHATSAPP_FROM` | Server | Numero de WhatsApp remitente | Formato: `whatsapp:+14155238886` (sandbox) |
| `ADMIN_WHATSAPP_PHONES` | Server | Numeros WhatsApp del equipo | Separados por coma: `whatsapp:+521234567890,whatsapp:+529876543210` |

## Notas

- Las variables `NEXT_PUBLIC_*` se exponen al browser — no poner secretos ahí
- `SUPABASE_SERVICE_ROLE_KEY` tiene acceso total a la DB — nunca exponerlo al cliente
- `T1_PAGOS_BASE_URL` por defecto usa sandbox si no se configura
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
- Para produccion, cambiar `T1_PAGOS_BASE_URL` a `https://api.claropagos.com/v1`
