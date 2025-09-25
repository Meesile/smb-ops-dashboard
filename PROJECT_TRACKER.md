# SMB Ops Dashboard – Project Tracker

Use this as the living project dashboard. Check items off as you complete them. Add dates, owners, and notes inline.

---

## 🔭 Vision & One‑liner
**Goal:** Build an SMB operations dashboard (MVP) that ingests sales/inventory/schedule data, visualizes KPIs, and sends actionable alerts.

**One‑liner:** "A lightweight, plug‑and‑play dashboard with real‑time alerts that helps small retailers stop stock‑outs and optimize staffing."

---

## 🗺️ Roadmap (Phased)

### Phase 0 — Setup & Planning
- [x] Create repo (frontend + backend) and project scaffolding
- [x] Decide tech stack (React/TS, Node/Express, Vite, SQLite starter)
- [ ] Define target vertical & primary pain point
- [ ] Confirm success criteria
- [ ] Write initial architecture diagram & ERD

### Phase 1 — Core MVP
- [ ] Auth: email/password + magic link
- [ ] Role model: owner, manager (RBAC)
- [ ] DB setup: Postgres + Prisma migration pipeline
- [x] Basic UI shell: Navbar, pages, protected routes (MVP shell running)
- [ ] Teams/orgs: single org per account (seed data)

### Phase 2 — Data Ingestion & Modeling
- [ ] CSV upload (sales, inventory) → validation → staging tables
- [ ] ETL job: normalize to core schemas
- [ ] Google Sheets connector (read-only)
- [ ] Error handling for imports
- [ ] Audit log of data imports

### Phase 3 — KPIs & Dashboards
- [ ] KPI cards: revenue, units sold, stock-outs, margin
- [ ] Charts: time series sales, top products, weekday vs weekend
- [ ] Drill-downs: product → daily trend
- [ ] Date range + filters

### Phase 4 — Alerts & Jobs
- [x] Threshold alerts: low inventory per product (API + UI list)
- [ ] Scheduling: nightly cron job
- [ ] Delivery: email (P0), SMS (P1)
- [ ] Alert config UI
- [ ] Alert history/status

### Phase 5 — Collaboration & Workflow
- [ ] Multi-user invites
- [ ] Task assignments linked to alerts
- [ ] Real-time presence & comments
- [ ] Activity feed

### Phase 6 — Forecasting & Insights
- [ ] Simple demand forecast
- [ ] Anomaly detection
- [ ] Weekly insights summary
- [ ] Review themes from Google reviews

### Phase 7 — Hardening & Launch
- [ ] Error monitoring & logging
- [ ] Rate limiting & security headers
- [ ] Seed demo data & screenshots
- [ ] Pricing page (Free beta)
- [ ] Onboard 2–3 SMBs (beta)

---

## 🧱 Backlog by Area

### Frontend
- [x] Vite + React + TS bootstrapped
- [x] Products list + Add Product form
- [ ] Reusable chart components
- [ ] Form validation (Zod/RHF)
- [ ] Toasts & error boundaries

### Backend
- [x] Express + TypeScript scaffold
- [x] Routes: `GET/POST/PATCH/DELETE /api/products` (Prisma-backed)
- [ ] Prisma models & migrations
- [ ] CSV parsing pipeline
- [ ] Background jobs (alerts)
- [ ] Email service

### Data & Schema
- [x] Initial Prisma schema (Product)
- [ ] Prisma schema (`products`, `inventory_levels`, `sales`, `alerts`)
- [ ] Indices for time-series
- [ ] Materialized views for KPIs

### Integrations
- [ ] Google Sheets (read)
- [ ] Square/Shopify (P1)
- [ ] Twilio SMS (P1)

### DevEx & Infra
- [x] GitHub repo created and pushed
- [ ] GitHub Actions: test → build → deploy
- [ ] Dockerfiles (frontend, backend)
- [ ] Preview deployments

---

## 🎯 Milestones
- [x] Frontend + backend both run locally and talk to each other
- [x] Create & list products end-to-end (UI → API)
- [x] Persist products to a real DB (Prisma + SQLite/Postgres)
- [x] First alert triggered (when quantity < threshold)
- [ ] MVP dashboard charts
- [ ] First beta user onboarded
