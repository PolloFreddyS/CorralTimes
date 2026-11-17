\set ON_ERROR_STOP 1
-- Reglas de integridad editorial (como admin con MFA).
begin;
select pg_temp.act_as('authenticated', '11111111-1111-4111-8111-111111111111', 'aal2');
insert into public.editions (id, number, slug, publication_date) values ('aaaaaaaa-0000-4000-8000-000000000001', 1, 'edicion-001-2026-11-20', '2026-11-20');

-- LP: nulo permitido, nunca 0 inventado para MISSING; snapshot congelado inmutable.
insert into public.lp_snapshots (id, edition_id, period_start, period_end, method, source, collected_at, created_by)
values ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', '2026-11-14', '2026-11-20', 'DPM_LIKE', 'Importación manual', now(), '11111111-1111-4111-8111-111111111111');
insert into public.lp_snapshot_entries (snapshot_id, player_id, queue, lp_change, games, quality)
select 'bbbbbbbb-0000-4000-8000-000000000001', id, 'RANKED_SOLO_5x5', null, null, 'MISSING' from public.lp_players where game_name = 'Edeeste';
select pg_temp.expect_rows($$select 1 from public.lp_snapshot_entries where lp_change is null and quality = 'MISSING'$$, 1, 'LP faltante se guarda como NULL');
select pg_temp.expect_error($$insert into public.lp_snapshot_entries (snapshot_id, player_id, queue, lp_change, quality) select 'bbbbbbbb-0000-4000-8000-000000000001', id, 'RANKED_FLEX_SR', 0, 'MISSING' from public.lp_players where game_name = 'Edeeste'$$, 'MISSING con valor numérico rechazado');
update public.lp_snapshots set status = 'FROZEN' where id = 'bbbbbbbb-0000-4000-8000-000000000001';
select pg_temp.expect_error($$update public.lp_snapshot_entries set lp_change = 50$$, 'snapshot LP congelado no se modifica');
select pg_temp.expect_error($$update public.lp_snapshots set commentary = 'cambio'$$, 'snapshot congelado no se reabre en silencio');

-- Power Ranking final congelado y posiciones únicas.
insert into public.power_rankings (id, edition_id) values ('cccccccc-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001');
insert into public.power_ranking_entries (ranking_id, position, participant) values ('cccccccc-0000-4000-8000-000000000001', 1, 'Participante');
select pg_temp.expect_error($$insert into public.power_ranking_entries (ranking_id, position, participant) values ('cccccccc-0000-4000-8000-000000000001', 1, 'Duplicado')$$, 'posiciones de ranking únicas');
update public.power_rankings set status = 'FINAL', frozen_at = now() where id = 'cccccccc-0000-4000-8000-000000000001';
select pg_temp.expect_error($$update public.power_ranking_entries set position = 2$$, 'ranking final congelado');

-- Revisiones publicadas inmutables.
insert into public.edition_revisions (edition_id, revision, snapshot, sha256, published_by)
values ('aaaaaaaa-0000-4000-8000-000000000001', 1, '{}'::jsonb, repeat('a', 64), '11111111-1111-4111-8111-111111111111');
select pg_temp.expect_error($$update public.edition_revisions set snapshot = '{"x":1}'$$, 'revisión publicada inmutable');

-- La Voz del Pastor: nada se publica sin pasaje verificado; paráfrasis sin comillas.
insert into public.articles (id, edition_id, slug, title, category, created_by)
values ('dddddddd-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'la-fuerza', 'La fuerza', 'PASTORAL', '11111111-1111-4111-8111-111111111111');
select pg_temp.expect_error($$update public.articles set status = 'READY_FOR_PUBLICATION' where id = 'dddddddd-0000-4000-8000-000000000001'$$, 'columna sin pasaje no avanza');
insert into public.article_pastoral_details (article_id, book_code, chapter, verse_start, verse_end, translation_code, passage_mode, passage_text)
values ('dddddddd-0000-4000-8000-000000000001', 'PHP', 4, 13, 13, 'RVR1960', 'QUOTATION', 'Todo lo puedo en Cristo que me fortalece.');
select pg_temp.expect_error($$update public.articles set status = 'READY_FOR_PUBLICATION' where id = 'dddddddd-0000-4000-8000-000000000001'$$, 'cita sin verificar no avanza');
select pg_temp.expect_error($$update public.article_pastoral_details set verified = true$$, 'verificar exige quién, cuándo y fuente');
update public.article_pastoral_details set verified = true, verified_by = '11111111-1111-4111-8111-111111111111', verified_at = now(), verification_source = 'Biblia RVR1960 impresa';
update public.articles set status = 'READY_FOR_PUBLICATION' where id = 'dddddddd-0000-4000-8000-000000000001';
select pg_temp.expect_rows($$select 1 from public.articles where status = 'READY_FOR_PUBLICATION'$$, 1, 'columna verificada avanza');
select pg_temp.expect_error($$update public.article_pastoral_details set passage_mode = 'PARAPHRASE', passage_text = '“Todo lo puedo”'$$, 'paráfrasis con comillas rechazada');
select pg_temp.expect_error($$update public.article_pastoral_details set prayer_invitation = 'Oremos'$$, 'invitación a orar exige privacidad');

-- Otros contratos.
select pg_temp.expect_error($$insert into public.articles (slug, title, category, status, created_by) values ('suelto', 'Suelto', 'NOTICIA', 'PUBLISHED', '11111111-1111-4111-8111-111111111111')$$, 'artículo publicado exige edición');
select pg_temp.expect_error($$insert into public.word_puzzles (edition_id, answer) values ('aaaaaaaa-0000-4000-8000-000000000001', 'gallo')$$, 'respuesta del palabrero normalizada (A-Z/Ñ)');
select pg_temp.expect_error($$insert into public.media_assets (role, approval, created_by) values ('COVER', 'APPROVED', '11111111-1111-4111-8111-111111111111')$$, 'imagen aprobada exige texto alternativo');
select pg_temp.expect_error($$insert into public.editions (number, slug, publication_date) values (2, '../admin', '2026-11-27')$$, 'slug de edición validado');

-- Concurrencia optimista: version la incrementa el servidor.
update public.editions set headline = 'Titular' where id = 'aaaaaaaa-0000-4000-8000-000000000001';
select pg_temp.expect_rows($$select 1 from public.editions where version = 2$$, 1, 'version incrementada por el servidor');
rollback;

-- Retención (rol postgres = job programado).
select private.purge_expired();
select pg_temp.expect_rows($$select 1 from public.security_audit_events where kind = 'RETENTION'$$, 1, 'retención auditada');
