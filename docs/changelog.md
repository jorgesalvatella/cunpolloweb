# Changelog

## 2026-02-28 — Migracion de imagenes del menu a Vercel Blob Storage

### Objetivo
Mover las 33 imagenes del menu (`.webp`) de `public/images/menu/` a Vercel Blob Storage para entrega via CDN edge global y desacoplar las imagenes del bundle de deploy.

### Archivos modificados
- `package.json` — Agregado `@vercel/blob` como dependencia
- `next.config.ts` — Agregado `images.remotePatterns` para `*.public.blob.vercel-storage.com`
- `src/data/menu-items.ts` — Reemplazadas 39 rutas locales `/images/menu/*.webp` con URLs de Vercel Blob
- `.env.example` — Agregado placeholder `BLOB_READ_WRITE_TOKEN`
- `docs/env-vars.md` — Documentada nueva variable
- `docs/changelog.md` — Este entry

### Archivos nuevos
- `scripts/upload-menu-images.ts` — Script para subir imagenes a Vercel Blob

### Archivos eliminados
- `public/images/menu/` — 33 archivos `.webp` eliminados del repo (ahora en Blob Storage)

### Notas
- Blob Store ID: `store_IGWU4bQZUcdjJKUP`
- URL base: `https://igwu4bqzucdjjkup.public.blob.vercel-storage.com/menu/`
- `BLOB_READ_WRITE_TOKEN` solo necesario para el script de upload, no en runtime
- Next.js Image optimization funciona con las URLs remotas via `remotePatterns`

## 2026-02-27 — UX/UI Overhaul: Sales Conversion & Clarity

### Objetivo
Reorientar toda la UX hacia la conversion de ventas. CTAs activos ("Pedir Ahora" en vez de "Ver Menu"), quick-add en tarjetas de menu, carrito flotante con total, copy orientado a accion, y consistencia visual (rounded-full buttons).

### Archivos modificados
- `src/messages/es.json` — Nuevos keys: hero.ctaOrder, hero.trustLine, video.*, nav.order, cart.pickupEstimate, checkout.step*, checkout.securePayment, location.orderPickup/open/closed, footer.orderNow/weekdays/weekends, menu.added. Actualizados: menuPreview.*, cta.*
- `src/messages/en.json` — Mismos keys en ingles
- `src/components/landing/HeroSection.tsx` — CTA "Pedir Ahora" (si ordering enabled), trust line "Listo en ~20 min", boton py-4 text-lg
- `src/components/layout/Header.tsx` — Boton "Pedir" pill en nav (rojo on scroll, blanco on transparent). En mobile menu con fondo dorado
- `src/components/menu/MenuItemCard.tsx` — Boton "+" quick-add dorado (bottom-right imagen), checkmark verde al agregar. Descripcion visible en mobile (line-clamp-1)
- `src/components/landing/MenuPreview.tsx` — Titulo "Los Mas Pedidos", CTA "Ver Todo y Pedir" con bg-red-600 rounded-full
- `src/components/landing/CTASection.tsx` — Titulo "Pide y Recoge en 20 Min", botones rounded-full
- `src/components/cart/CartFloatingButton.tsx` — Muestra "$total MXN" + badge count, pill mas ancha
- `src/app/[locale]/cart/page.tsx` — Pickup estimate, emoji reemplazado por SVG, checkout button rounded-full py-4 text-lg, continue shopping como text link
- `src/components/landing/VideoSection.tsx` — Heading "Asi Preparamos tu Pollo" + subtitle
- `src/components/landing/LocationSection.tsx` — Boton "Pide para Recoger" dorado, indicador abierto/cerrado (13:00-21:00), botones rounded-full
- `src/components/layout/Footer.tsx` — Boton "Hacer Pedido" dorado, texto Lun-Vie/Sab-Dom internacionalizado
- `src/app/[locale]/checkout/page.tsx` — Progress steps (Menu > Carrito > Pago), botones rounded-full
- `src/components/checkout/CheckoutForm.tsx` — Boton rounded-full, "Pago seguro con encriptacion SSL"
- `src/components/menu/MenuItemModal.tsx` — Boton rounded-full
- `src/components/menu/CategoryTabs.tsx` — Tap targets py-2.5 → py-3
- `src/components/cart/CartItemRow.tsx` — Quantity buttons w-8 h-8 → w-10 h-10

## 2026-02-27 — Migracion a T1 Pagos API v2

