# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Full-featured Turkish logistics platform called **TaşıYo**.

## Authentication

- **Flow**: Phone or Email → OTP code sent (SMS via Twilio or Email via SMTP) → Verify code → Session token stored in localStorage
- **Routes**: `POST /api/auth/send-otp`, `POST /api/auth/verify-otp`, `GET /api/auth/me`, `POST /api/auth/logout`
- **Session storage**: `user_sessions` table in PostgreSQL (token-based, 30-day expiry)
- **OTP storage**: `otp_codes` table (10-minute expiry, single use)
- **Fallback**: If Twilio/SMTP not configured, OTP is logged to server console AND returned as `devCode` in JSON response (auto-fills OTP field in UI)
- **Platform settings**: Twilio and SMTP credentials stored in `platform_settings` DB table, editable via Admin → Ayarlar
- **Admin user seed**: `artifacts/api-server/src/index.ts` — on startup, if no admin role user exists in DB, creates `admin@tasiyo.com` automatically
  - Dev DB: admin is `ahmet@logistikco.com` (id: 1) — seed skips creation
  - Production: seed creates `admin@tasiyo.com` on first deploy

## Admin Settings Page

Path: `/admin/settings` — Three sections:
1. **SMS (Twilio)**: Account SID, Auth Token, Phone Number + Test SMS button
2. **Email (SMTP)**: Host, Port, User, Password, From Address + Test Email button
3. **Platform**: Platform name, support email, OTP expiry, max attempts

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, TailwindCSS, shadcn/ui, lucide-react, recharts, framer-motion

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server (all backend routes)
│   └── lojistik-platform/  # React + Vite frontend (Turkish logistics platform UI)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Platform Overview — TaşıYo Lojistik

A hybrid logistics marketplace + real-time dispatch platform. All UI text is in Turkish.

### User Roles

1. **Süper Yönetici (Super Admin)** — `/admin` — Analytics, user management, listing moderation
2. **Kurumsal Kullanıcı (Corporate)** — `/dashboard` — Load posting, offer management, tracking, team management
3. **Şoför/Bireysel (Driver/Individual)** — `/driver` — Mobile-style load feed, job matching, notifications

### Key Features

- Marketplace: Load posting + bidding system
- Real-time vehicle matching (Uber-style)
- GPS shipment tracking with status timeline
- Offer comparison (Kabul Et / Reddet)
- Premium listings badge system
- Role-switching UI on the gateway page
- Analytics charts (Recharts) for admin panel

## Database Schema

- `users` — platform users (admin, corporate, individual, driver roles)
- `loads` — freight/load listings with origin/destination, pricing model (fixed/bidding)
- `offers` — bids submitted by drivers on loads
- `shipments` — active/completed shipments
- `shipment_events` — tracking timeline events for each shipment
- `notifications` — push-style notifications per user
- `conversations` / `conversation_participants` / `messages` — messaging system

## API Endpoints

- `GET /api/users` — list users
- `GET/POST /api/loads` — load listings
- `GET/POST /api/offers` — offers + `POST /api/offers/:id/accept|reject`
- `GET /api/shipments` — shipments
- `GET /api/vehicles` — nearby vehicles (mock data)
- `GET /api/notifications` — notifications
- `GET /api/admin/stats` — admin statistics with charts
- `GET/POST /api/messages` — messaging/conversations

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only emit `.d.ts` files during typecheck
- Run codegen: `pnpm --filter @workspace/api-spec run codegen`
