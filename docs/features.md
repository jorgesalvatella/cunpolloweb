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
- Filtros por categoria (tabs con tap targets ampliados)
- 35 items en 8 categorias: promociones, especialidad, lo-mero-bueno, antojitos, acompanamientos, bebidas, postres, combos
- Categoria "Promociones" con items solo-display (no se agregan al carrito, etiqueta "Solo consumo en restaurante")
- Quick-add "+" dorado en cada tarjeta (checkmark verde al agregar)
- Descripcion visible en mobile (line-clamp-1, antes hidden)
- Modal con detalle, tags (popular/picante/nuevo), precios reales, boton rounded-full
- Imagenes reales de productos (WebP, extraidas de Rappi) en `public/images/menu/`
- Datos estaticos en `src/data/menu-items.ts` (datos extraidos de Rappi)

### Sistema de Pedidos (Paga y Recoge)
- **Estado**: Integrado con Openpay (sandbox)
- **Feature flag**: `FEATURES.ORDERING_ENABLED` en `src/lib/constants.ts` (actualmente `true`)
- Carrito client-side con persistencia en localStorage
- Boton flotante de carrito muestra total "$X MXN" + badge con cantidad
- Pagina de carrito con pickup estimate, checkout primary button, SVG icon (sin emoji)
- Checkout con progress steps (Menu > Carrito > Pago), trust badge SSL
- Confirmacion con animacion y "Te esperamos en ~20 min"
- Comprobante de pago descargable (PDF generado en cliente con jsPDF)
- Sin delivery, sin cuentas de usuario
- Notificaciones WhatsApp via Twilio (ver seccion abajo)

### Dashboard Admin
- **Estado**: Desplegado en produccion (Supabase configurado)
- Login por contrasena simple (cookie HTTP-only)
- Lista de pedidos en real-time (Supabase Realtime)
- Progresion de status: pagado > preparando > listo > entregado
- Ruta `/admin` (fuera del sistema i18n)

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
| Openpay integracion | Integrar pasarela de pago Openpay (tarjeta + SPEI) | Documentacion y credenciales Openpay |

## Desactivadas

| Feature | Flag | Razon |
|---------|------|-------|
| Delivery | `FEATURES.DELIVERY_ENABLED: false` | Solo pickup por ahora |
| PWA | `FEATURES.PWA_ENABLED: false` | Futuro |
| Chicken 3D model | Removido del scene | Preferencia del usuario |
| Gradientes | N/A | Preferencia: colores solidos |
