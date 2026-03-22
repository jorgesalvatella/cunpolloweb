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
  "deviceSessionId": "...",
  "paymentMethod": "card",
  "customerEmail": "juan@email.com",
  "orderType": "dine_in",
  "pickupTime": "14:00"
}
```

- `paymentMethod`: `"card"` (default) o `"spei"`
- `tokenId` / `deviceSessionId`: obligatorios solo si `paymentMethod === "card"`
- `customerEmail`: opcional, usado para el cargo SPEI

**Response 200 (tarjeta):**
```json
{
  "orderId": "uuid-...",
  "orderNumber": 1042,
  "redirectUrl": "https://..." // solo si requiere 3D Secure
}
```

**Response 200 (SPEI):**
```json
{
  "orderId": "uuid-...",
  "orderNumber": 1042,
  "speiDetails": {
    "clabe": "646180...",
    "bank": "STP",
    "agreement": "...",
    "name": "CUNPOLLO",
    "due_date": "2026-03-22 18:00:00"
  }
}
```

**Errores:**
- `400` — Datos incompletos, producto no disponible
- `402` — Error de pago (Openpay)
- `429` — Rate limit excedido (10 req/min por IP)
- `500` — Error interno

**Seguridad:**
- Rate limiting: 10 requests por minuto por IP
- Idempotency key: si se envia `idempotencyKey`, previene cargos duplicados
- Origin validation: redirect URL validada contra whitelist
- Batch fetch: items del menu se obtienen en una sola query (no N+1)

**Flujo interno (tarjeta):**
1. Rate limit check por IP
2. Si hay `idempotencyKey`, verifica que no exista orden duplicada
3. Batch fetch de items del menu y validacion server-side de precios
4. INSERT en Supabase (status: pending, payment_status: processing)
5. Cobra con Openpay (tarjeta tokenizada)
6. Si requiere 3D Secure: responde con `redirectUrl`, orden queda en `pending_3ds`
7. Si pago directo: actualiza a `paid`, envia WhatsApp y responde con orderId

**Flujo interno (SPEI):**
1-3. Igual que tarjeta
4. INSERT en Supabase (status: pending, payment_status: pending_spei, payment_method: spei)
5. Crea cargo SPEI en Openpay (`method: "bank_account"`, due_date: +3 horas)
6. Guarda spei_details (CLABE, banco, referencia) en la orden
7. Responde con orderId + speiDetails
8. Cuando Openpay recibe la transferencia, envia webhook → orden pasa a `paid` → WhatsApp

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

## Webhooks

### `POST /api/webhooks/openpay`
Recibe notificaciones de Openpay cuando un cargo cambia de estado. Maneja el caso donde el usuario completa 3D Secure pero nunca regresa a la pagina de confirmacion.

**Autenticacion:** Token via header `Authorization: Bearer <token>` o query param `?token=<token>`. Configurar `OPENPAY_WEBHOOK_TOKEN` en env vars.

**Flujo:**
1. Valida token de autenticacion
2. Extrae `order_id` del payload
3. Verifica estado del cargo directamente con Openpay API (no confia solo en payload)
4. Si `completed`: actualiza orden a `paid`, envia WhatsApp al admin y cliente
5. Si `failed`: actualiza orden a `cancelled`

**Configurar en Openpay dashboard:** `https://cunpollo.com/api/webhooks/openpay?token=<OPENPAY_WEBHOOK_TOKEN>`

---

### `GET /api/webhooks/openpay`
Health check para verificacion del webhook.

**Response 200:** `{ "ok": true, "service": "cunpollo-openpay-webhook" }`

---

## Admin

### `POST /api/admin/login`
Autentica con usuario y contrasena. Devuelve el rol asignado.

**Request:** `{ "username": "cocinero", "password": "..." }`
**Response 200:** `{ "ok": true, "role": "cocina" }` + cookie `cunpollo-admin`
**Response 401:** `{ "error": "Credenciales incorrectas" }`
**Response 429:** `{ "error": "Demasiados intentos. Espera 15 minutos." }` — Max 5 intentos/15 min por IP

