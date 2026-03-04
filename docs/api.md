# API Routes

Base: `/api`

Todas las rutas API están excluidas del middleware de i18n.

---

## Pedidos

### `POST /api/orders`
Crea una orden.

**Request body:**
```json
{
  "items": [
    { "menuItemId": "pollo-entero", "quantity": 2 }
  ],
  "customerName": "Juan Perez",
  "customerPhone": "+529981234567"
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
- `400` — Datos incompletos, producto no disponible
- `500` — Error interno

**Flujo interno:**
1. Valida items contra menu (recalcula precios server-side)
2. INSERT en Supabase (status: pending)
3. TODO: Procesamiento de pago con OpenPay
4. Responde con orderId

---

### `GET /api/orders/[id]`
Consulta una orden por UUID (sin auth, el UUID actua como token).

**Response 200:**
```json
{
  "id": "uuid-...",
  "order_number": 10,
  "status": "paid",
  "items": [...],
  "subtotal": 100,
  "total": 100,
  "created_at": "2026-03-01T...",
  "customer_name": "Juan Perez"
}
```

**Campos excluidos** (seguridad): `customer_phone`, `payment_reference`, `payment_status`

**Response 404:** `{ "error": "Pedido no encontrado" }`

---

## Admin

### `POST /api/admin/login`
Autentica al admin con contrasena.

**Request:** `{ "password": "..." }`
**Response 200:** `{ "ok": true }` + cookie `cunpollo-admin`
**Response 401:** `{ "error": "Contrasena incorrecta" }`

---

### `GET /api/admin/orders`
Lista ordenes (requiere cookie admin).

**Query params:**
- `status` (opcional) — Filtrar por status (paid, preparing, ready, etc.)

**Response 200:** Array de `Order[]` (max 50, ordenados por created_at DESC)
**Response 401:** `{ "error": "No autorizado" }`

---

### `PATCH /api/admin/orders/[id]`
Cambia el status de una orden (requiere cookie admin).

**Request:** `{ "status": "preparing" }`
**Status validos:** pending, paid, preparing, ready, picked_up, cancelled
**Response 200:** Objeto `Order` actualizado
**Response 400/401/500:** Error
