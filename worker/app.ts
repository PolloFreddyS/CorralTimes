import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { apiError } from './api/errors';
import { publicRoutes } from './api/public';
import { requireAdmin, type AdminVariables, type AdminVerifier } from './auth/require-admin';
import { supabaseAdminCheck, supabaseAsUser } from './auth/supabase-verifier';
import { emptyContentSource, type PublicContentSource } from './content/source';
import { demoContentSource } from './demo/demo-content';
import { demoContentEnabled, parseIntakeMode, supabaseConfig, type Bindings } from './env';
import { htmlRoutes } from './html/pages';
import { apiSecurityHeaders } from './middleware/security-headers';
import { sameOriginGuard } from './middleware/same-origin';
import { demoPuzzleSource, emptyPuzzleSource, type PuzzleSource } from './puzzles/source';

export const MAX_JSON_BODY_BYTES = 64 * 1024;

export interface AppDeps {
  /**
   * Verificador de administradores. Por defecto: Supabase (si SUPABASE_URL/SUPABASE_PUBLISHABLE_KEY existen).
   * null = no configurado → todo /api/admin responde 401.
   */
  adminVerifier?: AdminVerifier | null;
  fetch?: typeof fetch;
  content?: (env: Bindings) => PublicContentSource;
  puzzles?: (env: Bindings) => PuzzleSource;
  now?: () => Date;
}

/** Fase 1: sin base de datos. Solo hay contenido si el modo demo está activo (nunca en producción). */
const defaultContent = (env: Bindings) => (demoContentEnabled(env) ? demoContentSource : emptyContentSource);
const defaultPuzzles = (env: Bindings) => (demoContentEnabled(env) ? demoPuzzleSource : emptyPuzzleSource);

export function createApp(deps: AppDeps) {
  const content = deps.content ?? defaultContent;
  const fetchImpl = deps.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  const getVerifier = (env: unknown): AdminVerifier | null => {
    if (deps.adminVerifier !== undefined) return deps.adminVerifier;
    const cfg = supabaseConfig(env as Bindings);
    return cfg ? supabaseAdminCheck(cfg, fetchImpl) : null;
  };
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

  api.get('/health', (c) => c.json({ ok: true, service: 'corral-times', version: '2.0.0', env: c.env.APP_ENV }));

  // Configuración PÚBLICA para el cliente (sin secretos). Permite no incrustar valores en el build.
  api.get('/public/config', (c) => {
    const cfg = supabaseConfig(c.env);
    c.header('Cache-Control', 'public, max-age=300');
    return c.json({ supabaseUrl: cfg?.url ?? null, supabasePublishableKey: cfg?.publishableKey ?? null });
  });

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
  admin.use('*', requireAdmin(getVerifier));
  admin.get('/me', (c) => {
    const a = c.get('admin');
    return c.json({ userId: a.userId, displayName: a.displayName, aal: a.aal });
  });
  // Registro del inicio de sesión (tras MFA). Se ejecuta con el token del admin: RLS y la RPC validan.
  admin.post('/session', async (c) => {
    const cfg = supabaseConfig(c.env);
    if (!cfg) return apiError(c, 503, 'NOT_CONFIGURED', 'Supabase no está configurado.');
    await supabaseAsUser(cfg, c.get('admin').token, fetchImpl).rpc('log_admin_event', {
      p_kind: 'ADMIN_SIGN_IN',
      p_summary: 'Inicio de sesión en la redacción (MFA)',
      p_metadata: { user_agent: (c.req.header('User-Agent') ?? '').slice(0, 120) },
    });
    return c.json({ ok: true });
  });
  admin.get('/security-events', async (c) => {
    const cfg = supabaseConfig(c.env);
    if (!cfg) return apiError(c, 503, 'NOT_CONFIGURED', 'Supabase no está configurado.');
    const rows = await supabaseAsUser(cfg, c.get('admin').token, fetchImpl).get<unknown[]>(
      'security_audit_events?select=id,kind,severity,actor_id,summary,created_at&order=created_at.desc&limit=100',
    );
    return c.json({ events: rows });
  });
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
