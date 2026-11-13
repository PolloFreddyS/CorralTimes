# Security — threat model & controls

Security is a release-blocking requirement. This document holds the Phase 0 threat model and the status of each
control. **Status key:** ✅ implemented and tested · 🟡 partial · ⏳ planned (phase).

## Assets
Unpublished submissions and evidence media · admin sessions · the edition snapshots and exports ·
LP data · integration secrets · contributor abuse-control metadata.

## Actors & assumptions
* Anyone may obtain the Press Pass link. A contributor alias is **unverified**.
* Attackers can craft arbitrary HTTP requests, upload malicious files and replay tokens.
* An admin session may be stolen. Environment variables may leak. Third-party providers may fail.

## Threats → controls

| # | Threat | Control | Status |
|---|---|---|---|
| T1 | Anonymous access to admin API | `requireAdmin` fails closed: no verifier, a throwing verifier or an unknown token all return 401 | ✅ `tests/integration/worker-api.test.ts`, e2e |
| T2 | Admin UI shown without auth | `AdminGate` renders "Acceso restringido" outside demo mode. Queries refuse to return fixtures | ✅ `tests/integration/admin-gate.test.tsx` |
| T3 | Privilege escalation / self-made admin | UUID allowlist `admin_users`, writable only by the provisioning role. RLS `is_admin()` | ⏳ P2 |
| T4 | Stolen admin session | Short JWT lifetime, MFA (AAL2) for sensitive ops, audit log of sign-ins and sensitive actions | ⏳ P2 |
| T5 | CSRF / cross-origin abuse | Same-origin `Origin` check on non-GET requests. No CORS headers | ✅ tested |
| T6 | XSS via submissions | All user content rendered as text. ESLint bans `dangerouslySetInnerHTML`. Strict CSP | ✅ `tests/security/xss-rendering.test.tsx` |
| T7 | Mass assignment | Zod schemas strip unknown keys (`status`, `isAdmin`, …) | ✅ unit test |
| T8 | Spam / flooding of the Press Pass | Turnstile (server-validated), Workers rate-limit binding per IP hash + global, idempotency key, body limit (64 KB JSON) | 🟡 body limit ✅, rest ⏳ P3 |
| T9 | Malicious uploads | MIME allowlist + magic-byte sniffing (`sniffImageMime`), 5 MB limit, server paths, private bucket, signed URLs, EXIF stripping on export | 🟡 sniffing ✅, rest ⏳ P3 |
| T10 | Secret leakage to the browser | Only `VITE_*` public vars. `scripts/check-bundle-secrets.mjs` fails CI on privileged key patterns | ✅ scanner and its tests |
| T11 | Secrets committed to git | `.gitignore` covers `.env*` / `.dev.vars*`. GitHub secret scanning + gitleaks in CI | 🟡 gitignore ✅, CI scan ✅ |
| T12 | Fabricated data in production | Demo fixtures are only served in demo mode and are labeled `[DEMO]`. Missing LP data is `null`, not 0 | ✅ tests |
| T13 | Silent edits to closed editions | Immutable snapshots, DB trigger rejecting updates on `CLOSED` editions, revisions on reopen | ⏳ P5/P7 |
| T14 | Unauthorized scraping integrations | No Cloudflare bypass or internal-endpoint scraping. Providers must be authorized | policy, ⏳ P6 |
| T15 | Information disclosure in errors | Stable error codes and Spanish messages. No stack traces. Generic 500 | ✅ |
| T16 | Clickjacking / sniffing / referrer leaks | `frame-ancestors 'none'`, XFO DENY, nosniff, Referrer-Policy, HSTS, Permissions-Policy | ✅ e2e checks headers |
| T17 | Over-retention of personal data | Configurable retention, a cleanup Cron with an audit entry, IP stored only as an expiring salted hash | ⏳ P2/P3 |

## Headers
* **Static assets** (`public/_headers`) use a CSP that allows only `self` and Turnstile (`challenges.cloudflare.com`).
  `connect-src` adds `*.supabase.co`. `style-src` allows `'unsafe-inline'` because Radix injects scroll-lock styles.
  Scripts stay strict.
* **API** (`worker/middleware/security-headers.ts`) sets `default-src 'none'` and `Cache-Control: no-store`.

## Retention defaults (configurable, Phase 2)
Rejected evidence: 30 days · unneeded original media: 30 days after edition closure · security logs: 60 days (30–90) ·
published editorial records: kept until deliberately removed · abuse-control IP hashes: 24 h.

## Reporting
Report a vulnerability privately to the repository owner. Do not open a public issue.
