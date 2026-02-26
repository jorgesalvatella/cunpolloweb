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
- 16 items en 4 categorías: pollos, complementos, bebidas, combos
- Modal con detalle, tags (popular/picante/nuevo), precios
- Datos estáticos en `src/data/menu-items.ts`

### Sistema de Pedidos (Paga y Recoge)
- **Estado**: Desplegado en producción (T1 Pagos pendiente de API key real)
- **Feature flag**: `FEATURES.ORDERING_ENABLED` en `src/lib/constants.ts` (actualmente `true`)
- Carrito client-side con persistencia en localStorage
- Checkout con pago por tarjeta (T1 Pagos)
- Confirmación con animación y "Te esperamos en ~20 min"
- Sin delivery, sin cuentas de usuario, sin notificaciones

### Dashboard Admin
- **Estado**: Desplegado en producción (Supabase configurado)
- Login por contraseña simple (cookie HTTP-only)
- Lista de pedidos en real-time (Supabase Realtime)
- Progresión de status: pagado → preparando → listo → entregado
- Ruta `/admin` (fuera del sistema i18n)

## Pendientes / Por Configurar

| Item | Descripción | Bloqueado por |
|------|-------------|---------------|
| T1 Pagos API key | Obtener credenciales reales | Registro en t1pagos.com |
| Prueba e2e | Flujo completo con tarjeta sandbox | T1 Pagos key real |

## Desactivadas

| Feature | Flag | Razón |
|---------|------|-------|
| Delivery | `FEATURES.DELIVERY_ENABLED: false` | Solo pickup por ahora |
| PWA | `FEATURES.PWA_ENABLED: false` | Futuro |
| Chicken 3D model | Removido del scene | Preferencia del usuario |
| Gradientes | N/A | Preferencia: colores sólidos |
