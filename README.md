# ⚖️ LegalFlow: The OS for Modern Solo Lawyers

**LegalFlow** es una plataforma SaaS diseñada para transformar la operativa de micro-despachos jurídicos. Menos administración, más abogacía.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Django%20%7C%20PostgreSQL-green)](https://github.com/tu-usuario/legalflow)

---

## 🚀 Propuesta de Valor
Los abogados autónomos pierden hasta un 30% de su tiempo en tareas no facturables. LegalFlow resuelve la "asfixia administrativa" mediante:

* **Automatización Fiscal:** Generación de facturas con cálculo automático de IVA e IRPF (normativa española).
* **Portal del Cliente Seguro:** Intercambio de documentación cifrada bajo estándares RGPD.
* **Control de Expedientes:** Workflow dinámico para el seguimiento de casos judiciales.
* **Asistente Tributario:** Dashboard en tiempo real para la previsión de modelos 303 y 130.

---

## 🛠️ Tech Stack
### Frontend
* **Framework:** Next.js 14 (App Router) + React 18 + TypeScript
* **Styling:** Tailwind CSS
* **Estado y datos:** Zustand (sesión) + TanStack Query (datos del servidor)
* **Formularios:** React Hook Form + Zod

### Backend (API)
* **Core:** Node.js + NestJS + TypeScript
* **Base de datos:** PostgreSQL + Prisma ORM
* **Auth:** JWT (access token + refresh token en cookie HttpOnly)
* **Colas / Cache:** Redis + BullMQ
* **IA:** Claude API (Anthropic) — asistente de navegación y chat de jurisprudencia (búsqueda simple, pendiente de vectorización con pgvector para RAG real)
* **Almacenamiento:** AWS S3 (SDK integrado; subida de documentos de clientes pendiente de completar)
---
## 📁 Estructura del Proyecto

```text
/legalflow-saas
├── /apps
│   ├── /api            # Backend NestJS — API REST y lógica de negocio
│   └── /web            # Frontend Next.js — interfaz del despacho
├── /packages           # Código compartido entre apps (reservado, vacío por ahora)
├── docker-compose.yml  # Postgres, Redis y Mailhog para desarrollo local
├── pnpm-workspace.yaml # Configuración del monorepo (pnpm workspaces)
└── README.md
```
