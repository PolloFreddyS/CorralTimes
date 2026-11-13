// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createApp } from '../../worker/app';
import type { PublicContentSource } from '../../worker/content/source';
import { demoContentSource } from '../../worker/demo/demo-content';
import secrets from '../../worker/demo/puzzle-secrets.json';
import { DICTIONARY } from '../../worker/puzzles/dictionary';
import type { AssetFetcher, Bindings } from '../../worker/env';

const ORIGIN = 'https://corral.test';
const SHELL = '<!doctype html><html><head><title>EL CORRAL TIMES HQ</title>\n<!--app-meta--></head><body><div id="root"></div></body></html>';
const assets: AssetFetcher = { fetch: async () => new Response(SHELL, { headers: { 'Content-Type': 'text/html' } }) };
const env = (over: Partial<Bindings> = {}): Bindings => ({ APP_ENV: 'local', INTAKE_MODE: 'not_configured', DEMO_CONTENT: 'true', ASSETS: assets, ...over });
const app = createApp({ adminVerifier: null });
const get = (path: string, e = env()) => app.request(`${ORIGIN}${path}`, {}, e);
const post = (path: string, body: unknown, e = env()) =>
  app.request(`${ORIGIN}${path}`, { method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, e);
const ANSWER = secrets.puzzles[0]!.answer;
const PUZZLE = secrets.puzzles[0]!.id;

describe('API pública de lectura', () => {
  it('sirve la última edición demo y sus artículos', async () => {
    const latest = await (await get('/api/public/editions/latest')).json();
    expect(latest.demo).toBe(true);
    const art = await get(`/api/public/editions/${latest.slug}/articles/${latest.articles[0].slug}`);
    expect(art.status).toBe(200);
    expect((await art.json()).article.body.type).toBe('doc');
  });

  it('en producción nunca sirve contenido demo, aunque la variable esté activa', async () => {
    const e = env({ APP_ENV: 'production', DEMO_CONTENT: 'true' });
    expect((await get('/api/public/editions/latest', e)).status).toBe(404);
    expect(await (await get('/api/public/editions', e)).json()).toEqual({ editions: [] });
    expect((await get(`/api/public/puzzles/${PUZZLE}`, e)).status).toBe(404);
  });

  it('rechaza slugs malformados y no enumera por ID', async () => {
    expect((await get('/api/public/editions/..%2F..%2Fadmin')).status).toBe(404);
    expect((await get('/api/public/editions/00000000-0000-4000-8000-000000000001')).status).toBe(404);
    expect((await get('/api/public/submissions')).status).toBe(404);
  });

  it('el listado público no expone borradores ni datos de reportes', async () => {
    const text = await (await get('/api/public/editions/latest')).text();
    expect(text).not.toMatch(/reporterAlias|submissionId|receipt|DRAFT|EDITORIAL_DRAFT/);
  });
});

describe('El Palabrero — validación en servidor', () => {
  it('los metadatos del puzzle nunca incluyen la respuesta', async () => {
    const res = await get(`/api/public/puzzles/${PUZZLE}`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text.toUpperCase()).not.toContain(ANSWER);
    expect(JSON.parse(text)).toMatchObject({ length: 5, maxAttempts: 6 });
  });

  it('devuelve solo retroalimentación por letra', async () => {
    const res = await post(`/api/public/puzzles/${PUZZLE}/guess`, { guess: 'tráje' });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ guess: 'TRAJE', feedback: expect.any(Array), solved: false });
    expect(JSON.stringify(body)).not.toContain(ANSWER);
  });

  it('acepta la respuesta correcta', async () => {
    const body = await (await post(`/api/public/puzzles/${PUZZLE}/guess`, { guess: ANSWER.toLowerCase() })).json();
    expect(body.solved).toBe(true);
  });

  it('rechaza palabras mal formadas o fuera del diccionario', async () => {
    expect((await post(`/api/public/puzzles/${PUZZLE}/guess`, { guess: 'abc' })).status).toBe(422);
    const res = await post(`/api/public/puzzles/${PUZZLE}/guess`, { guess: 'qxzwv' });
    expect(res.status).toBe(422);
    expect((await res.json()).error.code).toBe('NOT_IN_DICTIONARY');
  });

  it('rechaza intentos cross-origin y puzzles inexistentes', async () => {
    const cross = await app.request(`${ORIGIN}/api/public/puzzles/${PUZZLE}/guess`, { method: 'POST', headers: { Origin: 'https://evil.test' }, body: '{"guess":"gallo"}' }, env());
    expect(cross.status).toBe(403);
    expect((await post('/api/public/puzzles/no-existe/guess', { guess: 'gallo' })).status).toBe(404);
  });

  it('respeta la ventana de activación', async () => {
    const future = createApp({ adminVerifier: null, puzzles: () => ({ get: async () => ({ id: 'p', editionNumber: 1, answer: 'GALLO', clue: null, activeFrom: '2999-01-01T00:00:00Z', activeUntil: null }) }) });
    expect((await future.request(`${ORIGIN}/api/public/puzzles/p`, {}, env())).status).toBe(404);
  });

  it('el diccionario solo contiene palabras de 5 letras bien formadas', () => {
    expect(DICTIONARY.size).toBeGreaterThan(150);
    for (const w of DICTIONARY) expect(w).toMatch(/^[A-ZÑ]{5}$/);
  });
});

describe('HTML con metadatos para WhatsApp / Open Graph', () => {
  it('la portada incluye og:title, og:image y canonical en el HTML inicial', async () => {
    const res = await get('/');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toMatch(/<meta property="og:title" content="EL CORRAL TIMES — CRISIS ALIMENTARIA/);
    expect(html).toContain(`<meta property="og:image" content="${ORIGIN}/social/og-default.png" />`);
    expect(html).toContain(`<link rel="canonical" href="${ORIGIN}/" />`);
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(res.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
  });

  it('los artículos son og:type article con su propio título', async () => {
    const latest = await (await get('/api/public/editions/latest')).json();
    const html = await (await get(`/ediciones/${latest.slug}/${latest.articles[1].slug}`)).text();
    expect(html).toContain('<meta property="og:type" content="article" />');
    expect(html).toContain(`<title>${latest.articles[1].title}</title>`);
  });

  it('el contenido demo se marca noindex', async () => {
    expect(await (await get('/')).text()).toContain('<meta name="robots" content="noindex, nofollow" />');
  });

  it('ediciones inexistentes devuelven 404 con noindex', async () => {
    const res = await get('/ediciones/edicion-999-2099-01-01');
    expect(res.status).toBe(404);
    expect(await res.text()).toContain('noindex');
  });

  it('escapa contenido en los metadatos (sin inyección de HTML)', async () => {
    const evil: PublicContentSource = {
      ...demoContentSource,
      latestEdition: async () => ({ ...(await demoContentSource.latestEdition())!, headline: '"><script>alert(1)</script>', dek: "it's <b>bold</b>" }),
    };
    const html = await (await createApp({ adminVerifier: null, content: () => evil }).request(`${ORIGIN}/`, {}, env())).text();
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&quot;&gt;&lt;script&gt;');
    expect(html).toContain('it&#39;s &lt;b&gt;bold&lt;/b&gt;');
  });

  it('sin contenido publicado, la portada usa metadatos genéricos', async () => {
    const html = await (await get('/', env({ DEMO_CONTENT: 'false' }))).text();
    expect(html).toContain('<meta property="og:title" content="EL CORRAL TIMES" />');
  });
});
