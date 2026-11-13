import { useLayoutEffect, useRef, useState } from 'react';
import { formatLpDelta } from '@shared/domain/lp';

interface Point {
  editionNumber: number;
  periodEnd: string;
  total: number | null;
}

/** Línea del total de grupo por semana (una serie → sin leyenda; el título la nombra). */
export function LpHistoryChart({ points, title }: { points: Point[]; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(300);
  const [hover, setHover] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry!.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = 180;
  const pad = { l: 40, r: 16, t: 26, b: 26 };
  const known = points.filter((p) => p.total !== null).map((p) => p.total!);
  if (points.length < 2 || known.length < 2) {
    return (
      <figure>
        <figcaption className="kicker mb-2">{title}</figcaption>
        <p className="border border-dashed border-rule-soft p-4 text-center text-sm text-fg-muted">Se necesitan al menos dos semanas congeladas para mostrar la tendencia.</p>
      </figure>
    );
  }
  const lo = Math.min(0, ...known);
  const hi = Math.max(0, ...known);
  const span = hi - lo || 1;
  const x = (i: number) => pad.l + (i * (width - pad.l - pad.r)) / (points.length - 1);
  const y = (v: number) => pad.t + ((hi - v) / span) * (H - pad.t - pad.b);
  const segs: string[] = [];
  let d = '';
  points.forEach((p, i) => {
    if (p.total === null) {
      if (d) segs.push(d);
      d = '';
      return;
    }
    d += `${d ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.total).toFixed(1)}`;
  });
  if (d) segs.push(d);
  const h = hover !== null ? points[hover] : null;

  return (
    <figure>
      <figcaption className="kicker mb-2">{title}</figcaption>
      <div ref={ref} className="relative w-full min-w-0 overflow-hidden">
        <svg
          className="block"
          width={width}
          height={H}
          role="img"
          aria-label={`${title}. ${points.map((p) => `Edición ${p.editionNumber}: ${p.total === null ? 'sin datos' : formatLpDelta(p.total)}`).join('; ')}`}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const rel = e.clientX - rect.left;
            let best = 0;
            points.forEach((_, i) => {
              if (Math.abs(x(i) - rel) < Math.abs(x(best) - rel)) best = i;
            });
            setHover(best);
          }}
          onMouseLeave={() => setHover(null)}
        >
          <line x1={pad.l} x2={width - pad.r} y1={y(0)} y2={y(0)} stroke="var(--chart-grid)" strokeWidth={1} />
          <text x={pad.l - 6} y={y(0)} dy="0.32em" textAnchor="end" className="fill-fg-muted font-mono text-[10px]">0</text>
          <text x={pad.l - 6} y={y(hi)} dy="0.32em" textAnchor="end" className="fill-fg-muted font-mono text-[10px]">{hi !== 0 ? formatLpDelta(hi) : ''}</text>
          <text x={pad.l - 6} y={y(lo)} dy="0.32em" textAnchor="end" className="fill-fg-muted font-mono text-[10px]">{lo !== 0 ? formatLpDelta(lo) : ''}</text>
          {points.map((p, i) => (
            <text key={p.editionNumber} x={x(i)} y={H - 6} textAnchor="middle" className="fill-fg-muted font-sans text-[10px]">N.º {p.editionNumber}</text>
          ))}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="var(--rule)" strokeWidth={1} />}
          {segs.map((s, i) => <path key={i} d={s} fill="none" stroke="var(--fg)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />)}
          {points.map((p, i) =>
            p.total === null ? null : (
              <circle key={i} cx={x(i)} cy={y(p.total)} r={hover === i ? 5.5 : 4} fill={p.total >= 0 ? 'var(--chart-gain)' : 'var(--chart-loss)'} stroke="var(--surface)" strokeWidth={2} />
            ),
          )}
          {(() => {
            const last = points.length - 1;
            const v = points[last]!.total;
            return v === null ? null : <text x={x(last) - 8} y={y(v) - 10} textAnchor="end" className="fill-fg font-mono text-[11px] font-semibold">{formatLpDelta(v)}</text>;
          })()}
        </svg>
        {h && (
          <div role="tooltip" className="pointer-events-none absolute top-0 border border-rule bg-surface-raised px-2 py-1 font-sans text-xs shadow-[3px_3px_0_var(--rule)]" style={{ left: Math.min(x(hover!) + 8, width - 140) }}>
            <p className="font-semibold">Edición N.º {h.editionNumber}</p>
            <p className="text-fg-muted">Semana al {h.periodEnd}</p>
            <p>{h.total === null ? 'Sin datos' : `${formatLpDelta(h.total)} LP`}</p>
          </div>
        )}
      </div>
    </figure>
  );
}
