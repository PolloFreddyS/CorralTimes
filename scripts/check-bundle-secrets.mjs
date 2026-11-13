#!/usr/bin/env node
/**
 * Inspecciona el bundle del navegador (dist/client) buscando credenciales privilegiadas.
 * Falla (exit 1) si encuentra algo. Se ejecuta en CI después de `vite build`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const SECRET_PATTERNS = [
  { name: 'Supabase service_role JWT', re: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]*c2VydmljZV9yb2xl[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+/ },
  { name: 'Supabase secret key', re: /sb_secret_[A-Za-z0-9_-]{10,}/ },
  { name: 'Anthropic API key', re: /sk-ant-[A-Za-z0-9_-]{10,}/ },
  { name: 'OpenAI-style secret key', re: /\bsk-(?:proj-)?[A-Za-z0-9]{20,}/ },
  { name: 'Riot API key', re: /RGAPI-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i },
  { name: 'Turnstile secret key', re: /\b0x4AAAAAAA[A-Za-z0-9_-]{20,}/ },
  { name: 'Private key block', re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'Postgres connection string with password', re: /postgres(?:ql)?:\/\/[^:\s"']+:[^@\s"']+@/ },
  { name: 'Server-only env var name', re: /SUPABASE_SERVICE_ROLE_KEY|TURNSTILE_SECRET_KEY|RIOT_API_KEY|ANTHROPIC_API_KEY/ },
];

export function scanText(text) {
  return SECRET_PATTERNS.filter((p) => p.re.test(text)).map((p) => p.name);
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else yield full;
  }
}

function main() {
  const root = join(process.argv[2] ?? 'dist', 'client');
  let findings = 0;
  for (const file of walk(root)) {
    if (!/\.(js|mjs|css|html|json|map|txt)$/.test(file) && !file.endsWith('_headers')) continue;
    const hits = scanText(readFileSync(file, 'utf8'));
    for (const h of hits) {
      findings++;
      console.error(`✗ ${h} en ${file}`);
    }
  }
  if (findings) {
    console.error(`\n${findings} posible(s) secreto(s) en el bundle del navegador.`);
    process.exit(1);
  }
  console.log(`✓ Bundle limpio: sin credenciales privilegiadas en ${root}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