**Roles y vistas:**
| Rol | Vista permitida |
|-----|----------------|
| `admin` | `/admin` (dashboard completo) |
| `cocina` | `/admin/cocina` |
| `entrega` | `/admin/entrega` |
| `gerente` | `/admin/gerente` |

El rol `admin` tiene acceso a todas las vistas.

---

### `GET /api/admin/me`
Devuelve el rol del usuario autenticado.

**Response 200:** `{ "role": "cocina" }`
**Response 401:** `{ "error": "No autenticado" }`

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

**Transiciones validas (state machine):**
```
pending → paid, cancelled
paid → preparing, cancelled
preparing → ready, cancelled
ready → picked_up
picked_up → (terminal)
cancelled → (terminal)
```

**Response 200:** Objeto `Order` actualizado
**Response 400:** Estado invalido o transicion no permitida
**Response 401:** No autorizado
**Response 404:** Pedido no encontrado

---

### `POST /api/admin/orders/[id]/refund`
Procesa un reembolso via Openpay API (requiere cookie admin).

**Requisitos:** Orden debe tener `payment_status: "success"` y `payment_reference` valido.

**Response 200:**
```json
{
  "success": true,
  "refundId": "tr_...",
  "orderNumber": 1042
}
```

**Efectos:**
- Procesa refund en Openpay
- Actualiza orden a `payment_status: "refunded"`, `status: "cancelled"`
- Registra accion en audit log

**Response 400:** Pago no exitoso o sin referencia
**Response 401:** No autorizado
**Response 404:** Pedido no encontrado
**Response 500:** Error al procesar reembolso en Openpay

---

## Cron Jobs

### `GET /api/cron/timeout-orders`
Verifica ordenes en `processing` o `pending_3ds` por mas de 30 minutos. Para cada una, consulta Openpay y resuelve el estado.

**Autenticacion:** `Authorization: Bearer <CRON_SECRET>` o `?token=<CRON_SECRET>`

**Frecuencia:** Cada 15 minutos (configurado en `vercel.json`)

**Response 200:**
```json
{
  "processed": 2,
  "results": [
    { "id": "uuid", "order_number": 10, "action": "marked_paid" },
    { "id": "uuid", "order_number": 11, "action": "timeout_cancelled" }
  ]
}
```

**Acciones posibles:**
- `marked_paid` — Openpay confirmo pago exitoso
- `marked_failed` — Openpay reporto pago fallido
- `timeout_cancelled` — Sin respuesta despues de 30 min, cancelado
- `timeout_no_ref` — Sin referencia de pago, cancelado

---

## Menu (Datos publicos desde Supabase)

### `GET /api/menu`
Devuelve categorias activas, items disponibles y promociones vigentes desde la base de datos Supabase. No requiere autenticacion.

**Response 200:**
```json
{
  "categories": [
    { "id": "especialidad", "name": { "es": "...", "en": "..." }, "icon": "...", "order": 0 }
  ],
  "items": [
    {
      "id": "pollo-entero",
      "categoryId": "especialidad",
      "name": { "es": "...", "en": "..." },
      "description": { "es": "...", "en": "..." },
      "price": 219,
      "image": "https://...",
      "tags": ["popular"],
      "available": true,
      "discountPercent": null,
      "discountFixed": null
    }
  ],
  "promotions": [
    {
      "id": "uuid-...",
      "name": "10% off pickup",
      "descriptionEs": "...",
      "descriptionEn": "...",
      "discountType": "percent",
      "discountValue": 10,
      "targetOrderType": "pickup",
      "minOrderAmount": 200,
      "active": true,
      "startsAt": null,
      "endsAt": null
    }
  ]
}
```

**Filtros aplicados server-side:**
- Categorias: `active = true`, ordenadas por `sort_order`
- Items: `available = true`, ordenados por `sort_order`
- Promociones: `active = true`, dentro de rango de fechas (`starts_at`/`ends_at`)

**Cache:** `public, s-maxage=60, stale-while-revalidate=300`

**Response 500:** `{ "error": "Error loading menu data" }`

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

## Menu (Admin)

### `GET /api/admin/menu`
Lista todos los items del menu y categorias, incluyendo no disponibles/inactivos (requiere cookie admin).

