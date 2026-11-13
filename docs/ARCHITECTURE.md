# Architecture — EL CORRAL TIMES HQ

> Phase 0 deliverable: repository audit, architecture, dependency decisions, deployment design,
> milestone plan and external prerequisites.

## 1. Repository audit (2026-11-13)

| Item | Finding |
|---|---|
| Source code | None. The repository had no commits. |
| Branding / logo | **No official Corral Times logo found.** A temporary typographic masthead is used, with a replacement point in `src/branding/brand.config.ts` (`logo.src`). |
| Workflows / config | None. |
| Decision | Greenfield scaffold. Nothing existing was overwritten. |

Branch note: the session's tooling requires work on `claude/corral-times-hq-v1-krfiin`.
The spec asked for `feature/corral-times-hq-v1`. Both names refer to the same feature branch,
and it can be renamed when the PR is opened.

## 2. Shape of the system

```
Browser (React SPA) ──same origin──▶ Cloudflare Worker (Hono, /api/*) ──▶ Supabase (Postgres + Auth + Storage)
        ▲                                   │
        └──── static assets (Workers Static Assets, SPA fallback, public/_headers)
```

* **One deployable**: a single Worker serves the SPA through Static Assets. It also serves `/api/*`
  (`run_worker_first: ["/api/*"]`). There are no microservices, no Redis and no containers.
* **Same-origin API**: the API emits no CORS headers. State-changing requests must carry a matching `Origin`
  header (CSRF defense, `worker/middleware/same-origin.ts`).
* **Shared domain layer** (`shared/domain/*`): business rules live here, outside React, and are imported by both
  the SPA and the Worker. That covers the edition calendar, submission validation and lifecycle, readiness rules
  and LP utilities.
* **Privileged access happens only in the Worker.** The browser holds only the public Supabase publishable key
  (protected by RLS) and the Turnstile site key.

### Data access strategy (Phase 2+)

| Path | Credential | Why |
|---|---|---|
| Admin reads/writes | Admin's Supabase JWT forwarded by the Worker to PostgREST | RLS enforces `is_admin()` again inside Postgres (defense in depth). |
| Public submission | Worker → `SECURITY DEFINER` RPC `submit_news(...)` with a narrowly granted role | Anonymous users never get table access. The RPC can only insert one row and returns an opaque receipt. |
| Storage uploads | Worker-generated, server-controlled paths in a **private** bucket | No anonymous listing. Reads use short-lived signed URLs. |
| Cleanup / retention jobs | Service role, only in a Cron Trigger handler | Never reachable from a request path. |

### Admin identity

* Sign-in uses a Supabase Auth magic link with TOTP MFA (AAL2 required for sensitive operations).
* The `admin_users` allowlist is keyed by **`auth.users.id` (UUID)**. Rows are inserted only by a documented
  provisioning SQL/CLI step run by the owner. Self-registration never grants admin.
* The Worker verifies the JWT against Supabase JWKS, checks `aal`, and checks the allowlist. Every failure
  path fails closed (`worker/auth/require-admin.ts`). A secret URL is never treated as authentication.

## 3. Dependency decisions (versions verified 2026-11-13)

| Concern | Choice | Notes |
|---|---|---|
| UI | React 19.3, TypeScript 6.0 (strict + `noUncheckedIndexedAccess`) | TS 7 (native) is not yet supported by typescript-eslint. |
| Build | Vite 8 + `@cloudflare/vite-plugin` 1.69 | Dev and preview run the real `workerd` runtime. |
| Styling | Tailwind CSS 4.3 + CSS variables. Radix primitives (`radix-ui`) in shadcn style (`cva`, `tailwind-merge`) | Components are copied in, not installed via the shadcn CLI. |
| Routing | React Router 7 (data router, lazy admin routes) | The public page does not download admin code. |
| Server state | TanStack Query 5 | Query keys are already shaped for the real API. |
| Forms | React Hook Form 7 + Zod 4 (`@hookform/resolvers` 5) | The same Zod schema validates in the client and the Worker. |
| API | Hono 4 | Lightweight and Workers-native. Testable with `app.request()` in Node. |
| Fonts | `@fontsource` packages (self-hosted) | No third-party font CDN, so the CSP can stay strict. |
| Tests | Vitest 5, Testing Library, Playwright 1.63 (pinned to the preinstalled browser build) | |
| Persistence (Phase 2) | Supabase Postgres, Auth, Storage | |

Known advisory: `npm audit` reports a moderate ReDoS issue in `minimatch`. It is reached only through
`typescript-eslint`, a dev-only lint dependency that never ships to the bundle or Worker. It is tracked for
the upstream fix.

## 4. Module layout

```
src/            React SPA
  app/          router, providers, theme, admin gate
  branding/     brand.config.ts (logo, fonts, colors, identity)
  components/   editorial/ (13 newspaper components), ui/ (primitives), layout/
  features/     one folder per newsroom module
  demo/         labeled fictional fixtures (demo mode only)
  lib/          api client, env, queries
  styles/       tokens + fonts
shared/domain/  business rules shared by SPA and Worker
worker/         Hono API: api/, auth/, middleware/ (services/, providers/ arrive with later phases)
supabase/       migrations/ + seed.sql (Phase 2)
tests/          unit/, integration/, security/, e2e/
scripts/        check-bundle-secrets.mjs
```

## 5. Environments

| Env | How | Data | Demo mode |
|---|---|---|---|
| local | `npm run dev` (Vite + workerd) | local Supabase (Phase 2) / fixtures | on by default in dev |
| preview | `wrangler deploy --env preview` (Phase 9) | separate Supabase project | only if `VITE_DEMO_MODE=true` is set explicitly |
| production | manual, owner-approved | production Supabase | **must be off** |

Outside demo mode, every newsroom query fails with `DATA_SOURCE_NOT_CONFIGURED` instead of returning
fixtures. Admin screens render only "Acceso restringido" until auth exists.

## 6. Milestone plan

| Phase | Scope | Status |
|---|---|---|
| 0 | Audit, architecture, threat model, plan | ✅ this document |
| 1 | Foundation, design system, page shells, Worker skeleton, tests, CI | ✅ |
| 2 | Supabase schema + RLS, admin auth/MFA/allowlist, audit log, storage, permission tests | next — needs Supabase project |
| 3 | Press Pass backend: Turnstile, rate limits, uploads, persistence | needs Turnstile keys |
| 4 | Inbox, Story Desk, decisions history, Caos module | |
| 5 | Edition builder, locking/revisions, Hemeroteca, Power Rankings | |
| 6 | LP market: registry, manual import, DPM-like vs strict calculations, snapshots | |
| 7 | Friday export: immutable snapshot, master prompt, JSON, ZIP | |
| 8 | Hardening & QA | |
| 9 | Deployment preparation (no automatic production deploy) | |

## 7. External prerequisites

1. **Supabase project(s)**, ideally one for preview and one for production. The owner creates them.
   I need the project URL and publishable key (public). The service-role key goes only into
   `wrangler secret put`, never into chat or git.
2. **Cloudflare account** with Workers, and a Turnstile widget (site key + secret key).
3. **Admin emails** for the owner and Divilight. They are used only during provisioning, never hardcoded.
4. (Optional, later) a Riot API key for `RiotOfficialProvider`. There is no authorized DPM API; see `LP_INTEGRATION.md` (Phase 6).
