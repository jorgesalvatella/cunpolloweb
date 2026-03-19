# Pre-Launch Audit — CUNPOLLO Ecommerce

**Fecha de auditoría:** 2026-03-18
**Fecha de lanzamiento:** 2026-03-20 (viernes)
**Auditor:** Claude Code
**Stack:** Next.js 15 + Supabase + Openpay + Twilio WhatsApp + Vercel

---

## Resumen Ejecutivo

Se revisaron 17 API routes, el flujo completo de checkout/pago, el panel admin, la configuración de Supabase, la integración con Openpay, y la configuración de deploy. Se identificaron **30 issues** categorizados por severidad.

| Severidad | Cantidad | Descripción |
|-----------|----------|-------------|
| CRITICO   | 6        | Pueden causar data leak, cargos duplicados o pedidos perdidos |
| ALTO      | 7        | Vulnerabilidades de seguridad o bugs que afectan operación |
| MEDIO     | 11       | Mejoras importantes para estabilidad y UX |
| BAJO      | 6        | Mejoras menores, hardening adicional |

---

## CRITICO — Resolver antes del viernes

### 1. RLS permite leer TODAS las ordenes sin autenticación

- **Archivo:** `supabase/schema.sql:48-50`
- **Problema:** La policy "Public read by id" usa `USING (true)`, lo que permite a cualquier persona con el anon key leer todas las ordenes — nombres, telefonos, totales, items, status de pago.
- **Impacto:** Fuga de datos personales de clientes. Violación de privacidad.
- **Solución:** Cambiar la policy a algo como:
  ```sql
  CREATE POLICY "Public read by id"
    ON orders FOR SELECT
    USING (id = current_setting('request.jwt.claims')::json->>'sub'::uuid);
  ```
  O mejor: eliminar la policy y que solo el service_role (backend) pueda leer ordenes.

---

### 2. Sin rate limiting en `/api/orders`

- **Archivo:** `src/app/api/orders/route.ts`
- **Problema:** No hay límite de requests. Un atacante puede:
  - Probar tarjetas robadas en masa (card testing)
  - Hacer DoS al sistema de pagos
  - Spamear notificaciones WhatsApp a numeros de clientes
- **Impacto:** Abuso de Openpay, costos de Twilio, saturación del sistema.
- **Solución:** Implementar rate limiting con Upstash Redis + `@upstash/ratelimit`:
  - Per IP: 10 requests/minuto
  - Per teléfono: 5 ordenes/hora

---

### 3. Sin rate limiting en `/api/admin/login`

- **Archivo:** `src/app/api/admin/login/route.ts`
- **Problema:** Credenciales se validan contra env vars sin protección contra brute force. Intentos ilimitados.
- **Impacto:** Un atacante puede adivinar la contraseña del admin con suficiente tiempo.
- **Solución:** Max 5 intentos por IP cada 15 minutos. Bloquear temporalmente después de fallos consecutivos.

---

### 4. Sin idempotency key en pagos — riesgo de cargos duplicados

- **Archivo:** `src/app/api/orders/route.ts:118-126`
- **Problema:** Si la red falla después de que Openpay cobra pero antes de que el cliente reciba respuesta, el retry crea una segunda orden + segundo cargo.
- **Impacto:** Cliente paga doble. Disputa de cargo. Pérdida de confianza.
- **Solución:**
  1. Agregar columna `idempotency_key` (UNIQUE) a tabla orders
  2. Cliente genera UUID antes de enviar
  3. Server checa si el key ya existe antes de cobrar
  4. Si existe, retorna la respuesta cacheada

---

### 5. Cart se limpia ANTES del redirect 3D Secure

- **Archivo:** `src/components/checkout/CheckoutForm.tsx:250-255`
- **Problema:** El código hace `clearCart()` y luego `window.location.href = redirectUrl`. Si el usuario cierra el browser durante 3D Secure, o el banco falla:
  - El carrito ya se borró
  - La orden existe en DB con status `pending_3ds`
  - El usuario no puede recuperar su carrito ni reintentar
