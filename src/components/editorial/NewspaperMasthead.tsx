import { brand } from '@/branding/brand.config';
import { cn } from '@/lib/cn';
import { formatLongDate } from '@shared/domain/edition-calendar';

interface Props {
  editionNumber?: number | null;
  publicationDate?: string | null;
  compact?: boolean;
  className?: string;
}

/**
 * Cabecera del periódico. Si `brand.logo.src` está definido usa el logo oficial;
 * si no, una cabecera tipográfica temporal (no es un logo oficial).
 */
export function NewspaperMasthead({ editionNumber, publicationDate, compact = false, className }: Props) {
  return (
    <header className={cn('text-center text-fg', className)}>
      {!compact && (
        <div className="flex items-center justify-between gap-2 border-b border-rule pb-1 kicker text-fg-muted">
          <span>{brand.motto}</span>
          <span className="hidden sm:inline">Sale los {brand.publicationDay.toLowerCase()}</span>
          <span>{editionNumber != null ? `Edición N.º ${editionNumber}` : 'Edición —'}</span>
        </div>
      )}
      <div className={cn('flex items-center justify-center gap-3', compact ? 'py-1' : 'py-3 sm:py-4')}>
        {brand.logo.src ? (
          <img src={brand.logo.src} alt={brand.logo.alt} className={compact ? 'h-9' : 'h-16 sm:h-24'} />
        ) : (
          <h1
            className={cn(
              'font-masthead leading-none tracking-tight',
              compact ? 'text-2xl sm:text-3xl' : 'text-[2.6rem] min-[400px]:text-5xl sm:text-7xl lg:text-8xl',
            )}
          >
            <span aria-hidden className="mr-2 align-middle font-sans text-[0.55em]">{brand.emoji}</span>
            El Corral Times
          </h1>
        )}
      </div>
      {!compact && (
        <>
          <div className="rule-double" />
          <div className="flex flex-col items-center justify-between gap-1 py-1.5 sm:flex-row">
            <p className="font-headline text-sm italic sm:text-base">“{brand.subtitle}”</p>
            <p className="kicker text-fg-muted">{publicationDate ? formatLongDate(publicationDate) : 'Fecha por definir'}</p>
          </div>
          <div className="rule-thick" />
        </>
      )}
    </header>
  );
}
