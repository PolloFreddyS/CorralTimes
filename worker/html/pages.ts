import { Hono, type Context } from 'hono';
import { ARTICLE_CATEGORY_LABELS, isValidSlug, type PublicArtwork } from '@shared/domain/public-content';
import { formatLongDate } from '@shared/domain/edition-calendar';
import type { PublicContentSource } from '../content/source';
import { demoContentEnabled, type Bindings } from '../env';
import { applyHtmlSecurityHeaders } from './headers';
import { injectMeta, type PageMeta } from './meta';

const SITE_DESCRIPTION = 'Noticias, dramas, memes y más caos del gallinero. El periódico satírico de Los Gallos Sin Planes.';
const DEFAULT_IMAGE = { path: '/social/og-default.png', width: 1200, height: 630, alt: 'EL CORRAL TIMES — Noticias, dramas, memes y más caos del gallinero' };

function imageFor(origin: string, art: PublicArtwork | null) {
  if (art?.src) return { url: new URL(art.src, origin).href, width: art.width, height: art.height, alt: art.alt };
  return { url: `${origin}${DEFAULT_IMAGE.path}`, width: DEFAULT_IMAGE.width, height: DEFAULT_IMAGE.height, alt: DEFAULT_IMAGE.alt };
}

/** Páginas públicas que deben tener metadatos en el HTML inicial. */
export function htmlRoutes(content: (env: Bindings) => PublicContentSource) {
  const r = new Hono<{ Bindings: Bindings }>();

  async function render(c: Context<{ Bindings: Bindings }>, meta: Omit<PageMeta, 'url' | 'noindex'> & { noindex?: boolean }, status = 200) {
    const url = new URL(c.req.url);
    const assets = c.env.ASSETS;
    if (!assets) return c.text('Assets no configurados', 500);
    const shell = await assets.fetch(new Request(new URL('/', url.origin)));
    if (!shell.ok) return shell;
    const html = injectMeta(await shell.text(), {
      ...meta,
      url: `${url.origin}${url.pathname}`,
      noindex: meta.noindex ?? (demoContentEnabled(c.env) || c.env.APP_ENV !== 'production'),
    });
    const headers = new Headers();
    applyHtmlSecurityHeaders(headers);
    // Fase 5: caché en el edge para ediciones publicadas + purga al publicar/despublicar.
    headers.set('Cache-Control', 'no-cache');
    return new Response(html, { status, headers });
  }

  const site = (c: Context<{ Bindings: Bindings }>, title: string, description = SITE_DESCRIPTION) =>
    render(c, { title, description, type: 'website', image: imageFor(new URL(c.req.url).origin, null) });

  r.get('/', async (c) => {
    const e = await content(c.env).latestEdition();
    if (!e) return site(c, 'EL CORRAL TIMES');
    const origin = new URL(c.req.url).origin;
    return render(c, { title: `EL CORRAL TIMES — ${e.headline}`, description: e.dek || SITE_DESCRIPTION, type: 'website', image: imageFor(origin, e.cover) });
  });

  r.get('/ediciones', (c) => site(c, 'Ediciones — EL CORRAL TIMES'));
  r.get('/archivo', (c) => site(c, 'Hemeroteca — EL CORRAL TIMES'));
  r.get('/bolsa-lp', (c) => site(c, 'Wall Street del Tilt — EL CORRAL TIMES', 'La bolsa de valores más ridícula del LP: ganancias, pérdidas y tilt semanal.'));
  r.get('/power-rankings', (c) => site(c, 'Power Rankings — EL CORRAL TIMES'));
  r.get('/la-voz-del-pastor', (c) => site(c, 'La Voz del Pastor — EL CORRAL TIMES', 'Una pausa entre el caos y el tilt: versículo, reflexión y aplicación de la semana.'));
  r.get('/juegos', (c) => site(c, 'El Palabrero del Corral — EL CORRAL TIMES', 'Adivina el tilt: el juego de palabras semanal de EL CORRAL TIMES.'));
  r.get('/enviar-noticia', (c) => render(c, { title: 'Corral Press Pass — ¿Qué pasó en el gallinero?', description: 'Reporta la noticia. Nosotros hacemos el escándalo.', type: 'website', image: imageFor(new URL(c.req.url).origin, null), noindex: true }));

  r.get('/ediciones/:slug', async (c) => {
    const slug = c.req.param('slug');
    const e = isValidSlug(slug) ? await content(c.env).edition(slug) : null;
    if (!e) return render(c, { title: 'Edición no encontrada — EL CORRAL TIMES', description: SITE_DESCRIPTION, type: 'website', image: null, noindex: true }, 404);
    return render(c, {
      title: `Edición N.º ${e.number}: ${e.headline}`,
      description: `${formatLongDate(e.publicationDate)} · ${e.dek}`,
      type: 'website',
      image: imageFor(new URL(c.req.url).origin, e.cover),
    });
  });

  r.get('/ediciones/:slug/:article', async (c) => {
    const { slug, article } = c.req.param();
    const found = isValidSlug(slug) && isValidSlug(article) ? await content(c.env).article(slug, article) : null;
    if (!found) return render(c, { title: 'Artículo no encontrado — EL CORRAL TIMES', description: SITE_DESCRIPTION, type: 'website', image: null, noindex: true }, 404);
    const { edition, article: a } = found;
    return render(c, {
      title: a.title,
      description: a.pastoral
        ? `La Voz del Pastor · ${a.pastoral.referenceLabel} · Una pausa entre el caos y el tilt`
        : `${ARTICLE_CATEGORY_LABELS[a.category]} · Edición N.º ${edition.number} · ${a.subtitle}`,
      type: 'article',
      image: imageFor(new URL(c.req.url).origin, a.hero ?? edition.cover),
      publishedTime: a.publishedAt,
    });
  });

  return r;
}

/** Rutas que el Worker atiende antes que los assets (debe coincidir con wrangler.jsonc). */
export const HTML_ROUTE_PATTERNS = ['/', '/ediciones', '/ediciones/*', '/archivo', '/bolsa-lp', '/power-rankings', '/la-voz-del-pastor', '/juegos', '/enviar-noticia'];
