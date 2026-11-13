import { ArrowDown, ArrowUp, Minus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { PowerRankingEntry } from '@shared/domain/models';

function Movement({ entry }: { entry: PowerRankingEntry }) {
  if (entry.previousPosition === null) {
    return (
      <span className="inline-flex items-center gap-0.5 text-gold" title="Nuevo en el ranking">
        <Sparkles aria-hidden className="size-3.5" /> <span className="kicker">Nuevo</span>
      </span>
    );
  }
  const diff = entry.previousPosition - entry.position;
  if (diff === 0) return <span className="inline-flex items-center text-fg-muted"><Minus aria-hidden className="size-3.5" /><span className="sr-only">Sin cambios</span></span>;
  const up = diff > 0;
  return (
    <span className={cn('inline-flex items-center gap-0.5 font-mono text-xs', up ? 'text-green' : 'text-accent')}>
      {up ? <ArrowUp aria-hidden className="size-3.5" /> : <ArrowDown aria-hidden className="size-3.5" />}
      <span className="sr-only">{up ? 'Sube' : 'Baja'}</span>
      {Math.abs(diff)}
    </span>
  );
}

export function PlayerRankCard({ entry }: { entry: PowerRankingEntry }) {
  return (
    <li className="grid grid-cols-[3rem_1fr_auto] items-start gap-3 border-b border-rule-soft py-2.5 last:border-b-0">
      <span className="headline text-4xl text-accent tabular-nums">{entry.position}</span>
      <div>
        <p className="font-headline text-lg font-bold leading-tight">{entry.participant}</p>
        {entry.commentary && <p className="font-serif text-sm text-fg-muted">{entry.commentary}</p>}
      </div>
      <Movement entry={entry} />
    </li>
  );
}
