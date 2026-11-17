-- Utilidades de prueba: actuar como un rol/usuario concreto dentro de una transacción.
create or replace function pg_temp.act_as(p_role text, p_sub uuid default null, p_aal text default 'aal2') returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    case when p_sub is null then json_build_object('role', p_role)::text
         else json_build_object('role', p_role, 'sub', p_sub, 'aal', p_aal)::text end, true);
  execute format('set local role %I', p_role);
end $$;

create or replace function pg_temp.expect_error(p_sql text, p_label text) returns void
language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    raise notice 'ok — % (%)', p_label, sqlerrm;
    return;
  end;
  raise exception 'FALLO: se esperaba un error en: %', p_label;
end $$;

create or replace function pg_temp.expect_rows(p_sql text, p_expected bigint, p_label text) returns void
language plpgsql as $$
declare n bigint;
begin
  execute format('select count(*) from (%s) q', p_sql) into n;
  if n is distinct from p_expected then
    raise exception 'FALLO: % — esperaba % filas, obtuve %', p_label, p_expected, n;
  end if;
  raise notice 'ok — %', p_label;
end $$;
