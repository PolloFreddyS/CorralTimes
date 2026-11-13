import type { MiddlewareHandler } from 'hono';
import { apiError } from '../api/errors';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Protección CSRF / CORS controlado: la API solo la consume la propia SPA (mismo origen).
 * Cualquier petición que modifique estado debe traer un Origin idéntico al del Worker.
 * No se emiten cabeceras CORS, así que los navegadores bloquean lecturas cross-origin.
 */
export const sameOriginGuard: MiddlewareHandler = async (c, next) => {
  if (!SAFE_METHODS.has(c.req.method)) {
    const origin = c.req.header('Origin');
    const expected = new URL(c.req.url).origin;
    if (!origin || origin !== expected) {
      return apiError(c, 403, 'CROSS_ORIGIN_REJECTED', 'Origen no permitido.');
    }
  }
  if (c.req.method === 'OPTIONS') return c.body(null, 204);
  await next();
};
