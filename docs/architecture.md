# Arquitectura del Proyecto

## Estructura de Carpetas

```
cunpolloweb/
├── CLAUDE.md                          # Instrucciones para Claude (reglas, convenciones)
├── .env.example                       # Variables de entorno requeridas
├── next.config.ts                     # Config Next.js (sin static export)
├── package.json                       # Dependencias (pnpm)
├── supabase/
│   └── schema.sql                     # Schema de base de datos
├── docs/                              # Documentación del proyecto
│   ├── architecture.md                # (este archivo)
│   ├── features.md                    # Features y su estado
│   ├── api.md                         # Referencia de API routes
│   ├── database.md                    # Schema y modelo de datos
│   ├── env-vars.md                    # Variables de entorno
│   ├── setup.md                       # Guía de setup y deploy
│   └── changelog.md                   # Log de cambios
└── src/
    ├── middleware.ts                   # next-intl middleware (excluye /api, /admin)
    ├── app/
    │   ├── layout.tsx                 # Root layout (HTML, fonts, body)
    │   ├── error.tsx                  # Error boundary (branded, con WhatsApp link)
    │   ├── global-error.tsx           # Global error boundary (fallback minimal)
    │   ├── page.tsx                   # Redirect root → /es
    │   ├── sitemap.ts                 # Sitemap dinámico
    │   ├── robots.ts                  # Robots.txt
    │   ├── [locale]/
    │   │   ├── layout.tsx             # Locale layout (Header, Footer, CartProvider)
    │   │   ├── page.tsx               # Landing page
    │   │   ├── loading.tsx            # Loading skeleton
    │   │   ├── not-found.tsx          # 404
    │   │   ├── menu/
    │   │   │   ├── page.tsx           # Página del menú completo
    │   │   │   └── loading.tsx        # Loading del menú
    │   │   ├── cart/
    │   │   │   └── page.tsx           # Página del carrito
    │   │   ├── checkout/
    │   │   │   └── page.tsx           # Página de checkout/pago
    │   │   └── confirmation/
    │   │       └── [id]/
    │   │           └── page.tsx       # Confirmación de pedido + descarga PDF (jsPDF)
    │   ├── admin/
    │   │   ├── layout.tsx             # Layout admin (sin Header/Footer)
    │   │   ├── page.tsx               # Dashboard de pedidos
    │   │   ├── cocina/
    │   │   │   └── page.tsx           # Vista cocina (KDS tablet, dark theme)
    │   │   ├── entrega/
    │   │   │   └── page.tsx           # Vista entrega/cajera (pedidos listos)
    │   │   ├── gerente/
    │   │   │   └── page.tsx           # Vista gerente (stats, alertas, tabla)
    │   │   └── login/
    │   │       └── page.tsx           # Login admin
    │   └── api/
    │       ├── orders/
    │       │   ├── route.ts           # POST: crear orden + cobrar
    │       │   └── [id]/
    │       │       ├── route.ts       # GET: consultar orden
    │       │       └── verify/
    │       │           └── route.ts   # POST: verificar pago 3DS con Openpay
    │       ├── catalog/
    │       │   └── feed/
    │       │       └── route.ts           # GET: XML feed para Meta Commerce Manager
    │       ├── menu/
    │       │   └── route.ts               # GET: public menu data (categories, items, promotions)
    │       ├── webhooks/
    │       │   └── openpay/
    │       │       └── route.ts           # POST: webhook de Openpay (3DS completados, pagos fallidos)
    │       └── admin/
    │           ├── login/
    │           │   └── route.ts       # POST: auth con usuario+contraseña, devuelve rol
    │           ├── me/
    │           │   └── route.ts       # GET: rol del usuario autenticado
    │           ├── orders/
    │           │   ├── route.ts       # GET: listar órdenes
    │           │   └── [id]/
    │           │       └── route.ts   # PATCH: cambiar status
    │           ├── contacts/
    │           │   ├── route.ts       # GET/POST: listar/agregar contactos
    │           │   └── [id]/
    │           │       └── route.ts   # DELETE: desactivar contacto
    │           ├── menu/
    │           │   ├── route.ts       # GET/POST/PUT/DELETE: CRUD items del menu
    │           │   └── categories/
    │           │       └── route.ts   # GET/PUT: listar/actualizar categorias
    │           ├── upload/
    │           │   └── route.ts       # POST: upload imagen a Vercel Blob (sharp optimize)
    │           ├── promotions/
    │           │   ├── route.ts       # GET/POST/PUT: listar/crear/actualizar promociones
    │           │   └── [id]/
    │           │       └── route.ts   # DELETE: eliminar promocion
    │           ├── phones/
    │           │   └── route.ts       # GET/POST/PUT/DELETE: CRUD telefonos admin notificaciones
    │           └── campaigns/
    │               └── route.ts       # GET/POST: historial/enviar campana
    ├── components/
    │   ├── layout/
    │   │   ├── Header.tsx             # Navbar (logo, nav, cart icon, lang switcher)
    │   │   ├── Footer.tsx             # Footer (redes, horarios, contacto)
    │   │   └── LanguageSwitcher.tsx   # Toggle ES/EN
    │   ├── landing/
    │   │   ├── HeroSection.tsx        # Hero con 3D scene
    │   │   ├── MenuPreview.tsx        # Preview de items populares
    │   │   ├── LocationSection.tsx    # Mapa y dirección
    │   │   ├── VideoSection.tsx       # Video del restaurante
    │   │   ├── RewardsSection.tsx      # Programa de lealtad CunPollo Rewards (Tagocard)
    │   │   └── CTASection.tsx         # Call to action
    │   ├── menu/
    │   │   ├── MenuContainer.tsx      # Contenedor del menú con filtros
    │   │   ├── MenuItemCard.tsx       # Tarjeta de item del menú
    │   │   ├── MenuItemModal.tsx      # Modal con detalle + agregar al carrito
    │   │   ├── CategoryTabs.tsx       # Tabs de categorías
    │   │   └── RewardsBanner.tsx     # Banner dismissible de Rewards en menu
    │   ├── cart/
    │   │   ├── CartFloatingButton.tsx # FAB flotante con badge
    │   │   └── CartItemRow.tsx        # Fila de item en el carrito
    │   ├── checkout/
    │   │   ├── CheckoutForm.tsx       # Formulario completo de checkout
    │   │   └── CardInput.tsx          # Inputs de tarjeta con formateo
    │   ├── admin/
    │   │   ├── OrdersDashboard.tsx    # Dashboard real-time de pedidos
    │   │   ├── OrderCard.tsx          # Tarjeta de pedido con acciones
    │   │   ├── WhatsAppHub.tsx        # Hub principal de WhatsApp promos (tabs)
    │   │   ├── ContactList.tsx        # Lista/CRUD de contactos WhatsApp
    │   │   ├── SendPromo.tsx          # Formulario para enviar promos via template
    │   │   ├── CampaignHistory.tsx    # Historial de campanas enviadas
    │   │   ├── MenuManager.tsx        # Gestion de menu: editar precio, disponibilidad, descuentos (Realtime)
    │   │   ├── PromotionsManager.tsx  # CRUD de promociones de orden (crear, editar, activar, eliminar)
    │   │   └── AdminPhonesManager.tsx # CRUD de telefonos admin para notificaciones WhatsApp
    │   ├── ui/
    │   │   ├── Button.tsx             # Botón reutilizable
    │   │   ├── Container.tsx          # Container con max-width
    │   │   └── Badge.tsx              # Badge para tags del menú
    │   ├── seo/
    │   │   └── JsonLd.tsx             # Structured data
    │   ├── PWARegister.tsx          # Registro del service worker (client-side)
    │   ├── WhatsAppButton.tsx       # Boton flotante WhatsApp Business (+529983871387)
    │   └── three/
    │       ├── SceneWrapper.tsx       # Canvas wrapper para 3D
    │       ├── FlameParticles.tsx     # Partículas de fuego/confetti
    │       └── ChickenModel.tsx       # (desactivado por preferencia del user)
    ├── context/
    │   └── CartContext.tsx             # Context del carrito (localStorage)
    ├── data/
    │   ├── index.ts                   # Exports: getMenuItems, getMenuItemById, etc.
    │   ├── menu-items.ts              # Datos del menú (33 items, datos de Rappi)
    │   └── categories.ts             # 7 categorías del menú
    ├── hooks/
    │   ├── useMediaQuery.ts           # Hook para media queries
    │   └── useScrollDirection.ts      # Hook para dirección de scroll
    ├── i18n/
    │   ├── config.ts                  # Locales: es, en. Default: es
    │   ├── routing.ts                 # Routing config de next-intl
    │   ├── navigation.ts             # Link, useRouter tipados
    │   └── request.ts                 # Server-side locale resolver
    ├── lib/
    │   ├── constants.ts               # FEATURES flags + RESTAURANT info
    │   ├── utils.ts                   # cn() helper (clsx + tailwind-merge)
    │   ├── fonts.ts                   # Font config
    │   ├── openpay.ts                  # Openpay API wrapper (tokenize + charge)
    │   ├── twilio.ts                  # Twilio WhatsApp notifications (server-only)
    │   ├── whatsapp-templates.ts      # Registry de templates WhatsApp con metadata (SID, variables, broken flag)
    │   ├── admin-auth.ts              # Auth admin por cookie
    │   ├── menu-data.ts               # Server-side menu data from Supabase (DB fetchers + helpers)
    │   ├── rate-limit.ts              # In-memory rate limiter (sliding window)
    │   ├── audit-log.ts               # Audit log utility para acciones admin
    │   └── supabase/
    │       ├── client.ts              # Supabase browser client (anon key)
    │       └── server.ts             # Supabase server client (service_role)
    ├── messages/
    │   ├── es.json                    # Traducciones español
    │   └── en.json                    # Traducciones inglés
    ├── styles/
    │   └── globals.css                # Tailwind v4 + @theme tokens
    └── types/
        ├── menu.ts                    # MenuItem, MenuCategory, BilingualText, Promotion, Db* types
        ├── order.ts                   # Order, CartItem, OrderItem, PaymentStatus
        └── restaurant.ts             # Restaurant type
```

## Flujo de Datos

```
[Cliente]
  MenuItemModal → CartContext (localStorage)
  CartPage → CheckoutForm → POST /api/orders

[Servidor]
  POST /api/orders → rate limit → idempotency check → batch fetch items → Supabase INSERT → Openpay charge → Supabase UPDATE → WhatsApp notify → response
  POST /api/orders/[id]/verify → verificar cobro 3DS con Openpay → Supabase UPDATE → WhatsApp notify
  POST /api/webhooks/openpay → verificar token → buscar orden → verificar cargo con Openpay API → Supabase UPDATE → WhatsApp notify

[Admin]
  /admin/login → POST /api/admin/login → cookie
  /admin → GET /api/admin/orders → Supabase SELECT
  OrderCard → PATCH /api/admin/orders/[id] → Supabase UPDATE → WhatsApp notify (fire-and-forget)
  Supabase Realtime → auto-refresh dashboard

[Vistas Especializadas]
  /admin/cocina → GET /api/admin/orders (paid+preparing) → Supabase Realtime → EMPEZAR/LISTO
  /admin/entrega → GET /api/admin/orders?status=ready → Supabase Realtime → ENTREGADO
  /admin/gerente → GET /api/admin/orders?status=all → Stats + alertas + tabla completa
```
