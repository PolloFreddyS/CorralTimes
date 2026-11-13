# Corral AI Creative Studio

**ChatGPT is the official creative director.** Claude Code builds the platform and does not replace that workflow.

## Mode A: ChatGPT workflow (default, required for launch)
1. In HQ → Creative Studio, pick the edition/article, the asset role and the composition.
2. HQ builds a deterministic Markdown brief (`shared/creative/brief.ts`) containing:
   * edition metadata and approved facts
   * exact quotes and LP figures
   * the role's aspect ratio and size, and its placement
   * exact text (discouraged), exclusions, references
   * the editorial rules and the full Creative Bible
3. **Copiar brief** → paste into ChatGPT. ChatGPT proposes, and generates only when the owner asks.
4. Upload the approved image to HQ. Phase 6 adds versions, crops, WebP/AVIF derivatives, alt/caption, approval,
   and public derivatives only after approval.

Warnings flag missing approved facts, long in-image text and the missing official logo.

**Working today:** brief generation, copy, `.md` download, Creative Bible export (`.md` / `.json`).

## Mode B: OpenAI API (optional, Phase 10)
* Server-side key only.
* The model ID comes from settings; no hardcoded or deprecated IDs. The current API docs are checked at implementation time.
* Generation is explicit only: never on page load. Budget caps, cost and usage tracking, full history.
* It **does not** connect to the owner's ChatGPT conversations, memory or history. Consistency comes from the Creative Bible plus approved references.
* If it is not configured, everything else keeps working.

## Exports (Phase 6)
`EXPORTAR PAQUETE CREATIVO` builds a ZIP containing `creative-brief.md`, `edition.json`, `article-briefs.json`,
`asset-manifest.json` and `approved-reference-list.md`. Only approved material is included, and it never references private URLs.

## Media roles
COVER 16:9 · ARTICLE_HERO 3:2 · MEME 1:1 · SOCIAL_PREVIEW 1.91:1 (1200×630) · SECTION_BANNER 4:1 · CHARACTER_ASSET 1:1.
Headlines, names, ranks and LP are typeset in HTML, never trusted to AI-generated image text.
