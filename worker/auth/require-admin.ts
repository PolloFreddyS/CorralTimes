import type { MiddlewareHandler } from 'hono';
import { apiError } from '../api/errors';

/**
 * Resultado de verificar una sesión de administrador.
 * `userId` es el identificador inmutable de Supabase Auth (UUID), nunca un nombre visible.
 */
export interface AdminIdentity {
  userId: string;
  aal: 'aal1' | 'aal2';
}

export type AdminVerifier = (authorizationHeader: string | undefined) => Promise<AdminIdentity | null>;

export type AdminVariables = { admin: AdminIdentity };

/**
 * Middleware de autorización: falla cerrado.
 * - Sin verificador configurado (Fase 1) → 401 siempre.
 * - Verificador que devuelve null o lanza → 401.
 * La verificación real (JWT de Supabase + allowlist en `admin_users`) llega en la Fase 2.
 */
export function requireAdmin(verifier: AdminVerifier | null): MiddlewareHandler<{ Variables: AdminVariables }> {
  return async (c, next) => {
    let identity: AdminIdentity | null = null;
    if (verifier) {
      try {
        identity = await verifier(c.req.header('Authorization'));
      } catch {
        identity = null;
      }
    }
    if (!identity) {
      return apiError(c, 401, 'UNAUTHORIZED', 'Se requiere una sesión de administrador.');
    }
    c.set('admin', identity);
    await next();
  };
}