- **Impacto:** Pedidos huérfanos, clientes frustrados, carrito perdido.
- **Solución:** Mover `clearCart()` a la página de confirmación, DESPUÉS de verificar que el pago fue exitoso.

---

### 6. Sin webhook de Openpay — pedidos 3DS pueden quedar perdidos

- **Archivo:** No existe `/api/webhooks/openpay`
- **Problema:** Si el pago 3D Secure se completa exitosamente en el banco pero el usuario nunca regresa a la página de confirmación (cierra browser, pierde internet, etc.):
  - Openpay cobró al cliente
  - La orden queda en `pending_3ds` para siempre
  - El admin no sabe que el pago ya se hizo
  - El cliente pagó pero nunca recibe su pedido
- **Impacto:** Pérdida de ingresos, clientes enojados, disputas de cargo.
- **Solución:** Crear endpoint `/api/webhooks/openpay` que:
  1. Reciba notificaciones de Openpay cuando un cargo cambia de status
  2. Valide la firma HMAC del webhook
  3. Actualice el status de la orden en DB
  4. Envíe notificación WhatsApp al admin

---

## ALTO — Resolver antes del viernes o inmediatamente después

### 7. Falta validación UUID en endpoints DELETE admin

- **Archivos:**
  - `src/app/api/admin/contacts/[id]/route.ts:5-26`
  - `src/app/api/admin/promotions/[id]/route.ts:5-36`
- **Problema:** No se valida formato UUID antes de pasar a Supabase. Errores de DB pueden filtrar información del schema.
- **Solución:** Agregar validación UUID regex antes del query:
  ```typescript
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  ```

---

### 8. Faltan security headers en Next.js

- **Archivo:** `next.config.ts`
- **Problema:** Solo tiene headers de Service Worker. Faltan:
  - `Content-Security-Policy` — sin protección contra XSS/script injection
  - `X-Frame-Options: DENY` — sin protección contra clickjacking
  - `X-Content-Type-Options: nosniff` — browser puede MIME-sniff
  - `Referrer-Policy: strict-origin-when-cross-origin` — fuga de URLs
  - `Permissions-Policy` — sin restricción de features del browser
- **Nota:** Cloudflare provee algo de protección, pero Next.js debe agregar headers como defense-in-depth.

---

### 9. Admin auth cookie usa salt estático

- **Archivo:** `src/lib/admin-auth.ts:37`
- **Problema:** El HMAC-SHA256 usa `"cunpollo-admin-salt"` hardcodeado. El token es determinístico — si alguien obtiene el cookie, puede usarlo indefinidamente (hasta logout). No hay rotación de sesión.
- **Impacto:** Session hijacking si el cookie se filtra.
- **Solución:** Usar tokens de sesión aleatorios con expiración corta (1-2 horas), idealmente almacenados server-side.

---

### 10. Sin validación de transiciones de estado de orden

- **Archivo:** `src/app/api/admin/orders/[id]/route.ts:17-20`
- **Problema:** Se valida que el status sea uno válido, pero no se valida la transición. Un admin puede marcar:
  - `picked_up` → `pending` (imposible)
  - `cancelled` → `preparing` (no tiene sentido)
  - `ready` → `paid` (retroceso)
- **Solución:** Implementar state machine:
  ```
  pending → paid → preparing → ready → picked_up
  pending → cancelled
  paid → cancelled (con refund)
  ```

---

### 11. Doble-click en botón de pagar puede enviar 2 requests

