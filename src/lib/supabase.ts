import type { SupabaseClient } from '@supabase/supabase-js';
import { apiFetch } from './api';

/**
 * Cliente de Supabase para la redacción. Se carga de forma diferida (no pesa en el periódico público)
 * y se configura en tiempo de ejecución desde /api/public/config (solo valores públicos).
 */
let clientPromise: Promise<SupabaseClient | null> | null = null;

export function getSupabase(): Promise<SupabaseClient | null> {
  clientPromise ??= (async () => {
    const cfg = await apiFetch<{ supabaseUrl: string | null; supabasePublishableKey: string | null }>('/public/config');
    if (!cfg.supabaseUrl || !cfg.supabasePublishableKey) return null;
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'ct-hq-auth' },
    });
  })().catch((e) => {
    clientPromise = null;
    throw e;
  });
  return clientPromise;
}

/** fetch a /api/admin/* con el token de la sesión actual. */
export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const supabase = await getSupabase();
  const token = supabase ? (await supabase.auth.getSession()).data.session?.access_token : undefined;
  return apiFetch<T>(`/admin${path}`, { ...init, headers: { ...init?.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
}
