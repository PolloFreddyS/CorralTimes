import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ArticleBody } from '@/components/newspaper/ArticleBody';
import type { ArticleDoc } from '@shared/domain/article-doc';

describe('ArticleBody — renderizado seguro', () => {
  it('no renderiza enlaces peligrosos ni HTML embebido', () => {
    const doc: ArticleDoc = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'clic', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] },
        { type: 'paragraph', content: [{ type: 'text', text: '<img src=x onerror=alert(1)>' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'seguro', marks: [{ type: 'link', attrs: { href: 'https://example.com' } }] }] },
        // nodo desconocido inyectado por un dato malformado
        { type: 'html', html: '<script>alert(1)</script>' } as unknown as ArticleDoc['content'][number],
      ],
    };
    const { container } = render(<ArticleBody doc={doc} />);
    expect(container.querySelector('img, script')).toBeNull();
    const links = [...container.querySelectorAll('a')];
    expect(links).toHaveLength(1);
    expect(links[0]!.getAttribute('href')).toBe('https://example.com/');
    expect(links[0]!.getAttribute('rel')).toContain('noopener');
  });
});
