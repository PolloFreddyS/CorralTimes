// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createApp, MAX_JSON_BODY_BYTES } from '../../worker/app';
import type { AdminVerifier } from '../../worker/auth/require-admin';
import type { Bindings } from '../../worker/env';

const ORIGIN = 'https://hq.example.test';
const env = (over: Partial<Bindings> = {}): Bindings => ({ APP_ENV: 'local', INTAKE_MODE: 'not_configured', ...over });
const req = (app: ReturnType<typeof createApp>, path: string, init: RequestInit = {}, e = env()) =>
  app.request(`${ORIGIN}${path}`, init, e);

describe('API del Worker — Fase 1', () => {
  const app = createApp({ adminVerifier: null });

  it('health responde con cabeceras de seguridad', async () => {
    const res = await req(app, '/api/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
    expect(res.headers.get('content-security-policy')).toContain("default-src 'none'");
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('intake-status refleja la configuración y por defecto está cerrado', async () => {
    expect(await (await req(app, '/api/public/intake-status')).json()).toEqual({ mode: 'not_configured', open: false });
    expect(await (await req(app, '/api/public/intake-status', {}, env({ INTAKE_MODE: 'paused' }))).json()).toEqual({ mode: 'paused', open: false });
    expect(await (await req(app, '/api/public/intake-status', {}, env({ INTAKE_MODE: 'basura' }))).json()).toEqual({ mode: 'not_configured', open: false });
  });

  it('el envío público responde 503 con la recepción cerrada', async () => {
    const res = await req(app, '/api/public/submissions', { method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'application/json' }, body: '{}' });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: { code: 'INTAKE_CLOSED', message: expect.any(String) } });
  });

  it('rechaza peticiones que modifican estado desde otro origen (CSRF)', async () => {
    const cross = await req(app, '/api/public/submissions', { method: 'POST', headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' }, body: '{}' });
    expect(cross.status).toBe(403);
    const noOrigin = await req(app, '/api/public/submissions', { method: 'POST', body: '{}' });
    expect(noOrigin.status).toBe(403);
  });

  it('rechaza cuerpos demasiado grandes', async () => {
    const big = 'x'.repeat(MAX_JSON_BODY_BYTES + 1);
    const res = await req(app, '/api/public/submissions', { method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'application/json', 'Content-Length': String(big.length) }, body: big });
    expect(res.status).toBe(413);
  });

  it('rutas desconocidas devuelven 404 JSON sin detalles internos', async () => {
    const res = await req(app, '/api/../../etc/passwd');
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ error: { code: 'NOT_FOUND' } });
  });
});

describe('autorización de administradores (falla cerrado)', () => {
  it('sin verificador configurado, toda ruta admin responde 401 aunque traiga token', async () => {
    const app = createApp({ adminVerifier: null });
    for (const auth of [undefined, 'Bearer cualquier-cosa', 'Bearer eyJhbGciOiJub25lIn0.eyJyb2xlIjoiYWRtaW4ifQ.']) {
      const res = await req(app, '/api/admin/me', { headers: auth ? { Authorization: auth } : {} });
      expect(res.status).toBe(401);
    }
  });

  it('un verificador que lanza error no concede acceso', async () => {
    const throwing: AdminVerifier = async () => {
      throw new Error('boom');
    };
    const res = await req(createApp({ adminVerifier: throwing }), '/api/admin/me', { headers: { Authorization: 'Bearer x' } });
    expect(res.status).toBe(401);
  });

  it('solo una identidad verificada accede, identificada por UUID inmutable', async () => {
    const verifier: AdminVerifier = async (h) => (h === 'Bearer valid' ? { userId: '11111111-1111-4111-8111-111111111111', aal: 'aal2' } : null);
    const app = createApp({ adminVerifier: verifier });
    expect((await req(app, '/api/admin/me', { headers: { Authorization: 'Bearer forged' } })).status).toBe(401);
    const ok = await req(app, '/api/admin/me', { headers: { Authorization: 'Bearer valid' } });
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ userId: '11111111-1111-4111-8111-111111111111' });
  });
});
