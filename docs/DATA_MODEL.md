# Data model (planned for Phase 2)

All tables: `id uuid primary key default gen_random_uuid()`, `created_at`/`updated_at timestamptz default now()`
(server-generated, with an `updated_at` trigger), RLS enabled, and no grants to `anon`. Optimistic concurrency uses
a `version int` column on editable rows. Enums are Postgres enums that mirror `shared/domain/*`.

| Table | Purpose | Key notes |
|---|---|---|
| `admin_users` | Allowlist | `user_id uuid unique references auth.users`, `display_name`, `disabled_at`. Insert only via the provisioning function. |
| `editions` | Weekly edition | `number int unique`, `publication_date date unique`, `status edition_status`, `revision int` |
| `submissions` | **Original** reports (evidence, immutable) | `receipt text unique` (opaque), `category`, `status`, content fields, `edition_id`. The alias is unverified. No IP column. |
| `submission_attachments` | Evidence media metadata | `storage_path` (server-generated), `mime`, `bytes`, `sha256`, `purge_after` |
| `editorial_stories` | Editorial (satirical) version | `submission_id` nullable, `headline`, `satirical_body`, `verification`, `is_rumor`, `exact_quote`, `version` |
| `editorial_decisions` | Append-only decision history | `submission_id`, `from_status`, `to_status`, `admin_id`, `note` |
| `story_assignments` | Story ↔ edition placement | `edition_id`, `story_id`, `section`, `position`. Unique `(edition_id, story_id)`. |
| `community_characters` | People referenced in stories / rankings | display name, optional link to `lp_players` |
| `power_rankings` / `power_ranking_entries` | Manual ranking per edition | unique `(ranking_id, position)`, `previous_position` nullable, frozen with the edition |
| `lp_players` | Registry (seeded with 11 Riot IDs) | `game_name`, `tag_line`, `active` |
| `lp_snapshots` / `lp_snapshot_entries` | Weekly LP report | queue, method, start/end rank+LP (**nullable**), `games` nullable, `quality`, `source`, `collected_at` |
| `lp_import_jobs` | Manual import / sync jobs | `provider`, `status`, per-player errors JSON |
| `editorial_exports` | Friday packages | `edition_id`, `revision`, `sha256`, `storage_path`, `created_by` |
| `security_audit_events` | Audit trail | `kind`, `actor_id`, `summary`, `metadata jsonb` (no secrets), `expires_at` |
| `application_settings` | Ops settings | intake mode, retention days, closing hour |

Quotes, rumors and memes are `editorial_stories` rows filtered by type and section, which avoids three near-duplicate
tables. A dedicated table can be split out later if the Caos module needs fields of its own.
