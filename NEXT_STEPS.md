# LegalFlow Digital

Plataforma SaaS de gestión legal para abogados y pequeños despachos.

**Stack:** Next.js 14 · NestJS · PostgreSQL (Supabase) · Redis · Prisma · Claude API · AWS S3

---

## Estructura del monorepo

```
legalflow-saas/
├── apps/
│   ├── api/          ← Backend NestJS (puerto 3001)
│   └── web/          ← Frontend Next.js 14 (puerto 3000)
├── docker-compose.yml  ← PostgreSQL + Redis + MailHog locales
├── package.json        ← pnpm workspaces raíz
└── pnpm-workspace.yaml
```

---

## Requisitos previos

- **Node.js** ≥ 20
- **pnpm** ≥ 9 → `npm install -g pnpm`
- **Docker Desktop** (para la base de datos y Redis locales)

---

## Setup inicial (primera vez)

### 1. Clonar el repositorio

```bash
git clone https://github.com/aabc123-dutor/legalflow-saas.git
cd legalflow-saas
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Levantar servicios locales (PostgreSQL + Redis)

```bash
docker compose up -d
```

Verifica que están en marcha:
```bash
docker compose ps
```

### 4. Configurar variables de entorno

**Backend:**
```bash
cp apps/api/.env.example apps/api/.env
```
Edita `apps/api/.env` y rellena como mínimo:
- `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` → cualquier string largo y aleatorio
- `ANTHROPIC_API_KEY` → tu clave de la API de Claude (https://console.anthropic.com)
- `AWS_*` → credenciales S3 (opcional en desarrollo, solo para subida de documentos)

**Frontend:**
```bash
cp apps/web/.env.example apps/web/.env.local
```
No necesita cambios para desarrollo local.

### 5. Crear las tablas de la base de datos

```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma generate
cd ../..
```

### 6. Arrancar el proyecto

```bash
pnpm dev
```

Esto levanta en paralelo:
- **Frontend** → http://localhost:3000
- **Backend** → http://localhost:3001/api/v1
- **Swagger docs** → http://localhost:3001/api/docs
- **MailHog (email)** → http://localhost:8025

---

## Módulos implementados

| Módulo | Descripción |
|--------|-------------|
| **Auth** | Registro, login, logout, refresh token (HttpOnly cookie), JWT |
| **Users** | Perfil del usuario, cambio de contraseña |
| **Clients** | CRUD de clientes del despacho |
| **Expedientes** | Gestión de asuntos y casos |
| **Documentos** | Subida de archivos (S3) vinculados a expedientes |
| **Facturas** | Emisión con IVA 21% e IRPF 15%/7% |
| **Fiscal** | Dashboard trimestral, Modelos 303 y 130, cálculo de cuotas |
| **AI** | Chatbot de navegación + chatbot RAG de jurisprudencia (Claude API) |

---

## Comandos útiles

```bash
# Solo el backend
pnpm --filter @legalflow/api dev

# Solo el frontend
pnpm --filter @legalflow/web dev

# Abrir Prisma Studio (UI de base de datos)
pnpm db:studio

# Crear una migración nueva tras editar schema.prisma
cd apps/api && npx prisma migrate dev --name <nombre>

# Ver logs de Docker
docker compose logs -f postgres
docker compose logs -f redis

# Parar los servicios Docker
docker compose down
```

---

## Próximos pasos de implementación

Los capítulos 6 (Implementación completa), 7 (Pruebas) y 8 (Conclusiones) del TFG quedan por completar:

1. **DTOs con validación** → añadir `class-validator` en todos los módulos con campos tipados
2. **Subida de documentos a S3** → implementar en `documentos.service.ts`
3. **Generación de PDF de facturas** → cola Bull + `pdf-lib`
4. **pgvector para RAG** → habilitar extensión en Supabase y usar embeddings reales
5. **Tests** → Jest para el backend, Playwright para e2e
6. **Middleware de audit log** → interceptor NestJS que registra en `audit_logs`
7. **Row Level Security** → activar políticas RLS en Supabase para producción
8. **Despliegue** → Vercel (web) + Render (api) + Supabase (DB) + Redis Cloud

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Zustand, React Hook Form, Zod |
| Backend | NestJS, TypeScript, Passport.js, JWT |
| Base de datos | PostgreSQL vía Supabase, Prisma ORM |
| Caché / Colas | Redis 7 + Bull 4 |
| Almacenamiento | AWS S3 |
| IA | Claude 3.5 Sonnet (Anthropic API) |
| Email | Nodemailer / SMTP (MailHog en local) |
| Seguridad | bcrypt, AES-256, TLS 1.3, RLS |
