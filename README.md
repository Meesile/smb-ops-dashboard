# SMB Ops Dashboard

A modern, lightweight operations dashboard designed for small businesses to track inventory, analyze sales, and receive actionable alerts — all in one place.

## 🚀 Features

### Core Functionality
- **Product Management** - Add, edit, delete, and track inventory levels with threshold alerts
- **Sales Analytics** - Real-time sales tracking with time-series and product trend visualizations
- **Low-Stock Alerts** - Automated threshold-based alerts with nightly cron jobs
- **CSV Import Pipeline** - Upload, validate, and normalize inventory data with full audit trail
- **KPI Dashboard** - At-a-glance metrics for units sold, stock-outs, and inventory levels
- **Product Drill-Down** - Individual product sales trends with 30-day history

### Data Import & Management
- CSV upload with automatic encoding detection (UTF-8, UTF-16)
- Multi-delimiter support (comma, semicolon, tab, pipe)
- Staging and validation pipeline with error reporting
- Import history with audit trail and job management
- Delete individual or all import jobs with confirmation modals

### Analytics & Insights
- Daily sales time series (units + unique products)
- Top products by sales volume
- Product-specific trend analysis
- Inventory overview charts (low-stock vs top quantity)
- Sales summary per product (total units, sale count, last sale date)

## 🛠️ Tech Stack

### Frontend
- **React 18** + **TypeScript** - Modern component-based UI
- **Vite** - Lightning-fast dev server and build tool
- **Recharts** - Powerful charting library for data visualization
- **CSS Variables** - Themeable dark UI design system

### Backend
- **Node.js** + **Express** - RESTful API server
- **TypeScript** - Type-safe backend development
- **Prisma ORM** - Type-safe database access with migrations
- **SQLite** - Lightweight database (production: PostgreSQL)
- **node-cron** - Scheduled jobs for nightly alerts
- **Multer** - CSV file upload handling
- **csv-parse** - Robust CSV parsing with validation

### Data Layer
- **Product** - Core inventory items with SKU, quantity, threshold
- **Sale** - Sales transactions with timestamp and units
- **InventoryLevel** - Time-series snapshots of inventory
- **StagingImportJob** - Import job tracking and audit
- **StagingRow** - Row-level import validation and error tracking

## 📦 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Meesile/smb-ops-dashboard.git
cd smb-ops-dashboard
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Set up the database**
```bash
# Create .env file
echo "DATABASE_URL=\"file:./prisma/dev.db\"" > .env

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

4. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

### Running Locally

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs at http://localhost:4000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# UI runs at http://localhost:5173
```

### Seeding Test Data

Add sample products and sales data:
```bash
cd backend

# Add products via API
curl -X POST http://localhost:4000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Croissant","sku":"CR-01","quantity":2,"threshold":8}'

# Or use the Add Product form in the UI
```

## 📊 API Endpoints

### Products
- `GET /api/products` - List all products with sales summary
- `POST /api/products` - Create a new product
- `PATCH /api/products/:sku` - Update product by SKU
- `DELETE /api/products/:sku` - Delete product by SKU

### KPIs & Analytics
- `GET /api/kpis/summary` - Overall KPI summary
- `GET /api/kpis/sales-timeseries?days=30` - Daily sales time series
- `GET /api/kpis/product-trends?days=30&limit=10` - Top products by sales
- `GET /api/kpis/product-sales/:productId?days=30` - Product-specific sales trend

### Alerts
- `GET /api/alerts/low-stock` - Products below threshold
- `POST /api/alerts/run-job` - Manually trigger alert job

### Imports
- `POST /api/imports/csv` - Upload and stage CSV data
- `POST /api/imports/normalize/:jobId` - Normalize staged data to core tables
- `GET /api/imports/jobs` - List recent import jobs
- `GET /api/imports/jobs/:jobId/errors` - Invalid rows for a job
- `DELETE /api/imports/jobs/:jobId` - Delete specific import job
- `DELETE /api/imports/jobs` - Delete all import jobs

## 🎨 UI Features

- **Dark Theme** - Modern, professional design with custom CSS variables
- **Responsive Layout** - Two-column grid (main content + sidebar)
- **No-Scroll Design** - Everything visible in a single viewport
- **Interactive Charts** - Recharts with dark theme, tooltips, and drill-downs
- **Confirmation Modals** - Centered popups for destructive actions
- **Real-time Updates** - Polling and auto-refresh on window focus
- **Inline Editing** - Edit products directly in the list
- **Status Badges** - Color-coded status indicators

## 🔧 Architecture

```
smb-ops-dashboard/
├── backend/
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── jobs/        # Cron jobs and schedulers
│   │   ├── lib/         # Prisma client
│   │   └── index.ts     # Express app entry
│   └── prisma/
│       ├── schema.prisma # Database schema
│       └── migrations/   # Migration history
│
├── frontend/
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── pages/       # Page components
│       ├── main.tsx     # React app entry
│       └── styles.css   # Global styles
│
└── docs/               # Documentation
```

## 🎯 Roadmap

See [PROJECT_TRACKER.md](./PROJECT_TRACKER.md) for the complete roadmap.

### Completed (MVP v1)
- ✅ Product CRUD with inline editing
- ✅ CSV import with validation and staging
- ✅ KPI cards and sales analytics
- ✅ Low-stock alerts with cron scheduler
- ✅ Product trend drill-downs
- ✅ Import history audit trail
- ✅ Modern dark theme UI

### Next Up
- [ ] Email delivery for alerts
- [ ] Alert configuration UI
- [ ] Date range filters for charts
- [ ] Google Sheets connector
- [ ] Multi-user authentication and RBAC
- [ ] Docker deployment setup

### Future (Advanced)
- [ ] Demand forecasting with AI/ML
- [ ] Anomaly detection
- [ ] MCP integration for AI-powered insights
- [ ] Multi-tenant support
- [ ] Real-time collaboration features

## 🧪 Testing

```bash
# Test backend endpoints
curl http://localhost:4000/api/status
curl http://localhost:4000/api/products
curl http://localhost:4000/api/kpis/summary

# Run alert job manually
curl -X POST http://localhost:4000/api/alerts/run-job
```

## 📝 CSV Import Format

Upload CSV files with the following columns (case-insensitive):
```csv
sku,name,quantity,threshold
CR-01,Croissant,2,8
ER-2LB,Espresso Roast,15,5
```

Supported delimiters: comma, semicolon, tab, pipe
Supported encodings: UTF-8, UTF-16LE, UTF-16BE

## 🤝 Contributing

This is an MVP project for small business operations. Contributions welcome!

## 📄 License

MIT

## 🔗 Links

- **GitHub**: [Meesile/smb-ops-dashboard](https://github.com/Meesile/smb-ops-dashboard)
- **Project Tracker**: See [PROJECT_TRACKER.md](./PROJECT_TRACKER.md)

---

**Built with ❤️ for small business owners who deserve better tools.**
