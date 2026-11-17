-- =====================================================================
-- Seguridad: administradores, RLS (deny by default), privilegios mínimos, auditoría.
-- Lectores anónimos y colaboradores NO tienen acceso directo a ninguna tabla.
-- El periódico público se sirve desde snapshots vía el Worker (Fase 5); el envío público
-- pasa por una RPC acotada (Fase 3).
-- =====================================================================

grant usage on schema private to authenticated;

-- ---------- Identidad de administrador ----------
-- Por ID inmutable de Supabase Auth (auth.uid()), nunca por nombre o correo.
create function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admin_users a
    where a.user_id = (select auth.uid()) and a.disabled_at is null
  )
$$;

-- Toda operación editorial exige MFA (AAL2).
create function private.is_admin_aal2() returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_admin() and coalesce((select auth.jwt()) ->> 'aal', '') = 'aal2'
$$;

revoke all on function private.is_admin() from public, anon;
revoke all on function private.is_admin_aal2() from public, anon;
grant execute on function private.is_admin(), private.is_admin_aal2() to authenticated;

-- ---------- Privilegios mínimos ----------
-- Supabase concede por defecto privilegios a anon/authenticated en tablas nuevas: se retiran todos.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated, public;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on functions from anon, public;

-- Administradores (rol authenticated + RLS) en tablas editoriales.
grant select, insert, update, delete on
  public.editions, public.submissions, public.submission_attachments, public.characters,
  public.media_assets, public.media_revisions, public.articles, public.article_sources,
  public.article_pastoral_details, public.creative_bible_versions, public.creative_briefs,
  public.creative_generations, public.quotes, public.memes, public.rumors, public.lp_players,
  public.lp_import_jobs, public.lp_snapshots, public.lp_snapshot_entries, public.power_rankings,
  public.power_ranking_entries, public.word_puzzles, public.word_dictionary_terms,
  public.whatsapp_announcements
to authenticated;

-- Solo-anexar: leer e insertar; nunca modificar ni borrar.
grant select, insert on
  public.edition_revisions, public.publication_events, public.editorial_approvals,
  public.article_revisions
to authenticated;

-- Configuración: lectura y actualización (no alta/baja de claves desde la app).
grant select, update on public.application_settings to authenticated;

-- Admins y bitácora: solo lectura desde la API. Altas de admins por aprovisionamiento; eventos por RPC.
grant select on public.admin_users, public.security_audit_events to authenticated;

-- ---------- RLS: activada en TODAS las tablas ----------
-- (Sin FORCE: el dueño —postgres— la omite, lo que permite a las funciones SECURITY DEFINER
-- de aprovisionamiento y auditoría operar; ningún rol de la API es dueño de las tablas.)
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

-- Política genérica "admin con MFA" para las tablas editoriales.
do $$
declare t text;
begin
  foreach t in array array[
    'editions','submissions','submission_attachments','characters','media_assets','media_revisions',
    'articles','article_sources','article_pastoral_details','creative_bible_versions','creative_briefs',
    'creative_generations','quotes','memes','rumors','lp_players','lp_import_jobs','lp_snapshots',
    'lp_snapshot_entries','power_rankings','power_ranking_entries','word_puzzles','word_dictionary_terms',
    'whatsapp_announcements','edition_revisions','publication_events','editorial_approvals','article_revisions'
  ] loop
    execute format(
      'create policy admin_all on public.%I as permissive for all to authenticated using ((select private.is_admin_aal2())) with check ((select private.is_admin_aal2()))',
      t
    );
  end loop;
end $$;

create policy admin_settings_read on public.application_settings for select to authenticated using ((select private.is_admin_aal2()));
create policy admin_settings_update on public.application_settings for update to authenticated
  using ((select private.is_admin_aal2())) with check ((select private.is_admin_aal2()));

-- Cada usuario ve su propia fila (para saber si es admin); los admins con MFA ven todas.
create policy admin_users_self on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin_aal2()));

create policy audit_admin_read on public.security_audit_events for select to authenticated using ((select private.is_admin_aal2()));

-- Quien registra una revisión/decisión/evento de publicación es siempre el usuario autenticado.
create policy actor_is_self_approvals on public.editorial_approvals as restrictive for insert to authenticated with check (actor_id = (select auth.uid()));
create policy actor_is_self_publication on public.publication_events as restrictive for insert to authenticated with check (actor_id = (select auth.uid()));
create policy actor_is_self_revisions on public.edition_revisions as restrictive for insert to authenticated with check (published_by = (select auth.uid()));
create policy actor_is_self_article_rev on public.article_revisions as restrictive for insert to authenticated with check (edited_by = (select auth.uid()));

