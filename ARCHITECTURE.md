# Transport Management ERP (TMS) — Architecture

## 1. System Overview

Modular monolith for a real logistics company:

- **Client** (`client/`) — React + Vite SPA with role-based portals (Admin, Driver PWA, Customer)
- **Server** (`server/`) — Express modular monolith (controllers → services → models)
- **Data** — MongoDB (source of truth), Redis (cache + BullMQ queues), Cloudinary (files)
- **Realtime** — Socket.IO (notifications + live GPS)

```
React (RTK Query) → Express API → Services → MongoDB
                 ↘ Socket.IO ↗
                 ↘ BullMQ/Redis → Email / reminders
                 ↘ Cloudinary → documents/POD/images
```

---

## 2. Folder Structure

```
TRANSPORT/
├── ARCHITECTURE.md
├── README.md
├── client/                          # React + Vite
│   ├── public/
│   ├── src/
│   │   ├── app/                     # store, router, providers
│   │   ├── assets/
│   │   ├── components/              # ui, layout, shared
│   │   │   ├── ui/                  # Button, Input, Modal, Table...
│   │   │   ├── layout/              # Sidebar, Topbar, AppShell
│   │   │   └── common/              # EmptyState, Skeleton, ConfirmDialog
│   │   ├── features/                # domain feature modules
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── customers/
│   │   │   ├── vehicles/
│   │   │   ├── drivers/
│   │   │   ├── bookings/
│   │   │   ├── trips/
│   │   │   ├── tracking/
│   │   │   ├── fuel/
│   │   │   ├── maintenance/
│   │   │   ├── expenses/
│   │   │   ├── pod/
│   │   │   ├── invoices/
│   │   │   ├── payments/
│   │   │   ├── ledger/
│   │   │   ├── reports/
│   │   │   ├── notifications/
│   │   │   ├── support/
│   │   │   ├── settings/
│   │   │   ├── driver-portal/       # mobile-first PWA
│   │   │   └── customer-portal/
│   │   ├── hooks/
│   │   ├── lib/                     # axios/baseQuery, zod helpers, utils
│   │   ├── styles/                  # design tokens / global CSS
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
│
└── server/
    ├── src/
    │   ├── config/                  # env, db, redis, cloudinary, mail
    │   ├── modules/                 # domain modules
    │   │   ├── auth/
    │   │   ├── users/
    │   │   ├── roles/
    │   │   ├── customers/
    │   │   ├── vehicles/
    │   │   ├── drivers/
    │   │   ├── bookings/
    │   │   ├── trips/
    │   │   ├── routes/
    │   │   ├── tracking/
    │   │   ├── fuel/
    │   │   ├── maintenance/
    │   │   ├── expenses/
    │   │   ├── pod/
    │   │   ├── invoices/
    │   │   ├── payments/
    │   │   ├── ledger/
    │   │   ├── vendors/
    │   │   ├── documents/
    │   │   ├── notifications/
    │   │   ├── reports/
    │   │   ├── support/
    │   │   ├── branches/
    │   │   ├── settings/
    │   │   └── audit/
    │   ├── middleware/              # auth, rbac, validate, rateLimit, upload
    │   ├── jobs/                    # BullMQ workers & queues
    │   ├── sockets/                 # Socket.IO handlers & rooms
    │   ├── utils/                   # ApiError, ApiResponse, pagination
    │   ├── validators/              # shared Zod schemas
    │   ├── seeds/                   # roles, permissions, admin
    │   ├── app.js
    │   └── server.js
    ├── package.json
    └── .env.example
```

Each server module typically contains: `*.model.js`, `*.controller.js`, `*.service.js`, `*.routes.js`, `*.validation.js`.

---

## 3. Database Schema & Relationships

### Core identity
| Collection | Key fields | Relations |
|---|---|---|
| **permissions** | module, action, code (`module:action`) | — |
| **roles** | name, slug, permissions[], isSystem | → permissions |
| **users** | email, passwordHash, role, branch, status, refreshTokens[] | → roles, branches |
| **branches** | name, code, address, status | — |
| **settings** | key, value, group | — |
| **activityLogs** | actor, module, entity, entityId, action, old/new, ip | → users |

### CRM / operations
| Collection | Key fields | Relations |
|---|---|---|
| **customers** | type, source(ONLINE/OFFLINE/ADMIN/IMPORTED), identity & tax, credit, tags | → users (optional portal), documents |
| **vehicles** | regNo, type, status, currentKm, docs meta | → vehicleDocuments |
| **vehicleDocuments** | vehicle, type, number, expiry, fileUrl | → vehicles |
| **drivers** | license, status, salary, employeeId | → users, driverDocuments |
| **driverDocuments** | driver, type, expiry, fileUrl | → drivers |
| **routes** | name, origin, destination, stops[], distanceKm | — |
| **bookings** | customer, source, pickup/delivery, cargo, charges, status | → customers, trips |
| **trips** | booking, vehicle, driver, helper, km, status, times | → bookings, vehicles, drivers, routes |
| **tripLocations** | trip, lat, lng, accuracy, speed, heading, ts | → trips (batched writes) |

### Finance & ops support
| Collection | Relations |
|---|---|
| **fuelRecords** | → vehicles, drivers, trips |
| **maintenanceRecords** | → vehicles, vendors |
| **expenses** | → vehicle/driver/trip/branch/vendor, approval workflow |
| **expenseSettlements** | → drivers, expenses, advances |
| **podRecords** | → trips, bookings |
| **invoices** | → customers, bookings, trips |
| **payments** | → invoices, customers |
| **customerLedgers** | → customers (running balance entries) |
| **vendors** / **vendorTransactions** | vendor ledger |
| **notifications** | → users |
| **supportTickets** | → users, customers |

