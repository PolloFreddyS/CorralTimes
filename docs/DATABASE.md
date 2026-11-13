# Database (Supabase Postgres — Phase 2)

Conventions for every table:
* `id uuid default gen_random_uuid()` and server-set `created_at`/`updated_at`.
* RLS **enabled with deny by default**. There are no `anon` grants except through specific `SECURITY DEFINER` RPCs.
* `version int` for optimistic concurrency on editable rows. Enums mirror `shared/domain/*`.

| Table | Purpose / key constraints |
|---|---|
| `admin_users` | `user_id uuid unique → auth.users`. Insert only through the provisioning function. `disabled_at`. |
| `application_settings` | Timezone (default America/Santo_Domingo), closing hour, intake mode, retention, AI budget |
| `editions` | `number unique`, `slug unique`, `publication_date`, `time_zone`, `status edition_status`, `current_revision` |
| `edition_revisions` | **Frozen public snapshot** (`snapshot jsonb`, `sha256`), `revision int`, `published_by`, unique `(edition_id, revision)`. Immutable via trigger. |
| `publication_events` | Append-only log: publish, schedule, unpublish, revise |
| `submissions` / `submission_attachments` | Original evidence. `receipt` is opaque. Never exposed publicly. |
| `editorial_approvals` | Append-only decisions on submissions and articles |
| `articles` | `edition_id`, `slug` (unique per edition), category, placement, `status article_status`, `body jsonb` (validated by `articleDocSchema`), SEO fields |
| `article_revisions` | Every saved body/title change |
| `article_sources` | Article ↔ submission references (many-to-many) |
| `characters` | Recurring community personalities (Creative Bible registry) |
| `media_assets` / `media_revisions` | Original (private) + derivatives (public after approval), role, dimensions, alt, caption, source label, approval status |
| `creative_bible_versions` | Versioned JSON (seed = `CREATIVE_BIBLE_V1`) |
| `creative_briefs` / `creative_generations` | Briefs generated. Optional OpenAI generations with cost and usage. |
| `quotes`, `memes`, `rumors` | Departamento del Caos (exact text; `is_rumor` is always true for rumors) |
| `lp_players`, `lp_import_jobs`, `lp_snapshots`, `lp_snapshot_entries` | See LP_MARKET.md. Nullable numeric fields, never defaulted to 0. |
| `power_rankings`, `power_ranking_entries` | Unique `(ranking_id, position)`. Frozen with the edition. |
| `word_puzzles` | `answer` (readable **only** by the service role / RPC), clue, difficulty, `active_from/until`, status |
| `word_dictionary_terms` | Community terms approved by admins |
| `whatsapp_announcements` | Edition, editable message, `copied_at` |
| `security_audit_events` | `kind`, `actor_id`, `summary`, `metadata jsonb` (never secrets), `expires_at` |

`word_puzzle_attempts` is **not** created: guesses are stateless and readers aren't tracked. Rate limiting uses the
Workers rate-limit binding instead.

Quotes, memes and rumors use their own small tables, because v2 links them to articles and artwork. This replaces the
single-table approach in the v1 plan.
