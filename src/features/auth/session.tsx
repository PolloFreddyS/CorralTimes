import type { Factor, SupabaseClient } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError } from '@/lib/api';
import { adminFetch, getSupabase } from '@/lib/supabase';

/**
 * Estado de la sesión de la redacción. La decisión final la toma SIEMPRE el servidor (/api/admin/me):
 * la UI solo refleja si hay que iniciar sesión, completar MFA o si la cuenta no está autorizada.
 */
export type AdminSessionState =
  | { status: 'loading' }
  | { status: 'unconfigured' }
  | { status: 'signed_out' }
  | { status: 'mfa_enroll' }
  | { status: 'mfa_verify'; factor: Factor }
  | { status: 'not_admin'; email: string | null }
  | { status: 'ready'; userId: string; displayName: string }
  | { status: 'error'; message: string };

interface Ctx {
  state: AdminSessionState;
  supabase: SupabaseClient | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}
const SessionCtx = createContext<Ctx | null>(null);

const SIGN_IN_LOGGED = 'ct-hq:signin-logged';

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminSessionState>({ status: 'loading' });
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  const evaluate = useCallback(async (client: SupabaseClient) => {
    const { data } = await client.auth.getSession();
    const session = data.session;
    if (!session) return setState({ status: 'signed_out' });
    const aal = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal.error) return setState({ status: 'error', message: 'No pudimos comprobar la verificación en dos pasos.' });
    if (aal.data.currentLevel !== 'aal2') {
      const factors = await client.auth.mfa.listFactors();
      const totp = factors.data?.totp.find((f) => f.status === 'verified');
      return setState(totp ? { status: 'mfa_verify', factor: totp } : { status: 'mfa_enroll' });
    }
    try {
      const me = await adminFetch<{ userId: string; displayName: string }>('/me');
      setState({ status: 'ready', userId: me.userId, displayName: me.displayName });
      try {
        if (window.sessionStorage.getItem(SIGN_IN_LOGGED) !== session.user.id) {
          await adminFetch('/session', { method: 'POST' });
          window.sessionStorage.setItem(SIGN_IN_LOGGED, session.user.id);
        }
      } catch {
        /* el registro de auditoría no bloquea la sesión */
      }
    } catch (e) {
      if (e instanceof ApiError && e.code === 'NOT_ADMIN') return setState({ status: 'not_admin', email: session.user.email ?? null });
      if (e instanceof ApiError && e.status === 401) return setState({ status: 'signed_out' });
      setState({ status: 'error', message: e instanceof ApiError ? e.message : 'No pudimos verificar tu acceso.' });
    }
  }, []);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;
    getSupabase()
      .then((client) => {
        if (cancelled) return;
        if (!client) return setState({ status: 'unconfigured' });
        setSupabase(client);
        void evaluate(client);
        const { data } = client.auth.onAuthStateChange((event) => {
          if (event === 'SIGNED_OUT') {
            try {
              window.sessionStorage.removeItem(SIGN_IN_LOGGED);
            } catch {
              /* sin almacenamiento */
            }
            setState({ status: 'signed_out' });
          } else if (event === 'SIGNED_IN' || event === 'MFA_CHALLENGE_VERIFIED') {
            void evaluate(client);
          }
        });
        unsub = () => data.subscription.unsubscribe();
      })
      .catch(() => !cancelled && setState({ status: 'error', message: 'No pudimos conectar con la redacción.' }));
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [evaluate]);

  const value = useMemo<Ctx>(
    () => ({
      state,
      supabase,
      refresh: async () => {
        if (supabase) await evaluate(supabase);
      },
      signOut: async () => {
        await supabase?.auth.signOut();
      },
    }),
    [state, supabase, evaluate],
  );
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

/** Variante tolerante: null en modo demo (sin proveedor). */
export function useOptionalAdminSession() {
  return useContext(SessionCtx);
}

export function useAdminSession() {
  const v = useContext(SessionCtx);
  if (!v) throw new Error('useAdminSession fuera de AdminSessionProvider');
  return v;
}
