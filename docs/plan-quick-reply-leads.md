# Plan: Botón "Me interesa" + Captura de Leads por WhatsApp

> **Estado**: Pendiente — implementar para la siguiente campaña (~1 semana después del 2026-11-04)
> **Objetivo**: Que las campañas lleven un botón quick reply "Me interesa"; quien lo toque queda registrado como lead y Gerencia recibe aviso inmediato por WhatsApp para cerrar la venta.

## Contexto actual (2026-11-04)

- Cuenta Twilio activa — SID en `.env.local` (ojo: activar auto-recharge en Billing para evitar re-suspensión)
- Sender WhatsApp: `whatsapp:+5219983871387` — ONLINE, quality HIGH, WABA `1475932520606512`
- Template campaña posadas vigente: `cunpollo_posadas_card_v3` (SID `HX102b563df78a06d1cfb07557a21933bb`), sin variables, botón "Llamar a Gerencia"
- Imagen posadas: `https://igwu4bqzucdjjkup.public.blob.vercel-storage.com/whatsapp/posadas-2026.jpeg`
- WhatsApp Gerencia: `+52 998 428 3677`
- Lecciones aprendidas:
  - Meta RECHAZA links `wa.me` en botones (subcode 2388081) — usar `PHONE_NUMBER` o `QUICK_REPLY`
  - Usar tipo `whatsapp/card`, NO `twilio/card` (evita error 63028)
  - Imagen header: 1200×628 (1.91:1), <5MB, URL pública (Vercel Blob)
  - Templates de campaña SIN variable de nombre (contactos con nombres genéricos)

## Paso 1 — Template v4 con ambos botones

Crear vía Content API (mismo proceso que v3). Quick reply + phone conviven en la card:

```bash
# Credenciales en cunpolloweb/.env.local
curl -s -X POST 'https://content.twilio.com/v1/Content' \
  -H 'Content-Type: application/json' \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
  -d '{
    "friendly_name": "cunpollo_<campana>_card_v1",
    "language": "es",
    "types": {
      "whatsapp/card": {
        "body": "<texto de la promo, sin variables>",
        "media": ["<URL publica 1200x628>"],
        "footer": "<condiciones>",
        "actions": [
          { "type": "QUICK_REPLY", "title": "Me interesa", "id": "lead_<campana>" },
          { "type": "PHONE_NUMBER", "title": "Llamar a Gerencia", "phone": "+529984283677" }
        ]
      }
    }
  }'

# Someter a aprobación (categoría MARKETING) y checar status:
curl -X POST "https://content.twilio.com/v1/Content/<SID>/ApprovalRequests/whatsapp" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" -H 'Content-Type: application/json' \
  -d '{ "name": "<friendly_name>", "category": "MARKETING" }'
curl "https://content.twilio.com/v1/Content/<SID>/ApprovalRequests" -u "$SID:$TOKEN"
```

Registrar el template aprobado en `src/lib/whatsapp-templates.ts` (variableCount 0, autoNameVariable false).

## Paso 2 — Tabla `leads` en Supabase

```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  contact_name text,              -- lookup en tabla contacts por teléfono
  campaign text not null,          -- del ButtonPayload, ej. 'lead_posadas'
  button_text text,                -- texto del botón tocado
  status text not null default 'new',  -- new | contacted | won | lost
  created_at timestamptz not null default now()
);
create index leads_campaign_idx on leads (campaign, created_at desc);
```

## Paso 3 — Webhook de mensajes entrantes

**Archivo nuevo**: `src/app/api/webhooks/twilio-whatsapp/route.ts`

1. POST handler que recibe `application/x-www-form-urlencoded` de Twilio
2. **Validar firma** `X-Twilio-Signature` (HMAC-SHA1 con AUTH_TOKEN sobre URL + params ordenados) — crítico, ver patrón en `.claude/skills/twilio-communications/SKILL.md`
3. Leer campos: `From` (whatsapp:+52...), `Body`, `ButtonPayload` (el id del quick reply), `ButtonText`, `ProfileName`
4. Si `ButtonPayload` empieza con `lead_`:
   - Insertar en `leads` (lookup de nombre en `contacts` por teléfono)
   - Notificar a Gerencia: `sendWhatsAppTemplate()` a los teléfonos de `admin_phones` (o texto libre si hay ventana activa). Mensaje: "🔥 Lead <campana>: <nombre> <telefono> tocó Me interesa"
   - Auto-responder al cliente con `sendWhatsApp()` (texto libre — su reply abrió ventana de 24h): "¡Gracias por tu interés! Gerencia te contacta en breve. Si prefieres, llámanos al +52 998 428 3677"
5. Responder 200 con TwiML vacío: `<Response></Response>` (Content-Type text/xml)

**Configurar la URL del webhook** en el sender de WhatsApp:
Twilio Console → Messaging → Senders → WhatsApp senders → +5219983871387 → Webhook URL for incoming messages → `https://cunpollo.com/api/webhooks/twilio-whatsapp` (método POST). También se puede por API (`POST /v2/Channels/Senders/<XE...>` con `webhook`).

## Paso 4 — Vista de interesados en admin (opcional pero recomendado)

- Sub-tab "Interesados" en `WhatsAppHub` (junto a Notificaciones/Contactos/Enviar Promo/Historial)
- Lista de `leads` con nombre, teléfono (link `tel:`), campaña, fecha, status editable (new/contacted/won/lost)
- API route: `src/app/api/admin/leads/route.ts` (GET + PATCH, con `verifyAdmin()`)

## Checklist de implementación

- [ ] Imagen de la nueva campaña (1200×628) subida a Vercel Blob
- [ ] Template v4 creado con QUICK_REPLY + PHONE_NUMBER
- [ ] Aprobado por Meta (checar status)
- [ ] Registrado en `whatsapp-templates.ts`
- [ ] Migración tabla `leads` aplicada en Supabase
- [ ] Webhook route con validación de firma
- [ ] Webhook URL configurada en el sender
- [ ] Notificación a Gerencia + auto-respuesta al cliente
- [ ] (Opcional) Sub-tab Interesados en admin
- [ ] Prueba end-to-end: mandarse el template a un teléfono propio, tocar "Me interesa", verificar lead + aviso a Gerencia
- [ ] Deploy y lanzar campaña desde admin

## Costos de referencia

- Mensaje marketing MX: ~$0.05-0.07 USD c/u
- Respuesta del cliente (quick reply) abre conversación de servicio: ~$0.01-0.02 USD; la auto-respuesta va incluida en esa ventana de 24h
