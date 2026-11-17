-- =====================================================================
-- EL CORRAL TIMES 2.0 — esquema base
-- Convenciones: UUID, timestamps del servidor, enums alineados con shared/domain/*,
-- columnas numéricas de datos (LP, partidas) NULLABLE: un dato ausente nunca es 0.
-- =====================================================================

create schema if not exists private;
revoke all on schema private from public;

-- ---------- Enums ----------
create type public.submission_category as enum ('NOTICIA','RUMOR','MEME','FRASE_LEGENDARIA','LOGRO','DRAMA_RANKED','OTRO');
create type public.submission_status   as enum ('SUBMITTED','UNDER_REVIEW','NEEDS_INFORMATION','APPROVED','REJECTED','ARCHIVED');
create type public.article_status      as enum ('EDITORIAL_DRAFT','READY_FOR_LAYOUT','READY_FOR_PUBLICATION','PUBLISHED','ARCHIVED');
create type public.article_category    as enum ('NOTICIA','INVESTIGACION','RANKED','POKEMON','COMUNIDAD','OPINION','EVENTO','PASTORAL');
create type public.article_placement   as enum ('LEAD','SECONDARY','BRIEF');
create type public.edition_status      as enum ('DRAFT','IN_REVIEW','READY','SCHEDULED','PUBLISHED','ARCHIVED');
create type public.publication_event_kind as enum ('SCHEDULED','PUBLISHED','UNPUBLISHED','REVISED','ARCHIVED');
create type public.media_role          as enum ('COVER','ARTICLE_HERO','MEME','SOCIAL_PREVIEW','SECTION_BANNER','CHARACTER_ASSET','PASTORAL_ILLUSTRATION');
create type public.artwork_source      as enum ('CHATGPT','OPENAI_API','UPLOAD');
create type public.approval_status     as enum ('PENDING','APPROVED','REJECTED');
create type public.lp_queue            as enum ('RANKED_SOLO_5x5','RANKED_FLEX_SR');
create type public.lp_data_quality     as enum ('COMPLETE','SOURCE_PROVIDED','FALLBACK_BASELINE','PARTIAL','MISSING','ERROR');
create type public.lp_method           as enum ('DPM_LIKE','STRICT','SOURCE_PROVIDED');
create type public.lp_snapshot_status  as enum ('DRAFT','PENDING_APPROVAL','APPROVED','FROZEN');
create type public.lp_job_status       as enum ('QUEUED','RUNNING','SUCCEEDED','PARTIAL','FAILED');
create type public.ranking_status      as enum ('DRAFT','FINAL');
create type public.puzzle_status       as enum ('DRAFT','READY','ARCHIVED');
create type public.passage_mode        as enum ('QUOTATION','PARAPHRASE');
create type public.prayer_privacy      as enum ('NO_PRIVATE_REQUESTS','CONSENT_RECORDED');
create type public.audit_severity      as enum ('info','warning','critical');

-- ---------- Utilidades ----------
-- updated_at y version (control de concurrencia optimista) los asigna SIEMPRE el servidor.
create function private.touch_row() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.created_at := old.created_at;
    new.version := old.version + 1;
  end if;
  return new;
end $$;

-- Tablas de solo-anexar (auditoría, decisiones, revisiones publicadas).
-- UPDATE nunca; DELETE solo para el rol de servicio (jobs de retención).
create function private.append_only() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'La tabla % es de solo-anexar', tg_table_name using errcode = '42501';
  end if;
  if tg_op = 'DELETE' and current_user not in ('postgres', 'service_role', 'supabase_admin') then
    raise exception 'La tabla % es de solo-anexar', tg_table_name using errcode = '42501';
  end if;
  return coalesce(new, old);
end $$;

-- ---------- Administración ----------
create table public.admin_users (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  created_at   timestamptz not null default now(),
  disabled_at  timestamptz
);

create table public.application_settings (
  key        text primary key check (key ~ '^[a-z_]{2,60}$'),
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.security_audit_events (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('ADMIN_SIGN_IN','AUTHZ_DENIED','SENSITIVE_OPERATION','EXPORT','ADMIN_CHANGE','INTEGRATION_FAILURE','ALERT','PUBLICATION','AI_GENERATION','RETENTION')),
  severity   public.audit_severity not null default 'info',
  actor_id   uuid,
  summary    text not null check (char_length(summary) <= 300),
  metadata   jsonb not null default '{}'::jsonb check (pg_column_size(metadata) <= 4096),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '60 days'
);
create index security_audit_events_created_idx on public.security_audit_events (created_at desc);
create trigger security_audit_events_append_only before update or delete on public.security_audit_events
  for each row execute function private.append_only();

-- ---------- Ediciones ----------
create table public.editions (
  id               uuid primary key default gen_random_uuid(),
  number           integer not null unique check (number > 0),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  publication_date date not null unique,
  time_zone        text not null default 'America/Santo_Domingo',
  status           public.edition_status not null default 'DRAFT',
  headline         text check (char_length(headline) <= 200),
  dek              text check (char_length(dek) <= 400),
  breaking         text check (char_length(breaking) <= 200),
  cover_asset_id   uuid,
  scheduled_for    timestamptz,
  published_at     timestamptz,
  current_revision integer not null default 0 check (current_revision >= 0),
  version          integer not null default 1,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (status <> 'SCHEDULED' or scheduled_for is not null)
);
create index editions_status_idx on public.editions (status, publication_date desc);

-- Snapshot público congelado: lo único que lee el periódico público (Fase 5).
create table public.edition_revisions (
  id           uuid primary key default gen_random_uuid(),
  edition_id   uuid not null references public.editions (id) on delete restrict,
  revision     integer not null check (revision > 0),
  snapshot     jsonb not null,
  sha256       text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  published_by uuid not null,
  published_at timestamptz not null default now(),
  unique (edition_id, revision)
);
create trigger edition_revisions_append_only before update or delete on public.edition_revisions
  for each row execute function private.append_only();

create table public.publication_events (
  id         uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.editions (id) on delete restrict,
  kind       public.publication_event_kind not null,
  revision   integer,
  actor_id   uuid not null,
  note       text check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);
create trigger publication_events_append_only before update or delete on public.publication_events
  for each row execute function private.append_only();

-- ---------- Reportes (evidencia original, nunca pública) ----------
create table public.submissions (
  id                      uuid primary key default gen_random_uuid(),
  receipt                 text not null unique check (receipt ~ '^CT-[A-Z0-9]{4,12}$'),
  category                public.submission_category not null,
  status                  public.submission_status not null default 'SUBMITTED',
  reporter_alias          text not null check (char_length(reporter_alias) between 2 and 40),
  headline                text not null check (char_length(headline) between 5 and 140),
  description             text not null check (char_length(description) between 20 and 4000),
  event_date              date not null,
  people_involved         text check (char_length(people_involved) <= 300),
  exact_quote             text check (char_length(exact_quote) <= 600),
  source                  text check (char_length(source) <= 500),
  notes                   text check (char_length(notes) <= 1000),
  permission_acknowledged boolean not null check (permission_acknowledged),
  edition_id              uuid references public.editions (id) on delete set null,
  received_at             timestamptz not null default now(),
  purge_after             timestamptz,
  version                 integer not null default 1,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index submissions_status_idx on public.submissions (status, received_at desc);

create table public.submission_attachments (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  storage_path  text not null unique check (storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(png|jpg|webp)$'),
  mime          text not null check (mime in ('image/png','image/jpeg','image/webp')),
  bytes         integer not null check (bytes > 0 and bytes <= 5242880),
  sha256        text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  width         integer check (width > 0),
  height        integer check (height > 0),
  purge_after   timestamptz,
  created_at    timestamptz not null default now()
);

create table public.editorial_approvals (
  id           uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('SUBMISSION','ARTICLE','EDITION','MEDIA','LP_SNAPSHOT','RANKING','PUZZLE','PASTORAL')),
  subject_id   uuid not null,
  from_status  text,
  to_status    text not null,
  actor_id     uuid not null,
  note         text check (char_length(note) <= 1000),
  created_at   timestamptz not null default now()
);
create index editorial_approvals_subject_idx on public.editorial_approvals (subject_type, subject_id, created_at);
create trigger editorial_approvals_append_only before update or delete on public.editorial_approvals
  for each row execute function private.append_only();

-- ---------- Medios ----------
create table public.characters (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (char_length(name) between 1 and 80),
  description text check (char_length(description) <= 1000),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.media_assets (
  id               uuid primary key default gen_random_uuid(),
  role             public.media_role not null,
  title            text check (char_length(title) <= 200),
  alt_text         text check (char_length(alt_text) <= 300),
  caption          text check (char_length(caption) <= 300),
  source           public.artwork_source not null default 'CHATGPT',
  approval         public.approval_status not null default 'PENDING',
  current_revision integer not null default 0,
  edition_id       uuid references public.editions (id) on delete set null,
  tags             text[] not null default '{}',
  created_by       uuid not null,
  version          integer not null default 1,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- Una imagen aprobada siempre tiene texto alternativo.
  check (approval <> 'APPROVED' or char_length(coalesce(alt_text, '')) > 0)
);

create table public.media_revisions (
  id                uuid primary key default gen_random_uuid(),
  asset_id          uuid not null references public.media_assets (id) on delete cascade,
  revision          integer not null check (revision > 0),
  original_path     text not null,
  public_path       text,
  mime              text not null check (mime in ('image/png','image/jpeg','image/webp','image/avif')),
  width             integer not null check (width > 0),
  height            integer not null check (height > 0),
  bytes             integer not null check (bytes > 0),
  sha256            text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  original_filename text check (char_length(original_filename) <= 255),
  created_by        uuid not null,
  created_at        timestamptz not null default now(),
  unique (asset_id, revision)
);

alter table public.editions add constraint editions_cover_fk foreign key (cover_asset_id) references public.media_assets (id) on delete set null;

-- ---------- Artículos (incluye LA VOZ DEL PASTOR, categoría PASTORAL) ----------
create table public.articles (
  id              uuid primary key default gen_random_uuid(),
  edition_id      uuid references public.editions (id) on delete restrict,
  slug            text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  title           text not null check (char_length(title) between 3 and 200),
  subtitle        text check (char_length(subtitle) <= 300),
  category        public.article_category not null,
  placement       public.article_placement not null default 'SECONDARY',
  status          public.article_status not null default 'EDITORIAL_DRAFT',
  summary         text check (char_length(summary) <= 600),
  body            jsonb not null default '{"type":"doc","content":[]}'::jsonb check (body ->> 'type' = 'doc' and jsonb_typeof(body -> 'content') = 'array'),
  credit          text check (char_length(credit) <= 120),
  hero_asset_id   uuid references public.media_assets (id) on delete set null,
  seo_title       text check (char_length(seo_title) <= 110),
  seo_description text check (char_length(seo_description) <= 200),
  position        integer not null default 0,
  created_by      uuid not null,
  version         integer not null default 1,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (edition_id, slug),
  -- Todo artículo publicado pertenece a una edición.
  check (status <> 'PUBLISHED' or edition_id is not null)
);
create index articles_edition_idx on public.articles (edition_id, position);

create table public.article_revisions (
  id         uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  revision   integer not null check (revision > 0),
  title      text not null,
  body       jsonb not null,
  edited_by  uuid not null,
  created_at timestamptz not null default now(),
  unique (article_id, revision)
);
create trigger article_revisions_append_only before update or delete on public.article_revisions
  for each row execute function private.append_only();

create table public.article_sources (
  article_id    uuid not null references public.articles (id) on delete cascade,
  submission_id uuid not null references public.submissions (id) on delete restrict,
  primary key (article_id, submission_id)
);

create table public.article_pastoral_details (
  article_id          uuid primary key references public.articles (id) on delete cascade,
  book_code           text not null check (book_code ~ '^[1-3]?[A-Z]{2,3}$'),
  chapter             integer not null check (chapter between 1 and 150),
  verse_start         integer not null check (verse_start between 1 and 176),
  verse_end           integer not null check (verse_end between 1 and 176),
  translation_code    text not null check (translation_code ~ '^[A-Z0-9]{2,10}$'),
  passage_mode        public.passage_mode not null,
  passage_text        text not null check (char_length(passage_text) between 1 and 4000),
  theme               text check (char_length(theme) <= 60),
  applications        text[] not null default '{}' check (cardinality(applications) <= 5),
  prayer_invitation   text check (char_length(prayer_invitation) <= 600),
  prayer_privacy      public.prayer_privacy,
  verified            boolean not null default false,
  verified_by         uuid,
  verified_at         timestamptz,
  verification_source text check (char_length(verification_source) <= 300),
  check (verse_end >= verse_start),
  -- Una paráfrasis nunca lleva comillas (no se presenta como cita textual).
  check (passage_mode = 'QUOTATION' or passage_text !~ '[“”"«»]'),
  -- Verificar exige quién, cuándo y contra qué fuente.
  check (not verified or (verified_by is not null and verified_at is not null and char_length(coalesce(verification_source, '')) > 0)),
  -- Una invitación a orar exige declarar su privacidad.
  check (prayer_invitation is null or prayer_privacy is not null)
);

-- Ninguna columna pastoral pasa a PUBLISHED/READY_FOR_PUBLICATION sin detalles y, si es cita, sin verificación.
create function private.guard_pastoral_publication() returns trigger
language plpgsql set search_path = '' as $$
declare d public.article_pastoral_details;
begin
  if new.category = 'PASTORAL' and new.status in ('READY_FOR_PUBLICATION', 'PUBLISHED') then
    select * into d from public.article_pastoral_details where article_id = new.id;
    if not found then
      raise exception 'La columna pastoral no tiene pasaje bíblico' using errcode = '23514';
    end if;
    if d.passage_mode = 'QUOTATION' and not d.verified then
      raise exception 'El pasaje bíblico no ha sido verificado' using errcode = '23514';
    end if;
  end if;
  return new;
end $$;
create trigger articles_guard_pastoral before insert or update of status on public.articles
  for each row execute function private.guard_pastoral_publication();

-- ---------- Creative Studio ----------
create table public.creative_bible_versions (
  id         uuid primary key default gen_random_uuid(),
  version    text not null unique check (version ~ '^\d+\.\d+\.\d+$'),
  content    jsonb not null,
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create table public.creative_briefs (
  id         uuid primary key default gen_random_uuid(),
  edition_id uuid references public.editions (id) on delete set null,
  article_id uuid references public.articles (id) on delete set null,
  role       public.media_role not null,
  content_md text not null check (char_length(content_md) <= 60000),
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create table public.creative_generations (
  id              uuid primary key default gen_random_uuid(),
  brief_id        uuid references public.creative_briefs (id) on delete set null,
  model           text not null check (char_length(model) <= 100),
  status          text not null check (status in ('REQUESTED','SUCCEEDED','FAILED','REJECTED','APPROVED')),
  cost_usd        numeric(10, 4) check (cost_usd >= 0),
  usage           jsonb,
  result_asset_id uuid references public.media_assets (id) on delete set null,
  created_by      uuid not null,
  created_at      timestamptz not null default now()
);

-- ---------- Departamento del Caos ----------
create table public.quotes (
  id            uuid primary key default gen_random_uuid(),
  edition_id    uuid references public.editions (id) on delete set null,
  article_id    uuid references public.articles (id) on delete set null,
  submission_id uuid references public.submissions (id) on delete set null,
  text          text not null check (char_length(text) between 1 and 600),
  attribution   text not null check (char_length(attribution) between 1 and 120),
  context       text check (char_length(context) <= 300),
  display_title text check (char_length(display_title) <= 140),
  approved      boolean not null default false,
  created_at    timestamptz not null default now()
);

create table public.memes (
  id         uuid primary key default gen_random_uuid(),
  edition_id uuid references public.editions (id) on delete set null,
  article_id uuid references public.articles (id) on delete set null,
  title      text not null check (char_length(title) <= 140),
  asset_id   uuid references public.media_assets (id) on delete set null,
  approved   boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.rumors (
  id         uuid primary key default gen_random_uuid(),
  edition_id uuid references public.editions (id) on delete set null,
  title      text not null check (char_length(title) <= 140),
  body       text not null check (char_length(body) <= 1000),
  approved   boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Wall Street del Tilt ----------
create table public.lp_players (
  id         uuid primary key default gen_random_uuid(),
  game_name  text not null check (char_length(game_name) between 3 and 16),
  tag_line   text not null check (tag_line ~ '^[[:alnum:]]{3,5}$'),
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  unique (game_name, tag_line)
);

create table public.lp_import_jobs (
  id           uuid primary key default gen_random_uuid(),
  provider     text not null check (provider in ('MANUAL_IMPORT','DIVILIGHT','DPM_AUTHORIZED','RIOT_OFFICIAL')),
  status       public.lp_job_status not null default 'QUEUED',
  period_start date,
  period_end   date,
  errors       jsonb not null default '[]'::jsonb,
  started_by   uuid not null,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  check (period_end is null or period_start is null or period_end >= period_start)
);

create table public.lp_snapshots (
  id            uuid primary key default gen_random_uuid(),
  edition_id    uuid unique references public.editions (id) on delete restrict,
  import_job_id uuid references public.lp_import_jobs (id) on delete set null,
  period_start  date not null,
  period_end    date not null,
  method        public.lp_method not null,
  source        text not null check (char_length(source) <= 200),
  collected_at  timestamptz not null,
  status        public.lp_snapshot_status not null default 'DRAFT',
  commentary    text check (char_length(commentary) <= 600),
  created_by    uuid not null,
  created_at    timestamptz not null default now(),
  check (period_end >= period_start)
);

create table public.lp_snapshot_entries (
  id          uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.lp_snapshots (id) on delete cascade,
  player_id   uuid not null references public.lp_players (id) on delete restrict,
  queue       public.lp_queue not null,
  start_rank  text check (char_length(start_rank) <= 40),
  end_rank    text check (char_length(end_rank) <= 40),
  start_lp    integer,
  end_lp      integer,
  lp_change   integer,          -- NULL = sin datos. Nunca default 0.
  games       integer check (games >= 0),
  quality     public.lp_data_quality not null,
  error       text check (char_length(error) <= 300),
  unique (snapshot_id, player_id, queue),
  check (quality <> 'MISSING' or lp_change is null)
);

-- Un snapshot congelado no se modifica en silencio.
create function private.guard_frozen_lp() returns trigger
language plpgsql set search_path = '' as $$
declare s public.lp_snapshot_status;
begin
  select status into s from public.lp_snapshots where id = coalesce(new.snapshot_id, old.snapshot_id);
  if s = 'FROZEN' then
    raise exception 'El snapshot LP está congelado' using errcode = '42501';
  end if;
  return coalesce(new, old);
end $$;
create trigger lp_entries_guard_frozen before insert or update or delete on public.lp_snapshot_entries
  for each row execute function private.guard_frozen_lp();

create function private.guard_frozen_lp_snapshot() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.status = 'FROZEN' then
    raise exception 'El snapshot LP está congelado' using errcode = '42501';
  end if;
  return coalesce(new, old);
end $$;
create trigger lp_snapshots_guard_frozen before update or delete on public.lp_snapshots
  for each row execute function private.guard_frozen_lp_snapshot();

-- ---------- Power Rankings ----------
create table public.power_rankings (
  id         uuid primary key default gen_random_uuid(),
  edition_id uuid not null unique references public.editions (id) on delete restrict,
  status     public.ranking_status not null default 'DRAFT',
  frozen_at  timestamptz,
  created_at timestamptz not null default now(),
  check (status <> 'FINAL' or frozen_at is not null)
);

create table public.power_ranking_entries (
  id                uuid primary key default gen_random_uuid(),
  ranking_id        uuid not null references public.power_rankings (id) on delete cascade,
  position          integer not null check (position > 0),
  previous_position integer check (previous_position > 0),
  participant       text not null check (char_length(participant) between 1 and 80),
  character_id      uuid references public.characters (id) on delete set null,
  commentary        text check (char_length(commentary) <= 400),
  unique (ranking_id, position)
);

create function private.guard_final_ranking() returns trigger
language plpgsql set search_path = '' as $$
declare s public.ranking_status;
begin
  select status into s from public.power_rankings where id = coalesce(new.ranking_id, old.ranking_id);
  if s = 'FINAL' then
    raise exception 'El ranking está congelado' using errcode = '42501';
  end if;
  return coalesce(new, old);
end $$;
create trigger ranking_entries_guard_final before insert or update or delete on public.power_ranking_entries
  for each row execute function private.guard_final_ranking();

-- ---------- El Palabrero ----------
create table public.word_puzzles (
  id           uuid primary key default gen_random_uuid(),
  edition_id   uuid not null unique references public.editions (id) on delete restrict,
  answer       text not null check (answer ~ '^[A-ZÑ]{5}$'),
  clue         text check (char_length(clue) <= 140),
  difficulty   text not null default 'NORMAL' check (difficulty in ('FACIL','NORMAL','DIFICIL')),
  active_from  timestamptz,
  active_until timestamptz,
  status       public.puzzle_status not null default 'DRAFT',
  created_at   timestamptz not null default now(),
  check (active_until is null or active_from is null or active_until > active_from)
);

create table public.word_dictionary_terms (
  term       text primary key check (term ~ '^[A-ZÑ]{5}$'),
  added_by   uuid not null,
  created_at timestamptz not null default now()
);

-- ---------- WhatsApp ----------
create table public.whatsapp_announcements (
  id         uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.editions (id) on delete cascade,
  message    text not null check (char_length(message) <= 2000),
  created_by uuid not null,
  copied_at  timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- touch triggers ----------
create trigger editions_touch      before update on public.editions      for each row execute function private.touch_row();
create trigger submissions_touch   before update on public.submissions   for each row execute function private.touch_row();
create trigger media_assets_touch  before update on public.media_assets  for each row execute function private.touch_row();
create trigger articles_touch      before update on public.articles      for each row execute function private.touch_row();
