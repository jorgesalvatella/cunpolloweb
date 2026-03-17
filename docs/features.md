# Features

## Implementadas

### Landing Page
- **Estado**: Produccion
- Hero section con CTA "Pedir Ahora" + trust line "Listo en ~20 min"
- Header con boton "Pedir" persistente en nav (desktop + mobile)
- Preview del menu: "Los Mas Pedidos" con CTA "Ver Todo y Pedir"
- CTA section: "Pide y Recoge en 20 Min" orientado a conversion
- Video section con heading "Asi Preparamos tu Pollo"
- Ubicacion con indicador abierto/cerrado + boton "Pide para Recoger"
- Footer con boton "Hacer Pedido" + horarios internacionalizados
- SEO: JSON-LD, sitemap, robots.txt
- Bilingue ES/EN con next-intl

### Menu Completo
- **Estado**: Produccion
- **Data source**: MenuContext (datos desde `/api/menu` via Supabase, con fallback loading state)
- Filtros por categoria (tabs con tap targets ampliados)
- 35 items en 8 categorias: promociones, especialidad, lo-mero-bueno, antojitos, acompanamientos, bebidas, postres, combos
- Categoria "Promociones" con items solo-display (no se agregan al carrito, etiqueta "Solo consumo en restaurante")
- Quick-add "+" dorado en cada tarjeta (checkmark verde al agregar)
- Descripcion visible en mobile (line-clamp-1, antes hidden)
- Modal con detalle, tags (popular/picante/nuevo), precios reales, boton rounded-full
- **Descuentos por producto**: Soporte para `discountPercent` y `discountFixed` — precio original tachado + precio efectivo en rojo
- Imagenes reales de productos (WebP, extraidas de Rappi) en Vercel Blob Storage
- Datos estaticos en `src/data/menu-items.ts` se mantienen como referencia pero ya no se usan en frontend

### Sistema de Pedidos (Paga y Recoge)
- **Estado**: Produccion (Openpay produccion, 3D Secure activo)
- **Feature flag**: `FEATURES.ORDERING_ENABLED` en `src/lib/constants.ts` (actualmente `true`)
- Carrito client-side con persistencia en localStorage
- Boton flotante de carrito muestra total "$X MXN" + badge con cantidad
- Pagina de carrito con pickup estimate, checkout primary button, SVG icon (sin emoji)
- Checkout con progress steps (Menu > Carrito > Pago), trust badge SSL
- Selector de tipo de pedido: "Comer aqui" o "Para llevar"
- Selector de horario: slots de 15 min entre 1 PM y 9 PM, filtrado inteligente segun hora actual (pickup: +15 min, dine-in: +30 min, timezone America/Cancun)
- Confirmacion con animacion, tipo de pedido y hora solicitada
- Comprobante de pago descargable (PDF generado en cliente con jsPDF)
- Sin delivery, sin cuentas de usuario
- Notificaciones WhatsApp via Twilio (ver seccion abajo)

### Dashboard Admin
- **Estado**: Desplegado en produccion (Supabase configurado)
- Login con usuario + contraseña, autenticacion por roles (cookie HTTP-only)
- Roles: `admin` (dashboard completo), `cocina`, `entrega`, `gerente`
- Cada rol solo accede a su vista; `admin` accede a todas
- Usuarios configurados via env var `ADMIN_USERS` (formato: `usuario:contraseña:rol`)
- Lista de pedidos en real-time (Supabase Realtime)
- Progresion de status: pagado > preparando > listo > entregado
- Ruta `/admin` (fuera del sistema i18n)

### Vistas Especializadas Admin
- **Estado**: Produccion
- **Cocina** (`/admin/cocina`): Dark theme optimizado para tablet en cocina. Muestra solo pedidos "paid" y "preparing". Sonido de notificacion para pedidos nuevos. Botones grandes: EMPEZAR (paid→preparing), LISTO (preparing→ready). Supabase Realtime.
- **Entrega** (`/admin/entrega`): White theme para cajera/mostrador. Muestra solo pedidos "ready". Nombre del cliente y telefono prominentes (clickeable para llamar). Boton ENTREGADO (ready→picked_up). Supabase Realtime.
- **Gerente** (`/admin/gerente`): Dashboard ejecutivo con stats del dia: pedidos totales, ingresos, ticket promedio, completados. Desglose por tipo (comer aqui vs llevar). Conteo por status. Alerta para pedidos sin atender (+15 min). Tabla completa de pedidos del dia. Supabase Realtime.

