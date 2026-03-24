# Changelog

## 2026-03-24 — Gestion de Telefonos Admin (Notificaciones WhatsApp)

### Resumen
Interfaz completa en el panel admin para gestionar los telefonos que reciben notificaciones WhatsApp cuando entra un pedido nuevo. Antes solo se podia cambiar via env var `ADMIN_WHATSAPP_PHONES`; ahora se gestiona desde la UI con persistencia en Supabase.

### Cambios
- **Tabla Supabase**: `admin_phones` (id, name, phone, active, timestamps) con RLS y trigger `updated_at`
- **API route**: `/api/admin/phones` — GET, POST, PUT, DELETE con validacion, normalizacion de telefono y deteccion de duplicados
- **Componente**: `AdminPhonesManager` — formulario para agregar, lista con toggle activo/inactivo, edicion inline, eliminacion con confirmacion de 2 pasos
- **WhatsApp Hub**: Nuevo sub-tab "Notificaciones" como primera opcion (antes: Contactos, Enviar Promo, Historial)
- **Twilio**: `notifyAdminNewOrder()` ahora es `async` y lee telefonos de la tabla `admin_phones` (activos), con fallback a env var si la tabla esta vacia o falla
- **Datos migrados**: 4 telefonos del equipo insertados en la tabla desde el env var existente

### Archivos nuevos
- `src/app/api/admin/phones/route.ts`
- `src/components/admin/AdminPhonesManager.tsx`
- `supabase/admin_phones.sql`

### Archivos modificados
- `src/components/admin/WhatsAppHub.tsx` — import + tab "Notificaciones"
- `src/lib/twilio.ts` — `getAdminPhones()` helper + `notifyAdminNewOrder()` async con lectura de DB
- `docs/api.md` — referencia de endpoints `/api/admin/phones`
- `docs/architecture.md` — mapa de archivos actualizado
- `docs/database.md` — documentacion tabla `admin_phones`
- `docs/features.md` — seccion de gestion de telefonos admin

---

## 2026-03-22 — CunPollo Rewards (Programa de Lealtad)

### Resumen
Lanzamiento del programa de lealtad CunPollo Rewards via Tagocard. Botones y banners dorados en 6 ubicaciones estrategicas del sitio que redirigen al registro externo en Tagocard.

### Cambios
- **Feature flag**: `FEATURES.REWARDS_ENABLED` + constante `REWARDS_URL` en `src/lib/constants.ts`
- **Homepage**: Nueva seccion `RewardsSection` entre Ubicacion y CTA final — 3 beneficios + boton dorado
- **Header**: Link dorado con icono estrella en desktop nav y mobile menu
- **Footer**: Boton outline dorado junto a "Hacer Pedido"
- **Menu page**: Componente `RewardsBanner` — banner slim dismissible arriba de las tabs
- **Cart page**: Nota inline dorada arriba del boton de checkout
- **Confirmation page**: Banner dorado con CTA despues del resumen de orden (solo pago exitoso)
- **Traducciones**: Namespace `rewards` completo en ES/EN

### Archivos nuevos
- `src/components/landing/RewardsSection.tsx`
- `src/components/menu/RewardsBanner.tsx`

### Archivos modificados
- `src/lib/constants.ts`
- `src/messages/es.json`, `src/messages/en.json`
- `src/app/[locale]/page.tsx`
- `src/app/[locale]/confirmation/[id]/page.tsx`
- `src/app/[locale]/cart/page.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/menu/MenuContainer.tsx`

---

## 2026-03-22 — Pago por transferencia SPEI (Openpay)

### Resumen
Agregado SPEI como segundo metodo de pago. Los clientes pueden elegir entre tarjeta o transferencia bancaria. Openpay genera una CLABE para que el cliente transfiera desde su app bancaria. El pago se confirma automaticamente via webhook.

