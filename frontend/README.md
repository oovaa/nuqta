# NUQTA — E-Commerce & Laptop Trade-In Frontend

Modern, high-performance vanilla frontend application for the **NUQTA Store**, complete with a customer-facing e-commerce storefront, an interactive laptop trade-in appraisal engine, and an executive administrative dashboard.

---

## Architecture & Technology Stack

* **Core Stack:** Semantic HTML5, CSS3 Custom Properties (Design System), Vanilla JavaScript (ES6+).
* **Build Tooling:** [Vite 6](https://vitejs.dev/) with multi-page HTML bundling.
* **API Integration:** Centralized REST client ([`js/api.js`](js/api.js)) communicating with the NestJS backend via HTTP-only JWT cookies (`credentials: 'include'`).
* **Design Language:** Custom black & white typographic theme with responsive grid layouts.

---

## Directory Structure

```
frontend/
├── index.html               # Storefront homepage with hero banner and highlights
├── shop.html                # Product catalog with category filters and price sorting
├── product.html             # Product detail page with specs and live customer reviews
├── cart.html                # Live shopping cart with item quantity adjustments
├── checkout.html            # Shipping address and delivery details form
├── payment.html             # Multi-option payment gateway (Cash on Delivery, Card, Bank)
├── track.html               # Live shipment and order status tracker
├── trade-in.html            # Customer laptop trade-in appraisal and submission form
├── account.html             # Customer profile, order history, and trade-in submissions
├── login.html               # Customer and administrator authentication
├── register.html            # New customer registration
├── about.html               # About NUQTA information
├── policies.html            # Shipping, return, and privacy policies
├── admin/                   # Dedicated Administrator Portal
│   ├── index.html           # Executive dashboard with 8 KPI cards and recent activity
│   ├── products.html        # Product inventory management with search and image uploads
│   ├── categories.html      # Catalog categories taxonomy management
│   ├── orders.html          # Customer order lifecycle and status management
│   ├── shipping.html        # Logistics dispatch and delivery status tracking
│   ├── payments.html        # Financial transactions ledger
│   ├── users.html           # User accounts, role assignment, and password reset tool
│   ├── parts.html           # Hardware benchmark parts and valuation pricing
│   ├── trade-ins.html       # Trade-in device inspections, photo gallery, and approvals
│   └── reviews.html         # Customer reviews and ratings moderation
├── js/
│   ├── api.js               # Complete API client covering all 11 backend services (42 endpoints)
│   ├── common.js            # Global header sync, auth session check, and cart badge counter
│   ├── shop.js              # Catalog browsing, filtering, details, and review submission
│   ├── cart.js              # Cart CRUD, multi-step checkout, and tracking logic
│   ├── account.js           # Authentication, profile, trade-in history, and password updates
│   ├── admin.js             # Administration business logic for all 10 admin views
│   └── data.js              # Offline fallback demo data
├── css/
│   └── style.css            # Unified responsive stylesheet
├── images/                  # Store images, logos, and product graphics
├── vite.config.js           # Vite configuration (port 5173, multi-page inputs, static copy plugin)
├── package.json             # NPM package scripts and Vite dev dependency
└── CHANGELOG.md             # Detailed log of all frontend improvements and features
```

---

## Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) v18.0.0 or higher.
* The NUQTA NestJS backend running on port `3000` (`http://localhost:3000`).

### Installation
From the root of the repository or inside the `frontend` folder:

```bash
cd frontend
npm install
```

### Running the Development Server
```bash
npm run dev
```

The frontend will start on **`http://localhost:5173`**.

> **Important:** The backend CORS configuration is set to `http://localhost:5173`. Running the frontend on port 5173 guarantees seamless cookie authentication without CORS restrictions.

### Building for Production
```bash
npm run build
```
Generates an optimized, production-ready build in `frontend/dist/`.

### Previewing the Production Build
```bash
npm run preview
```

---

## User Roles & Access Control

* **Customer**: Can browse the store, manage their cart, checkout orders, submit used laptops for trade-in valuation, write product reviews, and track their packages.
* **Administrator**: Accesses `/admin/index.html` to manage products, categories, orders, shipments, payments, users, parts pricing, trade-ins, and reviews.

To access the admin portal:
1. Log in with an admin account at `http://localhost:5173/login.html`.
2. Once logged in, the header automatically displays an **Admin** button leading to `http://localhost:5173/admin/index.html`.
