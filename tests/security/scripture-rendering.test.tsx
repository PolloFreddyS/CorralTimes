import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ArticleBody } from '@/components/newspaper/ArticleBody';
import { ScripturePassage } from '@/components/pastoral/ScripturePassage';

describe('pasajes bíblicos', () => {
  it('la cita se presenta como blockquote con referencia y traducción', () => {
    const { container } = render(<ScripturePassage mode="quotation" text="Texto" reference="Filipenses 4:13" translation="RVR1909" />);
    expect(container.querySelector('blockquote')).not.toBeNull();
    expect(screen.getByText(/Filipenses 4:13/)).toBeInTheDocument();
    expect(screen.getByText(/RVR1909/)).toBeInTheDocument();
  });
  it('la paráfrasis nunca usa blockquote ni comillas y se etiqueta', () => {
    const { container } = render(<ScripturePassage mode="paraphrase" text="Resumen" reference="Mateo 11:28" translation="RVR1909" />);
    expect(container.querySelector('blockquote')).toBeNull();
    expect(container.textContent).not.toMatch(/[“”]/);
    expect(screen.getByText(/Paráfrasis de Mateo 11:28 · no es cita textual/)).toBeInTheDocument();
  });
  it('el bloque scripture del artículo escapa el contenido', () => {
    const { container } = render(
      <ArticleBody doc={{ type: 'doc', content: [{ type: 'scripture', attrs: { mode: 'quotation', text: '<script>alert(1)</script>', reference: 'Juan 1:1', translation: 'RVR1909' } }] }} />,
    );
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('<script>');
  });
});
