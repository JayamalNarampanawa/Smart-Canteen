# Smart Canteen For NIBM

Monorepo with 1 backend and 3 role-based frontend apps:
- `server` (Node.js + Express + MongoDB + JWT + RBAC)
- `client-user` (React + Vite + Tailwind)
- `client-canteen-admin` (React + Vite + Tailwind)
- `client-super-admin` (React + Vite + Tailwind)

## Features Implemented (Phase 1)
- Auth with `register`, `login`, `me`
- Roles: `SUPER_ADMIN`, `CANTEEN_ADMIN`, `USER`
- Seed script for initial `SUPER_ADMIN`
- Models: `User`, `CanteenProfile`, `MenuItem`, `Order`, `Rating`
- RBAC-protected API routes:
  - `/api/auth`
  - `/api/canteen`
  - `/api/menu`
  - `/api/orders`
  - `/api/ratings`
  - `/api/users`
- Business rules:
  - USER edit/cancel only while order is `PLACED`
  - CANTEEN_ADMIN order transitions:
    - `PLACED -> ACCEPTED | REJECTED`
    - `ACCEPTED -> PREPARING`
    - `PREPARING -> READY`
    - `READY -> COLLECTED`
- Order item snapshots (`nameSnapshot`, `priceSnapshot`)
- SUPER_ADMIN can update active canteen profile and manage canteen admins
- SUPER_ADMIN analytics:
  - average rating
  - latest 10 comments

## Folder Structure
```text
.
├─ server
│  ├─ scripts
│  └─ src
│     ├─ config
│     ├─ constants
│     ├─ middleware
│     ├─ models
│     ├─ routes
│     └─ utils
├─ client-user
│  └─ src
├─ client-canteen-admin
│  └─ src
└─ client-super-admin
   └─ src
```

## Prerequisites
- Node.js 18+
- npm 9+
- MongoDB running locally or remote URI

## Environment Setup
1. Copy `server/.env.example` to `server/.env`
2. Set values:
```env
PORT=5000
MONGO_URI=your_mongo_uri
JWT_SECRET=your_secret
```

## Install
Run in each folder:

```bash
cd server && npm install
cd ../client-user && npm install
cd ../client-canteen-admin && npm install
cd ../client-super-admin && npm install
```

## Seed SUPER_ADMIN
```bash
cd server
npm run seed
```

Seed credentials:
- Email: `admin@nimbsomething.com`
- Password: `Admin@12345`

## Run (Development)
Terminal 1:
```bash
cd server
npm run dev
```

Terminal 2:
```bash
cd client-user
npm run dev
```

Terminal 3:
```bash
cd client-canteen-admin
npm run dev
```

Terminal 4:
```bash
cd client-super-admin
npm run dev
```

## Build Clients
```bash
cd client-user && npm run build
cd ../client-canteen-admin && npm run build
cd ../client-super-admin && npm run build
```

## API Endpoints (Examples)
- Auth
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- Canteen
  - `GET /api/canteen/active`
  - `PUT /api/canteen/active` (SUPER_ADMIN)
- Menu
  - `GET /api/menu`
  - `POST /api/menu` (CANTEEN_ADMIN/SUPER_ADMIN)
  - `PUT /api/menu/:id` (CANTEEN_ADMIN/SUPER_ADMIN)
  - `PATCH /api/menu/:id/availability` (CANTEEN_ADMIN/SUPER_ADMIN)
  - `DELETE /api/menu/:id` (CANTEEN_ADMIN/SUPER_ADMIN)
- Orders
  - `POST /api/orders` (USER)
  - `GET /api/orders/my` (USER)
  - `PUT /api/orders/:id` (USER, only while `PLACED`)
  - `PATCH /api/orders/:id/cancel` (USER, only while `PLACED`)
  - `GET /api/orders` (CANTEEN_ADMIN/SUPER_ADMIN)
  - `PATCH /api/orders/:id/status` (CANTEEN_ADMIN)
- Ratings
  - `POST /api/ratings` (USER, order must be `COLLECTED`)
  - `GET /api/ratings` (CANTEEN_ADMIN/SUPER_ADMIN)
  - `GET /api/ratings/analytics/summary` (SUPER_ADMIN)
- Users
  - `GET /api/users/canteen-admins` (SUPER_ADMIN)
  - `POST /api/users/canteen-admins` (SUPER_ADMIN)
  - `PATCH /api/users/:id/status` (SUPER_ADMIN)
