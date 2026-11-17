import type { MiddlewareHandler } from 'hono';
import { apiError } from '../api/errors';

/**
 * Identidad de administrador. `userId` es el identificador inmutable de Supabase Auth (UUID),
 * nunca un nombre visible ni un correo.
 */
export interface AdminIdentity {
  userId: string;
  displayName: string;
  aal: 'aal1' | 'aal2';
  /** Token del propio admin, para que Postgres aplique RLS a sus consultas. Nunca se registra. */
  token: string;
}

export type AdminCheck = { kind: 'invalid' } | { kind: 'not_admin' } | { kind: 'admin'; identity: AdminIdentity };

export type AdminVerifier = (authorizationHeader: string | undefined) => Promise<AdminCheck>;

export type AdminVariables = { admin: AdminIdentity };

/**
 * Autorización de /api/admin/*: falla cerrado.
 * - Sin verificador (Supabase no configurado), token inválido o error → 401.
 * - Usuario válido que no está en admin_users → 403 NOT_ADMIN.
 * - Admin sin MFA (aal1) → 403 MFA_REQUIRED (toda la redacción exige AAL2).
 */
export function requireAdmin(
  getVerifier: (env: unknown) => AdminVerifier | null,
  log: (event: { reason: string; path: string }) => void = (e) => console.warn(JSON.stringify({ type: 'AUTHZ_DENIED', ...e })),
): MiddlewareHandler<{ Variables: AdminVariables }> {
  return async (c, next) => {
    const verifier = getVerifier(c.env);
    let result: AdminCheck = { kind: 'invalid' };
    if (verifier) {
      try {
        result = await verifier(c.req.header('Authorization'));
      } catch {
        result = { kind: 'invalid' };
      }
    }
    const path = new URL(c.req.url).pathname;
    if (result.kind === 'invalid') {
      log({ reason: 'UNAUTHORIZED', path });
      return apiError(c, 401, 'UNAUTHORIZED', 'Se requiere una sesión de administrador.');
    }
    if (result.kind === 'not_admin') {
      log({ reason: 'NOT_ADMIN', path });
      return apiError(c, 403, 'NOT_ADMIN', 'Tu cuenta no está autorizada para la redacción.');
    }
    if (result.identity.aal !== 'aal2') {
      return apiError(c, 403, 'MFA_REQUIRED', 'Completa la verificación en dos pasos para continuar.');
    }
    c.set('admin', result.identity);
    await next();
  };
}
