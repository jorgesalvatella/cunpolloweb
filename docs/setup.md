# Setup y Deploy

## Requisitos
- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Cuenta en Supabase (gratis)
- Cuenta en T1 Pagos (para pagos)
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

### 4. Configurar T1 Pagos (opcional para dev)
1. Registrarse en [t1pagos.com](https://t1pagos.com)
2. Obtener API key de sandbox
3. Agregar a `.env.local`

### 5. Ejecutar
```bash
pnpm dev
```
Abrir http://localhost:3000

## Desarrollo sin servicios externos

El carrito y las páginas de menú/cart funcionan sin Supabase ni T1 Pagos.
Solo el flujo de checkout y admin requieren los servicios configurados.

Para desarrollar sin ellos:
- El carrito funciona completo (localStorage)
- La página de checkout mostrará un error al intentar pagar
- El admin redirigirá al login

## Deploy a Vercel

### 1. Conectar repositorio
- Ir a [vercel.com](https://vercel.com) → New Project → Import repo
- Framework: Next.js (auto-detectado)

### 2. Configurar variables de entorno
Agregar todas las variables de `.env.example` en Settings → Environment Variables.

### 3. Deploy
Push a `main` = deploy automático.

## Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Dev server con Turbopack |
| `pnpm build` | Build de producción |
| `pnpm start` | Servir build de producción |
| `pnpm lint` | Ejecutar ESLint |

## Notas sobre la migración desde Cloudflare Pages
- Se eliminó `output: "export"` de `next.config.ts`
- Se reactivó el middleware de next-intl
- Se eliminó `generateStaticParams` del locale layout
- El sitio ahora requiere un server (Vercel) en lugar de static hosting
