# Variables de Entorno

Archivo de referencia: `.env.example`

## Requeridas para el sistema de pedidos

| Variable | Tipo | Descripcion | Donde obtener |
|----------|------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | URL del proyecto Supabase | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Anon key de Supabase | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Service role key de Supabase | Supabase Dashboard > Settings > API |
| `ADMIN_PASSWORD` | Secret | Contrasena del dashboard admin | Definir manualmente |

## Pasarela de Pago (OpenPay)

| Variable | Tipo | Descripcion | Donde obtener |
|----------|------|-------------|---------------|
| `OPENPAY_MERCHANT_ID` | Secret | ID del comercio (server-side) | Panel OpenPay |
| `OPENPAY_PRIVATE_KEY` | Secret | Llave privada API (server-side) | Panel OpenPay |
| `NEXT_PUBLIC_OPENPAY_MERCHANT_ID` | Public | ID del comercio (client-side tokenizacion) | Panel OpenPay |
| `NEXT_PUBLIC_OPENPAY_PUBLIC_KEY` | Public | Llave publica (client-side tokenizacion) | Panel OpenPay |
| `NEXT_PUBLIC_OPENPAY_SANDBOX` | Public | `true` para sandbox, `false` para produccion | Manual |

## Twilio WhatsApp

| Variable | Tipo | Descripcion | Donde obtener |
|----------|------|-------------|---------------|
| `TWILIO_ACCOUNT_SID` | Secret | Account SID de Twilio | Twilio Console > Account Info |
| `TWILIO_AUTH_TOKEN` | Secret | Auth Token de Twilio | Twilio Console > Account Info |
| `TWILIO_WHATSAPP_FROM` | Server | Numero de WhatsApp remitente | Formato: `whatsapp:+529983871387` |
| `ADMIN_WHATSAPP_PHONES` | Server | Numeros WhatsApp del equipo | Separados por coma: `whatsapp:+521234567890,whatsapp:+529876543210` |

## Vercel Blob Storage

| Variable | Tipo | Descripcion | Donde obtener |
|----------|------|-------------|---------------|
| `BLOB_READ_WRITE_TOKEN` | Secret | Token de lectura/escritura para Vercel Blob | Vercel Dashboard > Storage > Blob Store > Settings |

## Notas

- Las variables `NEXT_PUBLIC_*` se exponen al browser — no poner secretos ahi
- `SUPABASE_SERVICE_ROLE_KEY` tiene acceso total a la DB — nunca exponerlo al cliente
- `ADMIN_PASSWORD` puede ser cualquier string, se usa para el login de `/admin`
- Las variables de Twilio son opcionales — si no se configuran, las notificaciones se desactivan silenciosamente
- Las variables de OpenPay estan pendientes de integracion

## Setup local

```bash
cp .env.example .env.local
# Editar .env.local con los valores reales
```

## Setup Vercel

Agregar cada variable en Vercel Dashboard > Settings > Environment Variables:
- Marcar las `NEXT_PUBLIC_*` para todos los environments
- Marcar las secretas solo para Production y Preview
