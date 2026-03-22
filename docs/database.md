# Base de Datos — Supabase

## Proyecto
- **Ref**: `hsdimsfuvdxlpeshhfzm`
- **URL**: `https://hsdimsfuvdxlpeshhfzm.supabase.co`
- **Schema**: `supabase/schema.sql` (aplicado en producción 2026-02-26)

## Tabla: `orders`

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `id` | UUID | `gen_random_uuid()` | PK |
| `order_number` | SERIAL | auto-increment | Número visible al cliente (#1, #2...) |
| `customer_name` | TEXT | NOT NULL | Nombre del cliente |
| `customer_phone` | TEXT | NOT NULL | Teléfono del cliente |
| `items` | JSONB | NOT NULL | Array de OrderItem (snapshot desnormalizado) |
| `subtotal` | INTEGER | NOT NULL | Subtotal en pesos MXN (no centavos) |
| `total` | INTEGER | NOT NULL | Total en pesos MXN |
| `status` | TEXT | `'pending'` | Estado del pedido |
| `payment_reference` | TEXT | NULL | ID del cargo en T1 Pagos |
| `payment_status` | TEXT | `'pending'` | Estado del pago |
| `order_type` | TEXT | `'pickup'` | Tipo: `dine_in` o `pickup` |
| `pickup_time` | TEXT | NULL | Hora solicitada (ej: "14:00", "18:30") |
| `created_at` | TIMESTAMPTZ | `NOW()` | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | `NOW()` | Última actualización (trigger automático) |

### Formato de `items` (JSONB)
```json
[
  {
    "menuItemId": "pollo-entero",
    "name": "Pollo Entero Rostizado",
    "quantity": 2,
    "unitPrice": 189,
    "lineTotal": 378
  }
]
```

### Flujo de `status`
```
pending → paid → preparing → ready → picked_up
                                    ↘ cancelled (desde cualquier estado)
```

### Columnas de metodo de pago

| Columna | Tipo | Default | Descripcion |
|---------|------|---------|-------------|
| `payment_method` | TEXT | `'card'` | Metodo de pago: `card` o `spei` |
| `spei_details` | JSONB | NULL | Datos SPEI: `{clabe, bank, agreement, name, due_date}` |

### Flujo de `payment_status`
```
Tarjeta: pending → processing → pending_3ds → success / failed
SPEI:    pending_spei → success (via webhook cuando se recibe la transferencia)
                      → failed (si vence el plazo)
```

## Indices
- `idx_orders_status` — Para filtrar por status en admin
- `idx_orders_created_at` — Para ordenar por fecha DESC
- `idx_orders_payment_status` — Para consultas de pago

## Trigger
- `orders_updated_at` — Actualiza `updated_at` automáticamente en cada UPDATE

## Realtime
- Tabla `orders` agregada a `supabase_realtime` publication
- Usado por el dashboard admin para actualizaciones en vivo

## RLS (Row Level Security)
- Service role: acceso completo (usado por API routes del server)
- Anon: lectura pública (para que el cliente consulte su orden por UUID)

## Tabla: `categories`

Categorias del menu.

| Columna | Tipo | Default | Descripcion |
|---------|------|---------|-------------|
| `id` | TEXT | PK | Slug unico (ej: "especialidad") |
| `name_es` | TEXT | NOT NULL | Nombre en espanol |
| `name_en` | TEXT | NOT NULL | Nombre en ingles |
| `icon` | TEXT | `''` | Emoji de la categoria |
| `sort_order` | INTEGER | `0` | Orden de aparicion |
| `active` | BOOLEAN | `true` | Si se muestra al cliente |
| `created_at` | TIMESTAMPTZ | `now()` | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | `now()` | Ultima actualizacion (trigger) |

**Indices:** `idx_categories_sort` en `sort_order`
**RLS:** Lectura publica, escritura solo `service_role`
**Realtime:** Habilitado

---

## Tabla: `menu_items`

Productos del menu.

| Columna | Tipo | Default | Descripcion |
|---------|------|---------|-------------|
| `id` | TEXT | PK | Slug unico (ej: "pollo-rostizado") |
| `category_id` | TEXT | FK → categories(id) | Categoria del producto |
| `name_es` | TEXT | NOT NULL | Nombre en espanol |
| `name_en` | TEXT | NOT NULL | Nombre en ingles |
| `description_es` | TEXT | NOT NULL | Descripcion en espanol |
| `description_en` | TEXT | NOT NULL | Descripcion en ingles |
| `price` | INTEGER | NOT NULL | Precio en pesos MXN |
| `image` | TEXT | NOT NULL | URL de imagen (Vercel Blob) |
| `tags` | TEXT[] | `'{}'` | Tags: popular, spicy, new |
| `available` | BOOLEAN | `true` | Si se muestra al cliente |
| `is_promo` | BOOLEAN | `false` | Item solo display (sin agregar al carrito) |
| `discount_percent` | INTEGER | NULL | Descuento porcentual (ej: 10 = 10%) |
| `discount_fixed` | INTEGER | NULL | Descuento fijo en pesos (ej: 50 = -$50) |
| `sort_order` | INTEGER | `0` | Orden de aparicion |
| `created_at` | TIMESTAMPTZ | `now()` | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | `now()` | Ultima actualizacion (trigger) |

**Logica de descuento:** `discount_fixed` tiene prioridad sobre `discount_percent`. Precio efectivo = `price - discount_fixed` o `price * (1 - discount_percent/100)`.

**Indices:** `idx_menu_items_category`, `idx_menu_items_available`, `idx_menu_items_sort`
**RLS:** Lectura publica, escritura solo `service_role`
**Realtime:** Habilitado

---

## Tabla: `promotions`

Promociones a nivel de orden (descuentos generales por tipo de pedido).

| Columna | Tipo | Default | Descripcion |
|---------|------|---------|-------------|
| `id` | UUID | `gen_random_uuid()` | PK |
| `name` | TEXT | NOT NULL | Nombre interno (ej: "5% desc. para llevar") |
| `description_es` | TEXT | `''` | Texto visible al cliente (espanol) |
| `description_en` | TEXT | `''` | Texto visible al cliente (ingles) |
| `discount_type` | TEXT | NOT NULL | `'percent'` o `'fixed'` |
| `discount_value` | NUMERIC(10,2) | NOT NULL | Valor del descuento (% o pesos) |
| `target_order_type` | TEXT | NOT NULL | `'pickup'`, `'dine_in'`, o `'all'` |
| `min_order_amount` | INTEGER | `0` | Monto minimo de subtotal para aplicar |
| `active` | BOOLEAN | `false` | Si esta activa |
| `starts_at` | TIMESTAMPTZ | NULL | Inicio programado (opcional) |
| `ends_at` | TIMESTAMPTZ | NULL | Fin programado (opcional) |
| `created_at` | TIMESTAMPTZ | `now()` | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | `now()` | Ultima actualizacion (trigger) |

**Logica:** Si hay multiples promos activas para el mismo tipo de pedido, el servidor aplica la que da mayor descuento. Solo se aplica una promo por orden.

**Indices:** `idx_promotions_active`
**RLS:** Lectura publica, escritura solo `service_role`

---

## Columnas de descuento en `orders`

| Columna | Tipo | Default | Descripcion |
|---------|------|---------|-------------|
| `discount_amount` | INTEGER | `0` | Descuento aplicado en pesos |
| `discount_description` | TEXT | NULL | Nombre de la promo aplicada |
| `promotion_id` | UUID | NULL | FK → promotions(id), promo utilizada |
| `guests` | INTEGER | NULL | Numero de personas (solo dine_in) |

---

## Tabla: `contacts`

Contactos de WhatsApp para envio de promociones.

| Columna | Tipo | Default | Descripcion |
|---------|------|---------|-------------|
| `id` | UUID | `gen_random_uuid()` | PK |
| `name` | TEXT | NOT NULL | Nombre del contacto |
| `phone` | TEXT | NOT NULL, UNIQUE | Telefono WhatsApp |
| `source` | TEXT | `'manual'` | Origen: `manual` o `order` |
| `active` | BOOLEAN | `true` | Soft delete flag |
| `created_at` | TIMESTAMPTZ | `now()` | Fecha de creacion |

**Indices:** `idx_contacts_active` en columna `active`

---

## Tabla: `campaigns`

Registro de campanas de WhatsApp enviadas.

| Columna | Tipo | Default | Descripcion |
|---------|------|---------|-------------|
| `id` | UUID | `gen_random_uuid()` | PK |
| `template_name` | TEXT | NOT NULL | Nombre del template de Meta |
| `message_preview` | TEXT | NOT NULL | Vista previa del mensaje |
| `recipients_count` | INTEGER | `0` | Total de destinatarios |
| `sent_count` | INTEGER | `0` | Mensajes enviados exitosamente |
| `failed_count` | INTEGER | `0` | Mensajes fallidos |
| `status` | TEXT | `'draft'` | Estado: draft, sending, completed, failed |
| `created_at` | TIMESTAMPTZ | `now()` | Fecha de creacion |

---

## Como aplicar (referencia)
Schema ya aplicado en producción. Para un proyecto nuevo:
1. Ir al SQL Editor en el dashboard de Supabase
2. Pegar el contenido de `supabase/schema.sql`
3. Ejecutar

O via Supabase MCP:
```
apply_migration(name: "create_orders_table", query: <contenido de schema.sql>)
```
