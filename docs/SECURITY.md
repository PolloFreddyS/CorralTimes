# Security — threat model & controls (v2)

Status key: ✅ implemented and tested · 🟡 partial · ⏳ planned (phase). No system is impossible to compromise. These are layered controls.

## Actors
Readers (anonymous, read-only) · contributors (anonymous, submit-only) · two admins · scheduled jobs · attackers
who can craft any request, upload hostile files, scrape public APIs and brute-force the word game.

## Controls

| # | Threat | Control | Status |
|---|---|---|---|
| T1 | Anonymous access to admin API | `requireAdmin` fails closed for a missing verifier, a throwing verifier or an unknown token | ✅ tests + e2e |
| T2 | HQ UI shown without auth | `AdminGate` shows "Acceso restringido". Queries never fall back to fixtures. | ✅ |
| T3 | Draft or unpublished leak via public API | `PublicContentSource` only exposes published snapshots by slug. No ID routes, no filters, slugs validated | ✅ tests (P1 demo source), ⏳ DB in P5 |
| T4 | Demo content in production | `demoContentEnabled()` ignores `DEMO_CONTENT` when `APP_ENV=production` | ✅ test |
| T5 | Word-game answer exposure | Answer only in the Worker. The puzzle metadata endpoint omits it. The bundle scanner fails CI if a demo answer appears in `dist/client` | ✅ tests + scanner |
| T6 | Word-game brute force | 6-attempt UX, dictionary check, POST same-origin. Workers rate limiting per IP hash planned. **A small public word list cannot be made perfectly secret.** | 🟡 ⏳ P8 |
| T7 | XSS via articles | Closed article schema, renderer that only knows listed nodes, `safeHref` (http/https/mailto), lint ban on `dangerouslySetInnerHTML` | ✅ tests |
| T8 | HTML or metadata injection in OG tags | All values HTML-escaped and clipped | ✅ test |
| T9 | CSRF / cross-origin writes | `Origin` must match on non-GET requests. No CORS headers | ✅ |
| T10 | Privilege escalation / self-made admin | UUID allowlist, provisioning-only inserts, RLS `is_admin()`, MFA (AAL2) for sensitive operations | ⏳ P2 |
| T11 | Malicious uploads | Magic-byte sniffing, size limits, private staging bucket, server paths, public derivatives only after approval, metadata stripping | 🟡 sniffing ✅, ⏳ P3/P6 |
| T12 | Secret leakage | Only `VITE_*` public vars. Bundle scanner covers Supabase service role/secret keys, Anthropic/OpenAI-style keys, Riot keys, Turnstile secrets, private keys and DB URLs | ✅ |
| T13 | OpenAI key misuse / cost abuse | Server-only key, explicit admin action, budget caps, audit log | ⏳ P10 |
| T14 | Stale cache exposes unpublished content | Public HTML is `no-cache` today. Phase 5 adds edge caching keyed on snapshot version, purged on publish/unpublish | 🟡 |
| T15 | Unsafe GitHub workflows | `permissions: contents: read`, no `pull_request_target`, no secrets in CI, gitleaks, Dependabot | ✅ |
| T16 | Clickjacking / sniffing | CSP `frame-ancestors 'none'`, XFO, nosniff, HSTS, Permissions-Policy, COOP on assets and Worker HTML | ✅ e2e |
| T17 | Over-collection | No reader accounts or tracking. Word-game progress stays in localStorage. Contributor alias is unverified. IP kept only as an expiring salted hash. | ✅ / ⏳ P3 |

## Indexing
The public newspaper is indexable in production only. Demo and preview pages carry `noindex`, and
`robots.txt` disallows `/redaccion`, `/acceso`, `/api/` and `/enviar-noticia`.

## Recovery (detailed in DEPLOYMENT.md, Phase 12)
Supabase PITR/daily backups and a restore drill · secret rotation (`wrangler secret put` + Supabase key roll) ·
emergency unpublish (`PUBLISHED → READY`, audited, cache purged) · incident checklist.

## Retention defaults
Rejected evidence: 30 days · unused original media: 30 days after publication · security logs: 60 days ·
published records: kept until deliberately removed · abuse IP hashes: 24 hours.
