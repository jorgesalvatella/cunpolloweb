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
  "customerPhone": "+529981234567",
  "tokenId": "tok_...",
  "deviceSessionId": "..."
}
```

**Response 200:**
```json
{
  "orderId": "uuid-...",
  "orderNumber": 1042,
  "redirectUrl": "https://..." // solo si requiere 3D Secure
}
```

**Errores:**
- `400` — Datos incompletos, producto no disponible
- `402` — Error de pago (Openpay)
- `500` — Error interno

**Flujo interno:**
1. Valida items contra menu (recalcula precios server-side)
2. INSERT en Supabase (status: pending, payment_status: processing)
3. Cobra con Openpay (tarjeta tokenizada)
4. Si requiere 3D Secure: responde con `redirectUrl`, orden queda en `pending_3ds`
5. Si pago directo: actualiza a `paid`, envia WhatsApp y responde con orderId

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

### `POST /api/orders/[id]/verify`
Verifica el estado del pago con Openpay despues de 3D Secure. Llamado automaticamente por la pagina de confirmacion cuando detecta parametros de retorno 3DS.

**Response 200:**
```json
{
  "status": "paid" | "failed" | "pending" | "unknown"
}
```

Si el cobro fue exitoso, actualiza la orden a `paid` y envia notificacion WhatsApp.

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

---

## Catalogo de Productos (Feed para Meta/WhatsApp)

### `GET /api/catalog/feed`
Genera un feed XML de productos en formato Atom + Google Product Data compatible con Meta Commerce Manager. Se usa para sincronizar automaticamente el catalogo de WhatsApp Business.

**Response:** XML (Content-Type: `application/xml`)

**Productos incluidos:** Todos los items activos del menu, excluyendo:
- Items con `promo: true` (promociones solo en restaurante)
- Item de prueba (`prueba-pasarela`)

**Campos por producto:**
- `g:id` — ID unico del producto
- `g:title` — Nombre en espanol
- `g:description` — Descripcion en espanol
- `g:price` — Precio en MXN
- `g:image_link` — URL de imagen
- `g:product_type` — Categoria
- `g:availability` — Siempre "in stock" (filtrado por `available`)
- `g:brand` — CUNPOLLO

**Configuracion en Meta Commerce Manager:**
1. Ir a Commerce Manager > Catalogo > Origenes de datos
2. Seleccionar "Data Feed" > "Scheduled Feed"
3. URL: `https://cunpollo.com/api/catalog/feed`
4. Frecuencia: diaria o cada hora

**Cache:** 1 hora (`s-maxage=3600`)

---

## Contactos (WhatsApp Promos)

### `GET /api/admin/contacts`
Lista contactos (requiere cookie admin).

**Query params:**
- `active=true` (opcional) — Solo contactos activos

**Response 200:** Array de contactos

---

### `POST /api/admin/contacts`
Agrega contacto o importa de pedidos (requiere cookie admin).

**Agregar manual:**
```json
{ "name": "Juan", "phone": "+529981234567" }
```

**Importar de pedidos:**
```json
{ "importFromOrders": true }
```

**Response 201:** Contacto creado
**Response 409:** Telefono duplicado

---

### `DELETE /api/admin/contacts/[id]`
Desactiva un contacto (soft delete, requiere cookie admin).

**Response 200:** `{ "ok": true }`

---

## Campanas WhatsApp

### `GET /api/admin/campaigns`
Lista historial de campanas (requiere cookie admin).

**Response 200:** Array de campanas

---

### `POST /api/admin/campaigns`
Crea y envia una campana (requiere cookie admin).

**Request:**
```json
{
  "templateName": "lanzamiento_delivery",
  "contentSid": "HXXXXXXXXXXX",
  "messagePreview": "Texto de referencia...",
  "contentVariables": { "1": "CUNPOLLO" },
  "contactIds": ["uuid-1", "uuid-2"]
}
```

Si `contactIds` no se envia, se envia a todos los contactos activos.

**Response 200:**
```json
{
  "id": "uuid-...",
  "sent": 10,
  "failed": 1,
  "status": "completed"
}
```
