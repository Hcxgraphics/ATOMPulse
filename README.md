<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/atom.svg" alt="AtomPulse Logo" width="120" />
  <h1>AtomPulse</h1>
  <p><strong>Enterprise Performance & Goal Intelligence Platform</strong></p>
  <p><em>Built for AtomQuest Hackathon 1.0</em></p>

  [![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![Express.js](https://img.shields.io/badge/Express-4.x-white?style=for-the-badge&logo=express)](https://expressjs.com/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
  [![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://prisma.io)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
</div>

---

## 🚀 Live Demo
**URL:** [https://atompulse-demo.render.com](https://atompulse-demo.render.com) (Placeholder)

### Demo Credentials (All Passwords: `AtomPulse@2025`)
| Role | Email | Use Case |
|------|-------|----------|
| **Employee** | `employee@atompulse.com` | Create goals, log check-ins, track progress |
| **Manager** | `manager@atompulse.com` | Review/Approve goals, provide check-in feedback, team overview |
| **Admin/HR** | `admin@atompulse.com` | System configuration, Analytics, Shared Goals, Audit Logs |

*(Quick-login badges are available on the sign-in page to switch contexts instantly during the demo!)*

---

## 📖 Executive Summary
**AtomPulse** is a deployment-ready, full-stack web application designed to support the complete lifecycle of employee performance goals. It enforces strict business rules (e.g., 100% total weightage, check-in windows, lock mechanisms) while presenting a premium, Jira/Notion-inspired UI experience.

---

## ✨ Features

### Phase 1: Core Goal Management
- **Goal Sheet Lifecycle:** Draft -> Submitted -> Approved -> Locked -> Returned.
- **Complex Business Rules Engine:** Enforces weightage constraints (10% min, exactly 100% total), maximum goals per sheet (8), and prevents editing post-approval without HR intervention.
- **Quarterly Check-ins:** Configurable check-in windows per quarter where progress scores are automatically computed based on 4 distinct UOM formulas (Min, Max, Timeline, Zero-based).

### Phase 2: Manager & Admin Capabilities
- **Manager Kanban Review:** Managers review pending goals in a clean slide-over panel, editing weightages inline or returning sheets with feedback.
- **Shared Goals Architecture:** Admins can "Push" organizational goals to entire departments. Child goals auto-sync progress when the primary owner logs an achievement.
- **Audit Trail & Governance:** Immutable audit logs tracking every change to a locked goal sheet.

### Phase 3: Advance Features
- **Automated Escalation Engine:** Bull+Redis cron jobs detect overdue submissions and approvals, escalating up the management chain.
- **Analytics Dashboard:** Recharts-powered visualization of completion rates, QoQ trends, and manager effectiveness.
- **XLSX Exports:** ExcelJS implementation for downloading highly formatted achievement reports.
- **Event-Driven Notifications:** Real-time in-app notifications and email integration (Resend).

---

## 🏗 Architecture & Repository Structure

This project uses a **Turborepo** monorepo structure.

```text
atompulse/
├── apps/
│   ├── web/           # Next.js 14 App Router (Frontend)
│   └── api/           # Express.js API (Backend)
├── packages/
│   ├── ui/            # Shared component library (shadcn/ui + Tailwind)
│   ├── db/            # Prisma schema, migrations, seed script
│   ├── types/         # Zod schemas shared across the stack
│   └── config/        # Shared ESLint & TS configs
└── infra/             # Deployment configurations (Render.com)
```

### Architecture Diagram
See [docs/architecture.md](./docs/architecture.md) for the detailed flow.

---

## 🚀 Local Development (No Docker Required)

### Prerequisites
- Node.js 20+ → https://nodejs.org
- PostgreSQL 15+ → https://postgresql.org (or use Neon free cloud DB)
- Redis 7+ → https://redis.io (or use Upstash free cloud Redis)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/Hcxgraphics/ATOMPulse.git
cd ATOMPulse

# 2. Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# → Edit both files with your DB + Redis URLs

# 3. Install all dependencies
npm install

# 4. Set up database (run migrations + seed demo data)
npm run db:migrate
npm run db:seed

# 5. Start development servers
npm run dev
```

### 🌐 Access
- **Web App:** http://localhost:3000
- **API:** http://localhost:4000
- **Prisma Studio (DB GUI):** `npm run db:studio` → http://localhost:5555

### 🔑 Demo Credentials
| Role | Email | Password |
|---|---|---|
| Employee | employee@atompulse.com | AtomPulse@2025 |
| Manager | manager@atompulse.com | AtomPulse@2025 |
| Admin | admin@atompulse.com | AtomPulse@2025 |

---

## 🛡 License
MIT License. Created for the AtomQuest Hackathon 1.0.