### Indexes (representative)
- `users.email` unique; `users.refreshTokens.token` sparse
- `customers.mobile`, `customers.email`, `customers.source`, text search on name/company
- `vehicles.registrationNumber` unique; `vehicles.status`
- `drivers.mobile` unique; `drivers.licenseNumber` unique; `drivers.status`
- `bookings.bookingNumber` unique; compound `(status, createdAt)`, `(customer, createdAt)`, `(source, createdAt)`
- `trips.tripNumber` unique; `(status, startTime)`, `(driver, status)`, `(vehicle, status)`
- `tripLocations`: `(trip, timestamp)` — TTL optional for old points
- `invoices.invoiceNumber` unique; `(customer, status)`, `dueDate`
- `activityLogs`: `(module, entityId, createdAt)`

---

## 4. API Architecture

### Conventions
- Base: `/api/v1`
- Response: `{ success, message, data, meta? }`
- Errors: `{ success:false, message, errors?, code? }`
- Auth: `Authorization: Bearer <accessToken>`; refresh via `POST /auth/refresh` (httpOnly cookie or body)
- List endpoints: `?page&limit&sort&search&filters...`
- Permissions checked on server: `requirePermission('bookings:create')`

### Module route map (Phase-aligned)
| Area | Endpoints (examples) |
|---|---|
| Auth | `POST /auth/register`, `/login`, `/refresh`, `/logout`, `/forgot-password`, `/verify-email` |
| Users/Roles | `/users`, `/roles`, `/permissions` |
| Customers | `/customers` CRUD + portal invite |
| Fleet | `/vehicles`, `/vehicles/:id/documents` |
| Drivers | `/drivers`, documents, status |
| Bookings | `/bookings`, status transitions, assign |
| Trips | `/trips`, assign vehicle/driver, start/complete |
| Tracking | Socket `trip:location` + `GET /trips/:id/track` |
| Ops | `/fuel`, `/maintenance`, `/expenses`, `/settlements` |
| Finance | `/pod`, `/invoices`, `/payments`, `/ledgers` |
| System | `/notifications`, `/reports/*`, `/support`, `/branches`, `/settings`, `/audit-logs` |

### Realtime rooms
- `user:{userId}` — notifications
- `trip:{tripId}` — live location for admin/customer
- `branch:{branchId}` — ops board updates

### Background jobs (BullMQ)
- email send, document expiry reminders, maintenance due, overdue invoices, GPS batch flush (if queued)

---

## 5. Permission Matrix

Permission code format: `{module}:{action}`  
Actions: `view | create | edit | delete | approve | export | assign | manage`

### Default roles

| Module | Super Admin | Admin | Transport Mgr | Dispatcher | Accountant | Staff | Driver | Customer |
|---|---|---|---|---|---|---|---|---|
| users | full | CRUD | — | — | — | view | — | — |
| roles | full | manage | — | — | — | — | — | — |
| customers | full | full | CRUD | view/create/edit | view | view/create | — | self |
| vehicles | full | full | full | view | view | view | view assigned | — |
| drivers | full | full | full | view/assign | view | view | self | — |
| bookings | full | full | full | full ops | view | create/view | — | self CRUD limited |
| trips | full | full | full | assign/ops | view | view | own trip actions | track own |
| fuel/maint/exp | full | full | full | create/view | approve/view | create | own expenses | — |
| invoices/payments | full | full | view | view | full | view | — | own view/pay |
| reports | full | full | ops+fleet | ops | finance | limited | own | own |
| settings/audit | full | manage | — | — | — | — | — | — |
| support | full | full | view | view | view | create | create | create |

Super Admin can create custom roles by composing any permission set.

Frontend only hides UI; **every API route enforces permissions**.

---

## 6. Development Roadmap

| Phase | Scope | Exit criteria |
|---|---|---|
| **1** | Setup, design system, Auth, RBAC, seeds | Login/register/refresh; role guards; design tokens; app shell |
| **2** | Users, Customers, Vehicles, Drivers | Full CRUD + validation + pagination + docs metadata |
| **3** | Online/Offline bookings | Shared workflow; source tracking; status machine |
| **4** | Trips + assignment | Availability & document expiry checks |
| **5** | Driver PWA + GPS + Socket tracking | Live map; sharing ON/OFF; reconnect |
| **6** | Fuel, Maintenance, Expenses, Settlements | Approvals + balances |
| **7** | POD, Invoices, Payments, Ledger | PDF invoice; payment history |
| **8** | Redis, BullMQ, Nodemailer, Notifications | Queued emails + realtime inbox |
| **9** | Reports, Dashboard analytics, Exports | Real DB aggregations |
| **10** | Customer portal, CRM, Support | Portal + notes/follow-ups/tickets |
| **11** | Security hardening, tests, performance QA | Rate limits, indexes, load sanity |

**Rule:** Do not advance phases until the current phase is functional and verified.

---

## 7. Design System (Phase 1)

- Brand: deep slate + transport amber accent (professional logistics, not purple-AI)
- Fonts: `DM Sans` (UI) + `IBM Plex Sans` (data/tables)
- Radius: `sm/md/lg` tokens; soft shadows; dense ERP tables
- Layout: collapsible sidebar + topbar; driver portal = bottom nav mobile-first
