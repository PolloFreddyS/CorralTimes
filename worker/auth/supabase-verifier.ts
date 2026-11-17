import type { AdminCheck } from './require-admin';

export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

/** Forma mínima de un JWT (3 segmentos base64url). Evita enviar basura a Supabase. */
const JWT_SHAPE = /^[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}$/;

export function bearerToken(header: string | undefined): string | null {
  if (!header || header.length > 4096) return null;
  const m = header.match(/^Bearer\s+(\S+)$/);
  return m && JWT_SHAPE.test(m[1]!) ? m[1]! : null;
}

/**
 * Verificación de administrador con Supabase, sin claves secretas:
 * el Worker llama a la RPC `current_admin()` CON EL TOKEN DEL USUARIO. PostgREST valida la firma y
 * la expiración del JWT; la función devuelve la identidad solo si el UUID está en `admin_users`
 * (no deshabilitado), junto con el nivel de autenticación (aal1/aal2).
 * Cualquier error de red o respuesta inesperada → fallo cerrado.
 */
export function supabaseAdminCheck(config: SupabaseConfig, fetchImpl: typeof fetch = fetch) {
  return async (authorization: string | undefined): Promise<AdminCheck> => {
    const token = bearerToken(authorization);
    if (!token) return { kind: 'invalid' };
    const res = await fetchImpl(`${config.url}/rest/v1/rpc/current_admin`, {
      method: 'POST',
      headers: {
        apikey: config.publishableKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: '{}',
      signal: AbortSignal.timeout(5000),
    });
    if (res.status === 401 || res.status === 403) return { kind: 'invalid' };
    if (!res.ok) throw new Error(`SUPABASE_${res.status}`);
    const data = (await res.json()) as { user_id?: unknown; display_name?: unknown; aal?: unknown } | null;
    if (!data) return { kind: 'not_admin' };
    if (typeof data.user_id !== 'string' || !/^[0-9a-f-]{36}$/i.test(data.user_id)) throw new Error('SUPABASE_BAD_RESPONSE');
    return {
      kind: 'admin',
      identity: {
        userId: data.user_id,
        displayName: typeof data.display_name === 'string' ? data.display_name : '',
        aal: data.aal === 'aal2' ? 'aal2' : 'aal1',
        token,
      },
    };
  };
}

/** Cliente REST mínimo que actúa COMO el administrador (RLS aplica en Postgres). */
export function supabaseAsUser(config: SupabaseConfig, token: string, fetchImpl: typeof fetch = fetch) {
  const headers = { apikey: config.publishableKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' };
  return {
    async get<T>(path: string): Promise<T> {
      const res = await fetchImpl(`${config.url}/rest/v1/${path}`, { headers, signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`SUPABASE_${res.status}`);
      return (await res.json()) as T;
    },
    async rpc<T>(fn: string, args: Record<string, unknown>): Promise<T | null> {
      const res = await fetchImpl(`${config.url}/rest/v1/rpc/${fn}`, { method: 'POST', headers, body: JSON.stringify(args), signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`SUPABASE_${res.status}`);
      const text = await res.text();
      return text ? (JSON.parse(text) as T) : null;
    },
  };
}
