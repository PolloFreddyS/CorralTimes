import { cn } from '@/lib/cn';
import type { EditorialStory } from '@shared/domain/models';
import { EditorialStamp } from './EditorialStamp';
import { RumorLabel } from './RumorLabel';

const SECTION_LABELS: Record<NonNullable<EditorialStory['section']>, string> = {
  PORTADA: 'Portada',
  SECUNDARIA: 'Secundaria',
  BREVES: 'Breves',
  RUMORES: 'Rumores',
  FRASES: 'Frases',
  MEME: 'Meme',
  BOLSA_LP: 'Bolsa LP',
  POWER_RANKING: 'Power Ranking',
};

/**
 * Tarjeta de historia. Todo el contenido se renderiza como TEXTO (React escapa por defecto);
 * nunca usamos dangerouslySetInnerHTML con contenido enviado por usuarios.
 */
export function StoryCard({ story, variant = 'standard', className }: { story: EditorialStory; variant?: 'lead' | 'standard' | 'brief'; className?: string }) {
  return (
    <article className={cn('relative text-fg', className)}>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        {story.section && <span className="kicker text-accent">{SECTION_LABELS[story.section]}</span>}
        {story.isRumor && <RumorLabel />}
      </div>
      <h3
        className={cn(
          'headline',
          variant === 'lead' && 'text-3xl sm:text-5xl',
          variant === 'standard' && 'text-xl sm:text-2xl',
          variant === 'brief' && 'text-base font-bold',
        )}
      >
        {story.headline}
      </h3>
      {story.exactQuote ? (
        <blockquote className="mt-2 border-l-4 border-gold-strong pl-3 font-headline text-lg italic">
          “{story.exactQuote}”
          {story.quoteAttribution && <footer className="mt-1 font-sans text-xs not-italic text-fg-muted">— {story.quoteAttribution}</footer>}
        </blockquote>
      ) : null}
      {story.satiricalBody && variant !== 'brief' ? (
        <p className={cn('mt-2 font-serif leading-relaxed text-fg/90', variant === 'lead' && 'dropcap text-lg')}>{story.satiricalBody}</p>
      ) : null}
      {variant === 'lead' && story.approved && (
        <EditorialStamp tone="approved" className="absolute top-0 right-0">Aprobado</EditorialStamp>
      )}
    </article>
  );
}
