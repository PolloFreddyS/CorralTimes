import { describe, expect, it } from 'vitest';
import { docToPlainText, p, readingMinutes, safeHref, t } from '@shared/domain/article-doc';
import { articleDocSchema } from '@shared/domain/article-doc-schema';

describe('documento de artículo', () => {
  it('safeHref solo permite http(s) y mailto', () => {
    expect(safeHref('https://example.com/a')).toBe('https://example.com/a');
    expect(safeHref('mailto:x@example.com')).toBe('mailto:x@example.com');
    for (const bad of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'java\tscript:alert(1)', ' javascript:alert(1)', 'data:text/html,<script>', 'vbscript:x', '//evil.example', '/relativo', '']) {
      expect(safeHref(bad), bad).toBeNull();
    }
  });
  it('el esquema rechaza nodos desconocidos y HTML crudo', () => {
    expect(articleDocSchema.safeParse({ type: 'doc', content: [{ type: 'html', html: '<script>x</script>' }] }).success).toBe(false);
    expect(articleDocSchema.safeParse({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'script' }] }] }] }).success).toBe(false);
    expect(articleDocSchema.safeParse({ type: 'doc', content: [p('Hola ', t('mundo', { type: 'bold' }))] }).success).toBe(true);
  });
  it('las citas se mantienen exactas en el texto plano', () => {
    const doc = { type: 'doc' as const, content: [{ type: 'quote' as const, attrs: { text: 'Diablo, mano… ¡qué ñame!', attribution: 'Alguien' } }] };
    expect(docToPlainText(doc)).toContain('“Diablo, mano… ¡qué ñame!”');
  });
  it('calcula tiempo de lectura mínimo de 1 minuto', () => {
    expect(readingMinutes({ type: 'doc', content: [p('corto')] })).toBe(1);
    expect(readingMinutes({ type: 'doc', content: [p('palabra '.repeat(600))] })).toBe(3);
  });
});