### Cambios
- **DB**: Migracion `add_spei_payment_columns` — columnas `payment_method` (TEXT, default 'card') y `spei_details` (JSONB) en tabla `orders`
- **Tipos**: `PaymentMethod`, `SpeiDetails`, `pending_spei` status en `src/types/order.ts`
- **Openpay SDK**: Nueva funcion `createBankCharge()` en `src/lib/openpay.ts`
- **API POST /api/orders**: Branch SPEI antes del flujo de tarjeta. Validacion condicional de tokenId/deviceSessionId
- **API GET /api/orders/[id]**: Agrega `payment_method`, `spei_details` al select
- **CheckoutForm**: Tabs "Tarjeta" / "Transferencia SPEI", campo email para SPEI, boton condicional
- **Confirmacion**: Vista pendiente SPEI con CLABE (copiar), banco, referencia, vencimiento + polling cada 10s
- **Admin OrderCard**: Badge "SPEI" + label "Esperando SPEI" para `pending_spei`
- **Traducciones**: Nuevas keys en checkout + confirmation (ES/EN)
- **Webhook**: Sin cambios funcionales — ya maneja `completed` → `paid` para cualquier tipo de cargo

### Archivos modificados
- `src/types/order.ts`
- `src/lib/openpay.ts`
- `src/app/api/orders/route.ts`
- `src/app/api/orders/[id]/route.ts`
- `src/app/api/webhooks/openpay/route.ts` (log adicional)
- `src/components/checkout/CheckoutForm.tsx`
- `src/app/[locale]/confirmation/[id]/page.tsx`
- `src/components/admin/OrderCard.tsx`
- `src/messages/es.json`, `src/messages/en.json`

---

## 2026-03-20 — Realtime robusto en admin + WhatsApp template para notificacion de pedidos

### Problema
Las vistas admin (cocina, entrega, gerente, dashboard) usaban Supabase Realtime para actualizar pedidos, pero si la conexion WebSocket se caia silenciosamente, el staff no veia pedidos nuevos hasta recargar la pagina. Ademas, la notificacion WhatsApp a admins usaba texto libre (`sendWhatsApp`), que solo funciona dentro de la ventana de 24 horas de WhatsApp Business API.

### Cambios — Realtime robusto
- **Polling fallback**: Todas las vistas admin ahora hacen polling cada 10 segundos como respaldo. Si Realtime funciona, los pedidos llegan al instante; si no, llegan en maximo 10 segundos.
- **Fix Supabase Proxy**: Reemplazado el import deprecated `supabase` (Proxy) por `getSupabase()` directo en todas las vistas admin. El Proxy podia causar problemas con el contexto `this` en el cliente Realtime.
- **Monitoreo de conexion**: Callback en `.subscribe()` loguea `CHANNEL_ERROR` y `TIMED_OUT` para debugging.

### Cambios — WhatsApp template para admins
- **Nuevo template**: Creado `cunpollo_new_order_admin_v2` en Twilio Content API (SID: `HXc3551bb7c64df102453ff7c7bc61522e`), categoria UTILITY, pendiente aprobacion de Meta.
- **`notifyAdminNewOrder()`**: Ahora usa `sendWhatsAppTemplate()` con 2 variables (numero de orden + detalle combinado) en vez de `sendWhatsApp()` con texto libre. Garantiza entrega sin depender de ventana de 24h.
- **Equipo notificado**: 4 numeros configurados en `ADMIN_WHATSAPP_PHONES`.

### Archivos modificados
- `src/app/admin/cocina/page.tsx` — `getSupabase()` + polling 10s + subscribe callback
- `src/app/admin/entrega/page.tsx` — Idem
- `src/app/admin/gerente/page.tsx` — Idem
- `src/components/admin/OrdersDashboard.tsx` — Idem
- `src/components/admin/MenuManager.tsx` — `getSupabase()` (sin polling, no es critico)
- `src/lib/twilio.ts` — `ADMIN_NEW_ORDER_TEMPLATE`, `notifyAdminNewOrder()` usa template con 2 vars

### Env vars actualizadas (Vercel Production)
- `ADMIN_WHATSAPP_PHONES` — Actualizada con 4 numeros del equipo

