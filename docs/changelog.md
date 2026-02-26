# Changelog

## 2026-02-26 — Sistema de Pedidos "Paga y Recoge"

### Fase 0: Migración de Infraestructura
- Eliminado `output: "export"` de `next.config.ts` (ya no es static site)
- Reactivado middleware de next-intl con matcher que excluye `/api` y `/admin`
- Eliminado `generateStaticParams` del locale layout
- Instalado `@supabase/supabase-js`

### Fase 1: Carrito de Compras
- `CartContext` con estado real + persistencia en localStorage
- `CartFloatingButton` — botón flotante bottom-right con badge animado
- `CartItemRow` — fila de item con controles +/- y eliminar
- Página `/cart` con lista, resumen, y acciones
- `MenuItemModal` actualizado con selector de cantidad y botón "Agregar al Pedido"
- `Header` actualizado con icono de carrito + badge (desktop y mobile)
- Feature flag `ORDERING_ENABLED` activado
- Traducciones: namespaces `cart`, `checkout`, `confirmation` en ES y EN

### Fase 2: Supabase Setup
- Clientes Supabase: `client.ts` (browser) y `server.ts` (service_role)
- Schema SQL: tabla `orders` con indices, trigger updated_at, RLS, realtime
- `.env.example` con todas las variables requeridas

### Fase 3: T1 Pagos + API Routes
- `t1pagos.ts` — wrapper server-side para tokenizar y cobrar
- `POST /api/orders` — crear orden + procesar pago (validación server-side)
- `GET /api/orders/[id]` — consultar orden por UUID
- `POST /api/webhooks/t1pagos` — webhook de safety net
- `CheckoutForm` — formulario completo (datos personales + tarjeta)
- `CardInput` — inputs con formateo automático de número, vencimiento, CVV

### Fase 4: Confirmación
- Página `/confirmation/[id]` con animación de checkmark (Framer Motion)
- Número de orden, mensaje "~20 min", resumen, dirección, botones de acción

### Fase 5: Dashboard Admin
- Login por contraseña simple con cookie HTTP-only (`/admin/login`)
- Dashboard con lista real-time de pedidos (Supabase Realtime)
- Tarjetas de pedido con progresión de status y cancelación
- API: login, listar órdenes, cambiar status (todas con auth)
- Layout admin separado (sin Header/Footer, noindex)

### Fase 6: Tipos actualizados
- `OrderItem` con snapshot desnormalizado (nombre, precios)
- `PaymentStatus` type
- `CreateOrderRequest` / `CreateOrderResponse`
- `OrderStatus` alineado al flujo real (paid, preparing, ready, picked_up)

### Documentación
- `CLAUDE.md` con regla de actualización obligatoria de docs
- Carpeta `docs/` con architecture, features, api, database, env-vars, setup, changelog
- Memory files actualizados: `MEMORY.md`, `ordering-system.md`

### Menú Real con Datos de Rappi
- Menú actualizado de 16 a 33 items con precios reales
- 7 categorías: especialidad, lo-mero-bueno, antojitos, acompañamientos, bebidas, postres, combos
- 17 imágenes de productos descargadas de Rappi CDN, convertidas a WebP (600x600)
- Imágenes almacenadas en `public/images/menu/`
- Reemplazados placeholders emoji por `next/image` en: MenuItemCard, MenuItemModal, MenuPreview, CartItemRow
- Campo `image` en tipo `MenuItem` cambiado de opcional a requerido
- OG image configurada para social sharing (1200x630)

### Deploy e Infraestructura
- Supabase schema aplicado via MCP (tabla `orders` con RLS, Realtime, triggers)
- Deploy a Vercel con env vars configuradas (production)
- Dominio `cunpollo.com` migrado de Cloudflare Pages a Vercel
- DNS en Cloudflare con proxy ON + SSL Full (Strict)
- Repo GitHub conectado a Vercel para auto-deploy en push a `main`
- `.mcp.json` excluido de git (contiene tokens)
- Secret scanner actualizado (excluir pnpm-lock.yaml falsos positivos)