### Corregido: `src/lib/t1pagos.ts`
- Base URL: `https://api.sandbox.t1pagos.com/v2` (antes: `claropagos.com/v1`)
- Auth: `X-API-Key` header (antes: `Authorization: Bearer`)
- Env var: `T1_PAGOS_API_KEY` (antes: `T1_PAGOS_BEARER_TOKEN`)
- Tokenizacion response: `data.tarjeta.token` (nested, antes: `data.token`)
- Cargo response: `data.cargo.id` (nested, antes: `data.id`)
- Monto como string (antes: number)
- Device fingerprint ahora requerido

### Corregido: `src/app/api/webhooks/t1pagos/route.ts`
- Campo evento: `tipo_evento` (antes: `tipo`)
- Estructura datos: `data.cargo` (antes: `datos`)
- Agregada verificacion Basic HTTP auth (`T1_WEBHOOK_USER` / `T1_WEBHOOK_PASS`)

### Archivos modificados
- `src/types/order.ts` — `deviceFingerprint` ahora requerido
- `src/app/api/orders/route.ts` — valida `deviceFingerprint` como campo requerido
- `src/components/checkout/CheckoutForm.tsx` — genera device fingerprint (UUID placeholder, TODO: CyberSource SDK)
- `.env.example` — variables renombradas y nuevas (webhook auth)

### Documentacion actualizada
- `docs/env-vars.md` — variables T1 Pagos v2, webhook auth
- `docs/api.md` — endpoints v2, payload webhook v2, basic auth
- `docs/features.md` — estado actualizado, pendientes actualizados

## 2026-02-26 — Integracion real T1 Pagos (ClaroPagos API)

### Reescrito: `src/lib/t1pagos.ts`
- Base URL corregida: `https://api.sandbox.claropagos.com/v1` (antes era URL inventada)
- Auth: Bearer Token via header `Authorization` (antes era `X-API-Key`)
- Tokenizacion (`POST /v1/tarjeta`): campos reales `pan`, `expiracion_mes`, `expiracion_anio`, `cvv2`, `nombre`
- Cargo (`POST /v1/cargo`): campos reales `monto`, `moneda`, `descripcion`, `metodo_pago`, `tarjeta.token`, `pedido`, `capturar`
- Monto en pesos MXN (no centavos como Stripe)
- Response wrapper `{ status, data, http_code, error }` correctamente parseado
- Device fingerprint (CyberSource) opcional en `pedido.device_fingerprint`

### Reescrito: `src/app/api/webhooks/t1pagos/route.ts`
- Payload tipado segun docs reales de ClaroPagos
- Evento `tipo` (antes `evento`), datos en `datos` con estructura real
- Order ID via `datos.pedido.id_externo` (fallback a `datos.orden_id`)
- Maneja `cargo.exitoso`, `cargo.fallido`, `cargo.cancelado`
- Integra WhatsApp notify en webhook exitoso

### Archivos modificados
- `src/app/api/orders/route.ts` — Monto en pesos (no centavos), `orderId` en vez de `reference`, `deviceFingerprint` opcional
- `src/types/order.ts` — `deviceFingerprint?: string` en `CreateOrderRequest`
- `.env.example` — `T1_PAGOS_BEARER_TOKEN` (antes `T1_PAGOS_API_KEY`), URL corregida

### Documentacion actualizada
- `docs/env-vars.md` — Variable renombrada, URLs corregidas
- `docs/setup.md` — Instrucciones actualizadas para ClaroPagos
- `docs/api.md` — Flujo interno y webhook actualizados
- `docs/features.md` — Detalles de integracion real
- `docs/architecture.md` — Descripcion actualizada

## 2026-02-26 — Notificaciones WhatsApp via Twilio

### Nuevo archivo: `src/lib/twilio.ts`
- Wrapper server-only para Twilio REST API (sin SDK, fetch directo con Basic Auth)
- `notifyCustomerStatusChange(order)` — mensaje al cliente segun status del pedido
- `notifyAdminNewOrder(order)` — resumen del pedido nuevo al equipo
- Fire-and-forget: errores se loguean, nunca bloquean el flujo
- Soporta multiples numeros admin via `ADMIN_WHATSAPP_PHONES` (separados por coma)
- `Promise.allSettled` para envio a multiples admins

### Archivos modificados
- `src/lib/constants.ts` — Nuevo feature flag `WHATSAPP_NOTIFICATIONS: true`
- `src/app/api/orders/route.ts` — Notifica cliente + admin despues del pago exitoso
- `src/app/api/admin/orders/[id]/route.ts` — Notifica cliente en cambio de status
- `.env.example` — Variables Twilio placeholder (SID, Token, From, Admin phones)

### Documentacion
- `docs/env-vars.md` — Seccion Twilio WhatsApp con tabla de variables
- `docs/architecture.md` — `twilio.ts` en mapa + flujo actualizado
- `docs/features.md` — Nueva feature "Notificaciones WhatsApp"

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