- **Archivo:** `src/components/checkout/CheckoutForm.tsx:421`
- **Problema:** Si el usuario hace doble-click antes de que `loading` se active, se pueden enviar 2 requests de pago simultáneos.
- **Impacto:** Cargos duplicados (relacionado con issue #4).
- **Solución:** Deshabilitar el botón inmediatamente con `e.preventDefault()` y debounce, o usar un ref para trackear si ya se envió.

---

### 12. Origin header no validado en URL de confirmación

- **Archivo:** `src/app/api/orders/route.ts:112`
- **Problema:** El código lee `request.headers.get("origin")` para construir la URL de confirmación que Openpay usa para redirect. No se valida contra whitelist.
- **Impacto:** Un atacante podría inyectar un origin malicioso y redirigir al usuario a un sitio de phishing después del 3DS.
- **Solución:**
  ```typescript
  const validOrigins = ["https://cunpollo.com", "https://www.cunpollo.com"];
  const origin = validOrigins.includes(request.headers.get("origin") || "")
    ? request.headers.get("origin")
    : "https://cunpollo.com";
  ```

---

### 13. N+1 queries al crear orden

- **Archivo:** `src/app/api/orders/route.ts:56-61`
- **Problema:** Se llama `getMenuItemByIdFromDB()` en un loop por cada item del carrito. Si el carrito tiene 10 items = 10 queries a Supabase.
- **Impacto:** Latencia en checkout, especialmente con carritos grandes.
- **Solución:** Batch fetch todos los items en una sola query:
  ```typescript
  const menuItemIds = body.items.map(i => i.menuItemId);
  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("*")
    .in("id", menuItemIds);
  ```

---

## MEDIO — Resolver primera semana

### 14. Faltan error boundaries

- **Ubicación esperada:** `src/app/error.tsx`, `src/app/global-error.tsx`
- **Problema:** No existen. Un error no manejado muestra la página genérica de Next.js sin branding ni opciones de recuperación.
- **Impacto:** UX pobre cuando algo falla. El usuario no sabe qué hacer.
- **Solución:** Crear `error.tsx` y `global-error.tsx` con diseño CUNPOLLO, botón de "volver al inicio" y opción de contacto WhatsApp.

---

### 15. Sin validación Luhn en número de tarjeta

- **Archivo:** `src/components/checkout/CardInput.tsx:46-55`
- **Problema:** Solo se formatea el número (espacios), no se valida con algoritmo Luhn. Tarjetas inválidas llegan a Openpay innecesariamente.
- **Nota:** OpenPay SDK tiene `window.OpenPay.card.validateCardNumber()` — ya está cargado pero no se usa.
- **Solución:** Usar la función de validación del SDK antes de tokenizar.

---

### 16. Sin validación de fecha de expiración

- **Archivo:** `src/components/checkout/CardInput.tsx:60-68`
- **Problema:** El campo acepta MM/YY pero no valida:
  - Que el mes sea 01-12
  - Que la fecha no esté vencida
  - Que el año sea razonable
- **Impacto:** Tarjetas vencidas llegan a Openpay, error críptico para el usuario.

---

### 17. Ordenes en `processing` no tienen timeout

- **Archivo:** `src/app/api/orders/route.ts:95`
- **Problema:** Si Openpay no responde (timeout de red), la orden queda en `payment_status: "processing"` para siempre. El admin ve ordenes atoradas.
- **Solución:** Cron job o database trigger que marque ordenes en `processing` por más de 30 min como `timeout`. Permitir retry manual.

---

### 18. Sin funcionalidad de refund

- **Problema:** No existe endpoint de reembolso. Admin puede cancelar ordenes pero el dinero queda en Openpay.
- **Impacto:** Disputas de cargo, clientes insatisfechos.
- **Solución:** Crear `/api/admin/orders/[id]/refund` que llame a la API de refund de Openpay y actualice `payment_status: "refunded"`.

---

### 19. Carrito no valida items eliminados del menú

- **Archivo:** `src/context/CartContext.tsx:36-66`
- **Problema:** El carrito persiste en localStorage. Si un producto se elimina del menú o se marca como no disponible, los items fantasma causan error en checkout.
- **Solución:** Al cargar el carrito, filtrar items contra el menú actual:
  ```typescript
  const filtered = saved.filter(item => menuItems.find(m => m.id === item.menuItemId && m.available));
  ```

---

### 20. Floating-point en total del carrito

- **Archivo:** `src/context/CartContext.tsx:102-105`
- **Problema:** JavaScript floating-point puede causar que el total del carrito sea `$219.9999999` vs `$220.00` calculado por el server.
- **Impacto:** Discrepancia visual, confusión del usuario.
- **Solución:** `Math.round(total * 100) / 100`

---

### 21. Phone normalization inconsistente

- **Archivos:** `src/app/api/orders/route.ts:41` vs `src/lib/twilio.ts:48-55`
- **Problema:** La creación de orden limpia `[\s\-()]` pero `formatPhone()` en Twilio tiene lógica diferente. Podría causar que el WhatsApp se envíe a un formato de número incorrecto.
- **Solución:** Usar una sola función compartida de normalización de teléfono.

---

### 22. Sin audit log de acciones admin

- **Archivos:** Todas las rutas admin (`/api/admin/orders/[id]`, `/api/admin/menu`, etc.)
- **Problema:** No se registra quién hizo qué cambio, cuándo, ni cuál era el valor anterior.
- **Impacto:** Imposible auditar compliance o detectar cambios no autorizados.
- **Solución:** Crear tabla `admin_audit_log` con: user, action, entity, old_value, new_value, timestamp.

---

### 23. Campañas WhatsApp sin check de opt-in

- **Archivo:** `src/app/api/admin/campaigns/route.ts:74-96`
- **Problema:** Al enviar campañas masivas, no se verifica si los contactos dieron consentimiento para recibir marketing. WhatsApp Business requiere opt-in explícito.
- **Impacto:** Suspensión de cuenta WhatsApp Business, quejas de usuarios.
- **Solución:** Agregar campo `opted_in_marketing` a tabla contacts, filtrar antes de enviar.

---

### 24. Images con flag `unoptimized`

- **Archivos:**
  - `src/components/menu/MenuItemCard.tsx:63`
  - `src/components/menu/MenuItemModal.tsx:64`
- **Problema:** Next.js Image tiene `unoptimized` — salta la optimización automática de Vercel (resize por viewport, CDN cache, formato moderno).
- **Nota:** Las imágenes ya se optimizan en upload (WebP, max 1620x1080), así que el impacto es menor.
- **Solución:** Quitar `unoptimized` para que Vercel optimice adicionalmente.

---

## BAJO — Resolver segunda semana

### 25. Sin CSRF tokens en admin routes

- **Archivos:** Todos los PATCH/PUT/DELETE de admin
- **Problema:** No hay tokens CSRF explícitos. Si un admin visita un sitio malicioso, podrían cambiar status de ordenes.
- **Mitigación actual:** Cookie tiene `sameSite: lax` que provee protección parcial.
- **Solución ideal:** Implementar CSRF tokens en formularios admin.

---

### 26. Faltan indexes en columnas frecuentemente consultadas

- **Archivo:** `supabase/schema.sql`
- **Columnas sin index:**
  - `orders.order_number` — usado en queries de API
  - `orders.customer_phone` — usado para notificaciones WhatsApp
  - `menu_items.available` — usado para filtrar items disponibles
  - `categories.active` — usado para listar categorías activas
  - `promotions.active` — usado para cargar promos activas
- **Impacto:** Bajo con pocos datos, pero degrada con volumen.

---

### 27. Traducciones hardcodeadas en español

- **Archivos:**
  - `src/components/checkout/CheckoutForm.tsx:218` — `"El sistema de pago no esta listo..."`
  - `src/app/[locale]/confirmation/[id]/page.tsx:97` — `"Comer en restaurante"` / `"Para llevar"`
- **Problema:** Estos textos no usan `t()` de next-intl. Si el usuario cambia a inglés, se muestran en español.
- **Solución:** Mover a `src/messages/{es,en}.json` y usar `t()`.

---

### 28. Sin autocomplete hints en inputs de tarjeta

- **Archivo:** `src/components/checkout/CardInput.tsx`
- **Problema:** Faltan atributos `autoComplete="cc-number"`, `autoComplete="cc-exp"`, `autoComplete="cc-csc"`. Browsers y password managers no pueden auto-rellenar datos de tarjeta.
- **Impacto:** Fricción en checkout, especialmente en móvil.

---

### 29. Sin `beforeunload` warning durante procesamiento de pago

- **Archivo:** `src/components/checkout/CheckoutForm.tsx`
- **Problema:** Si el usuario cierra la pestaña o navega atrás mientras `loading=true` (pago procesándose), no recibe warning. El pago puede completarse silenciosamente.
- **Solución:**
  ```typescript
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (loading) { e.preventDefault(); }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [loading]);
  ```

---

### 30. Errores de campañas exponen teléfonos en response

- **Archivo:** `src/app/api/admin/campaigns/route.ts:115`
- **Problema:** El array de errores incluye números de teléfono: `"${contact.phone}: ${result.error}"`. Si la respuesta se intercepta, expone PII.
- **Solución:** Solo retornar conteo de errores. Loggear detalles server-side.

---

## Lo que está BIEN (no tocar)

| Area | Status | Detalle |
|------|--------|---------|
| Cálculo de precios server-side | OK | Cliente no controla montos — `route.ts:54-83` |
| Tokenización de tarjetas | OK | PCI compliant, datos nunca tocan backend |
| 3D Secure con verificación server-side | OK | `verify/route.ts` consulta Openpay como source of truth |
| Modo producción activo | OK | `OPENPAY_SANDBOX=false`, credenciales de producción |
| Auth en todos los endpoints admin | OK | `verifyAdmin()` en cada ruta |
| Service role key solo en server | OK | Nunca expuesto en client-side code |
| Queries parametrizadas | OK | Sin riesgo de SQL injection |
| Realtime subscriptions con cleanup | OK | `removeChannel()` en unmount de cada componente |
| Timing-safe password comparison | OK | `crypto.timingSafeEqual` en `admin-auth.ts` |
| Image upload con optimización | OK | Sharp WebP + resize automático |
| SEO completo | OK | robots.txt, sitemap.ts, OG tags, JSON-LD |
| PWA manifest | OK | Icons, screenshots, theme-color configurados |
| TypeScript strict mode | OK | `tsconfig.json` con `strict: true` |
| httpOnly + secure cookies | OK | Admin cookies no accesibles por JS |
| Validación de input en servidor | OK | Nombre 2-100 chars, phone regex, qty 1-100, max 50 items |

---

## Checklist de Acciones Pre-Viernes

- [x] **CRITICO #1:** Arreglar RLS en tabla orders (quitar `USING (true)`) — CORREGIDO: policy eliminada, solo service_role lee ordenes
- [x] **CRITICO #2:** Implementar rate limiting en `/api/orders` — CORREGIDO: 10 req/min por IP
- [x] **CRITICO #3:** Implementar rate limiting en `/api/admin/login` — CORREGIDO: 5 intentos/15 min por IP
- [x] **CRITICO #4:** Agregar idempotency key en flujo de pagos — CORREGIDO: columna + UUID del cliente
- [x] **CRITICO #5:** Mover `clearCart()` después de verificación de pago exitoso — CORREGIDO: se limpia en confirmation page
- [x] **CRITICO #6:** Crear webhook de Openpay para capturar pagos 3DS abandonados — CORREGIDO: `/api/webhooks/openpay`
- [x] **ALTO #7:** Validación UUID en endpoints DELETE admin — CORREGIDO
- [x] **ALTO #8:** Security headers (X-Frame-Options, X-Content-Type-Options, etc.) — CORREGIDO en next.config.ts
- [x] **ALTO #9:** Admin auth cookie salt dinámico — CORREGIDO: usa `ADMIN_COOKIE_SECRET` env var
- [x] **ALTO #10:** Validación de transiciones de estado de orden — CORREGIDO: state machine implementada
- [x] **ALTO #11:** Prevenir doble-click en botón de pagar — CORREGIDO: submittingRef
- [x] **ALTO #12:** Validar origin header contra whitelist — CORREGIDO
- [x] **ALTO #13:** N+1 queries al crear orden — CORREGIDO: batch fetch con `.in()`
- [x] **MEDIO #14:** Error boundaries — CORREGIDO: `error.tsx` y `global-error.tsx`
- [x] **MEDIO #15:** Validación Luhn en tarjeta — CORREGIDO en CardInput.tsx
- [x] **MEDIO #16:** Validación fecha de expiración — CORREGIDO en CardInput.tsx
- [x] **MEDIO #19:** Carrito valida items eliminados del menú — CORREGIDO en CartContext.tsx
- [x] **MEDIO #20:** Floating-point en total del carrito — CORREGIDO: `Math.round(total * 100) / 100`
- [x] **MEDIO #21:** Phone normalization — CORREGIDO: `formatPhone()` exportado como función compartida
- [x] **MEDIO #24:** Images con flag `unoptimized` — CORREGIDO: flag removido
- [x] **BAJO #26:** Indexes en columnas frecuentemente consultadas — CORREGIDO: 5 indexes agregados
- [x] **BAJO #27:** Traducciones hardcodeadas en español — CORREGIDO: movidas a messages JSON
- [x] **BAJO #28:** Autocomplete hints en inputs de tarjeta — CORREGIDO: cc-number, cc-exp, cc-csc, cc-name
- [x] **BAJO #29:** beforeunload warning durante pago — CORREGIDO en CheckoutForm.tsx
- [x] **MEDIO #17:** Ordenes en processing sin timeout — CORREGIDO: cron job `/api/cron/timeout-orders` cada 15 min
- [x] **MEDIO #18:** Sin funcionalidad de refund — CORREGIDO: endpoint `POST /api/admin/orders/[id]/refund`
- [x] **MEDIO #22:** Sin audit log de acciones admin — CORREGIDO: tabla `admin_audit_log` + logging en mutations
- [x] **MEDIO #23:** Campañas WhatsApp sin check de opt-in — CORREGIDO: filtro `opted_in_marketing` en contacts
- [x] **BAJO #25:** Sin CSRF tokens en admin routes — CORREGIDO: Origin header validation + sameSite: lax
- [x] **BAJO #30:** Errores de campañas exponen teléfonos — CORREGIDO: solo conteo en response
- [ ] **RECORDAR:** Configurar `ADMIN_COOKIE_SECRET` en Vercel (string aleatorio largo)
- [ ] **RECORDAR:** Configurar `OPENPAY_WEBHOOK_TOKEN` en Vercel y en dashboard de Openpay
- [ ] **RECORDAR:** Configurar `CRON_SECRET` en Vercel para el cron job de timeout
- [ ] **RECORDAR:** Registrar URL del webhook en Openpay: `https://cunpollo.com/api/webhooks/openpay`
- [ ] **RECORDAR:** Eliminar producto de prueba "Prueba" ($2) desde admin
- [ ] **RECORDAR:** Verificar que env vars en Vercel son las de producción
- [ ] **RECORDAR:** Hacer un pedido de prueba completo con tarjeta real

---

## Notas Adicionales

### Sobre el producto de prueba
Existe un item "Prueba" a $2 MXN en la base de datos. Fue usado para testing de pagos. **Eliminarlo desde el admin antes del viernes.**

### Sobre moneda
Los montos se envían a Openpay en **pesos** (no centavos). Ejemplo: `amount: 219` = $219 MXN. Verificar que esto coincide con lo que Openpay espera según la documentación.

### Sobre Cloudflare
- SSL mode: Full (Strict) — correcto
- Proxy ON — correcto
- HTTPS enforcement viene de Cloudflare, no de Next.js

### Sobre Twilio / WhatsApp
- Todas las notificaciones (ordenes y campañas/promociones) se envían por **WhatsApp Business**, no por SMS
- El número +529983871387 es exclusivo de WhatsApp Business — SMS no se usa en ningún flujo
- Templates de WhatsApp están hardcodeados en `src/lib/twilio.ts:9-14`