### Notas
- El polling es un respaldo; puede removerse si se confirma que Realtime es estable post-launch.
- El template debe ser aprobado por Meta antes de que los mensajes se entreguen. Status: pendiente.

---

## 2026-03-18 — Auditoria de seguridad pre-launch: 25 issues corregidos

### Cambio
Correccion masiva de seguridad, estabilidad y UX basada en la auditoria pre-launch (`docs/pre-launch-audit.md`). Se resolvieron los 30 issues: 6 criticos, 7 altos, 11 medios y 6 bajos.

### CRITICOS
- **RLS orders**: Eliminada policy `USING (true)` que permitia leer todas las ordenes sin auth. Solo service_role accede.
- **Rate limiting**: `/api/orders` (10 req/min/IP) y `/api/admin/login` (5 intentos/15 min/IP) con sliding window.
- **Idempotency key**: Nueva columna `idempotency_key` UNIQUE en orders. Cliente genera UUID antes de pagar, server rechaza duplicados.
- **clearCart() movido**: Ya no se limpia antes del redirect 3DS. Se limpia en la pagina de confirmacion despues de verificar pago exitoso.
- **Webhook Openpay**: Nuevo endpoint `/api/webhooks/openpay` que captura pagos 3DS completados cuando el usuario no regresa.

