import { useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import { Link } from 'react-router';
import { EditionStatus, LPMarketTicker, PublicationReadinessPanel, StoryCard } from '@/components/editorial';
import { PageHeader } from '@/components/layout/PageHeader';
import { ErrorState, LoadingRows } from '@/components/layout/QueryState';
import { Button } from '@/components/ui/button';
import { editionQuery, lpRowsQuery, rankingQuery, storiesQuery, submissionsQuery } from '@/lib/demo-queries';
import { useNow } from '@/lib/use-now';
import { editionClock, formatCountdown, formatLongDate } from '@shared/domain/edition-calendar';
import type { SubmissionStatus } from '@shared/domain/submission';
import { evaluateReadiness, readinessInputFrom } from './edition-readiness';

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'red' | 'green' | 'gold' }) {
  const color = tone === 'red' ? 'text-accent' : tone === 'green' ? 'text-green' : tone === 'gold' ? 'text-gold' : 'text-fg';
  return (
    <div className="border-r border-rule-soft px-3 py-2 last:border-r-0">
      <p className={`headline text-3xl tabular-nums ${color}`}>{value}</p>
      <p className="kicker text-fg-muted">{label}</p>
    </div>
  );
}

export function DashboardPage() {
  const now = useNow();
  const clock = editionClock(now);
  const edition = useQuery(editionQuery);
  const subs = useQuery(submissionsQuery);
  const stories = useQuery(storiesQuery);
  const ranking = useQuery(rankingQuery);
  const lp = useQuery(lpRowsQuery);

  const error = edition.error ?? subs.error ?? stories.error ?? ranking.error;
  if (error) return <ErrorState error={error} />;
  if (!edition.data || !subs.data || !stories.data || !ranking.data) return <LoadingRows rows={6} />;

  const byStatus = (s: SubmissionStatus) => subs.data.filter((x) => x.status === s).length;
  const checks = evaluateReadiness(readinessInputFrom(edition.data, subs.data, stories.data, ranking.data));
  const lead = stories.data.find((s) => s.section === 'PORTADA');

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="La Redacción"
        title={`Edición N.º ${edition.data.number}`}
        description={<>Publicación: <strong>{formatLongDate(edition.data.publicationDate)}</strong></>}
        actions={<EditionStatus status={edition.data.status} revision={edition.data.revision} />}
      />

      <div className="flex flex-wrap items-center gap-3 border-2 border-rule bg-surface-raised px-4 py-3">
        <Clock aria-hidden className="size-5 text-accent" />
        <div>
          <p className="kicker text-fg-muted">Publicación programada · viernes {clock.publicationDate}, 6:00 p. m. (Santo Domingo)</p>
          <p className="font-mono text-xl font-semibold" aria-live="off">{formatCountdown(clock.msUntilClose)}</p>
        </div>
      </div>

      <section aria-label="Estado del buzón" className="grid grid-cols-2 border-y-2 border-rule sm:grid-cols-4 lg:grid-cols-7">
        <Stat label="Total" value={subs.data.length} />
        <Stat label="Por revisar" value={byStatus('SUBMITTED') + byStatus('UNDER_REVIEW')} tone="gold" />
        <Stat label="Falta info" value={byStatus('NEEDS_INFORMATION')} tone="gold" />
        <Stat label="Aprobadas" value={byStatus('APPROVED')} tone="green" />
        <Stat label="Seleccionadas" value={stories.data.filter((s) => s.section).length} />
        <Stat label="Rechazadas" value={byStatus('REJECTED')} tone="red" />
        <Stat label="Arte pendiente" value={edition.data.coverArtworkApproved ? 0 : 1} tone="gold" />
      </section>

      <LPMarketTicker rows={lp.data ?? []} />

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <section aria-labelledby="candidate">
          <h2 id="candidate" className="kicker mb-2 border-b border-rule pb-1">Candidata a portada</h2>
          {lead ? (
            <StoryCard story={lead} variant="lead" />
          ) : (
            <p className="text-sm text-fg-muted">Aún no hay titular principal asignado.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="ink" size="sm"><Link to="/redaccion/buzon">Abrir buzón</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/redaccion/imprenta">Ir a La Imprenta</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/redaccion/creative-studio">Creative Studio</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/redaccion/wall-street">Validar Bolsa LP</Link></Button>
          </div>
        </section>
        <PublicationReadinessPanel checks={checks} />
      </div>
    </div>
  );
}
