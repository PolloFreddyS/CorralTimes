# 🐓 EL CORRAL TIMES HQ

*“Noticias, dramas, memes y más caos del gallinero”* · Filipenses 4:13

This is the internal newsroom and contribution portal for **EL CORRAL TIMES**, the satirical weekly paper of
*Los Gallos Sin Planes*. Contributors report stories through the **Corral Press Pass**, and the two
administrators review and organize them. Every Friday the app produces an editorial package (prompt + JSON +
media) for ChatGPT. The app never generates or publishes the newspaper itself.

> **Status: Phase 1 (foundation).** The UI and the Worker skeleton are real and tested. Newsroom data is
> **demo-only** until Phase 2 connects Supabase. See [`PROGRESS.md`](PROGRESS.md).

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173 — Vite + real workerd runtime, demo mode ON
```

| URL | What |
|---|---|
| `/` | Corral Press Pass (public submission form) |
| `/redaccion` | Newsroom (demo mode only until Phase 2 auth) |
| `/acceso` | Editor login (Phase 2) |
| `/api/health` | Worker health |

## Scripts

| Command | Does |
|---|---|
| `npm run check` | typecheck + lint + unit/integration/security tests + build + bundle secret scan |
| `npm run test:e2e` | Playwright (desktop + mobile) against a demo-mode build in workerd |
| `npm run preview` | Production-like build served by workerd |
| `npm run cf-typegen` | Regenerate Worker binding types after editing `wrangler.jsonc` |

Deployment is intentionally disabled until Phase 9 and requires the owner's approval.

## Docs
[Architecture](docs/ARCHITECTURE.md) · [Security](docs/SECURITY.md) · [Data model](docs/DATA_MODEL.md)

## Branding
No official logo exists in the repo yet. To add one, put it in `public/brand/` and set `logo.src` in
`src/branding/brand.config.ts`. Colors are defined in `src/styles/index.css`.
