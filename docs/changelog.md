# Changelog

## 2026-03-16 — PWA completa (Progressive Web App)

### Cambio
- PWA completamente funcional: instalable en Android e iOS
- Manifest completo con todos los campos requeridos y recomendados
- Service worker con cache strategies (cache-first para assets, network-first para paginas)
- Iconos generados del isotipo SVG en 8 tamaños (72-512px) + 2 maskable + SVG

### Archivos nuevos
- `src/components/PWARegister.tsx` — Componente que registra el service worker
- `public/icon-{72,96,128,144,152,192,384,512}x{72,96,128,144,152,192,384,512}.png` — Iconos PWA
- `public/icon-maskable-192x192.png` — Icono maskable 192px (Android adaptive)
- `public/icon-maskable-512x512.png` — Icono maskable 512px (Android adaptive)

### Archivos modificados
- `public/manifest.json` — Reescrito: nombre, shortcuts, screenshots, iconos maskable, categorias, orientacion, scope, id
- `public/sw.js` — Reescrito: pre-cache de assets estaticos, cache-first/network-first strategies, limpieza de caches viejos
- `src/app/layout.tsx` — Viewport export con theme_color, PWARegister component
- `src/lib/constants.ts` — `PWA_ENABLED: true`
- `next.config.ts` — Headers para sw.js (Service-Worker-Allowed, no-cache)

### Documentacion actualizada
- `docs/features.md` — Nueva seccion PWA
- `docs/architecture.md` — PWARegister en mapa
- `docs/changelog.md` — Este entry

## 2026-03-15 — Autenticacion por roles + vistas especializadas admin

### Cambio
- Autenticacion por roles: cada usuario tiene su usuario/contraseña y solo accede a su vista
- 3 nuevas vistas admin para operacion diaria del restaurante, sin modificar el dashboard existente

### Autenticacion por roles
- Nueva env var `ADMIN_USERS` reemplaza `ADMIN_PASSWORD` (backward compatible)
- Formato: `usuario:contraseña:rol` separados por coma
- Roles: `admin` (acceso total), `cocina`, `entrega`, `gerente`
- Login ahora pide usuario + contraseña, redirige automaticamente a la vista del rol
- Nuevo endpoint `GET /api/admin/me` devuelve el rol del usuario autenticado
- Cada vista verifica que el rol sea el correcto (admin puede acceder a todas)

### Archivos modificados (auth)
- `src/lib/admin-auth.ts` — Reescrito: soporte multi-usuario con roles, `getAdminRole()`, `validateCredentials()`
- `src/app/api/admin/login/route.ts` — Acepta username+password, devuelve rol
- `src/app/admin/login/page.tsx` — Campo usuario, redirect por rol
- `src/app/admin/page.tsx` — Verifica rol = admin
- `src/app/admin/cocina/page.tsx` — Verifica rol = cocina o admin
- `src/app/admin/entrega/page.tsx` — Verifica rol = entrega o admin
- `src/app/admin/gerente/page.tsx` — Verifica rol = gerente o admin
- `.env.example` — `ADMIN_USERS` reemplaza `ADMIN_PASSWORD`

### Archivos nuevos
- `src/app/api/admin/me/route.ts` — Endpoint que devuelve el rol del usuario

### Archivos nuevos (vistas)
- `src/app/admin/cocina/page.tsx` — Kitchen Display System (KDS) para tablet en cocina
  - Dark theme (bg-gray-900) con texto grande para legibilidad
  - Solo muestra pedidos "paid" y "preparing"
  - Notificacion sonora cuando llega pedido nuevo (HTML audio)
  - Botones EMPEZAR (paid→preparing) y LISTO (preparing→ready)
  - Badges de tipo de pedido, horario, personas
  - Supabase Realtime en canal "cocina-realtime"
- `src/app/admin/entrega/page.tsx` — Vista de entrega para cajera/mostrador
  - White theme limpio, solo pedidos "ready"
  - Nombre y telefono del cliente prominentes (telefono clickeable)
  - Tiempo de espera en minutos
  - Boton ENTREGADO (ready→picked_up)
  - Supabase Realtime en canal "entrega-realtime"
- `src/app/admin/gerente/page.tsx` — Dashboard gerencial
  - Cards: pedidos hoy, ingresos, ticket promedio, completados
  - Desglose por tipo (comer aqui vs llevar)
  - Conteo por status
  - Alertas: pedidos sin atender (+15 min en status "paid")
  - Tabla completa de pedidos del dia
  - Supabase Realtime en canal "gerente-realtime"

### Documentacion actualizada
- `docs/architecture.md` — Nuevas rutas en mapa + flujo de vistas especializadas
- `docs/features.md` — Nueva seccion "Vistas Especializadas Admin"
- `docs/changelog.md` — Este entry

## 2026-03-14 — Openpay en produccion + tipo de pedido y horario

