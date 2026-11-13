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
}

export function parseIntakeMode(value: string | undefined): IntakeMode {
  return value === 'open' || value === 'paused' ? value : 'not_configured';
}

/** El contenido demo jamás se sirve en producción, aunque alguien active la variable por error. */
export function demoContentEnabled(env: Bindings): boolean {
  return env.DEMO_CONTENT === 'true' && env.APP_ENV !== 'production';
}
