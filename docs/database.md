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

### Flujo de `payment_status`
```
pending → processing → success
                     → failed
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

## Cómo aplicar (referencia)
Schema ya aplicado en producción. Para un proyecto nuevo:
1. Ir al SQL Editor en el dashboard de Supabase
2. Pegar el contenido de `supabase/schema.sql`
3. Ejecutar

O via Supabase MCP:
```
apply_migration(name: "create_orders_table", query: <contenido de schema.sql>)
```