### ALTOS
- **UUID validation**: Validacion regex en endpoints DELETE de contacts y promotions.
- **Security headers**: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` en next.config.ts.
- **Admin cookie salt**: Ahora usa env var `ADMIN_COOKIE_SECRET` en vez de salt hardcodeado.
- **State machine**: Transiciones de estado de ordenes validadas (no se puede ir de `picked_up` a `pending`).
- **Doble-click**: `submittingRef` previene envio duplicado del formulario de pago.
- **Origin validation**: URL de redirect 3DS validada contra whitelist de dominios.
- **N+1 queries**: Items del menu se obtienen en batch con `.in()` en vez de uno por uno.

### MEDIOS
- **Error boundaries**: `error.tsx` y `global-error.tsx` con branding CUNPOLLO y enlace WhatsApp.
- **Luhn + expiry validation**: CardInput valida numero de tarjeta y fecha de vencimiento antes de tokenizar.
- **Cart validation**: Items eliminados del menu se filtran al cargar el carrito.
- **Floating-point**: `Math.round(total * 100) / 100` en CartContext.
- **Phone normalization**: `formatPhone()` exportado como funcion compartida.
- **Images optimized**: Removido flag `unoptimized` de MenuItemCard y MenuItemModal.

### MEDIOS (cont.)
- **Timeout orders**: Cron job cada 15 min verifica ordenes en `processing`/`pending_3ds` por mas de 30 min, las resuelve con Openpay o las cancela.
- **Refund**: Nuevo endpoint `POST /api/admin/orders/[id]/refund` que procesa reembolso via Openpay API.
- **Audit log**: Nueva tabla `admin_audit_log` con registro de acciones admin (quien, que, cuando, valores antes/despues).
- **Opt-in marketing**: Campañas WhatsApp ahora filtran contactos por `opted_in_marketing = true`.

### BAJOS
- **CSRF**: Origin header validation en admin mutation routes + sameSite: lax cookies.
- **Indexes**: 5 nuevos indexes en columnas frecuentemente consultadas.
- **Traducciones**: Strings hardcodeados en espanol movidos a messages JSON.
- **Autocomplete**: `cc-number`, `cc-exp`, `cc-csc`, `cc-name` en inputs de tarjeta.
- **beforeunload**: Warning al cerrar pestaña durante procesamiento de pago.
- **Campaign errors**: Telefonos ya no se exponen en response de errores.

### Archivos nuevos
- `src/lib/rate-limit.ts` — Rate limiter in-memory (sliding window)
- `src/lib/audit-log.ts` — Utility para registrar acciones admin
- `src/app/api/webhooks/openpay/route.ts` — Webhook de Openpay
- `src/app/api/admin/orders/[id]/refund/route.ts` — Endpoint de reembolso
- `src/app/api/cron/timeout-orders/route.ts` — Cron para timeout de ordenes
- `src/app/error.tsx` — Error boundary con branding
- `src/app/global-error.tsx` — Global error boundary
- `vercel.json` — Configuracion de cron jobs

### Archivos modificados
- `src/app/api/orders/route.ts` — Rate limit, idempotency, batch fetch, origin validation
- `src/app/api/admin/login/route.ts` — Rate limit
- `src/app/api/admin/orders/[id]/route.ts` — UUID validation, state machine
- `src/app/api/admin/contacts/[id]/route.ts` — UUID validation
- `src/app/api/admin/promotions/[id]/route.ts` — UUID validation
- `src/app/api/admin/campaigns/route.ts` — Phone masking in errors
- `src/components/checkout/CheckoutForm.tsx` — clearCart moved, double-click prevention, beforeunload, idempotency key, translated strings
- `src/components/checkout/CardInput.tsx` — Luhn validation, expiry validation, autocomplete hints
- `src/context/CartContext.tsx` — Cart validation, floating-point fix
- `src/app/[locale]/confirmation/[id]/page.tsx` — clearCart on successful payment, translated receipt
- `src/components/menu/MenuItemCard.tsx` — Removed unoptimized
- `src/components/menu/MenuItemModal.tsx` — Removed unoptimized
- `src/lib/admin-auth.ts` — Dynamic salt from env var
- `src/lib/twilio.ts` — Exported formatPhone
- `src/types/order.ts` — idempotencyKey field
- `next.config.ts` — Security headers
- `supabase/schema.sql` — Updated RLS, idempotency_key column, indexes

### Migraciones DB aplicadas
- `fix_rls_orders_policy` — Eliminada policy `USING (true)`
- `add_idempotency_key_to_orders` — Columna + index
- `add_missing_indexes` — 5 indexes en columnas frecuentes
- `add_admin_audit_log_table` — Tabla de audit log con RLS
- `add_opted_in_marketing_to_contacts` — Columna opt-in en contacts

### Env vars nuevas (configurar en Vercel)
- `ADMIN_COOKIE_SECRET` — Salt para cookies admin
- `OPENPAY_WEBHOOK_TOKEN` — Token de verificacion del webhook
- `CRON_SECRET` — Token para autenticar cron jobs de Vercel

### Pendiente manual
- Configurar env vars en Vercel (ADMIN_COOKIE_SECRET, OPENPAY_WEBHOOK_TOKEN, CRON_SECRET)
- Registrar URL del webhook en Openpay dashboard
- Eliminar producto de prueba "Prueba" ($2) desde admin
- Hacer pedido de prueba completo con tarjeta real

---

## 2026-03-17 — Sistema completo de gestion de menu desde admin

### Cambio
- Menu migrado de archivos estaticos a base de datos Supabase
- CRUD completo de productos desde el admin (crear, editar, eliminar)
- Upload de imagenes con optimizacion automatica (sharp: resize + WebP)
- Descuentos por producto (% o fijo) con precio tachado en el menu
- Promociones por tipo de pedido (pickup/dine_in/ambos) con descuento en checkout
- Validacion server-side de precios y descuentos al procesar pagos
- Banner de promociones activas visible en la pagina del menu

### Base de datos
- Tabla `categories` — 8 categorias migradas
- Tabla `menu_items` — 42 productos con precios, disponibilidad, descuentos
- Tabla `promotions` — promos configurables por tipo de pedido
- Columnas en `orders`: `discount_amount`, `discount_description`, `promotion_id`
- Realtime habilitado para `menu_items` y `categories`

### API
- `GET /api/menu` — endpoint publico (categorias + items + promos activas)
- `GET/POST/PUT/DELETE /api/admin/menu` — CRUD de productos
- `GET/PUT /api/admin/menu/categories` — gestion de categorias
- `GET/POST/PUT /api/admin/promotions` — gestion de promociones
- `DELETE /api/admin/promotions/[id]` — eliminar promocion
- `POST /api/admin/upload` — upload imagen con optimizacion (sharp → WebP)

### Frontend
- `MenuContext` reemplaza datos estaticos en todos los componentes
- Descuentos por producto: precio original tachado + precio efectivo
- Checkout: desglose subtotal → descuento promo → total final
- Boton de pagar muestra total con descuento aplicado
- Banner verde de promo activa en pagina del menu

### Admin UI
- Tab "Menu": buscar, filtrar, editar precio inline, toggle disponibilidad, descuentos, agregar/eliminar producto, upload imagen
- Tab "Promos": crear/editar/eliminar promos, toggle activa, vista previa

### Seguridad
- Servidor recalcula todos los precios desde DB (no confia en el cliente)
- Descuentos validados server-side con `calculateEffectivePrice` y `calculateOrderDiscount`
- Openpay cobra el total calculado server-side
- Upload: valida tipo (solo imagenes), tamano (max 10MB), auth requerido

### Archivos nuevos
- `src/lib/menu-data.ts` — fetchers DB + helpers de descuento
- `src/context/MenuContext.tsx` — provider client-side para datos del menu
- `src/app/api/menu/route.ts` — API publica del menu
- `src/app/api/admin/menu/route.ts` — CRUD admin de items
- `src/app/api/admin/menu/categories/route.ts` — gestion categorias
- `src/app/api/admin/promotions/route.ts` — CRUD promos
- `src/app/api/admin/promotions/[id]/route.ts` — eliminar promo
- `src/app/api/admin/upload/route.ts` — upload imagen optimizada
- `src/components/admin/MenuManager.tsx` — UI gestion menu
- `src/components/admin/PromotionsManager.tsx` — UI gestion promos

### Archivos modificados
- `src/types/menu.ts` — tipos Db*, Promotion, campos de descuento
- `src/app/[locale]/layout.tsx` — MenuProvider wrapping CartProvider
- `src/context/CartContext.tsx` — usa MenuContext para precios efectivos
- `src/components/menu/MenuContainer.tsx` — MenuContext + banner promos
- `src/components/menu/MenuItemCard.tsx` — precio con descuento tachado
- `src/components/menu/MenuItemModal.tsx` — precio con descuento
- `src/components/landing/MenuPreview.tsx` — MenuContext
- `src/components/cart/CartItemRow.tsx` — precio efectivo
- `src/components/checkout/CheckoutForm.tsx` — desglose descuento + total final
- `src/app/api/orders/route.ts` — precios desde DB + descuentos server-side
- `src/app/api/orders/[id]/route.ts` — incluye campos de descuento
- `src/app/api/catalog/feed/route.ts` — lee desde DB con precios efectivos
- `src/app/admin/page.tsx` — tabs Menu y Promos

## 2026-03-17 — UI admin para gestion de menu y promociones

### Cambio
- Nuevos tabs "Menu" y "Promos" en el dashboard admin (`/admin`)
- MenuManager: lista de items con filtro por categoria, busqueda, edicion inline de precio/disponibilidad/descuento, Supabase Realtime
- PromotionsManager: CRUD completo de promociones de orden con formulario, toggle activa/inactiva, eliminar con confirmacion, vista previa de texto

### Archivos nuevos
- `src/components/admin/MenuManager.tsx` — Componente de gestion de menu con edicion inline y Realtime
- `src/components/admin/PromotionsManager.tsx` — CRUD de promociones con formulario y lista

### Archivos modificados
- `src/app/admin/page.tsx` — Agregados tabs "Menu" y "Promos", imports de MenuManager y PromotionsManager

### Documentacion actualizada
- `docs/architecture.md` — MenuManager y PromotionsManager en mapa de componentes admin
- `docs/features.md` — Nueva seccion "Gestion de Menu y Promociones (Admin)"
- `docs/changelog.md` — Este entry

## 2026-03-17 — Migracion de frontend a MenuContext (eliminar datos estaticos)

### Cambio
- Todos los componentes frontend que consumian datos del menu ahora usan `useMenu()` de `MenuContext` en vez de importar funciones estaticas de `@/data`
- Precios con descuento se muestran con precio original tachado + precio efectivo
- Cart total ahora calcula precios efectivos (con descuentos aplicados)
- Checkout muestra desglose de descuentos por item y promociones activas por tipo de pedido

### Archivos modificados
- `src/components/menu/MenuContainer.tsx` — Usa `useMenu()` para categories/items, agrega loading spinner
- `src/components/landing/MenuPreview.tsx` — Usa `useMenu()` para featured items, muestra precio con descuento
- `src/components/menu/MenuItemCard.tsx` — Usa `getEffectivePrice()` para precio con strikethrough
- `src/components/menu/MenuItemModal.tsx` — Usa `getEffectivePrice()` para precio header y boton "Agregar al Pedido"
- `src/context/CartContext.tsx` — Usa `useMenu()` (`getItemById` + `getEffectivePrice`) en vez de `getMenuItemById` de `@/data`
- `src/components/cart/CartItemRow.tsx` — Usa `useMenu()` para lookup de items y muestra precio unitario con descuento
- `src/components/checkout/CheckoutForm.tsx` — Usa `useMenu()` para order summary con descuentos y banner de promociones activas

### Documentacion actualizada
- `docs/features.md` — Menu data source actualizado, mencion de descuentos
- `docs/changelog.md` — Este entry

## 2026-03-17 — Migracion de menu a Supabase (tipos, data layer, API publica)

### Cambio
- Tipos de menu ampliados con campos de descuento y tipos DB (snake_case)
- Nuevo modulo server-side `menu-data.ts` para leer categorias, items y promociones desde Supabase
- Nuevo endpoint publico `GET /api/menu` que devuelve datos del menu desde la base de datos
- Helpers para calcular precios con descuento y descuentos a nivel de orden

### Archivos modificados
- `src/types/menu.ts` — Agregados `discountPercent`, `discountFixed` a MenuItem; nuevos tipos `DbMenuItem`, `DbCategory`, `DbPromotion`, `Promotion`

### Archivos nuevos
- `src/lib/menu-data.ts` — Fetchers: `getMenuItemsFromDB`, `getMenuItemByIdFromDB`, `getCategoriesFromDB`, `getActivePromotions`; helpers: `dbToMenuItem`, `dbToCategory`, `calculateEffectivePrice`, `calculateOrderDiscount`
- `src/app/api/menu/route.ts` — GET publico con cache (s-maxage=60, stale-while-revalidate=300)

### Documentacion actualizada
- `docs/architecture.md` — menu-data.ts en mapa de lib, api/menu en mapa de rutas, tipos actualizados
- `docs/api.md` — Nueva seccion "Menu (Datos publicos desde Supabase)"
- `docs/changelog.md` — Este entry

## 2026-03-17 — API routes para administracion de menu y promociones

### Cambio
- Nuevas API routes admin para gestionar menu items, categorias y promociones desde el dashboard
- CRUD completo para promociones (crear, listar, actualizar, eliminar)
- Actualizacion parcial de menu items y categorias (solo campos proporcionados)

### Archivos nuevos
- `src/app/api/admin/menu/route.ts` — GET: listar items + categorias, PUT: actualizar item
- `src/app/api/admin/menu/categories/route.ts` — GET: listar categorias, PUT: actualizar categoria
- `src/app/api/admin/promotions/route.ts` — GET: listar, POST: crear, PUT: actualizar promocion
- `src/app/api/admin/promotions/[id]/route.ts` — DELETE: eliminar promocion por UUID

### Documentacion actualizada
- `docs/api.md` — Nuevas secciones Menu (Admin) y Promociones (Admin)
- `docs/architecture.md` — Rutas admin/menu y admin/promotions en mapa de archivos
- `docs/changelog.md` — Este entry

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
