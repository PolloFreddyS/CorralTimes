# Progress checklist — EL CORRAL TIMES HQ v1

## Phase 0 — Audit & plan ✅
- [x] Repository audit (empty repo, no official logo)
- [x] Architecture, dependency decisions, deployment design → `docs/ARCHITECTURE.md`
- [x] Threat model → `docs/SECURITY.md`
- [x] Data model overview → `docs/DATA_MODEL.md`

## Phase 1 — Foundation & design system ✅
- [x] Vite 8 + React 19 + TS strict + Tailwind 4 + Cloudflare Worker (Hono) in one app
- [x] Newspaper / Newsroom visual modes, centralized branding (`src/branding/brand.config.ts`)
- [x] 13 editorial components (masthead, stamps, story/quote cards, LP ticker, checklist, export panel, …)
- [x] Routing: public Press Pass, `/acceso`, admin `/redaccion/*` (lazy, gated)
- [x] Page shells for all 9 newsroom modules, with labeled demo fixtures
- [x] Press Pass form with shared Zod validation (client); demo receipt; closed-intake state
- [x] Worker: health, intake status, fail-closed admin guard, CSRF origin check, body limit, security headers
- [x] Shared domain rules: edition calendar, submission lifecycle, readiness, LP null-safety
- [x] Tests: 56 unit/integration/security + 14 Playwright e2e (desktop + mobile)
- [x] CI workflow (typecheck, lint, test, build, bundle secret scan, e2e, gitleaks, audit)

## Phase 2 — Database & administration ⏳ (needs Supabase project)
- [ ] Migrations + RLS + least-privilege grants + seed (11 LP players)
- [ ] Supabase Auth magic link + MFA, UUID allowlist, provisioning script
- [ ] JWT verification in Worker (JWKS), audit log table + Centro de Seguridad wiring
- [ ] Private storage bucket policies; permission tests against local Supabase

## Phases 3–9
See `docs/ARCHITECTURE.md` §6.
