import { Quote } from 'lucide-react';

/** Las frases se muestran EXACTAS. El título satírico es opcional y separado del texto original. */
export function QuoteCard({ quote, attribution, displayTitle }: { quote: string; attribution: string; displayTitle?: string }) {
  return (
    <figure className="border-y-2 border-rule py-3">
      {displayTitle && <p className="kicker mb-1 text-accent">{displayTitle}</p>}
      <Quote aria-hidden className="size-6 text-gold-strong" />
      <blockquote className="font-headline text-xl leading-snug italic sm:text-2xl">“{quote}”</blockquote>
      <figcaption className="mt-2 font-sans text-xs tracking-wide uppercase text-fg-muted">— {attribution} · texto exacto</figcaption>
    </figure>
  );
}
