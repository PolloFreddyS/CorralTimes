# Deployment (prepared in Phase 12 — nothing is deployed yet)

* **Local:** `npm run dev` (Vite + workerd) or `npm run preview` (production build in workerd).
* **CI:** `.github/workflows/ci.yml` runs typecheck, lint, tests, build, the bundle/secret scan, the production dependency audit, e2e and gitleaks.
* **Preview (later):** `wrangler deploy --env preview` with `DEMO_CONTENT=false`, a separate Supabase project, and secrets set via `wrangler secret put`.
* **Production:** a manual, owner-approved deploy from a tagged commit. There is no automatic production deploy.
* **Rollback:** `wrangler rollback` to the previous Worker version. DB migrations are forward-only with a down script reviewed per release.
* **Backups:** Supabase daily backups + PITR (plan dependent), plus a restore drill before launch.
* **Secrets checklist:**

| Secret | Phase |
|---|---|
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | 2 — public, already in `wrangler.jsonc` vars |
| `SUPABASE_SECRET_KEY` (service role) | 3 — only for the public submission path and retention job |
| `SUPABASE_JWT` JWKS URL (non-secret) | 2 |
| `TURNSTILE_SECRET_KEY` | 3 |
| `OPENAI_API_KEY` (optional) | 10 |
| IP hash salt | 3 |

None of these belong in `VITE_*` variables.
