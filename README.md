# DIME — Unified Restaurant Operating Platform

DIME is a single Expo app that ships four interfaces — customer, owner
dashboard, server panel, and super admin console — backed by a single
Supabase project. iOS, Android, and Web run from the same codebase.

## Stack

- **Expo SDK 52** with `expo-router` typed routes, React 18.3, RN 0.76
- **Supabase** — Postgres, Auth, RLS, Realtime, Storage
- **TypeScript** strict mode, hand-written DB row types
- **NativeWind v4** + Tailwind theme with DIME orange (#FC8019) palette
- **Zustand** for client state (auth, cart, toast), **React Query** for server state
- No UI kit — every primitive is hand-built per `SKILL.md`

## Getting started

```bash
npm install
cp .env.example .env.local        # add SUPABASE_DB_URL for migrations
node scripts/apply-migrations.mjs # apply schema + seed
npx expo start                     # native dev server
npx expo start --web               # web
```

The publishable Supabase key in `.env` is safe to commit — it's the
anonymous JWT and RLS gates everything. **Never** commit
`SUPABASE_SERVICE_ROLE_KEY` — keep it in `.env.local` (already gitignored).

## Demo accounts

| email | password | role |
| - | - | - |
| `priya@dime.app` | `priya123` | customer (gold tier, 750 pts) |
| `demo@dime.app` | `demo123` | customer (silver) |
| `rahul@dime.app` | `rahul123` | customer |
| `owner@dime.app` | `owner123` | owner — owns all 6 seeded restaurants |
| `admin@dime.app` | `admin123` | super_admin |

Server PIN logins (no email): each restaurant has owner PIN `1234`,
chefs `30xx`, servers `40xx`, hosts `50xx` (see `008_seed_ops.sql`).

## Database

20 tables. Migrations are numbered SQL files in `supabase/migrations/`:

- `001_extensions.sql` — extensions, `tg_set_updated_at`, `short_code`
- `002_enums.sql` — every enum type used by the app
- `003_tables.sql` — schema, indices, `updated_at` triggers
- `004_functions.sql` — domain triggers (auth bootstrap, ratings,
  loyalty ledger, order side-effects, booking notifications, totals)
- `005_rls.sql` — RLS policies + realtime publication
- `006_seed_users_restaurants.sql` — auth users + 6 verified restaurants
- `007_seed_menu.sql` — categories + 50+ menu items with real prices
- `008_seed_ops.sql` — tables, staff, offers, reviews, bookings, banners

Apply with `node scripts/apply-migrations.mjs` (needs `SUPABASE_DB_URL`).

## App layout

```
app/
├── _layout.tsx              providers + toast host + auth bootstrap
├── index.tsx                role-based redirect
├── (auth)/                  login, signup
├── (tabs)/                  customer: home, discover, bookings, profile
├── restaurant/[id].tsx
├── menu/[id].tsx
├── cart.tsx
├── order/[id].tsx           realtime subscribed
├── booking/(new|[id])
├── booking-confirm/[id].tsx
├── scan.tsx                 camera QR scanner
├── review/[id].tsx
├── loyalty.tsx
├── notifications.tsx        realtime subscribed
├── (orders|offers|refer|preferences|edit-profile|support|my-reviews|favorites)
├── owner/                   12 ops screens (dashboard, KDS, tables,
│                            menu, bookings, inventory, analytics,
│                            staff, offers, reviews, settings, orders)
├── server/                  PIN login, tables, bill, floor map
└── admin/                   dashboard, restaurants, users, orders, support, content
```

## What works end-to-end

- Sign up / sign in via Supabase Auth, `users` row auto-created
- Browse restaurants, search, cuisine + price + rating filters
- Restaurant detail with realtime rating, reviews + replies, offers
- Menu browsing with veg/non-veg filter, item detail sheet, variants
- Cart with promo, loyalty redemption (100→₹50), tip, GST auto-calc
- Place order — DB triggers compute totals, fire realtime, award loyalty
- Order tracker with realtime stage transitions
- QR scan → starts table session → ordering against that table
- Reviews — five-axis rating, awards 50 loyalty points
- Loyalty: tiered, ledger-backed, per-tx auto-recompute
- Booking flow with date/time/seating/occasion + QR receipt
- Owner dashboard: KPIs, KDS with elapsed timers, table grid + QR PNG,
  staff permission matrix (21 toggles), live menu toggle, analytics
- Server: PIN login, table grid, bill close (gated by permission)
- Super admin: approve/suspend restaurants, ban users, resolve tickets

## Known scope cuts vs. PRD

In one session I prioritised depth over breadth:

- Edge functions (`staff-login`, `calculate-bill`, `daily-maintenance`)
  are described in the migration but not deployed. The current PIN flow
  uses direct Supabase queries; for production, wire a Postgres function
  + JWT mint via an edge function so PIN auth gets its own session.
- Owner onboarding wizard, order edit modal, advanced floor manager
  drag-drop, full split-bill-by-items UI, peak-hours heatmap — all are
  scaffolded with sensible placeholders or single-screen approximations.
- Image upload (Expo Image Picker → Supabase Storage) is stubbed out
  in profile/review screens.

## Testing

```bash
npm run typecheck   # strict, currently 0 errors
```

iOS/Android/Web have not been booted in this environment, but the
codebase compiles clean and the Supabase contract (RLS, triggers, types)
is exercised by every query/mutation.

## Brand & design

- Primary: `#FC8019` Swiggy-spec deep orange
- Type scale: 32 / 24 / 20 / 17 / 15 / 13 / 11px
- Border radii: 6 / 8 / 12 / 16 / 20 / 24
- All buttons trigger `expo-haptics`. Toasts auto-dismiss in 4s.
- Icons: SF Symbols on iOS via `expo-symbols`, Material fallback elsewhere.

## Security note

The PRD pasted both publishable and **service-role** Supabase keys in
plaintext. The publishable key is safe on the client; the service-role
key bypasses RLS and was rotated before this repo was published. If the
old service key was committed anywhere, rotate it again from
Supabase → Settings → API.
