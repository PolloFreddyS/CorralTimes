import { cn } from '@/lib/cn';
import { formatLpDelta, QUEUE_LABELS } from '@shared/domain/lp';
import type { LpPlayerRow } from '@shared/domain/models';

/**
 * Cinta bursátil de LP. La animación se desactiva con prefers-reduced-motion (CSS global)
 * y el contenido también está disponible como lista accesible para lectores de pantalla.
 */
export function LPMarketTicker({ rows, className }: { rows: LpPlayerRow[]; className?: string }) {
  if (rows.length === 0) {
    return <div className={cn('border-y border-rule px-3 py-1.5 font-mono text-xs text-fg-muted', className)}>BOLSA LP · sin cotizaciones esta semana</div>;
  }
  const items = rows.map((r) => (
    <span key={`${r.riotId}-${r.queue}`} className="inline-flex items-center gap-1.5 px-4">
      <span className="font-semibold">{r.riotId.split('#')[0]}</span>
      <span className="text-fg-muted">{QUEUE_LABELS[r.queue]}</span>
      <span className={cn(r.lpChange === null ? 'text-fg-muted' : r.lpChange >= 0 ? 'text-green' : 'text-accent')}>
        {r.lpChange === null ? '■' : r.lpChange >= 0 ? '▲' : '▼'} {formatLpDelta(r.lpChange)}
      </span>
    </span>
  ));
  return (
    <div className={cn('overflow-hidden border-y-2 border-rule bg-surface-raised font-mono text-xs', className)}>
      <ul className="sr-only">
        {rows.map((r) => (
          <li key={`${r.riotId}-${r.queue}-sr`}>
            {r.riotId} {QUEUE_LABELS[r.queue]}: {r.lpChange === null ? 'sin datos' : `${formatLpDelta(r.lpChange)} LP`}
          </li>
        ))}
      </ul>
      <div aria-hidden className="flex w-max py-1.5 whitespace-nowrap motion-safe:animate-[ticker_40s_linear_infinite]">
        {items}
        {items}
      </div>
    </div>
  );
}
