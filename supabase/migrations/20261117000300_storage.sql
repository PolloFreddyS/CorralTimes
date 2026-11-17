-- =====================================================================
-- Almacenamiento: evidencia y originales en buckets PRIVADOS; solo derivados aprobados en el público.
-- Las rutas las genera el servidor (uuid/uuid.ext). Sin políticas para anon: no se puede listar.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('evidence',      'evidence',      false, 5242880,  array['image/png','image/jpeg','image/webp']),
  ('media-staging', 'media-staging', false, 20971520, array['image/png','image/jpeg','image/webp','image/avif']),
  ('media-public',  'media-public',  true,  10485760, array['image/webp','image/avif','image/jpeg','image/png'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy corral_admin_read on storage.objects for select to authenticated
  using (bucket_id in ('evidence', 'media-staging', 'media-public') and (select private.is_admin_aal2()));
create policy corral_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id in ('media-staging', 'media-public') and (select private.is_admin_aal2()));
create policy corral_admin_update on storage.objects for update to authenticated
  using (bucket_id in ('media-staging', 'media-public') and (select private.is_admin_aal2()))
  with check (bucket_id in ('media-staging', 'media-public') and (select private.is_admin_aal2()));
create policy corral_admin_delete on storage.objects for delete to authenticated
  using (bucket_id in ('evidence', 'media-staging', 'media-public') and (select private.is_admin_aal2()));
-- La evidencia de los colaboradores la escribe solo el Worker (rol de servicio) en la Fase 3.
