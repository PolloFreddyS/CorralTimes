import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MEDIA_ROLE_SPECS } from '@shared/domain/workflow';
import type { PublicArtwork } from '@shared/domain/public-content';

/**
 * Ilustración oficial. Si aún no hay imagen aprobada, muestra un espacio reservado honesto
 * (nunca una imagen inventada). Reserva el alto con aspect-ratio para evitar saltos de diseño.
 */
export function ArtworkSlot({ art, className, priority = false }: { art: PublicArtwork; className?: string; priority?: boolean }) {
  const ratio = `${art.width} / ${art.height}`;
  return (
    <figure className={cn('w-full', className)}>
      {art.src ? (
        <img
          src={art.src}
          alt={art.alt}
          width={art.width}
          height={art.height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          {...(priority ? { fetchPriority: 'high' as const } : {})}
          className="h-auto w-full border border-rule object-cover"
          style={{ aspectRatio: ratio }}
        />
      ) : (
        <div
          role="img"
          aria-label={`${art.alt} (ilustración pendiente)`}
          className="halftone flex w-full flex-col items-center justify-center gap-2 border border-rule p-4 text-center text-fg-muted"
          style={{ aspectRatio: ratio }}
        >
          <ImageOff aria-hidden className="size-7" />
          <span className="kicker">{MEDIA_ROLE_SPECS[art.role].label}</span>
          <span className="max-w-xs font-serif text-sm italic">Ilustración oficial pendiente</span>
        </div>
      )}
      {art.caption && <figcaption className="mt-1.5 border-b border-rule-soft pb-1.5 font-sans text-xs text-fg-muted">{art.caption}</figcaption>}
    </figure>
  );
}
