# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # start dev server on localhost:3000
pnpm build        # production build
pnpm lint         # ESLint via next lint
```

There are no tests in this project.

## Architecture

**Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui (Radix UI), TanStack Table, next-auth v5 (beta), Zod, React Hook Form, sonner (toasts), dayjs, jsPDF / pdf-lib, xlsx.

**Package manager:** pnpm. Path alias `@/` maps to `src/`.

### Route structure

```
src/app/
  (protected)/          # requires authentication (SessionProvider wraps all children)
    (user)/             # regular USER role — sidebar from UserNavbarSidebar
      tickets/          # hourly ticket scan & registration
      owners/           # OWNER-type customers
      renters/          # RENTER-type customers
      privates/         # PRIVATE-type customers
      notes/
      components/       # shared across user routes (receipt dialogs, scanner, exports)
    admin/              # ADMIN role only (enforced in middleware + RoleGate)
      tickets/          # ticket catalog + pricing (hours / days or weeks)
      parking-type/
      users/
      interests/
      other-payments/
      update-amount-customers/
  auth/                 # public — login, register, reset, verify
```

### Data flow pattern

Every entity follows the same four-layer pattern:

1. **Schema** (`src/schemas/`) — Zod schema + inferred TypeScript type (e.g. `CustomerSchemaType`).
2. **Service** (`src/services/`) — plain `fetch` wrappers that talk to `NEXT_PUBLIC_API_URL`. GET calls attach Next.js `next.tags` for cache invalidation; mutations call `revalidateTag` after success.
3. **Server Action** (`src/actions/`) — `'use server'` functions that validate with the Zod schema, call the service, and return `{ error }` or `{ success }`. They never call `revalidateTag` themselves — that happens inside the service.
4. **Page / Component** — Server components (pages) fetch directly via services; client components call server actions with `useTransition`.

### Authentication

- `src/auth.ts` — NextAuth config: Credentials provider (email or username + password) signs a 30-day JWT; the `jwt` callback mints a `jsonwebtoken` access token stored on `token.accessToken` and exposed on `session.token`.
- `src/lib/auth.ts` — server-side helpers: `currentUser()`, `currentRole()`, `getAuthHeaders(token?)`. All service calls that require auth use `getAuthHeaders`.
- `src/middleware.ts` — redirects unauthenticated users to `/auth/login`; blocks non-ADMIN users from `/admin/*` (except `/admin/other-payments`).
- `src/components/auth/role-gate.tsx` — server component that redirects on role mismatch; used inside admin pages.

### Customer model

Three customer types: `OWNER`, `RENTER`, `PRIVATE` (from `CUSTOMER_TYPE` constant). Each has `receipts[]`, `vehicles[]`, and `vehicleRenters[]`. Receipts have status `PENDING | PAID` and payment types `TRANSFER | CASH | CHECK | MIX | CREDIT | TP | FIX`.

### Ticket system

Two distinct flows:
- **Hourly tickets** (`TicketRegistration`) — scanned via barcode on the `/tickets` page. The `ScannerButton` component listens globally for keyboard input (from a USB barcode scanner) and calls `startScanner` → dispatches a `"scan-success"` DOM event on success.
- **Day/week tickets** (`TicketRegistrationForDay`) — manually registered, managed in `/tickets/tickets-days-or-weeks/`.

### Cache tags

`src/services/cache-tags.ts` defines the full tag registry (`CACHE_TAGS`) and a typed helper `getCacheTag(service, tag, ...params)`. Use this helper — never hardcode tag strings.

### PDF generation

`src/utils/generate-receipt-without-registering.ts` and `src/utils/generate-all-receipts.ts` use `pdf-lib` + `jspdf-autotable` to fill pre-made PDF templates from `/public/*.pdf`. `src/utils/generate-receipt.ts` is fully commented out (legacy).

### UI conventions

- All data tables use TanStack Table wrapped in the pattern: `*-columns.tsx` (column definitions) + `*-table.tsx` (DataTable client component).
- Dialogs follow: `create-*-dialog.tsx`, `update-*-dialog.tsx`, `delete-*-dialog.tsx`, `soft-delete-*-dialog.tsx`, `restored-*-dialog.tsx`.
- Toast notifications use `sonner` (`import { toast } from 'sonner'`).
- All dates/times use `dayjs` with `America/Argentina/Buenos_Aires` timezone.

### Environment variables

| Variable | Used in |
|---|---|
| `NEXT_PUBLIC_API_URL` | All service fetch calls (base URL of the backend API) |
| `NEXTAUTH_SECRET` | JWT signing in `src/auth.ts` |
| `API_SECRET_TOKEN` | Server-to-server calls that bypass user auth (passed as `authToken` param) |
