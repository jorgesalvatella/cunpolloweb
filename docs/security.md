# Seguridad — CUNPOLLO Web

Documento de referencia para el estado de seguridad del sistema de pedidos.

## Estado actual (2026-02-28)

### Implementado

| Area | Detalle | Archivos |
|------|---------|----------|
| Precios server-side | El servidor recalcula precios desde `menu-items.ts`, ignora precios del cliente | `api/orders/route.ts` |
| Validacion de cantidad | Rango 1-100, tipo entero obligatorio | `api/orders/route.ts` |
| Limite de items | Maximo 50 productos por pedido | `api/orders/route.ts` |
| Sanitizacion nombre | Trim, largo 2-100 caracteres | `api/orders/route.ts` |
| Sanitizacion telefono | Regex `^\+?[0-9]{10,15}$`, limpia espacios/guiones | `api/orders/route.ts` |
| Admin hash HMAC-SHA256 | Cookie usa `crypto.createHmac('sha256')` en vez de djb2 | `lib/admin-auth.ts` |
| Timing-safe password compare | `crypto.timingSafeEqual` para evitar timing attacks | `lib/admin-auth.ts` |
| Webhook fail-secure | Rechaza webhooks si `T1_WEBHOOK_USER`/`T1_WEBHOOK_PASS` no estan configuradas | `api/webhooks/t1pagos/route.ts` |
| Order lookup limitado | `/api/orders/[id]` solo retorna `id, order_number, status, items, subtotal, total, created_at` — sin nombre/telefono | `api/orders/[id]/route.ts` |
| UUID validation | Valida formato UUID en params antes de query | `api/orders/[id]/route.ts` |
| Logs limpios | Error logs solo incluyen order ID, nunca datos de tarjeta | `api/orders/route.ts` |
| Mensajes de error genericos | No se filtran IDs internos ni nombres de productos en errores | `api/orders/route.ts` |
| Cookie httpOnly + secure | Cookie admin es `httpOnly`, `secure` en produccion, `sameSite: lax` | `api/admin/login/route.ts` |
| Status whitelist | Solo status validos aceptados en PATCH admin | `api/admin/orders/[id]/route.ts` |
| Supabase parameterizado | Todas las queries usan `.eq()` (parameterizado), sin string interpolation | Todos los API routes |
| Tarjeta nunca almacenada | Datos de tarjeta se tokenizan via T1 Pagos, nunca se guardan en DB | `api/orders/route.ts` |
| Variables server-only | `T1_PAGOS_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, etc. no son `NEXT_PUBLIC_` | `.env.example` |

### Pendiente — Prioridad ALTA

| Issue | Riesgo | Solucion propuesta | Esfuerzo |
|-------|--------|--------------------|---------|
| Rate limiting en `/api/orders` | Card testing, DoS, spam de pedidos | Upstash Redis + `@upstash/ratelimit` (5 orders/hora por IP) | Medio |
| Rate limiting en `/api/admin/login` | Brute force de password | Upstash Redis (5 intentos/15 min por IP) | Medio |
| RLS policy demasiado permisiva | Cualquier usuario anonimo puede leer todas las ordenes via Supabase client | Cambiar `USING (true)` a `USING (false)` para anon, o restringir a `service_role` only | Bajo |

### Pendiente — Prioridad MEDIA

| Issue | Riesgo | Solucion propuesta | Esfuerzo |
|-------|--------|--------------------|---------|
| CSRF tokens en admin | Atacante podria cambiar status de ordenes si admin visita sitio malicioso | Generar CSRF token en cookie + validar en cada PATCH | Medio |
| Idempotency key en ordenes | Retry de red puede crear ordenes/cobros duplicados | Header `Idempotency-Key` + columna con UNIQUE constraint | Medio |
| Audit log de acciones admin | No hay registro de quien cambio que | Tabla `audit_logs` con admin_id, order_id, accion, timestamps | Medio |
| Device fingerprint real | UUID random no sirve para deteccion de fraude | Integrar CyberSource SDK (requiere credenciales de T1 Pagos) | Alto |

### Pendiente — Prioridad BAJA

| Issue | Riesgo | Solucion propuesta | Esfuerzo |
|-------|--------|--------------------|---------|
| Password admin en produccion | Podria quedar como `change-me-to-a-secure-password` | Validacion al startup: throw si es valor default en production | Bajo |
| Webhook signature (HMAC) | Basic Auth es base64, no firma criptografica | Implementar HMAC si T1 Pagos lo soporta (verificar docs) | Medio |
| Content Security Policy | Sin CSP headers configurados | Agregar CSP en `next.config.ts` o middleware | Medio |

## Arquitectura de seguridad

```
Cliente (browser)
  |
  | HTTPS (Cloudflare SSL Full Strict)
  |
Vercel Edge (middleware next-intl)
  |
  |-- POST /api/orders
  |     1. Valida campos requeridos
  |     2. Sanitiza nombre/telefono
  |     3. Valida cantidades (1-100)
  |     4. Recalcula precios server-side desde menu-items.ts
  |     5. Inserta orden en Supabase (service_role)
  |     6. Tokeniza tarjeta via T1 Pagos API (nunca almacena PAN)
  |     7. Cobra via T1 Pagos API
  |     8. Actualiza status en DB
  |
  |-- GET /api/orders/[id]
  |     - Valida UUID format
  |     - Retorna solo campos publicos (sin PII)
  |
  |-- POST /api/webhooks/t1pagos
  |     - Verifica Basic Auth (fail-secure)
  |     - Actualiza payment_status en DB
  |
  |-- PATCH /api/admin/orders/[id]
  |     - Verifica cookie admin (HMAC-SHA256)
  |     - Whitelist de status validos
  |
Supabase (service_role key, server-only)
  |
  | RLS: PENDING — restringir SELECT para anon
  |
T1 Pagos API (sandbox/prod)
  |
  | API Key via X-API-Key header (server-only)
```

## Notas para el equipo

- **Nunca** exponer `SUPABASE_SERVICE_ROLE_KEY` o `T1_PAGOS_API_KEY` en variables `NEXT_PUBLIC_`
- **Nunca** loguear datos de tarjeta (PAN, CVV, expiracion) — solo el order ID
- **Nunca** confiar en precios enviados por el cliente — siempre recalcular server-side
- La cookie de admin cambia cuando se actualiza `ADMIN_PASSWORD` (por el hash HMAC) — los admins deben re-loguearse
- El webhook de T1 Pagos es un safety net — el flujo principal actualiza status en el mismo POST de `/api/orders`
