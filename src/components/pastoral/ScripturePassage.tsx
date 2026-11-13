import { cn } from '@/lib/cn';

/**
 * Pasaje bíblico. La distinción es visible y semántica:
 *  - CITA: <blockquote> entre comillas, con referencia y traducción.
 *  - PARÁFRASIS: texto sin comillas, etiquetado "Paráfrasis de …". Nunca se presenta como cita.
 */
export function ScripturePassage({
  mode,
  text,
  reference,
  translation,
  size = 'lg',
  className,
}: {
  mode: 'quotation' | 'paraphrase';
  text: string;
  reference: string;
  translation: string;
  size?: 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const textSize = size === 'xl' ? 'text-3xl sm:text-4xl' : size === 'lg' ? 'text-2xl sm:text-3xl' : 'text-xl';
  if (mode === 'paraphrase') {
    return (
      <figure className={cn('border-l-4 border-gold-strong/70 py-1 pl-4', className)}>
        <p className="kicker text-fg-muted">Paráfrasis de {reference} · no es cita textual</p>
        <p className={cn('mt-1 font-serif leading-snug', size === 'md' ? 'text-lg' : 'text-xl')}>{text}</p>
      </figure>
    );
  }
  return (
    <figure className={cn('text-center', className)}>
      <blockquote className={cn('font-headline leading-snug italic', textSize)}>
        <span aria-hidden className="text-gold">“</span>
        {text}
        <span aria-hidden className="text-gold">”</span>
      </blockquote>
      <figcaption className="mt-3 font-sans text-sm font-semibold tracking-[0.12em] uppercase">
        {reference} <span className="font-normal text-fg-muted">· {translation}</span>
      </figcaption>
    </figure>
  );
}
