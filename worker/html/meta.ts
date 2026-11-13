/**
 * Metadatos por página en el HTML INICIAL (los rastreadores de WhatsApp/Open Graph no ejecutan JS).
 * Todo valor se escapa; nunca se interpola contenido sin escapar en el HTML.
 */
export interface PageMeta {
  title: string;
  description: string;
  url: string;
  image: { url: string; width: number; height: number; alt: string } | null;
  type: 'website' | 'article';
  noindex: boolean;
  publishedTime?: string;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

export function renderMetaTags(m: PageMeta): string {
  const e = escapeHtml;
  const title = clip(m.title, 110);
  const desc = clip(m.description, 200);
  const tags = [
    `<meta name="description" content="${e(desc)}" />`,
    `<link rel="canonical" href="${e(m.url)}" />`,
    `<meta property="og:site_name" content="EL CORRAL TIMES" />`,
    `<meta property="og:locale" content="es_DO" />`,
    `<meta property="og:type" content="${m.type}" />`,
    `<meta property="og:title" content="${e(title)}" />`,
    `<meta property="og:description" content="${e(desc)}" />`,
    `<meta property="og:url" content="${e(m.url)}" />`,
    `<meta name="twitter:card" content="${m.image ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${e(title)}" />`,
    `<meta name="twitter:description" content="${e(desc)}" />`,
  ];
  if (m.image) {
    tags.push(
      `<meta property="og:image" content="${e(m.image.url)}" />`,
      `<meta property="og:image:width" content="${m.image.width}" />`,
      `<meta property="og:image:height" content="${m.image.height}" />`,
      `<meta property="og:image:alt" content="${e(m.image.alt)}" />`,
      `<meta name="twitter:image" content="${e(m.image.url)}" />`,
    );
  }
  if (m.publishedTime) tags.push(`<meta property="article:published_time" content="${e(m.publishedTime)}" />`);
  if (m.noindex) tags.push(`<meta name="robots" content="noindex, nofollow" />`);
  return tags.join('\n    ');
}

export const META_MARKER = '<!--app-meta-->';

export function injectMeta(html: string, m: PageMeta): string {
  const withTitle = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(clip(m.title, 110))}</title>`);
  return withTitle.includes(META_MARKER) ? withTitle.replace(META_MARKER, renderMetaTags(m)) : withTitle.replace('</head>', `${renderMetaTags(m)}\n</head>`);
}
