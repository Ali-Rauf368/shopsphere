# ShopSphere

A small online shop for well-made everyday things, built as a full-stack TypeScript project.

**Design:** warm paper tones with a single clay accent, Fraunces serif headings over Inter, flat surfaces and catalogue-style product cards. Colours are semantic tokens in `client/src/index.css`, so dark mode is just a second set of values. The brand story and shop copy are placeholder text for a fictional shop, so replace them with your own.

| Layer    | Stack |
|----------|-------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Recharts, lucide icons, React Router 7 |
| Backend  | Node.js 24, Express 5, TypeScript (strict), JWT, bcrypt, Zod |
| Database | PostgreSQL 16 with plain SQL migrations (`server/migrations/`) |
| Testing  | Vitest + Supertest (API), Playwright (browser), a disposable PostgreSQL cluster per run |
| API docs | OpenAPI 3.1, Swagger UI at `/api/docs` |

## Quick start

```bash
npm install
npm run db:start      # project-local Postgres 16 on :5433 (data in .pgdata/, no sudo needed)
npm run db:migrate
npm run db:seed       # demo catalog, reviews and 30 days of orders
npm run dev           # API on :4000, web on http://localhost:5180 (Ctrl+C to stop)
npm run db:stop       # when you are done
```

Demo logins: `demo@shopsphere.dev` / `demo12345` (customer) and `admin@shopsphere.dev` / `admin12345` (admin, sees the dashboard).

## Tests

```bash
npm test              # API tests (Vitest + Supertest)
npm run test:e2e      # browser tests (Playwright, Chromium)
npm run typecheck
```

Each run starts its own throwaway PostgreSQL 16 cluster in a temp directory, migrates it, and deletes it afterwards. A watchdog process removes the cluster even if the test runner is killed. Set `PGBIN` if your Postgres binaries are not in `/usr/lib/postgresql/16/bin`.

## Features

**Storefront**
- **Header**: announcement bar, location detection (Geolocation API plus reverse geocoding), **live search** with product previews and keyboard navigation, language switcher (English, Deutsch, اردو with right-to-left layout), **dark mode**, wishlist and account menu, animated cart badge.
- **Navbar**: 9 entries, 7 with hover dropdowns (6 departments plus About), and a slide-in drawer on mobile.
- **Home**: hero carousel (captions slide in, a clip-path info reveal, progress bars, pause button), department tiles, **flash deals with a live countdown**, best sellers, one 3-card section per department, reviews strip.
- **Browsing**: filter sidebar (collection, price range, rating, in stock) kept in the URL so filtered pages are shareable, removable filter chips, six sort orders, pagination, skeleton loaders, a bottom-sheet filter panel on mobile.
- **Product page**: zoom on hover, highlights, stock indicator, delivery estimate, share button, rating breakdown, reviews, related and recently viewed products, sticky buy bar on mobile.
- **Wishlist**: heart button on every card, plus a wishlist page.
- **Cart**: slide-out cart with a free-shipping progress bar, notifications with a "View cart" shortcut, full cart page.
- **Checkout**: two steps (shipping, then review and pay) that remember your address. Coupons are validated live with clear reasons when they fail. Shipping is charged on the server.
- **Orders**: order history and an order page with a **status timeline** (placed → shipped → delivered). Customers can cancel, which puts the stock back.
- **Account**: change display name and password, see a password-strength meter at signup, show/hide password fields, and fill in demo logins with one click.
- **About**: Story, Vision, a searchable 7-column review table with robohash avatars, and a contact page.
- Plus: friendly 404 page, per-page tab titles, skip-to-content link, reduced-motion support, code-split routes.

**Admin** (`admin@shopsphere.dev`)
- Overview: revenue, orders, average order value, customers, week-over-week trend, daily revenue chart, revenue by department, low-stock alerts.
- Products: search, create, edit (price, discount, stock, collection, highlights, featured) and delete.
- Orders: filter by status and change status (each change is recorded on the timeline).

**Backend**
- JWT auth with bcrypt password hashing, plus rate limiting on login and signup (`AUTH_RATE_LIMIT`, `TRUST_PROXY`).
- Checkout runs in a transaction that locks stock rows (no overselling), records prices at checkout, and applies coupons and shipping.
- Coupons: `WELCOME10` (10% off) and `BIG20` (20% off orders over $150). `SUMMER24` is expired and `PAUSED` is disabled, to show error handling.
- Database constraint errors come back as 409/400 responses, not 500s.
- OpenAPI 3.1 spec at `/api/openapi.json` and Swagger UI at `/api/docs`.

## Layout

```
server/  Express API (src/routes/*), SQL migrations, seed data, tests/
client/  React app (src/pages/*, src/components/*), e2e/ Playwright specs
scripts/ dev-db.sh: local Postgres cluster helper
```

Product photos are from [Unsplash](https://unsplash.com) and loaded from their CDN.