### Cambio
- Openpay pasado de sandbox a produccion (credenciales de produccion, sandbox=false)
- Nuevo selector de tipo de pedido en checkout: "Comer aqui" o "Para llevar"
- Nuevo selector de horario: slots de 15 min entre 1 PM y 9 PM
- Filtro inteligente de horarios: solo muestra slots futuros (pickup: +15 min, dine-in: +30 min desde hora actual en timezone America/Cancun). Si el usuario cambia de tipo y su horario ya no aplica, se resetea
- Tipo de pedido y horario visibles en: admin dashboard, confirmacion, PDF, WhatsApp

### Credenciales Openpay (produccion)
- Merchant ID: `ma6rwqx70h1ibjeome4y`
- Llave publica: `pk_5a96...` (en Vercel env vars)
- Llave privada: `sk_862a...` (en Vercel env vars)
- Sandbox: `false`
- Soporte Openpay: soporte@openpay.mx / 55 5022 0404

### Base de datos
- Migracion: `add_order_type_and_pickup_time`
- Columna `order_type` TEXT NOT NULL DEFAULT 'pickup' (valores: dine_in, pickup)
- Columna `pickup_time` TEXT nullable (ej: "14:00", "18:30")

### Archivos modificados
- `src/types/order.ts` — Nuevos tipos OrderType, campos order_type y pickup_time
- `src/components/checkout/CheckoutForm.tsx` — UI selector tipo + horario, debug logging
- `src/app/api/orders/route.ts` — Validacion y guardado de order_type y pickup_time
- `src/components/admin/OrderCard.tsx` — Badges de tipo y horario
- `src/app/[locale]/confirmation/[id]/page.tsx` — Muestra tipo y horario, PDF actualizado
- `src/lib/twilio.ts` — WhatsApp incluye tipo y horario
- `src/messages/es.json` — Keys checkout y confirmation
- `src/messages/en.json` — Keys checkout y confirmation

### Env vars en Vercel (actualizadas)
- `OPENPAY_PRIVATE_KEY` — Llave privada produccion
- `NEXT_PUBLIC_OPENPAY_PUBLIC_KEY` — Llave publica produccion
- `NEXT_PUBLIC_OPENPAY_SANDBOX` — `false`

### Nota tecnica
- Al usar Vercel CLI para setear env vars, usar `printf` en vez de `echo` para evitar `\n` trailing que corrompe las API keys

### Documentacion actualizada
- `docs/features.md` — Estado produccion, horario 15 min, pendientes limpiados
- `docs/database.md` — Columnas order_type y pickup_time
- `docs/api.md` — Campos orderType y pickupTime en POST /api/orders
- `docs/env-vars.md` — Nota sobre printf vs echo
- `docs/changelog.md` — Este entry

## 2026-03-12 — Categoria Promociones en el menu

### Cambio
- Nueva categoria "Promociones" (aparece primero en el menu)
- Items con `promo: true` son solo-display: sin precio, sin boton agregar al carrito, sin controles de cantidad
- Muestran etiqueta "Solo consumo en restaurante" / "Dine-in only"
- 2 promos iniciales: Miercoles Kids ($99) y Jueves Ninos Comen Gratis

### Archivos modificados
- `src/types/menu.ts` — Campo opcional `promo?: boolean` en `MenuItem`
- `src/data/categories.ts` — Nueva categoria `promociones` (order: 0)
- `src/data/menu-items.ts` — 2 items promo con imagenes en Vercel Blob `Public/`
- `src/components/menu/MenuItemCard.tsx` — Oculta precio y boton "+" para promos, muestra `dineInOnly`
- `src/components/menu/MenuItemModal.tsx` — Oculta precio y controles de orden para promos, muestra `dineInOnly`
- `src/messages/es.json` — Key `menu.dineInOnly`
- `src/messages/en.json` — Key `menu.dineInOnly`
- `docs/features.md` — Actualizado conteo de items y categorias

### Metodo para futuras promos
1. Subir imagen a **Vercel Blob Storage** > carpeta `Public/` (Dashboard Vercel > Storage > Blob)
2. URL resultante: `https://igwu4bqzucdjjkup.public.blob.vercel-storage.com/Public/{nombre}.jpeg`
3. Agregar item en `src/data/menu-items.ts` con `categoryId: "promociones"` y `promo: true`
4. Push a `main` — Vercel despliega automaticamente

## 2026-03-06 — Fix integracion Openpay (solo tarjetas + 3DS completo)

### Cambio
- Agregado endpoint `POST /api/orders/[id]/verify` para verificar cobros despues de redirect 3D Secure
- Pagina de confirmacion ahora detecta retorno de 3DS y verifica el pago automaticamente
- Corregido redirect URL hardcodeada a `/es/` — ahora respeta el locale del usuario
- Limpieza de console.log de debug en CheckoutForm
- Agregada funcion `getCharge()` en `src/lib/openpay.ts` para consultar estado de cobros
- Actualizado type declaration `openpay.d.ts` con metodo `charges.get`

### Archivos nuevos
- `src/app/api/orders/[id]/verify/route.ts` — Verificacion 3DS

