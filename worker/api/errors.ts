import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export interface ApiErrorBody {
  error: { code: string; message: string };
}

/** Respuesta de error segura: código estable + mensaje en español, sin trazas ni detalles internos. */
export function apiError(c: Context, status: ContentfulStatusCode, code: string, message: string) {
  return c.json<ApiErrorBody>({ error: { code, message } }, status);
}
