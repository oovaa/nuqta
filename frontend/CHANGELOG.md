# Changelog - NUQTA Frontend

All notable changes to the frontend application are documented in this file.

---

## [1.1.0] - 2026-11-08

### Added
- **Full Backend API Integration (`js/api.js`)**:
  - Implemented client wrappers covering all 11 NestJS backend controller modules and 42 REST endpoints:
    - `auth` (login, register, refresh, me, logout, changePassword, resetPassword)
    - `products` (getAll, getById, create, update, delete with multipart/file upload support)
    - `categories` (getAll, getById, create, update, delete)
    - `cart` (get, addItem, updateItem, removeItem, clear, checkout)
    - `orders` (create, getAll, getById, updateStatus, markReceived, delete)
    - `shipping` (create, getAll, getById, getStatus, update, delete)
    - `payment` (create, getAll, getById)
    - `parts` (create, getAll, getById, update, delete)
    - `soldLaptops` (create, getAll, getById, update, updateStatus, delete)
    - `reviews` (create, getAll, getByProduct, getById, update, delete)
    - `users` (getAll, getById, update, updateRole, delete)
  - Configured credentials handling (`credentials: 'include'`) for automatic HTTP-only JWT cookie propagation (`access_token`, `refresh_token`).

- **Modular `/admin/` Architecture**:
  - Relocated and decoupled all administrative views into a dedicated [`frontend/admin/`](admin/) directory:
    - [`admin/index.html`](admin/index.html): Executive dashboard featuring 8 real-time KPI metric cards (Gross Revenue, Orders, Trade-Ins, Shipments, Products, Categories, Users, Reviews), quick action shortcuts, and live recent activity preview tables.
    - [`admin/products.html`](admin/products.html): Dedicated catalog management with live client-side search, hardware specs editing, image uploads, and deletion.
    - [`admin/categories.html`](admin/categories.html): Dedicated taxonomy management with category creation, inline renaming, and deletion.
    - [`admin/orders.html`](admin/orders.html): Customer order lifecycle management with inline status updates (`active`, `checked_out`, `abandoned`, `completed`) and deletion.
    - [`admin/shipping.html`](admin/shipping.html): Dedicated logistics and courier dispatch management with delivery address auditing.
    - [`admin/payments.html`](admin/payments.html): Financial transactions ledger auditing cash on delivery, credit/debit card, and bank wire records.
    - [`admin/users.html`](admin/users.html): User accounts management with role elevation (`admin` / `user`), profile updates, account deletion, and administrator master password reset tool.
    - [`admin/parts.html`](admin/parts.html): Laptop parts and hardware benchmark valuation pricing management.
    - [`admin/trade-ins.html`](admin/trade-ins.html): Customer trade-in submissions queue with hardware specs inspector, photo preview modal, and approval/rejection actions.
    - [`admin/reviews.html`](admin/reviews.html): Store-wide product reviews and star rating moderation queue.

- **Customer Storefront Enhancements**:
  - **Trade-in Portal ([`trade-in.html`](trade-in.html))**: Added customer used device trade-in calculator querying benchmark hardware prices (`GET /parts`), estimating live payout value, and submitting appraisal requests with device photos (`POST /sold-laptops`).
  - **Product Reviews & Social Proof ([`product.html`](product.html))**: Integrated real-time customer review display (`GET /reviews/product/:id`) and verified review submission form (`POST /reviews`).
  - **Account Hub ([`account.html`](account.html))**: Live customer profile (`GET /auth/me`), order history with "Mark as Received" confirmation (`POST /orders/:id/received`), personal trade-in submissions list (`GET /sold-laptops`), and password change form (`POST /auth/change-password`).
  - **Checkout & Tracking Flow ([`cart.html`](cart.html), [`checkout.html`](checkout.html), [`payment.html`](payment.html), [`track.html`](track.html))**: Live cart operations, automated order creation, shipping address submission, payment method recording, and real-time order tracking.

- **Build Tooling & Server Configuration**:
  - Configured Vite development and production tooling (`package.json`, `vite.config.js`).
  - Locked development server to port `5173` to seamlessly align with backend CORS origin policies.
  - Implemented automatic static asset bundling plugin ensuring vanilla scripts and images remain preserved across development and production builds.
  - Added [`.gitignore`](.gitignore) excluding `node_modules/` and `dist/`.

### Changed
- Standardized navigation sidebars across all 10 admin pages with unified sibling links and active state highlighting.
- Refactored [`js/common.js`](js/common.js) and [`js/account.js`](js/account.js) to dynamically resolve paths depending on whether the browser is inside `/admin/` or the root storefront.
- Enhanced [`js/admin.js`](js/admin.js) into decoupled page lifecycle handlers (`startOverviewPage`, `startProductsPage`, `startCategoriesPage`, `startOrdersPage`, `startShippingPage`, `startPaymentsPage`, `startUsersPage`, `startPartsPage`, `startTradeInsPage`, `startReviewsPage`).

### Removed
- Removed deprecated admin redirect files from the root folder (`admin.html`, `admin-orders.html`, `admin-parts.html`, `admin-trade-ins.html`, `admin-reviews.html`). Root directory now exclusively houses customer-facing pages.
