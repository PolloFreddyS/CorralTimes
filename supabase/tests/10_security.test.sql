\set ON_ERROR_STOP 1
-- ---------- Preparación (como postgres) ----------
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'dueno@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'divilight@example.test'),
  ('33333333-3333-4333-8333-333333333333', 'curioso@example.test'),
  ('44444444-4444-4444-8444-444444444444', 'tercero@example.test');
select private.provision_admin('dueno@example.test', 'Dueño');
select private.provision_admin('DIVILIGHT@example.test', 'Divilight');
select pg_temp.expect_error($$select private.provision_admin('tercero@example.test', 'Tercero')$$, 'límite de 2 administradores');
select pg_temp.expect_error($$select private.provision_admin('noexiste@example.test', 'X')$$, 'no se aprovisiona un correo sin cuenta');
select pg_temp.expect_rows($$select 1 from public.security_audit_events where kind = 'ADMIN_CHANGE'$$, 2, 'aprovisionamiento auditado');
select pg_temp.expect_rows($$select 1 from public.lp_players$$, 11, 'registro LP sembrado (11 jugadores)');
select pg_temp.expect_rows($$select 1 from public.lp_players where game_name = 'En3ñemayPanekton' and tag_line = '7756'$$, 1, 'Riot ID con Unicode preservado');

-- ---------- 1. Anónimo: sin acceso a NINGUNA tabla ni RPC privilegiada ----------
begin;
select pg_temp.act_as('anon');
do $$
declare t record; denied int := 0; total int := 0;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    total := total + 1;
    begin
      execute format('select 1 from public.%I limit 1', t.tablename);
    exception when insufficient_privilege then denied := denied + 1;
    end;
  end loop;
  if denied <> total then raise exception 'FALLO: anon puede leer % de % tablas', total - denied, total; end if;
  raise notice 'ok — anon sin acceso a las % tablas públicas', total;
end $$;
select pg_temp.expect_error($$insert into public.submissions (receipt, category, reporter_alias, headline, description, event_date, permission_acknowledged) values ('CT-AAAA','NOTICIA','Anon','Titular falso','Descripción falsa suficientemente larga', current_date, true)$$, 'anon no inserta reportes directamente');
select pg_temp.expect_error($$select public.current_admin()$$, 'anon no ejecuta current_admin');
select pg_temp.expect_error($$select public.log_admin_event('ADMIN_SIGN_IN', 'x')$$, 'anon no registra eventos');
select pg_temp.expect_error($$select private.provision_admin('curioso@example.test', 'Hacker')$$, 'anon no se aprovisiona');
select pg_temp.expect_rows($$select 1 from storage.objects$$, 0, 'anon no lista objetos de storage');
rollback;

-- ---------- 2. Usuario autenticado que NO es admin ----------
begin;
select pg_temp.act_as('authenticated', '33333333-3333-4333-8333-333333333333');
select pg_temp.expect_rows($$select 1 from public.submissions$$, 0, 'no-admin no ve reportes');
select pg_temp.expect_error($$insert into public.editions (number, slug, publication_date) values (1, 'edicion-001-2026-11-20', '2026-11-20')$$, 'no-admin no crea ediciones');
select pg_temp.expect_error($$insert into public.admin_users (user_id, display_name) values ('33333333-3333-4333-8333-333333333333', 'Yo mismo')$$, 'no-admin no se autoasigna admin');
select pg_temp.expect_error($$select private.provision_admin('curioso@example.test', 'Yo')$$, 'no-admin no ejecuta aprovisionamiento');
select pg_temp.expect_error($$select public.log_admin_event('ADMIN_SIGN_IN', 'falso')$$, 'no-admin no escribe en la bitácora');
select pg_temp.expect_rows($$select 1 from public.security_audit_events$$, 0, 'no-admin no lee la bitácora');
select pg_temp.expect_rows($$select public.current_admin() where public.current_admin() is not null$$, 0, 'current_admin = null para no-admin');
rollback;

-- ---------- 3. Admin SIN MFA (aal1) ----------
begin;
select pg_temp.act_as('authenticated', '11111111-1111-4111-8111-111111111111', 'aal1');
select pg_temp.expect_error($$insert into public.editions (number, slug, publication_date) values (1, 'edicion-001-2026-11-20', '2026-11-20')$$, 'admin aal1 no escribe');
select pg_temp.expect_rows($$select 1 from public.lp_players$$, 0, 'admin aal1 no lee datos editoriales');
select pg_temp.expect_rows($$select 1 from public.current_admin() a where a ->> 'aal' = 'aal1'$$, 1, 'current_admin informa aal1 (la app pide MFA)');
rollback;

-- ---------- 4. Admin CON MFA (aal2) ----------
begin;
select pg_temp.act_as('authenticated', '11111111-1111-4111-8111-111111111111', 'aal2');
insert into public.editions (number, slug, publication_date) values (1, 'edicion-001-2026-11-20', '2026-11-20');
select pg_temp.expect_rows($$select 1 from public.editions$$, 1, 'admin aal2 crea y lee ediciones');
select pg_temp.expect_rows($$select 1 from public.lp_players$$, 11, 'admin aal2 lee el registro LP');
select pg_temp.expect_rows($$select 1 from public.admin_users$$, 2, 'admin aal2 ve la lista de admins');
select pg_temp.expect_error($$insert into public.admin_users (user_id, display_name) values ('33333333-3333-4333-8333-333333333333', 'Colado')$$, 'ni un admin crea admins desde la API');
select pg_temp.expect_error($$update public.admin_users set disabled_at = null$$, 'ni un admin modifica admins desde la API');
select pg_temp.expect_error($$update public.security_audit_events set summary = 'borrado'$$, 'la bitácora no se modifica');
select pg_temp.expect_error($$delete from public.security_audit_events$$, 'la bitácora no se borra');
select public.log_admin_event('ADMIN_SIGN_IN', 'Inicio de sesión con MFA');
select pg_temp.expect_error($$select public.log_admin_event('ADMIN_CHANGE', 'falso')$$, 'tipos de evento restringidos');
select pg_temp.expect_error($$insert into public.editorial_approvals (subject_type, subject_id, to_status, actor_id) values ('EDITION', gen_random_uuid(), 'READY', '22222222-2222-4222-8222-222222222222')$$, 'no se suplanta al actor de una decisión');
insert into public.editorial_approvals (subject_type, subject_id, to_status, actor_id) values ('EDITION', gen_random_uuid(), 'READY', '11111111-1111-4111-8111-111111111111');
select pg_temp.expect_error($$update public.editorial_approvals set to_status = 'PUBLISHED'$$, 'las decisiones son de solo-anexar');
select pg_temp.expect_rows($$select 1 from public.current_admin() a where a ->> 'display_name' = 'Dueño' and a ->> 'aal' = 'aal2'$$, 1, 'current_admin devuelve identidad y aal2');
rollback;

-- ---------- 5. Admin deshabilitado pierde el acceso ----------
begin;
select private.disable_admin('divilight@example.test');
select pg_temp.act_as('authenticated', '22222222-2222-4222-8222-222222222222', 'aal2');
select pg_temp.expect_rows($$select 1 from public.lp_players$$, 0, 'admin deshabilitado no lee datos');
select pg_temp.expect_rows($$select public.current_admin() where public.current_admin() is not null$$, 0, 'admin deshabilitado no es admin');
rollback;
