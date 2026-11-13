import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { apiError } from './api/errors';
import { publicRoutes } from './api/public';
import { requireAdmin, type AdminVariables, type AdminVerifier } from './auth/require-admin';
import { emptyContentSource, type PublicContentSource } from './content/source';
import { demoContentSource } from './demo/demo-content';
import { demoContentEnabled, parseIntakeMode, type Bindings } from './env';
import { htmlRoutes } from './html/pages';
import { apiSecurityHeaders } from './middleware/security-headers';
import { sameOriginGuard } from './middleware/same-origin';
import { demoPuzzleSource, emptyPuzzleSource, type PuzzleSource } from './puzzles/source';

export const MAX_JSON_BODY_BYTES = 64 * 1024;

export interface AppDeps {
  /** null = autenticación de administradores aún no configurada → todo /api/admin responde 401. */
  adminVerifier: AdminVerifier | null;
  content?: (env: Bindings) => PublicContentSource;
  puzzles?: (env: Bindings) => PuzzleSource;
  now?: () => Date;
}

/** Fase 1: sin base de datos. Solo hay contenido si el modo demo está activo (nunca en producción). */
const defaultContent = (env: Bindings) => (demoContentEnabled(env) ? demoContentSource : emptyContentSource);
const defaultPuzzles = (env: Bindings) => (demoContentEnabled(env) ? demoPuzzleSource : emptyPuzzleSource);

export function createApp(deps: AppDeps) {
  const content = deps.content ?? defaultContent;
  const puzzles = deps.puzzles ?? defaultPuzzles;

  const api = new Hono<{ Bindings: Bindings; Variables: AdminVariables }>();
  api.use('*', apiSecurityHeaders);
  api.use('*', sameOriginGuard);
  api.use(
    '*',
    bodyLimit({
      maxSize: MAX_JSON_BODY_BYTES,
      onError: (c) => apiError(c, 413, 'PAYLOAD_TOO_LARGE', 'La solicitud es demasiado grande.'),
    }),
  );

  api.get('/health', (c) => c.json({ ok: true, service: 'corral-times-hq', env: c.env.APP_ENV }));

  api.get('/public/intake-status', (c) => {
    const mode = parseIntakeMode(c.env.INTAKE_MODE);
    return c.json({ mode, open: mode === 'open' });
  });

  api.post('/public/submissions', (c) => {
    const mode = parseIntakeMode(c.env.INTAKE_MODE);
    if (mode !== 'open') {
      return apiError(c, 503, 'INTAKE_CLOSED', 'La recepción de noticias no está abierta en este momento.');
    }
    // Fase 3: Turnstile + validación + rate limit + persistencia. Hasta entonces, fallar de forma explícita.
    return apiError(c, 501, 'NOT_IMPLEMENTED', 'La recepción de noticias se habilita en la Fase 3.');
  });

  api.route('/public', publicRoutes({ content, puzzles, ...(deps.now ? { now: deps.now } : {}) }));

  const admin = new Hono<{ Bindings: Bindings; Variables: AdminVariables }>();
  admin.use('*', requireAdmin(deps.adminVerifier));
  admin.get('/me', (c) => c.json({ userId: c.get('admin').userId }));
  api.route('/admin', admin);

  api.onError((err, c) => {
    console.error('Unhandled API error', err instanceof Error ? err.name : 'unknown');
    return apiError(c, 500, 'INTERNAL_ERROR', 'Ocurrió un error inesperado.');
  });

  const app = new Hono<{ Bindings: Bindings }>();
  app.route('/api', api);
  // Rutas /api desconocidas: 404 JSON (nunca caen al HTML de la SPA).
  app.all('/api/*', (c) => {
    const res = apiError(c, 404, 'NOT_FOUND', 'Ruta no encontrada.');
    res.headers.set('Cache-Control', 'no-store');
    res.headers.set('X-Content-Type-Options', 'nosniff');
    return res;
  });
  app.route('/', htmlRoutes(content));
  // Cualquier otra ruta que llegue al Worker se delega a los assets (SPA).
  app.all('*', (c) => (c.env.ASSETS ? c.env.ASSETS.fetch(c.req.raw) : c.text('Not found', 404)));
  return app;
}
