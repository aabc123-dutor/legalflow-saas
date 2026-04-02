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
* **Framework:** React.js (Vite)
* **Styling:** Tailwind CSS / Headless UI
* **State Management:** React Context API / TanStack Query

### Backend (API)
* **Core:** Python + Django REST Framework
* **Database:** PostgreSQL
* **Auth:** JWT (JSON Web Tokens) + 2FA ready
* **Storage:** AWS S3 (Documentos de clientes)

---

## 📁 Estructura del Proyecto

```text
/legalflow-saas
├── /backend          # Django API & Business Logic
├── /frontend         # React SPA (Single Page Application)
├── /docs             # Diagramas, manuales y propuesta de TFG
├── docker-compose.yml # Orquestación para desarrollo
└── README.md