**Response 200:**
```json
{
  "items": [...],
  "categories": [...]
}
```

Ambos arrays ordenados por `sort_order` ASC.

---

### `POST /api/admin/menu`
Crea un nuevo item del menu (requiere cookie admin).

**Request:**
```json
{
  "id": "nuevo-producto",
  "name_es": "Nombre en espanol",
  "name_en": "English name",
  "description_es": "Descripcion",
  "description_en": "Description",
  "price": 150,
  "category_id": "especialidad",
  "image": "https://...",
  "tags": ["popular"],
  "available": true,
  "is_promo": false
}
```

**Campos requeridos:** `id` (slug), `name_es`, `category_id`, `price`
**Response 201:** Item creado
**Response 400:** Campos requeridos faltantes o ID invalido
**Response 409:** Ya existe un producto con ese ID

---

### `PUT /api/admin/menu`
Actualiza un item del menu (requiere cookie admin). Solo actualiza los campos proporcionados.

**Request:** `{ "id": "pollo-entero", "price": 250, "available": false }`
**Response 200:** Item actualizado
**Response 400:** ID faltante o sin campos
**Response 401:** No autorizado

---

### `DELETE /api/admin/menu?id=pollo-entero`
Elimina un item del menu (requiere cookie admin).

**Response 200:** `{ "success": true }`
**Response 400:** ID faltante
**Response 401:** No autorizado

---

### `POST /api/admin/upload`
Sube una imagen al Vercel Blob Storage (requiere cookie admin). La imagen se optimiza automaticamente.

**Request:** `multipart/form-data` con campo `file` (imagen)
**Procesamiento:**
- Valida tipo de archivo (solo imagenes) y tamano (max 10MB)
- Redimensiona a max 1620x1080px (sin deformar, sin agrandar)
- Convierte a WebP con calidad 80
- Sube a Vercel Blob Storage en carpeta `menu/`

**Response 200:**
```json
{
  "url": "https://igwu4bqzucdjjkup.public.blob.vercel-storage.com/menu/nombre-1234567890.webp",
  "originalSize": 3145728,
  "optimizedSize": 87654
}
```

**Response 400:** No se envio archivo, tipo invalido, o muy grande
**Response 401:** No autorizado

---

### `GET /api/admin/menu/categories`
Lista todas las categorias incluyendo inactivas (requiere cookie admin).

**Response 200:** Array de categorias ordenadas por `sort_order` ASC.

---

### `PUT /api/admin/menu/categories`
Actualiza una categoria (requiere cookie admin). Solo actualiza los campos proporcionados.

**Request:** `{ "id": "pollos", "active": false }`
**Response 200:** Categoria actualizada
**Response 400:** ID faltante o sin campos
**Response 401:** No autorizado

---

## Promociones (Admin)

### `GET /api/admin/promotions`
Lista todas las promociones incluyendo inactivas (requiere cookie admin).

**Response 200:** Array de promociones ordenadas por `created_at` DESC.

---

### `POST /api/admin/promotions`
Crea una nueva promocion (requiere cookie admin).

**Request:**
```json
{
  "name": "10% descuento pickup",
  "description_es": "10% de descuento en pedidos para recoger",
  "description_en": "10% off pickup orders",
  "discount_type": "percentage",
  "discount_value": 10,
  "target_order_type": "pickup",
  "min_order_amount": 200,
  "active": true,
  "starts_at": "2026-03-17T00:00:00Z",
  "ends_at": "2026-04-17T00:00:00Z"
}
```

**Campos requeridos:** `name`, `discount_type`, `discount_value`, `target_order_type`
**Response 201:** Promocion creada
**Response 400:** Campos requeridos faltantes

---

### `PUT /api/admin/promotions`
Actualiza una promocion (requiere cookie admin). Solo actualiza los campos proporcionados.

**Request:** `{ "id": "uuid-...", "active": false }`
**Response 200:** Promocion actualizada
**Response 400:** ID faltante o sin campos

---

### `DELETE /api/admin/promotions/[id]`
Elimina una promocion por UUID (requiere cookie admin).

**Response 200:** `{ "success": true }`
**Response 401:** No autorizado

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
