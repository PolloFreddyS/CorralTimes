import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import type { PublicPastoralPreview } from '@shared/domain/public-content';
import { articlePath } from '@shared/domain/public-content';
import { PastoralHeader } from './PastoralColumn';
import { ScripturePassage } from './ScripturePassage';

/** Avance en la portada: una franja propia, separada de la sátira, con tono cálido. */
export function PastoralBand({ editionSlug, preview }: { editionSlug: string; preview: PublicPastoralPreview }) {
  const d = preview.details;
  return (
    <section aria-label="La Voz del Pastor" data-tone="pastoral" className="border-y-4 border-double border-rule bg-surface px-4 py-8 text-fg sm:px-10">
      <PastoralHeader compact />
      <ScripturePassage
        className="mx-auto mt-6 max-w-3xl"
        mode={d.passageMode === 'QUOTATION' ? 'quotation' : 'paraphrase'}
        text={d.passageText}
        reference={d.referenceLabel.replace(/ \([^)]*\)$/, '')}
        translation={d.translationCode}
        size="lg"
      />
      <div className="mx-auto mt-6 max-w-2xl text-center">
        <h2 className="font-headline text-2xl font-bold">{preview.title}</h2>
        <p className="mt-1 font-serif text-fg-muted">{preview.excerpt}</p>
        <Button asChild variant="outline" className="mt-4 border-rule">
          <Link to={articlePath(editionSlug, preview.articleSlug)}>Leer la reflexión completa</Link>
        </Button>
      </div>
    </section>
  );
}
