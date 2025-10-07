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

- [x] CSV upload (sales, inventory) → validation → staging tables
- [x] ETL job: normalize to core schemas
- [ ] Google Sheets connector (read-only)
- [x] Error handling for imports
- [x] Audit log of data imports

### Phase 3 — KPIs & Dashboards
- [ ] KPI cards: revenue
- [x] KPI cards: units sold
- [x] KPI cards: stock-outs
- [ ] KPI cards: margin
- [x] Charts: time series sales, top products
- [x] Charts: weekday vs weekend (2025-10-07)
- [x] Drill-downs: product → daily trend
- [x] Date range + filters (days selector on Sales charts) (2025-10-07)
- [x] KPI cards: inventory (total products, low-stock, total quantity)
- [x] Chart: top products (by quantity)

### Phase 4 — Alerts & Jobs
- [x] Threshold alerts: low inventory per product (API + UI list)
- [x] Scheduling: nightly cron job
- [ ] Delivery: email (P0), SMS (P1)
- [ ] Alert config UI
- [x] Alert history/status (model + API + UI) (2025-10-07)

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
- [x] Inline edit & delete (auto-refresh)
- [x] KPI cards component (sales + stock metrics)
- [x] Sales charts component (time series + product trends)
- [x] Product trend drill-down modal
- [x] Import history with delete functionality
- [x] Confirmation modals (reusable component)
- [x] Products with sales summary display
- [x] Dark theme UI with modern design
- [x] Two-column layout (main + sidebar)
- [x] Single-viewport layout (no page scroll)
- [ ] Reusable chart components
- [ ] Form validation (Zod/RHF)
- [ ] Toasts & error boundaries

- [x] Express + TypeScript scaffold
- [x] Routes: `GET/POST/PATCH/DELETE /api/products` (Prisma-backed)
- [ ] Prisma models & migrations
- [x] Routes: GET/POST/PATCH/DELETE /api/products (Prisma-backed)
- [x] Prisma models & migrations (initial Product)
- [x] CSV parsing pipeline
- [x] Route: GET /api/kpis/summary
- [x] Routes: GET /api/kpis/sales-timeseries, /api/kpis/product-trends
- [x] Route: GET /api/kpis/product-sales/:productId
- [x] Routes: DELETE /api/imports/jobs/:jobId, DELETE /api/imports/jobs
- [x] Background jobs (alerts - cron scheduler)
- [x] Alert job system (manual trigger + scheduled)
- [ ] Email service

### Data & Schema
- [x] Initial Prisma schema (Product)
- [x] Prisma schema (products, inventory_levels, sales, staging tables)
- [x] Indices for time-series (Sale, InventoryLevel)
- [ ] Materialized views for KPIs

### Integrations
- [ ] Google Sheets (read)
- [ ] Square/Shopify (P1)
- [ ] Twilio SMS (P1)

### AI & MCP Integration
- [ ] Define AI use-cases and success metrics (insights, what-if, recommendations)
- [ ] Architecture doc: MCP server boundaries, data access, privacy controls
- [ ] Choose LLMs per task (cost/latency/quality matrix) and fallback policy
- [ ] Data contracts for AI: JSON Schemas for `Product`, `InventoryLevel`, `Sale`, KPI aggregates
- [ ] Build feature pipelines for AI (daily sales rollups, product stats, seasonality features)
- [ ] Embeddings + vector store for product metadata and weekly summaries (RAG)
- [ ] Retrieval layer: scoped queries by org, time range, product filters
- [ ] MCP tools: 
  - [ ] Query KPIs/time-series
  - [ ] Compute reorder points (EOQ/safety stock v1)
  - [ ] Margin optimization suggestions
  - [ ] What-if simulators (price/threshold changes)
- [ ] Prompt library and guardrails (system prompts, constraints, refusal policies)
- [ ] PII redaction + RBAC-aware data filtering for AI paths
- [ ] Caching + cost controls (token budgets, response size limits)
- [ ] Evaluation harness with golden questions and offline scoring
- [ ] UI surfaces: "Ask AI" panel, explain this chart, recommendations sidebar
- [ ] Observability: prompt/response logging, traces, feedback thumbs
- [ ] Security review and model risk assessment
- [ ] Gradual rollout plan and kill switch

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
- [x] MVP dashboard charts (KPIs + bar chart)
- [x] CSV import + normalize flow (UI → API → DB)
- [x] Nightly cron job system for alerts
- [x] Product sales trends and drill-downs
- [x] Import history audit trail with management
- [x] Professional dark theme UI with single-viewport layout
- [x] MVP v1 complete - ready for demo
- [ ] First beta user onboarded
