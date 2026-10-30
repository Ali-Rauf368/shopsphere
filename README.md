# ShopSphere

A full-stack e-commerce store: everything under one roof, at amazing prices.

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
npm run dev           # API on :4000, web on http://localhost:5180
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

- **Header**: logo, location detection (browser Geolocation API plus reverse geocoding), product search, language switcher (English, Deutsch, اردو with right-to-left layout), login/signup, cart badge.
- **Navbar**: 9 entries, 7 of them with dropdowns that open on hover (6 departments plus About → Story, Vision, Customer Reviews, Contact).
- **Hero carousel**: auto-advancing slides with captions that slide in, and a clip-path reveal panel on the info icon.
- **Home**: one section per department with 3 product cards each.
- **Catalog**: department and subcategory pages, search, sorting, pagination, discounts, star ratings.
- **Special Offers**: discounted products plus promo videos (`<video>` + `<source>`).
- **About**: Story, Vision, and a 7-column customer-review table with hover rows and robohash.org avatars.
- **Auth**: centered signup/login forms on a background image. Passwords are hashed with bcrypt and sessions use JWT.
- **Cart and checkout**: the cart is stored on the server. Checkout runs in a transaction that locks stock rows, so two buyers can't buy the last unit at the same time. Prices are recorded at checkout, and cancelling an order puts the stock back.
- **Reviews and contact**: logged-in users can review products, and the contact form stores messages in Postgres (this replaces Formspree).
- **Admin dashboard**: revenue, order, customer and product totals; a daily revenue line chart; revenue by department; recent orders with status editing; low-stock list.

## Layout

```
server/  Express API (src/routes/*), SQL migrations, seed data, tests/
client/  React app (src/pages/*, src/components/*), e2e/ Playwright specs
scripts/ dev-db.sh: local Postgres cluster helper
```

Product images come from picsum.photos placeholders. Replace `image_url` values with real product photos.