### Archivos modificados
- `src/lib/openpay.ts` — Nueva funcion `getCharge()`
- `src/types/openpay.d.ts` — Agregado `charges.get` al type
- `src/app/api/orders/route.ts` — Locale dinamico en redirect URL
- `src/app/[locale]/confirmation/[id]/page.tsx` — Verificacion 3DS al cargar
- `src/components/checkout/CheckoutForm.tsx` — Limpieza de logs de debug

### Documentacion actualizada
- `docs/api.md` — Nuevo endpoint verify, request/response actualizado para orders
- `docs/architecture.md` — Mapa actualizado con verify endpoint y flujo
- `docs/changelog.md` — Este entry

## 2026-03-02 — Twilio WhatsApp Business en produccion

### Cambio
- Numero remitente actualizado de sandbox (+14155238886) a numero propio (+529983871387)
- Numero registrado como WhatsApp Business Sender via Meta/Twilio Self Sign-up
- Perfil de WhatsApp Business configurado (logo CUNPOLLO, descripcion, website)
- Boton flotante de WhatsApp actualizado al numero de Twilio (era sandbox)
- 4 variables de entorno configuradas en Vercel (production)
- Deploy a produccion completado

### Archivos modificados
- `src/lib/twilio.ts` — Default fallback actualizado al numero propio
- `src/components/WhatsAppButton.tsx` — Numero actualizado de sandbox a +529983871387
- `.env.example` — Numero actualizado
- `docs/env-vars.md` — Referencia actualizada
- `docs/features.md` — Estado cambiado a "Produccion", removidos pendientes de Twilio

### Configuracion Twilio/Meta
- **Numero WhatsApp**: +529983871387 (numero mexicano, Voice + SIP, sin SMS)
- **Verificacion**: Por llamada de voz (numero no tiene SMS) via TwiML Bin + email
- **Env vars en Vercel**: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, ADMIN_WHATSAPP_PHONES

## 2026-03-01 — Comprobante de pago descargable (PDF)

### Nuevo
- Boton "Descargar Comprobante" en la pagina de confirmacion de pedido
- Genera PDF en el cliente con jsPDF (import dinamico, solo se carga al hacer clic)
- Contenido del PDF: titulo CUNPOLLO, numero de pedido, fecha, nombre del cliente, items con cantidades y precios, total, direccion del restaurante, mensaje de agradecimiento

### Archivos modificados
- `src/app/[locale]/confirmation/[id]/page.tsx` — Funcion `downloadReceipt()` con import dinamico de jsPDF, boton dorado
- `src/app/api/orders/[id]/route.ts` — Agregado `customer_name` al SELECT de Supabase
- `src/messages/es.json` — Key `confirmation.downloadReceipt`
- `src/messages/en.json` — Key `confirmation.downloadReceipt`
- `package.json` — Dependencia `jspdf` v4.2.0

### Decisiones de seguridad
- `payment_reference` **NO** se expone en la API publica `/api/orders/[id]` — es dato interno entre el sistema y Openpay
- `customer_name` se expone porque el que accede es el propio cliente (protegido por UUID)
- jsPDF se importa dinamicamente (`await import("jspdf")`) para evitar problemas de SSR y reducir bundle inicial (170KB vs 298KB)

### Documentacion actualizada
- `docs/features.md` — Agregada linea de comprobante PDF
- `docs/api.md` — Detallados campos del GET /api/orders/[id] y exclusiones de seguridad
- `docs/changelog.md` — Este entry

## 2026-02-28 — Security hardening del sistema de pedidos

### Archivos modificados
- `src/app/api/orders/route.ts` — Validacion de cantidad (1-100), limite de items (50), sanitizacion de nombre/telefono, logs sin datos sensibles de tarjeta
- `src/app/api/orders/[id]/route.ts` — Validacion UUID, select limitado (sin customer_name/phone en respuesta publica)
- `src/app/api/webhooks/t1pagos/route.ts` — Webhook auth fail-secure (rechaza si no hay credenciales configuradas)
- `src/lib/admin-auth.ts` — Hash HMAC-SHA256 (reemplaza djb2 debil), comparacion constant-time para password
- `src/components/cart/CartItemRow.tsx` — Layout mobile mejorado, nombre completo visible sin truncar

### Resumen de fixes
| Severidad | Issue | Fix |
|-----------|-------|-----|
| CRITICO | Webhook acepta todo sin auth configurada | Fail-secure: rechaza si no hay credenciales |
| CRITICO | Hash djb2 debil para admin cookie | HMAC-SHA256 + timing-safe comparison |
| ALTO | Sin validacion de cantidad en items | Rango 1-100, tipo entero |
| ALTO | Sin validacion de nombre/telefono | Largo, formato, sanitizacion |
| ALTO | Logs podrian filtrar datos de tarjeta | Logs limpios solo con order ID |
| ALTO | /api/orders/[id] expone datos de cliente | Select limitado, validacion UUID |
| MEDIO | Mensaje de error filtra menuItemId | Error generico |

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
