// @vitest-environment node
import { describe, expect, it } from 'vitest';
// @ts-expect-error — módulo JS sin tipos
import { scanText } from '../../scripts/check-bundle-secrets.mjs';

const b64url = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

describe('escáner de secretos del bundle', () => {
  it('detecta credenciales privilegiadas', () => {
    const header = b64url('{"alg":"HS256"}');
    const body = b64url('{"role":"service_role","iss":"supabase"}');
    expect(scanText(`const k="${header}.${body}.signature123"`)).toContain('Supabase service_role JWT');
    expect(scanText('sk-ant-api03-abcdefghijklmnop')).toContain('Anthropic API key');
    expect(scanText('RGAPI-12345678-1234-1234-1234-123456789012')).toContain('Riot API key');
    expect(scanText('postgres://user:pass@db.host:5432/x')).toContain('Postgres connection string with password');
    expect(scanText('env.SUPABASE_SERVICE_ROLE_KEY')).toContain('Server-only env var name');
  });
  it('no marca la clave pública "anon"', () => {
    const header = b64url('{"alg":"HS256"}');
    const body = b64url('{"role":"anon","iss":"supabase"}');
    expect(scanText(`${header}.${body}.sig`)).toEqual([]);
  });
});

describe('secreto de las respuestas del palabrero', () => {
  it('detecta una respuesta expuesta como palabra completa', async () => {
    // @ts-expect-error — módulo JS sin tipos
    const { findForbiddenWords, loadForbiddenWords } = await import('../../scripts/check-bundle-secrets.mjs');
    const words: string[] = loadForbiddenWords();
    expect(words.length).toBeGreaterThan(0);
    expect(findForbiddenWords(`const a="${words[0]!.toLowerCase()}"`, words)).toEqual([words[0]]);
    expect(findForbiddenWords('constructor estructura', ['TRUCO'])).toEqual([]);
  });
});
