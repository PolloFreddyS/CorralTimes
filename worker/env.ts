/**
 * Bindings que la app Hono necesita. Se declaran aquí (y no con el tipo global `Env`)
 * para que la lógica del Worker sea testeable en Node sin el runtime de Cloudflare.
 */
export type AppEnvName = 'local' | 'preview' | 'production';
export type IntakeMode = 'not_configured' | 'open' | 'paused';

export interface Bindings {
  APP_ENV: AppEnvName | string;
  INTAKE_MODE: IntakeMode | string;
}

export function parseIntakeMode(value: string | undefined): IntakeMode {
  return value === 'open' || value === 'paused' ? value : 'not_configured';
}
