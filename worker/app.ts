import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { apiError } from './api/errors';
import { requireAdmin, type AdminVariables, type AdminVerifier } from './auth/require-admin';
import { parseIntakeMode, type Bindings } from './env';
import { apiSecurityHeaders } from './middleware/security-headers';
import { sameOriginGuard } from './middleware/same-origin';

export const MAX_JSON_BODY_BYTES = 64 * 1024;

export interface AppDeps {
  /** null = autenticación de administradores aún no configurada → todo /api/admin responde 401. */
  adminVerifier: AdminVerifier | null;
}

export function createApp(deps: AppDeps) {
  const app = new Hono<{ Bindings: Bindings; Variables: AdminVariables }>().basePath('/api');

  app.use('*', apiSecurityHeaders);
  app.use('*', sameOriginGuard);
  app.use(
    '*',
    bodyLimit({
      maxSize: MAX_JSON_BODY_BYTES,
      onError: (c) => apiError(c, 413, 'PAYLOAD_TOO_LARGE', 'La solicitud es demasiado grande.'),
    }),
  );

  app.get('/health', (c) => c.json({ ok: true, service: 'corral-times-hq', env: c.env.APP_ENV }));

  app.get('/public/intake-status', (c) => {
    const mode = parseIntakeMode(c.env.INTAKE_MODE);
    return c.json({ mode, open: mode === 'open' });
  });

  app.post('/public/submissions', (c) => {
    const mode = parseIntakeMode(c.env.INTAKE_MODE);
    if (mode !== 'open') {
      return apiError(c, 503, 'INTAKE_CLOSED', 'La recepción de noticias no está abierta en este momento.');
    }
    // Fase 3: Turnstile + validación + rate limit + persistencia. Hasta entonces, fallar de forma explícita.
    return apiError(c, 501, 'NOT_IMPLEMENTED', 'La recepción de noticias se habilita en la Fase 3.');
  });

  const admin = new Hono<{ Bindings: Bindings; Variables: AdminVariables }>();
  admin.use('*', requireAdmin(deps.adminVerifier));
  admin.get('/me', (c) => c.json({ userId: c.get('admin').userId }));
  app.route('/admin', admin);

  app.notFound((c) => apiError(c, 404, 'NOT_FOUND', 'Ruta no encontrada.'));
  app.onError((err, c) => {
    console.error('Unhandled API error', err instanceof Error ? err.name : 'unknown');
    return apiError(c, 500, 'INTERNAL_ERROR', 'Ocurrió un error inesperado.');
  });

  return app;
}
