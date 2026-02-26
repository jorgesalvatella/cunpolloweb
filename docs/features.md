# Features

## Implementadas

### Landing Page
- **Estado**: Producción
- Hero section con escena 3D (confetti + toy blocks)
- Preview del menú (items populares)
- Sección de ubicación con link a Google Maps
- Video section
- CTA section
- SEO: JSON-LD, sitemap, robots.txt
- Bilingue ES/EN con next-intl

### Menú Completo
- **Estado**: Producción
- Filtros por categoría (tabs)
- 33 items en 7 categorías: especialidad, lo-mero-bueno, antojitos, acompañamientos, bebidas, postres, combos
- Modal con detalle, tags (popular/picante/nuevo), precios reales
- Imágenes reales de productos (WebP, extraídas de Rappi) en `public/images/menu/`
- Datos estáticos en `src/data/menu-items.ts` (datos extraídos de Rappi)

### Sistema de Pedidos (Paga y Recoge)
- **Estado**: Desplegado en produccion (pendiente Bearer token real de ClaroPagos)
- **Feature flag**: `FEATURES.ORDERING_ENABLED` en `src/lib/constants.ts` (actualmente `true`)
- Carrito client-side con persistencia en localStorage
- Checkout con pago por tarjeta via ClaroPagos (T1 Pagos)
- API real: `POST /v1/tarjeta` (tokenizacion) + `POST /v1/cargo` (cobro)
- Auth: Bearer token, no SDK (fetch directo al REST API)
- Montos en pesos MXN (no centavos)
- Device fingerprint (CyberSource) opcional — se envia si esta disponible
- Webhook safety net en `/api/webhooks/t1pagos` (eventos: cargo.exitoso, cargo.fallido, cargo.cancelado)
- Confirmacion con animacion y "Te esperamos en ~20 min"
- Sin delivery, sin cuentas de usuario
- Notificaciones WhatsApp via Twilio (ver seccion abajo)

### Dashboard Admin
- **Estado**: Desplegado en producción (Supabase configurado)
- Login por contraseña simple (cookie HTTP-only)
- Lista de pedidos en real-time (Supabase Realtime)
- Progresión de status: pagado → preparando → listo → entregado
- Ruta `/admin` (fuera del sistema i18n)

### Notificaciones WhatsApp
- **Estado**: Implementado (pendiente credenciales Twilio reales)
- **Feature flag**: `FEATURES.WHATSAPP_NOTIFICATIONS` en `src/lib/constants.ts` (actualmente `true`)
- **Archivo**: `src/lib/twilio.ts` — wrapper sin SDK, fetch directo al REST API de Twilio
- **Cliente**: recibe WhatsApp en cada cambio de status (paid, preparing, ready, picked_up, cancelled)
- **Admin/Cocina**: recibe WhatsApp cuando entra un pedido nuevo
- Fire-and-forget: errores se loguean pero nunca bloquean el flujo del pedido
- Soporta multiples numeros admin via `ADMIN_WHATSAPP_PHONES` (separados por coma)
- Sin dependencias nuevas (0 paquetes agregados)

## Pendientes / Por Configurar

| Item | Descripción | Bloqueado por |
|------|-------------|---------------|
| ClaroPagos Bearer token | Obtener token real del panel admin | Registro en t1pagos.com + admin.claropagos.com |
| Prueba e2e pago | Flujo completo con tarjeta sandbox | Bearer token real |
| Device fingerprint | Integrar CyberSource JS en checkout | Guia oficial de T1 Pagos |
| Twilio credenciales | Obtener Account SID y Auth Token reales | Registro en twilio.com |
| Twilio WhatsApp sender | Registrar numero de WhatsApp Business | Aprobacion de Twilio/Meta |

## Desactivadas

| Feature | Flag | Razón |
|---------|------|-------|
| Delivery | `FEATURES.DELIVERY_ENABLED: false` | Solo pickup por ahora |
| PWA | `FEATURES.PWA_ENABLED: false` | Futuro |
| Chicken 3D model | Removido del scene | Preferencia del usuario |
| Gradientes | N/A | Preferencia: colores sólidos |