-- ---------- Bitácora ----------
create function private.audit(p_kind text, p_severity public.audit_severity, p_actor uuid, p_summary text, p_metadata jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into public.security_audit_events (kind, severity, actor_id, summary, metadata)
  values (p_kind, p_severity, p_actor, left(p_summary, 300), coalesce(p_metadata, '{}'::jsonb));
$$;
revoke all on function private.audit(text, public.audit_severity, uuid, text, jsonb) from public, anon, authenticated;

-- Cambios en la lista de administradores siempre quedan auditados.
create function private.audit_admin_users() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform private.audit(
    'ADMIN_CHANGE', 'warning', (select auth.uid()),
    case tg_op
      when 'INSERT' then 'Administrador aprovisionado: ' || new.display_name
      when 'UPDATE' then case when new.disabled_at is not null and old.disabled_at is null then 'Administrador deshabilitado: ' || new.display_name
                              when new.disabled_at is null and old.disabled_at is not null then 'Administrador reactivado: ' || new.display_name
                              else 'Administrador modificado: ' || new.display_name end
      else 'Administrador eliminado: ' || old.display_name
    end,
    jsonb_build_object('user_id', coalesce(new.user_id, old.user_id))
  );
  return coalesce(new, old);
end $$;
create trigger admin_users_audit after insert or update or delete on public.admin_users
  for each row execute function private.audit_admin_users();

-- ---------- RPC públicas (expuestas por PostgREST) ----------
-- ¿Quién soy? Usada por el Worker para autorizar /api/admin/*. PostgREST valida la firma del JWT.
create function public.current_admin() returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when private.is_admin() then
    jsonb_build_object(
      'user_id', a.user_id,
      'display_name', a.display_name,
      'aal', coalesce((select auth.jwt()) ->> 'aal', 'aal1')
    )
  end
  from public.admin_users a
  where a.user_id = (select auth.uid()) and a.disabled_at is null
$$;
revoke all on function public.current_admin() from public, anon;
grant execute on function public.current_admin() to authenticated;

-- Registro de eventos iniciados por un admin (p. ej. inicio de sesión con MFA). Lista cerrada de tipos.
create function public.log_admin_event(p_kind text, p_summary text, p_metadata jsonb default '{}'::jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if p_kind not in ('ADMIN_SIGN_IN', 'EXPORT', 'SENSITIVE_OPERATION') then
    raise exception 'Tipo de evento no permitido' using errcode = '22023';
  end if;
  perform private.audit(p_kind, 'info', (select auth.uid()), p_summary, coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('aal', (select auth.jwt()) ->> 'aal'));
end $$;
revoke all on function public.log_admin_event(text, text, jsonb) from public, anon;
grant execute on function public.log_admin_event(text, text, jsonb) to authenticated;

-- ---------- Aprovisionamiento (solo desde el SQL Editor / rol postgres) ----------
-- Nadie puede volverse administrador desde la app: estas funciones NO se exponen a anon/authenticated.
create function private.provision_admin(p_email text, p_display_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid;
  v_active int;
  v_max int;
begin
  select id into v_user from auth.users where lower(email) = lower(trim(p_email));
  if v_user is null then
    raise exception 'No existe una cuenta de Supabase Auth con ese correo. Créala primero (Authentication → Users).';
  end if;
  select count(*) into v_active from public.admin_users where disabled_at is null and user_id <> v_user;
  select coalesce((value #>> '{}')::int, 2) into v_max from public.application_settings where key = 'max_admins';
  if v_active >= coalesce(v_max, 2) then
    raise exception 'Límite de administradores alcanzado (%). Ajusta application_settings.max_admins si es intencional.', coalesce(v_max, 2);
  end if;
  insert into public.admin_users (user_id, display_name) values (v_user, p_display_name)
  on conflict (user_id) do update set display_name = excluded.display_name, disabled_at = null;
  return v_user;
end $$;

create function private.disable_admin(p_email text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.admin_users set disabled_at = now()
  where user_id = (select id from auth.users where lower(email) = lower(trim(p_email))) and disabled_at is null;
  if not found then raise exception 'No hay un administrador activo con ese correo.'; end if;
end $$;

revoke all on function private.provision_admin(text, text) from public, anon, authenticated;
revoke all on function private.disable_admin(text) from public, anon, authenticated;

-- ---------- Retención ----------
-- Ejecutada por un job programado con rol de servicio (Fase 3). Deja constancia en la bitácora.
create function private.purge_expired() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_audit int;
  v_rejected int;
  v_days int;
begin
  select coalesce((value #>> '{}')::int, 30) into v_days from public.application_settings where key = 'retention_rejected_days';
  delete from public.security_audit_events where expires_at < now();
  get diagnostics v_audit = row_count;
  delete from public.submissions
   where status = 'REJECTED' and updated_at < now() - make_interval(days => coalesce(v_days, 30))
     and not exists (select 1 from public.article_sources s where s.submission_id = submissions.id);
  get diagnostics v_rejected = row_count;
  perform private.audit('RETENTION', 'info', null, 'Limpieza de retención ejecutada',
    jsonb_build_object('audit_events', v_audit, 'rejected_submissions', v_rejected));
  return jsonb_build_object('audit_events', v_audit, 'rejected_submissions', v_rejected);
end $$;
revoke all on function private.purge_expired() from public, anon, authenticated;
