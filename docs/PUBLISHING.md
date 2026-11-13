# Publishing & WhatsApp distribution

## Permanent URLs
* `/ediciones/edicion-NNN-YYYY-MM-DD` (`editionSlug`)
* `/ediciones/:edition/:article-slug` (`slugify`)

Slugs are validated (`isValidSlug`) before any lookup. Published URLs never change. A revision reuses the same URL with new snapshot content.

## Publication Center
* **Working now:** validation checklist built from `evaluateReadiness`, canonical URL display, link preview mock, editable
  **GENERAR ANUNCIO DE WHATSAPP** with copy.
* **Phase 5:** secure draft preview (short-lived signed token, never indexed), schedule, publish now (freezes
  `edition_revisions`), emergency unpublish, revision history, cache purge.

## Open Graph
The Worker injects these into the initial HTML of `/`, `/ediciones/*` and the section pages:
* `og:title`, `og:description`, `og:image` (+ width/height/alt), `og:url`, `og:type` (`article` for articles),
  `og:site_name`, `og:locale`
* Twitter `summary_large_image`, `canonical`, and `article:published_time`

Images use the approved `SOCIAL_PREVIEW` asset, then the cover, then `/social/og-default.png` (1.91:1).

**Testing link previews:** `curl -s https://<host>/ediciones/<slug> | grep og:`. After deploying, use the
Facebook Sharing Debugger (WhatsApp uses the same OG fields). WhatsApp caches previews aggressively, so append `?v=2` to re-test.

## La Voz del Pastor
The pastoral column is published only as part of an edition snapshot, after approval and passage verification (a readiness blocker otherwise). Its archive URL is `/la-voz-del-pastor`.

## WhatsApp
Sending is manual: copy the message and paste it into the group. There is no WhatsApp Business API. Readers share with `wa.me` links.
