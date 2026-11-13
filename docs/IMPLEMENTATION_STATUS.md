# Implementation status

_Last updated: 2026-11-13 · branch `claude/corral-times-hq-v1-krfiin`_

## Phase 0 — Inspection ✅
Repo assessed (v1 foundation kept, no official logo found). Architecture is in `ARCHITECTURE.md`.

## Phase 1 — Visual foundation ✅ (review checkpoint)

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
- [x] Palabrero admin shell, plus the v1 modules (inbox, desk, imprenta, LP, rankings, caos, hemeroteca, security)

**Tests.** 98 Vitest (unit/integration/security) + 20 Playwright (desktop and mobile) passing. Bundle scan clean, including the puzzle-answer check.

**Not functional yet.** These are buttons shown disabled with a phase label: saving, auth, uploads, publishing, imports, puzzle configuration, OpenAI.

## Phase 2+
Not started. See `ROADMAP.md`.
