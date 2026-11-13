# 🐓 EL CORRAL TIMES 2.0

*“Noticias, dramas, memes y más caos del gallinero”* · Filipenses 4:13

This is the digital newspaper and editorial HQ of *Los Gallos Sin Planes*. It has two connected experiences:

* **The digital newspaper (public):** a weekly edition with articles, the LP market, Power Rankings, memes, quotes and
  the word game *El Palabrero del Corral*. It is designed to be opened from a WhatsApp link.
* **Corral Times HQ (`/redaccion`):** the two-admin newsroom. Submissions → articles → editions → creative briefs for
  **ChatGPT, the official creative director** → publication → WhatsApp announcement.

> **Status: Phase 1 (visual foundation), at the review checkpoint.** Everything you click is real code, but content is
> **fictional demo data**, and the database and auth are not connected yet. See [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md).

## Quick start
```bash
npm install
npm run dev            # http://localhost:5173 — Vite + real workerd runtime, demo content ON
npm run check          # typecheck + lint + tests + build + bundle secret/answer scan
npm run test:e2e       # Playwright, desktop + mobile
```

| Route | |
|---|---|
| `/` · `/ediciones/:slug` · `/ediciones/:slug/:article` | Newspaper front page, edition, article |
| `/bolsa-lp` · `/power-rankings` · `/juegos` · `/archivo` | LP market, rankings, word game, archive |
| `/la-voz-del-pastor` | La Voz del Pastor: pastoral archive (faith section, not satire) |
| `/enviar-noticia` | Corral Press Pass |
| `/redaccion` | HQ (demo mode only until Phase 2) |

Check the link preview metadata with `curl -s localhost:5173/ | grep og:`.

## Docs
[Architecture](docs/ARCHITECTURE.md) · [Design system](docs/DESIGN_SYSTEM.md) · [Security](docs/SECURITY.md) ·
[Database](docs/DATABASE.md) · [Editorial workflow](docs/EDITORIAL_WORKFLOW.md) · [Creative Studio](docs/CREATIVE_STUDIO.md) ·
[LP market](docs/LP_MARKET.md) · [Word game](docs/WORD_GAME.md) · [Publishing](docs/PUBLISHING.md) ·
[La Voz del Pastor](docs/PASTORAL.md) · [Deployment](docs/DEPLOYMENT.md) · [Roadmap](docs/ROADMAP.md)

## Branding
No official logo is in the repo. To add one, put it in `public/brand/` and set `logo.src` in `src/branding/brand.config.ts`.
The social card is `public/social/og-default.png` (regenerate it with `node scripts/render-og-default.mjs`).
