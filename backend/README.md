# Nuqta Backend

NestJS + Drizzle (PostgreSQL) e-commerce API. All routes are prefixed with `/api/v1`.

## Tech stack

- NestJS 12 (Express platform, ESM)
- Drizzle ORM + `pg`
- Zod + `StandardSchemaValidationPipe` for validation
- cookie-parser (httpOnly cookies for auth)
- Vitest for tests

## Project structure

```
backend/
├── src/
│   ├── main.ts                 # bootstrap, global pipes, CORS, cookie-parser
│   ├── app.module.ts           # root module, global APP_PIPE / APP_INTERCEPTOR / APP_FILTER
│   ├── app.controller.ts       # health: GET /
│   ├── schema.ts               # Drizzle tables
│   ├── auth/                   # login, register, refresh, logout, me, change/reset password
│   ├── users/
│   ├── categories/
│   ├── products/
│   ├── cart/
│   ├── orders/
│   ├── shipping/
│   ├── payment/
│   ├── parts/
│   ├── sold-laptops/
│   ├── reviews/
│   ├── media/                  # image upload + serving (/media/:name)
│   └── common/                 # guards, cache, logging interceptor/filter
├── test/                       # e2e specs
├── drizzle.config.ts
└── .env
```

## Prerequisites

- Node.js 20+ (or Bun)
- PostgreSQL database
- (optional) `bun` for faster installs

## Environment (`.env`)

Create `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@host:5432/nuqta
PORT=3000
JWT_SECRET=change-me-in-production
FRONTEND_URL=http://localhost:5173
```

- `DATABASE_URL` — Postgres connection string (required).
- `PORT` — server port (default `3000`).
- `JWT_SECRET` — used to sign access/refresh tokens.
- `FRONTEND_URL` — allowed CORS origin (must match your frontend dev URL; credentials enabled).

## Install & run

```bash
cd backend
npm install          # or: bun install
npm run start:dev    # watch mode
# npm run start      # production-ish
# npm run build && npm run start:prod
```

Server: `http://localhost:3000` (or `PORT`). API base: `http://localhost:3000/api/v1`.

## Auth (cookies)

Login/register set two httpOnly cookies:

- `access_token` (15 min)
- `refresh_token` (7 days)

Endpoints:
- `POST /api/v1/auth/register` `{ name, email, password, phone?, city?, address? }`
- `POST /api/v1/auth/login` `{ email, password }`
- `GET  /api/v1/auth/refresh` (uses `refresh_token` cookie, rotates cookies)
- `POST /api/v1/auth/logout` (clears cookies)
- `GET  /api/v1/auth/me` (requires `access_token`)
- `POST /api/v1/auth/change-password` (authed) `{ oldPassword, newPassword }`
- `POST /api/v1/auth/reset-password` `{ email, oldPassword, newPassword }`

Frontend must send credentials (`withCredentials: true` / `credentials: 'include'`) and use the same origin or the configured `FRONTEND_URL`.

## Connecting from the frontend

Option A — Vite/CRA dev proxy (recommended, avoids CORS):

```ts
// vite.config.ts
server: { proxy: { '/api': 'http://localhost:3000', '/media': 'http://localhost:3000' } }
```

Then call `fetch('/api/v1/...')` with `credentials: 'include'`.

Option B — direct cross-origin: set `FRONTEND_URL` to your frontend origin and call `http://localhost:3000/api/v1/...` with credentials.

Media files are served at `GET /api/v1/media/:name` (or `/media/:name` without prefix? note global prefix applies → `/api/v1/media/:name`). Only image extensions are accepted on upload.

## Other endpoints (prefix `/api/v1`)

- `users`: `GET/GET:id/PATCH:id/DELETE:id`, `PATCH role/:id`
- `categories`: `POST/GET/GET:id/PATCH:id/DELETE:id`
- `products`: `POST/GET/GET:id/PATCH:id/DELETE:id`
- `cart`: `GET`, `POST items`, `PATCH/DELETE items/:productId`, `DELETE`, `POST checkout`
- `orders`: `POST/GET/GET:id/PATCH:id/DELETE:id`, `POST :id/revicved`
- `shipping`: `POST/GET/GET:id/GET:id/status/PATCH:id/DELETE:id`
- `payment`: `POST/GET/GET:id`
- `parts`: `POST/GET/GET:id/PATCH:id/DELETE:id`
- `sold-laptops`: `POST/GET/GET:id/PATCH:id/PATCH:id/status/DELETE:id`
- `reviews`: `POST/GET/GET product/:productId/GET:id/PATCH:id/DELETE:id`

## Tests

```bash
npm run test        # unit
npm run test:e2e    # e2e
npm run test:cov    # coverage
```

## Notes

- Validation uses Zod schemas via `StandardSchemaValidationPipe`; unknown fields are rejected (`.strict()`).
- Auth tokens are httpOnly cookies; JS cannot read them (XSS protection).
- Image uploads are restricted to image extensions/magic bytes.