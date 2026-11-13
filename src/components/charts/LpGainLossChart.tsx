import { useState } from 'react';
import { cn } from '@/lib/cn';
import { DATA_QUALITY_LABELS, formatLpDelta, QUEUE_LABELS } from '@shared/domain/lp';
import type { PublicLpEntry } from '@shared/domain/public-content';

/**
 * Barras divergentes de ganancia/pérdida de LP por jugador.
 * Identidad nunca solo por color: signo + ▲/▼ en la etiqueta. Dato ausente = "s/d" (sin barra), nunca 0.
 * Colores validados para daltonismo (azul/rojo, ver docs/DESIGN_SYSTEM.md).
 */
export function LpGainLossChart({ entries, title }: { entries: PublicLpEntry[]; title: string }) {
  const [active, setActive] = useState<number | null>(null);
  const known = entries.filter((e) => e.lpChange !== null).map((e) => Math.abs(e.lpChange!));
  const max = Math.max(1, ...known);
  const sorted = [...entries].sort((a, b) => (b.lpChange ?? -Infinity) - (a.lpChange ?? -Infinity));

  return (
    <figure className="min-w-0">
      <figcaption className="kicker mb-2">{title}</figcaption>
      <ul className="space-y-1" onMouseLeave={() => setActive(null)}>
        {sorted.map((e, i) => {
          const v = e.lpChange;
          // La barra más larga ocupa 36% desde el centro: deja espacio para la etiqueta sin desbordar.
          const pct = v === null ? 0 : (Math.abs(v) / max) * 36;
          const gain = (v ?? 0) >= 0;
          const label = `${e.player} ${QUEUE_LABELS[e.queue]}: ${v === null ? 'sin datos' : `${formatLpDelta(v)} LP`}`;
          return (
            <li key={`${e.player}-${e.queue}`} className="relative">
              <button
                type="button"
                className="grid w-full grid-cols-[minmax(0,9rem)_1fr] items-center gap-2 py-1 text-left focus-visible:outline-2 sm:grid-cols-[minmax(0,12rem)_1fr]"
                aria-label={label}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              >
                <span className="truncate font-sans text-xs font-semibold">
                  {e.player.split('#')[0]} <span className="font-normal text-fg-muted">· {QUEUE_LABELS[e.queue]}</span>
                </span>
                <span className="relative h-5">
                  <span aria-hidden className="absolute inset-y-0 left-1/2 w-px bg-rule" />
                  {v === null ? (
                    <span className="absolute inset-y-1 left-1/2 ml-1 font-mono text-[0.7rem] text-fg-muted">s/d</span>
                  ) : (
                    <>
                      <span
                        aria-hidden
                        className={cn('absolute inset-y-1', gain ? 'left-1/2 rounded-r bg-chart-gain' : 'right-1/2 rounded-l bg-chart-loss')}
                        style={{ width: `${pct}%` }}
                      />
                      <span
                        aria-hidden
                        className="absolute inset-y-0 flex items-center font-mono text-[0.7rem] font-semibold whitespace-nowrap text-fg"
                        style={gain ? { left: `calc(50% + ${pct}% + 4px)` } : { right: `calc(50% + ${pct}% + 4px)` }}
                      >
                        {gain ? '▲' : '▼'} {formatLpDelta(v)}
                      </span>
                    </>
                  )}
                </span>
              </button>
              {active === i && (
                <div role="tooltip" className="pointer-events-none absolute top-full left-0 z-10 mt-0.5 border border-rule bg-surface-raised px-2.5 py-1.5 font-sans text-xs shadow-[3px_3px_0_var(--rule)] sm:left-48">
                  <p className="font-semibold">{e.player}</p>
                  <p className="text-fg-muted">{QUEUE_LABELS[e.queue]} · {e.startRank ?? 's/d'} → {e.endRank ?? 's/d'}</p>
                  <p>{v === null ? 'Sin datos' : `${formatLpDelta(v)} LP`} · {e.games ?? 's/d'} partidas · {DATA_QUALITY_LABELS[e.quality]}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-2 flex flex-wrap gap-4 font-sans text-xs text-fg-muted">
        <span className="flex items-center gap-1.5"><span aria-hidden className="inline-block size-2.5 rounded-sm bg-chart-gain" />▲ Ganancia</span>
        <span className="flex items-center gap-1.5"><span aria-hidden className="inline-block size-2.5 rounded-sm bg-chart-loss" />▼ Pérdida</span>
        <span>s/d = sin datos (no es cero)</span>
      </div>
    </figure>
  );
}
