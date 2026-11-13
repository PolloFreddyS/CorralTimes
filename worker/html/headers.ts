/** Cabeceras de seguridad de las páginas HTML que genera el Worker (mismas que public/_headers). */
export const HTML_CSP =
  "default-src 'self'; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; " +
  "connect-src 'self' https://*.supabase.co; img-src 'self' data: blob: https://*.supabase.co; style-src 'self' 'unsafe-inline'; " +
  "font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests";

export function applyHtmlSecurityHeaders(h: Headers) {
  h.set('Content-Security-Policy', HTML_CSP);
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('X-Frame-Options', 'DENY');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  h.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  h.set('Cross-Origin-Opener-Policy', 'same-origin');
  h.set('Content-Type', 'text/html; charset=utf-8');
}
