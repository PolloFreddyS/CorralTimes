// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../worker/app';
import { bearerToken, supabaseAdminCheck } from '../../worker/auth/supabase-verifier';
import type { Bindings } from '../../worker/env';

const ORIGIN = 'https://corral.test';
const SUPA = 'https://proyecto.supabase.co';
const KEY = 'sb_publishable_test';
const JWT = 'eyJhbGciOiJFUzI1NiJ9abc.eyJzdWIiOiIxMSJ9abcdef.firmaFirmaFirma';
const env: Bindings = { APP_ENV: 'local', INTAKE_MODE: 'not_configured', SUPABASE_URL: SUPA, SUPABASE_PUBLISHABLE_KEY: KEY };

/** Supabase falso: valida que se use la clave publicable + el token del usuario, y responde según el token. */
function fakeSupabase(answers: Record<string, { status: number; body?: unknown }>) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const headers = new Headers(init?.headers);
    expect(headers.get('apikey')).toBe(KEY);
    const token = headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    if (url.endsWith('/rest/v1/rpc/current_admin')) {
      const a = answers[token] ?? { status: 401 };
      return new Response(a.body === undefined ? null : JSON.stringify(a.body), { status: a.status });
    }
    if (url.endsWith('/rest/v1/rpc/log_admin_event')) return new Response(null, { status: 204 });
    if (url.includes('/rest/v1/security_audit_events')) return new Response(JSON.stringify([{ id: '1', kind: 'ADMIN_SIGN_IN', summary: 'x' }]), { status: 200 });
    return new Response('not found', { status: 404 });
  }) as unknown as typeof fetch;
}

const ADMIN_ROW = { user_id: '11111111-1111-4111-8111-111111111111', display_name: 'Dueño', aal: 'aal2' };

describe('verificación de administradores con Supabase', () => {
  it('extrae solo tokens con forma de JWT', () => {
    expect(bearerToken(`Bearer ${JWT}`)).toBe(JWT);
    expect(bearerToken('Bearer abc')).toBeNull();
    expect(bearerToken(`Basic ${JWT}`)).toBeNull();
    expect(bearerToken(undefined)).toBeNull();
    expect(bearerToken(`Bearer ${'a'.repeat(5000)}`)).toBeNull();
  });

  it('no consulta a Supabase si el token no tiene forma de JWT', async () => {
    const f = fakeSupabase({});
    expect(await supabaseAdminCheck({ url: SUPA, publishableKey: KEY }, f)('Bearer basura')).toEqual({ kind: 'invalid' });
    expect(f).not.toHaveBeenCalled();
  });

  it('mapea respuestas: inválido (401), no-admin (null), admin con aal', async () => {
    const check = supabaseAdminCheck({ url: SUPA, publishableKey: KEY }, fakeSupabase({ [JWT]: { status: 200, body: ADMIN_ROW } }));
    expect(await check(`Bearer ${JWT}`)).toMatchObject({ kind: 'admin', identity: { userId: ADMIN_ROW.user_id, aal: 'aal2' } });
    const notAdmin = supabaseAdminCheck({ url: SUPA, publishableKey: KEY }, fakeSupabase({ [JWT]: { status: 200, body: null } }));
    expect(await notAdmin(`Bearer ${JWT}`)).toEqual({ kind: 'not_admin' });
    const invalid = supabaseAdminCheck({ url: SUPA, publishableKey: KEY }, fakeSupabase({}));
    expect(await invalid(`Bearer ${JWT}`)).toEqual({ kind: 'invalid' });
  });

  it('respuesta malformada o error de Supabase → falla cerrado', async () => {
    const bad = supabaseAdminCheck({ url: SUPA, publishableKey: KEY }, fakeSupabase({ [JWT]: { status: 200, body: { user_id: 'admin' } } }));
    await expect(bad(`Bearer ${JWT}`)).rejects.toThrow();
    const app = createApp({ fetch: fakeSupabase({ [JWT]: { status: 500 } }) });
    expect((await app.request(`${ORIGIN}/api/admin/me`, { headers: { Authorization: `Bearer ${JWT}` } }, env)).status).toBe(401);
  });

  it('flujo completo: /me, registro de sesión y bitácora con el token del admin', async () => {
    const f = fakeSupabase({ [JWT]: { status: 200, body: ADMIN_ROW } });
    const app = createApp({ fetch: f });
    const auth = { Authorization: `Bearer ${JWT}` };
    expect(await (await app.request(`${ORIGIN}/api/admin/me`, { headers: auth }, env)).json()).toEqual({ userId: ADMIN_ROW.user_id, displayName: 'Dueño', aal: 'aal2' });
    const s = await app.request(`${ORIGIN}/api/admin/session`, { method: 'POST', headers: { ...auth, Origin: ORIGIN } }, env);
    expect(s.status).toBe(200);
    const ev = await (await app.request(`${ORIGIN}/api/admin/security-events`, { headers: auth }, env)).json();
    expect(ev.events).toHaveLength(1);
  });

  it('admin aal1 no puede registrar sesión ni leer la bitácora', async () => {
    const app = createApp({ fetch: fakeSupabase({ [JWT]: { status: 200, body: { ...ADMIN_ROW, aal: 'aal1' } } }) });
    const res = await app.request(`${ORIGIN}/api/admin/security-events`, { headers: { Authorization: `Bearer ${JWT}` } }, env);
    expect(res.status).toBe(403);
  });

  it('sin Supabase configurado, /api/admin responde 401 y /config devuelve nulos', async () => {
    const app = createApp({});
    const bare: Bindings = { APP_ENV: 'local', INTAKE_MODE: 'not_configured' };
    expect((await app.request(`${ORIGIN}/api/admin/me`, { headers: { Authorization: `Bearer ${JWT}` } }, bare)).status).toBe(401);
    expect(await (await app.request(`${ORIGIN}/api/public/config`, {}, bare)).json()).toEqual({ supabaseUrl: null, supabasePublishableKey: null });
  });

  it('/config solo expone valores públicos y rechaza URLs que no son de Supabase', async () => {
    const app = createApp({});
    expect(await (await app.request(`${ORIGIN}/api/public/config`, {}, env)).json()).toEqual({ supabaseUrl: SUPA, supabasePublishableKey: KEY });
    const evil = { ...env, SUPABASE_URL: 'https://evil.example.com' };
    expect(await (await app.request(`${ORIGIN}/api/public/config`, {}, evil)).json()).toEqual({ supabaseUrl: null, supabasePublishableKey: null });
  });
});
