# Setup y Deploy

## Requisitos
- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Cuenta en Supabase (gratis)
- Cuenta en Openpay (para pagos — pendiente)
- Cuenta en Vercel (para deploy)

## Setup Local

### 1. Clonar e instalar
```bash
git clone <repo-url>
cd cunpolloweb
pnpm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env.local
```
Editar `.env.local` con los valores reales (ver `docs/env-vars.md`).

### 3. Configurar Supabase
1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a SQL Editor
3. Pegar y ejecutar el contenido de `supabase/schema.sql`
4. Copiar URL, anon key y service role key a `.env.local`

### 4. Configurar Openpay (opcional para dev)
Pendiente de integracion. Ver `docs/env-vars.md` para las variables necesarias.

### 5. Ejecutar
```bash
pnpm dev
```
Abrir http://localhost:3000

## Desarrollo sin servicios externos

El carrito y las paginas de menu/cart funcionan sin Supabase ni Openpay.
Solo el flujo de checkout y admin requieren los servicios configurados.

Para desarrollar sin ellos:
- El carrito funciona completo (localStorage)
- La página de checkout mostrará un error al intentar pagar
- El admin redirigirá al login

## Deploy a Vercel

### Configuración actual (producción)
- **Vercel project**: `jorgesalvatellas-projects/cunpolloweb`
- **URL Vercel**: https://cunpolloweb.vercel.app
- **Dominio**: https://cunpollo.com
- **Git**: Conectado a `jorgesalvatella/cunpolloweb` — push a `main` = deploy automático
- **Repo**: https://github.com/jorgesalvatella/cunpolloweb

### DNS y SSL
- DNS en **Cloudflare** con proxy **ON** (nube naranja)
- Cloudflare SSL mode: **Full (Strict)**
- Registros DNS:
  - `@` CNAME → `cname.vercel-dns.com` (proxy ON)
  - `www` CNAME → `cname.vercel-dns.com` (proxy ON)
- Si necesitas re-verificar el dominio en Vercel, apaga el proxy temporalmente

### Variables de entorno en Vercel
Configuradas en Vercel Dashboard → Settings → Environment Variables (production):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENPAY_MERCHANT_ID` (pendiente)
- `OPENPAY_PRIVATE_KEY` (pendiente)
- `ADMIN_PASSWORD`

### Deploy manual (CLI)
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Primer setup desde cero
1. Ir a [vercel.com](https://vercel.com) → New Project → Import repo
2. Framework: Next.js (auto-detectado)
3. Agregar env vars de `.env.example` en Settings → Environment Variables
4. Push a `main` = deploy automático

## Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Dev server con Turbopack |
| `pnpm build` | Build de producción |
| `pnpm start` | Servir build de producción |
| `pnpm lint` | Ejecutar ESLint |
| `vercel --prod` | Deploy manual a producción |
| `vercel env ls` | Ver env vars en Vercel |

## Notas sobre la migración desde Cloudflare Pages
- Se eliminó `output: "export"` de `next.config.ts`
- Se reactivó el middleware de next-intl
- Se eliminó `generateStaticParams` del locale layout
- El sitio ahora requiere un server (Vercel) en lugar de static hosting
- Dominio migrado de Cloudflare Pages a Vercel manteniendo Cloudflare como DNS/proxy