### Notificaciones WhatsApp
- **Estado**: Produccion (WhatsApp Business Sender registrado)
- **Numero**: +529983871387 (Twilio, registrado en WABA ID 1475932520606512)
- **Feature flag**: `FEATURES.WHATSAPP_NOTIFICATIONS` en `src/lib/constants.ts` (actualmente `true`)
- **Archivo**: `src/lib/twilio.ts` — wrapper sin SDK, fetch directo al REST API de Twilio
- **Cliente**: recibe WhatsApp en cada cambio de status (paid, preparing, ready, picked_up, cancelled)
- **Admin/Cocina**: recibe WhatsApp cuando entra un pedido nuevo
- **Boton flotante**: `src/components/WhatsAppButton.tsx` — abre chat con el numero de WhatsApp Business
- Fire-and-forget: errores se loguean pero nunca bloquean el flujo del pedido
- Soporta multiples numeros admin via `ADMIN_WHATSAPP_PHONES` (separados por coma)
- Sin dependencias nuevas (0 paquetes agregados)

### Gestion de Menu y Promociones (Admin)
- **Estado**: Implementado
- **Ruta**: `/admin` > Tabs "Menu" y "Promos"
- **Componentes**: `MenuManager`, `PromotionsManager`
- **Menu Manager**:
  - Filtro por categoria (tabs) + busqueda por nombre
  - Tabla de todos los items (incluso no disponibles, en gris)
  - Edicion inline: precio (clic para editar, guarda en blur/enter)
  - Toggle de disponibilidad (switch)
  - Selector de descuento: sin descuento / % / $ fijo + valor
  - Items con descuento muestran precio original tachado + precio efectivo
  - Indicador de guardado (flash verde + texto "Guardado")
  - Supabase Realtime: se actualiza automaticamente si otro admin cambia algo
- **Promotions Manager**:
  - Lista de promociones (activas resaltadas con borde verde)
  - Crear nueva promocion: nombre, tipo descuento (%/$), valor, aplica a (llevar/aqui/ambos), monto minimo, activa
  - Vista previa del texto: "5% de descuento en pedidos para llevar"
  - Editar promocion existente (mismo formulario)
  - Toggle inline activa/inactiva
  - Eliminar con confirmacion (doble clic)
- **API**: `/api/admin/menu` (GET, PUT), `/api/admin/promotions` (GET, POST, PUT, DELETE)

### Hub WhatsApp Promociones (Admin)
- **Estado**: Implementado
- **Ruta**: `/admin` > Tab "WhatsApp"
- **Componentes**: `WhatsAppHub`, `ContactList`, `SendPromo`, `CampaignHistory`
- **Tablas**: `contacts` (contactos WhatsApp), `campaigns` (historial de envios)
- **Funcionalidad**:
  - Agregar contactos manualmente o importar de pedidos existentes
  - Enviar promociones usando templates aprobados de Meta via Twilio (ContentSid)
  - Vista previa del mensaje antes de enviar
  - Seleccionar contactos especificos o enviar a todos
  - Historial de campanas con stats (enviados/fallidos)
- **API**: `/api/admin/contacts` (GET, POST, DELETE), `/api/admin/campaigns` (GET, POST)
- **Twilio**: `sendWhatsAppTemplate()` en `src/lib/twilio.ts` para templates con ContentSid

### Feed de Catalogo para WhatsApp (Meta Commerce Manager)
- **Estado**: Implementado
- **Ruta**: `/api/catalog/feed`
- **Archivo**: `src/app/api/catalog/feed/route.ts`
- **Formato**: XML Atom + Google Product Data (compatible con Meta Commerce Manager)
- **Productos**: Todos los items activos del menu (excluye promos y item de prueba)
- **Campos**: id, titulo, descripcion, precio (MXN), imagen, categoria, disponibilidad, marca
- **Cache**: 1 hora (s-maxage=3600)
- **Uso**: Configurar en Meta Commerce Manager como "Scheduled Feed" con URL `https://cunpollo.com/api/catalog/feed`
- **Beneficio**: Catalogo de WhatsApp Business se sincroniza automaticamente con los productos del sitio

## Pendientes / Por Configurar

| Item | Descripcion | Bloqueado por |
|------|-------------|---------------|
| — | Sin pendientes criticos | — |

### PWA (Progressive Web App)
- **Estado**: Produccion
- **Feature flag**: `FEATURES.PWA_ENABLED` en `src/lib/constants.ts` (actualmente `true`)
- **Manifest**: `public/manifest.json` — nombre, iconos (8 tamaños + 2 maskable + SVG), shortcuts (Menu, Carrito), screenshots, categorias
- **Service Worker**: `public/sw.js` — cache-first para assets estaticos, network-first para paginas, sin cache para API/admin
- **Registro**: `src/components/PWARegister.tsx` — componente client-side en root layout
- **Iconos**: Generados del isotipo SVG (72px a 512px + maskable con padding blanco)
- **Theme color**: `#BC2026` (rojo CUNPOLLO)
- Instalable en Android (Add to Home Screen) y iOS (Add to Home Screen via Safari)

## Desactivadas

| Feature | Flag | Razon |
|---------|------|-------|
| Delivery | `FEATURES.DELIVERY_ENABLED: false` | Solo pickup por ahora |
| Chicken 3D model | Removido del scene | Preferencia del usuario |
| Gradientes | N/A | Preferencia: colores solidos |
