-- Datos de referencia de PRODUCCIÓN (no son noticias ni estadísticas).

insert into public.application_settings (key, value) values
  ('time_zone', '"America/Santo_Domingo"'),
  ('closing_hour', '18'),
  ('intake_mode', '"not_configured"'),
  ('max_admins', '2'),
  ('retention_rejected_days', '30'),
  ('retention_media_days', '30'),
  ('retention_audit_days', '60'),
  ('bible_translation', '"RVR1960"')
on conflict (key) do nothing;

-- Registro inicial de jugadores (configurable desde HQ). Se preserva Unicode.
insert into public.lp_players (game_name, tag_line) values
  ('Barren Wuffet', 'LAN'),
  ('Webo De Frodo', 'LAN'),
  ('Toxic King Chiki', 'LAN'),
  ('Nunu y Pollo', 'Pollo'),
  ('Mi Momento Va', 'LAN12'),
  ('Itami4U', 'LAN'),
  ('En3ñemayPanekton', '7756'),
  ('Edeeste', 'LAN'),
  ('DarkSaphiro', 'LAN'),
  ('AFK Rayser', 'LAN'),
  ('Sr Terro Rita', 'Pollo')
on conflict (game_name, tag_line) do nothing;
