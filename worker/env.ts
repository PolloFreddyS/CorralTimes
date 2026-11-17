/**
 * Bindings que la app Hono necesita. Se declaran aquí (y no con el tipo global `Env`)
 * para que la lógica del Worker sea testeable en Node sin el runtime de Cloudflare.
 */
export type AppEnvName = 'local' | 'preview' | 'production';
export type IntakeMode = 'not_configured' | 'open' | 'paused';

export interface AssetFetcher {
  fetch(request: Request): Promise<Response>;
}

export interface Bindings {
  APP_ENV: AppEnvName | string;
  INTAKE_MODE: IntakeMode | string;
  /** "true" solo en local/preview: sirve contenido público FICTICIO etiquetado como demo. */
  DEMO_CONTENT?: string;
  ASSETS?: AssetFetcher;
  /** URL y clave PUBLICABLE de Supabase (públicas por diseño; la seguridad la dan RLS y el JWT). */
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
}

export function supabaseConfig(env: Bindings): { url: string; publishableKey: string } | null {
  const url = env.SUPABASE_URL?.trim();
  const key = env.SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) return null;
  return { url, publishableKey: key };
}

export function parseIntakeMode(value: string | undefined): IntakeMode {
  return value === 'open' || value === 'paused' ? value : 'not_configured';
}

/** El contenido demo jamás se sirve en producción, aunque alguien active la variable por error. */
export function demoContentEnabled(env: Bindings): boolean {
  return env.DEMO_CONTENT === 'true' && env.APP_ENV !== 'production';
}
