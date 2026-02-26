# API Routes

Base: `/api`

Todas las rutas API están excluidas del middleware de i18n.

---

## Pedidos

### `POST /api/orders`
Crea una orden y procesa el pago.

**Request body:**
```json
{
  "items": [
    { "menuItemId": "pollo-entero", "quantity": 2 }
  ],
  "customerName": "Juan Pérez",
  "customerPhone": "+529981234567",
  "card": {
    "number": "4111111111111111",
    "expMonth": "12",
    "expYear": "2026",
    "cvv": "123",
    "holderName": "JUAN PEREZ"
  }
}
```

**Response 200:**
```json
{
  "orderId": "uuid-...",
  "orderNumber": 1042
}
```

**Errores:**
- `400` — Datos incompletos, producto no disponible, error de tarjeta, error de cobro
- `500` — Error interno

**Flujo interno:**
1. Valida items contra menu (recalcula precios server-side)
2. INSERT en Supabase (status: pending)
3. Tokeniza tarjeta via ClaroPagos (`POST /v1/tarjeta`)
4. Crea cargo con token (`POST /v1/cargo`)
5. Si OK → UPDATE a paid + WhatsApp notify (fire-and-forget) → responde con orderId
6. Si falla → UPDATE a cancelled/failed, responde con error

---

### `GET /api/orders/[id]`
Consulta una orden por UUID (sin auth, el UUID actúa como token).

**Response 200:** Objeto `Order` completo
**Response 404:** `{ "error": "Pedido no encontrado" }`

---

## Webhook

### `POST /api/webhooks/t1pagos`
Safety net para eventos asincronos de ClaroPagos (T1 Pagos).

**Eventos manejados:**
- `cargo.exitoso` → Actualiza orden a paid/success + WhatsApp notify
- `cargo.fallido` → Actualiza orden a cancelled/failed
- `cargo.cancelado` → Actualiza orden a cancelled/failed

**Payload:** Estructura `WebhookPayload` con `tipo`, `datos.id`, `datos.pedido.id_externo`

Siempre responde `200 { "ok": true }`.

---

## Admin

### `POST /api/admin/login`
Autentica al admin con contraseña.

**Request:** `{ "password": "..." }`
**Response 200:** `{ "ok": true }` + cookie `cunpollo-admin`
**Response 401:** `{ "error": "Contraseña incorrecta" }`

---

### `GET /api/admin/orders`
Lista órdenes (requiere cookie admin).

**Query params:**
- `status` (opcional) — Filtrar por status (paid, preparing, ready, etc.)

**Response 200:** Array de `Order[]` (máx 50, ordenados por created_at DESC)
**Response 401:** `{ "error": "No autorizado" }`

---

### `PATCH /api/admin/orders/[id]`
Cambia el status de una orden (requiere cookie admin).

**Request:** `{ "status": "preparing" }`
**Status válidos:** pending, paid, preparing, ready, picked_up, cancelled
**Response 200:** Objeto `Order` actualizado
**Response 400/401/500:** Error
