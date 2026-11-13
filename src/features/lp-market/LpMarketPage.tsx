import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Upload } from 'lucide-react';
import { useState } from 'react';
import { LPMarketTicker } from '@/components/editorial';
import { PageHeader, PhaseNotice } from '@/components/layout/PageHeader';
import { ErrorState, LoadingRows } from '@/components/layout/QueryState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { lpRowsQuery } from '@/lib/demo-queries';
import { DATA_QUALITY_LABELS, formatLpDelta, INITIAL_LP_PLAYERS, QUEUE_LABELS, sumKnown } from '@shared/domain/lp';

export function LpMarketPage() {
  const { data, error } = useQuery(lpRowsQuery);
  const [syncInfo, setSyncInfo] = useState(false);
  if (error) return <ErrorState error={error} />;
  if (!data) return <LoadingRows />;

  const solo = sumKnown(data.filter((r) => r.queue === 'RANKED_SOLO_5x5').map((r) => r.lpChange));
  const flex = sumKnown(data.filter((r) => r.queue === 'RANKED_FLEX_SR').map((r) => r.lpChange));
  const total = sumKnown([solo.total, flex.total]);

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="Wall Street del Tilt"
        title="Bolsa LP semanal"
        description="Rendimiento LP de Solo/Duo y Flex. Un dato faltante se muestra como “s/d”, nunca como cero."
        actions={
          <>
            <Button variant="gold" size="sm" onClick={() => setSyncInfo(true)} aria-expanded={syncInfo} aria-controls="sync-info"><RefreshCw aria-hidden />Sincronizar Bolsa LP</Button>
            <Button variant="outline" size="sm" disabled title="Disponible en la Fase 6"><Upload aria-hidden />Importar JSON/CSV</Button>
          </>
        }
      />
      {syncInfo && (
        <div id="sync-info" role="status" className="border-2 border-gold p-4 text-sm">
          <p className="font-semibold">Sincronización no configurada.</p>
          <p className="mt-1 text-fg-muted">
            No hay un proveedor automático autorizado. La importación manual validada (JSON/CSV) llega en la Fase 6. No se simulan sincronizaciones.
          </p>
        </div>
      )}
      <LPMarketTicker rows={data} />
      <section aria-label="Totales" className="grid grid-cols-3 border-y-2 border-rule text-center">
        {[['Solo/Duo', solo], ['Flex', flex], ['Grupo', { total: total.total, missing: solo.missing + flex.missing }]].map(([label, v]) => {
          const val = v as { total: number | null; missing: number };
          return (
            <div key={label as string} className="border-r border-rule-soft py-3 last:border-r-0">
              <p className={cn('headline text-3xl tabular-nums', val.total === null ? 'text-fg-muted' : val.total >= 0 ? 'text-green' : 'text-accent')}>{formatLpDelta(val.total)}</p>
              <p className="kicker text-fg-muted">{label as string}</p>
              {val.missing > 0 && <p className="text-[0.7rem] text-gold">{val.missing} sin datos</p>}
            </div>
          );
        })}
      </section>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <caption className="sr-only">Detalle por jugador</caption>
          <thead>
            <tr className="border-b-2 border-rule text-left kicker">
              <th className="py-2 pr-3">Jugador</th><th className="pr-3">Cola</th><th className="pr-3">Inicio</th><th className="pr-3">Fin</th><th className="pr-3 text-right">Δ LP</th><th className="pr-3 text-right">Partidas</th><th>Calidad</th>
            </tr>
          </thead>
          <tbody className="font-mono text-xs">
            {data.map((r) => (
              <tr key={`${r.riotId}-${r.queue}`} className="border-b border-rule-soft">
                <td className="py-2 pr-3 font-sans font-semibold">{r.riotId}</td>
                <td className="pr-3">{QUEUE_LABELS[r.queue]}</td>
                <td className="pr-3">{r.startRank ?? 's/d'}</td>
                <td className="pr-3">{r.endRank ?? 's/d'}</td>
                <td className={cn('pr-3 text-right font-semibold', r.lpChange === null ? 'text-fg-muted' : r.lpChange >= 0 ? 'text-green' : 'text-accent')}>{formatLpDelta(r.lpChange)}</td>
                <td className="pr-3 text-right">{r.games ?? 's/d'}</td>
                <td><Badge tone={r.quality === 'COMPLETE' ? 'green' : r.quality === 'MISSING' || r.quality === 'ERROR' ? 'redOutline' : 'gold'}>{DATA_QUALITY_LABELS[r.quality]}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section aria-labelledby="registry">
        <h2 id="registry" className="kicker mb-2 border-b-2 border-rule pb-1">Registro inicial de jugadores (semilla)</h2>
        <ul className="flex flex-wrap gap-2">{INITIAL_LP_PLAYERS.map((p) => <li key={p}><Badge tone="muted" className="normal-case tracking-normal text-xs font-medium">{p}</Badge></li>)}</ul>
      </section>
      <PhaseNotice phase={6}>Registro editable, importaciones validadas, método DPM-like vs. línea base estricta, snapshots históricos y aprobación editorial.</PhaseNotice>
    </div>
  );
}
