#!/usr/bin/env bash
# Aplica las migraciones sobre un Postgres limpio que imita a Supabase y ejecuta las pruebas SQL.
# Uso: DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres scripts/db-test.sh
set -euo pipefail
: "${DATABASE_URL:?Define DATABASE_URL (base de datos VACÍA de pruebas)}"
cd "$(dirname "$0")/.."
PSQL=(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -X)
"${PSQL[@]}" -c "drop schema if exists public cascade; drop schema if exists private cascade; drop schema if exists auth cascade; drop schema if exists storage cascade; create schema public;" >/dev/null
"${PSQL[@]}" -c "do \$\$ begin if exists (select from pg_roles where rolname='anon') then drop owned by anon, authenticated, service_role; drop role anon; drop role authenticated; drop role service_role; end if; end \$\$;" >/dev/null 2>&1 || true
"${PSQL[@]}" -f supabase/tests/00_supabase_shim.sql >/dev/null
for f in supabase/migrations/*.sql; do
  echo "→ migración $(basename "$f")"
  "${PSQL[@]}" -f "$f" >/dev/null
done
# Las pruebas comparten sesión con los helpers (funciones pg_temp).
cat supabase/tests/helpers.sql supabase/tests/*.test.sql | "${PSQL[@]}" 2>&1 | sed -n 's/^.*NOTICE:  //p'
echo "✓ Pruebas de base de datos superadas"
