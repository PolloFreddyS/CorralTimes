/**
 * Documento estructurado de artículo. Es un subconjunto del JSON de ProseMirror/Tiptap
 * (el editor llega en la Fase 4) con una lista CERRADA de nodos y marcas.
 * Nunca se almacena ni se renderiza HTML arbitrario: el renderizador solo conoce estos nodos.
 */

import type { ArticleDoc, Block, TextNode } from './article-doc-schema';
export type { ArticleDoc, Block, TextNode } from './article-doc-schema';

/**
 * Solo se permiten enlaces http(s) y mailto. Bloquea javascript:, data:, vbscript:, URLs relativas
 * a protocolo (//evil) y caracteres de control usados para evadir filtros.
 */
export function safeHref(href: string): string | null {
  // eslint-disable-next-line no-control-regex
  const trimmed = href.replace(/[\u0000-\u001F\u007F\s]+/g, '');
  if (!trimmed || trimmed.startsWith('//')) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  return url.protocol === 'https:' || url.protocol === 'http:' || url.protocol === 'mailto:' ? url.href : null;
}

/** Texto plano (para resúmenes, tiempo de lectura y metadatos). */
export function docToPlainText(doc: ArticleDoc): string {
  const inlineText = (nodes: TextNode[]) => nodes.map((n) => n.text).join('');
  return doc.content
    .map((b) => {
      switch (b.type) {
        case 'paragraph':
        case 'heading':
        case 'callout':
          return inlineText(b.content);
        case 'quote':
          return `“${b.attrs.text}” — ${b.attrs.attribution}`;
        case 'scripture':
          return b.attrs.mode === 'quotation'
            ? `“${b.attrs.text}” (${b.attrs.reference}, ${b.attrs.translation})`
            : `Paráfrasis de ${b.attrs.reference}: ${b.attrs.text}`;
        case 'bulletList':
          return b.content.map(inlineText).join('\n');
        case 'table':
          return [b.header.join(' | '), ...b.rows.map((r) => r.join(' | '))].join('\n');
        case 'image':
          return '';
      }
    })
    .filter(Boolean)
    .join('\n\n');
}

export function readingMinutes(doc: ArticleDoc): number {
  const words = docToPlainText(doc).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Helpers para construir documentos (fixtures y pruebas). */
export const t = (text: string, ...marks: NonNullable<TextNode['marks']>): TextNode => (marks.length ? { type: 'text', text, marks } : { type: 'text', text });
export const p = (...content: (TextNode | string)[]): Block => ({ type: 'paragraph', content: content.map((c) => (typeof c === 'string' ? t(c) : c)) });
