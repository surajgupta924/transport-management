# SwiftHaul — Transport Management ERP

Production-oriented TMS built as a modular monolith (MERN).

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for folder structure, schema, API map, permission matrix, and phased roadmap.

## Phase 1 (current)

- Express API with JWT access + refresh tokens
- RBAC (roles, permissions, middleware enforcement)
- Seeded Super Admin + default roles
- React + Vite + Tailwind design system
- Auth UI (login/register), app shell, Users & Roles modules
- RTK Query + React Hook Form + Zod

## Prerequisites

- Node.js 20+
- MongoDB on `mongodb://127.0.0.1:27017` (local install, or binaries under `.tools/mongodb/`)

## Setup

```bash
# Optional: start local MongoDB if binaries exist under .tools/
./scripts/start-mongo.sh

# API
cd server
cp .env.example .env   # already present for local dev
npm install
npm run seed
npm run dev

# Client (new terminal)
cd client
npm install
npm run dev
```

- API: http://localhost:5000
- App: http://localhost:5173

### Default admin

- Email: `admin@tms.local`
- Password: `Admin@12345`

## Scripts

| Location | Command | Purpose |
|---|---|---|
| server | `npm run dev` | API with watch |
| server | `npm run seed` | Permissions, roles, HO branch, admin |
| client | `npm run dev` | Vite SPA |
| client | `npm run build` | Production build |

## Next

Phase 2: Customers, Vehicles, Drivers (full CRUD + documents metadata).
