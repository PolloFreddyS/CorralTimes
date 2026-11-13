/**
 * Configuración pública del frontend. Todo lo que está aquí termina en el bundle del navegador:
 * NUNCA agregues secretos. Ver .env.example y scripts/check-bundle-secrets.mjs.
 */
export const appConfig = {
  /** Modo demo: datos ficticios etiquetados. Activo por defecto solo en desarrollo. */
  demoMode: (import.meta.env.VITE_DEMO_MODE ?? (import.meta.env.DEV ? 'true' : 'false')) === 'true',
} as const;
