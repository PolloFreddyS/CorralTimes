import { HandHeart, Sprout } from 'lucide-react';
import { ArticleBody } from '@/components/newspaper/ArticleBody';
import { ArtworkSlot } from '@/components/newspaper/ArtworkSlot';
import type { ArticleDoc } from '@shared/domain/article-doc';
import { PASTORAL_SECTION } from '@shared/domain/pastoral';
import type { PublicArtwork, PublicPastoralDetails } from '@shared/domain/public-content';
import { ScripturePassage } from './ScripturePassage';

export function PastoralHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="text-center">
      <div className="pastoral-ornament"><span aria-hidden className="font-headline text-lg">✦</span></div>
      <p className={compact ? 'mt-1 font-headline text-2xl font-black tracking-wide' : 'mt-2 font-headline text-3xl font-black tracking-wide sm:text-4xl'}>{PASTORAL_SECTION.name}</p>
      <p className="mt-0.5 font-headline text-base italic text-fg-muted sm:text-lg">“{PASTORAL_SECTION.subtitle}”</p>
    </header>
  );
}

/**
 * Columna pastoral completa. Usada en la página pública del artículo y en la vista previa de la Mesa Pastoral,
 * para que lo que se aprueba sea exactamente lo que se publica.
 */
export function PastoralColumn({
  title,
  subtitle,
  details,
  body,
  artwork,
  dateLabel,
}: {
  title: string;
  subtitle: string;
  details: PublicPastoralDetails;
  body: ArticleDoc;
  artwork: PublicArtwork | null;
  dateLabel?: string;
}) {
  return (
    <article data-tone="pastoral" className="mx-auto max-w-3xl bg-surface px-4 py-8 text-fg sm:px-10">
      <PastoralHeader />
      <div className="mt-8 text-center">
        <p className="kicker text-gold">Tema: {details.theme}{dateLabel ? ` · ${dateLabel}` : ''}</p>
        <h1 className="mt-2 font-headline text-4xl leading-tight font-bold sm:text-5xl">{title}</h1>
        <p className="mt-2 font-headline text-xl text-fg-muted italic">{subtitle}</p>
      </div>
      <ScripturePassage
        className="my-8 border-y border-rule-soft py-6"
        mode={details.passageMode === 'QUOTATION' ? 'quotation' : 'paraphrase'}
        text={details.passageText}
        reference={details.referenceLabel.replace(/ \([^)]*\)$/, '')}
        translation={details.translationCode}
        size="xl"
      />
      {artwork && <ArtworkSlot art={artwork} className="mb-8" />}
      <div className="pastoral-prose">
        <ArticleBody doc={body} />
      </div>
      {details.applications.length > 0 && (
        <section aria-labelledby="pastoral-apply" className="mt-10 border border-rule-soft bg-surface-raised p-5">
          <h2 id="pastoral-apply" className="flex items-center gap-2 font-headline text-xl font-bold"><Sprout aria-hidden className="size-5 text-gold" />Para vivirlo esta semana</h2>
          <ul className="mt-3 space-y-2 font-serif">
            {details.applications.map((a) => <li key={a} className="flex gap-2"><span aria-hidden className="text-gold">✦</span>{a}</li>)}
          </ul>
        </section>
      )}
      {details.prayerInvitation && (
        <section aria-labelledby="pastoral-pray" className="mt-6 text-center">
          <h2 id="pastoral-pray" className="flex items-center justify-center gap-2 font-headline text-xl font-bold"><HandHeart aria-hidden className="size-5 text-gold" />Invitación a orar</h2>
          <p className="mx-auto mt-2 max-w-xl font-serif text-lg italic">{details.prayerInvitation}</p>
        </section>
      )}
      <footer className="mt-10 border-t border-rule-soft pt-3 text-center font-sans text-xs text-fg-muted">
        <p>{details.translationNotice}</p>
        <p className="mt-1">Las reflexiones y aplicaciones son comentario de la redacción, no texto bíblico.</p>
      </footer>
    </article>
  );
}
