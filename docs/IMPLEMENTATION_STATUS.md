# Implementation status — EL CORRAL TIMES 2.0

_Last updated: 2026-11-13 · branch `claude/corral-times-hq-v1-krfiin`_

## Phase 0 — Inspection ✅
Repo assessed (earlier prototype absorbed into 2.0, no official logo found). Architecture is in `ARCHITECTURE.md`.

## Phase 1 — Visual foundation ✅

**Public newspaper.** Data comes from the Worker; locally it is demo content, labeled as such.
- [x] `/` front page in the spec §7 order: masthead, date strip, breaking strip, lead + cover slot, secondary grid, LP summary, Power Rankings, meme, quote, word game, rumors/briefs, share, prev/next, footer
- [x] `/ediciones`, `/ediciones/:slug`, `/ediciones/:slug/:article` (safe structured body, related stories, WhatsApp share)
- [x] `/archivo` with search · `/bolsa-lp` with CVD-safe charts + table · `/power-rankings` · `/juegos` (playable demo) · `/enviar-noticia`
- [x] Per-page Open Graph/Twitter metadata in the initial HTML, plus a default 1200×630 social card
- [x] Responsive, with no horizontal overflow on mobile (verified by e2e)

**Worker.**
- [x] Public read API (slug-only), server-side word-game validation, fail-closed admin guard, CSRF origin check, security headers
- [x] Demo content refused in production

**HQ (demo mode, no auth yet).**
- [x] 12-module navigation in Spanish
- [x] Creative Studio: working ChatGPT brief generator + Creative Bible export
- [x] Publication Center: working readiness checklist + WhatsApp announcement generator
- [x] Palabrero admin shell, plus inbox, desk, imprenta, LP, rankings, caos, hemeroteca and security shells

**Tests.** 98 Vitest (unit/integration/security) + 20 Playwright (desktop and mobile) passing. Bundle scan clean, including the puzzle-answer check.

**Not functional yet.** These are buttons shown disabled with a phase label: saving, auth, uploads, publishing, imports, puzzle configuration, OpenAI.

## Addendum — La Voz del Pastor ✅ (review checkpoint)
- [x] Bible references: 66 books (1,189 chapters), Spanish names/abbreviations, parser + errors, translation registry with license
- [x] Pastoral column = article `category: PASTORAL` + structured details (no duplicate content system); `scripture` block (quotation vs paraphrase)
- [x] Rules in code: quotation needs human verification + source; paraphrase may not use quotes; verse cap for copyrighted translations; prayer privacy declaration; unverified quotation can't reach the public contract
- [x] Public: front-page band (separate from satire), full column with applications, prayer invitation, translation notice; `/la-voz-del-pastor` archive filterable by book/theme/year; own OG metadata
- [x] HQ: **Mesa Pastoral** (live validation, book autocomplete, preview = the public component, archive), nav entry
- [x] Readiness: pastoral check (optional; blocker if unapproved/unverified) · Creative Studio: `PASTORAL_ILLUSTRATION` with reverent tone rules
- [x] Tests: 122 Vitest + 22 Playwright passing (at that checkpoint)

## V2 consolidation ✅
- [x] Product identity is 2.0 everywhere (package `corral-times@2.0.0`, Worker `corral-times`, page titles)
- [x] V1 "close edition → prompt for a newspaper image" panel removed; La Redacción shows V2 publication readiness linking to the Centro de Publicación
- [x] Readiness includes V2 checks: approved cover artwork, El Palabrero, La Voz del Pastor
- [x] HQ phase labels follow the V2 roadmap

## Phase 2 — Database & authentication ✅ (code) · ⏳ owner setup
- [x] Versioned migrations (`supabase/migrations/`): 31 tables, enums, constraints, append-only and freeze triggers, pastoral publication guard
- [x] RLS on every table, deny by default; `anon` has no table access; editorial access requires an admin **with MFA (aal2)**
- [x] Admin allowlist by immutable UUID; provisioning only via `private.provision_admin` (SQL editor), capped at 2; all changes audited
- [x] Storage buckets: `evidence` and `media-staging` private, `media-public` for approved derivatives only
- [x] Worker: `/api/admin/*` verified via `current_admin()` RPC with the user's JWT (no secret key needed); 401/403 NOT_ADMIN/403 MFA_REQUIRED; `/api/public/config`
- [x] HQ login: magic link (no self sign-up) + mandatory TOTP enrollment/verification; sign-in audited; Centro de Seguridad reads the real audit log
- [x] Tests: 55 SQL assertions on a Supabase-like Postgres (`npm run db:test`, CI job) + 137 Vitest
- [ ] **Owner:** apply migrations, auth settings, invite users, provision both admins → `docs/ADMIN_SETUP.md`
- [ ] Live verification against the project (needs this environment's network to allow the Supabase host)

## Phase 3+
Not started. See `ROADMAP.md`.
