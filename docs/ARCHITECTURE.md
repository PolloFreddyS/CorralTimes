# Architecture — EL CORRAL TIMES 2.0

> Phase 0 deliverable for spec v2: repository assessment, architecture, decisions and plan.

## 1. Repository assessment (2026-11-13)

| Item | Finding |
|---|---|
| Prior work | The v1 Phase 0/1 foundation was already on this branch: React/Vite SPA, Hono Worker, design system and HQ shells. It was **extended, not replaced**. |
| Official logo / assets | **None in the repo.** A temporary typographic masthead and a typographic social card are used. Replacement points: `src/branding/brand.config.ts` and `public/social/`. |
| Deployment workflows | CI only (`.github/workflows/ci.yml`). There is no deploy workflow, by design. |
| Branch | Work continues on `claude/corral-times-hq-v1-krfiin`. The session's tooling only allows this branch. It can be renamed to `feature/corral-times-2` when the PR is opened. |

## 2. Two experiences, one deployment

```
                      ┌──────────────── Cloudflare Worker (Hono) ────────────────┐
WhatsApp / browser ──▶│ HTML routes (/, /ediciones/…): shell + per-page OG meta  │──▶ ASSETS (SPA bundle)
                      │ /api/public/*  read-only, published content, puzzle guess │──▶ Supabase (Phase 2+)
HQ (two admins)   ──▶│ /api/admin/*   requireAdmin (JWT + UUID allowlist, MFA)    │
                      └──────────────────────────────────────────────────────────┘
```

* **A: digital newspaper (public).** Cream newsprint mode. No login. It reads only published snapshots.
* **B: Corral Times HQ (`/redaccion`).** Dark newsroom mode. Two admins. All writes go through
  authenticated Worker routes, and RLS is enforced again inside Postgres.
* **Isolation.** Public routes and admin routes are separate Hono sub-apps with separate data paths.
  The public `PublicContentSource` interface has *no method* that can return a draft.

### Why no Next.js (social previews still work)
WhatsApp and Open Graph crawlers don't run JavaScript. For public routes the Worker fetches the SPA
shell from `ASSETS` and injects an escaped `<title>`, `description`, `canonical`, `og:*` and `twitter:*`
tags (`worker/html/`). It does this before returning the HTML, with the right status (404 for unknown slugs).
That covers the "metadata in initial HTML" requirement without a second framework.

**Planned for Phase 5:** server-render the article body itself into the shell, using
`renderToString` of the same React components plus `hydrateRoot`. Search engines will then see the
full text, and edge caching of published snapshots will be added with purge-on-publish.

## 3. Data flow by audience

| Audience | Path | Credential | Can do |
|---|---|---|---|
| Reader | `/api/public/editions…`, `/api/public/puzzles…` | none | Read published snapshots by **slug**. Submit word guesses and get feedback only. |
| Contributor | `POST /api/public/submissions` | Turnstile token | Insert one submission via a `SECURITY DEFINER` RPC (Phase 3). |
| Admin | `/api/admin/*` | Supabase JWT (AAL2 for sensitive operations) + `admin_users` allowlist | Editorial CRUD, publish, uploads, briefs |
| Jobs | Cron Trigger handlers | Service role, never on a request path | Retention cleanup, scheduled publication |

## 4. Module map

```
shared/domain/     workflow.ts (state machines, media roles) · submission(+schema) · article-doc(+schema)
                   public-content.ts (read contract, slugs) · palabrero.ts · lp.ts · readiness.ts · edition-calendar.ts
shared/creative/   bible.ts (Creative Bible v1) · brief.ts (ChatGPT briefs) · whatsapp.ts
worker/            app.ts · api/public.ts · auth/ · html/ (meta, headers, pages) · content/ · puzzles/ · demo/
src/               app/ (router, theme, gates) · components/{editorial,newspaper,charts,ui,layout}
                   features/{public,press-pass,palabrero,creative,publication,dashboard,submissions,stories,
                             editions,lp-market,rankings,caos,archive,security,auth}
```

Schemas are kept in separate files (`*-schema.ts`) so that Zod is not loaded on the public front page.

## 5. Dependency decisions
These are unchanged from v1 (React 19.3, TS 6.0 strict, Vite 8, Tailwind 4.3, Hono 4, TanStack Query 5,
RHF 7 + Zod 4, Vitest 5, Playwright 1.63). **Nothing new was added in v2.** Charts are hand-built in SVG/HTML,
and the social card is rendered by a script with the Playwright already used for tests.

Additions planned for later phases:

| Phase | Addition | Notes |
|---|---|---|
| 2 | `@supabase/supabase-js` | |
| 4 | Tiptap | The article JSON schema is already its subset. |
| 7 | CSV parser | Possibly hand-written. |
| 10 | OpenAI SDK, or plain `fetch` | The model ID comes from config. |

## 6. Environments

| Env | `APP_ENV` | `DEMO_CONTENT` | `VITE_DEMO_MODE` (HQ) |
|---|---|---|---|
| local (`npm run dev`, `npm run preview`) | local | true | true in dev |
| preview | preview | false (set `true` explicitly for a demo preview) | false |
| production | production | **ignored**: demo content is never served (`demoContentEnabled`) | false |

## 7. External prerequisites (requested only when needed)

| Phase | What's needed |
|---|---|
| 2 | Supabase project URL + publishable key. The service-role key goes only into `wrangler secret put`. Admin emails are used only at provisioning. |
| 3 | Turnstile site key + secret key. |
| 5 / 12 | Cloudflare account and custom domain. |
| 10 (optional) | OpenAI API key, chosen image model and a monthly budget. |

See [ROADMAP.md](ROADMAP.md) and [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).
