import { useQuery } from '@tanstack/react-query';
import { PlayerRankCard } from '@/components/editorial';
import { PageHeader, PhaseNotice } from '@/components/layout/PageHeader';
import { ErrorState, LoadingRows } from '@/components/layout/QueryState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { editionQuery, rankingQuery } from '@/lib/demo-queries';

export function RankingsPage() {
  const ranking = useQuery(rankingQuery);
  const edition = useQuery(editionQuery);
  if (ranking.error) return <ErrorState error={ranking.error} />;
  if (!ranking.data || !edition.data) return <LoadingRows />;
  return (
    <div>
      <PageHeader
        kicker="Power Rankings"
        title={`Ranking de la edición N.º ${edition.data.number}`}
        description="Curado a mano por la redacción. Las posiciones nunca se generan automáticamente."
        actions={<><Badge tone={edition.data.rankingState === 'FINAL' ? 'green' : 'gold'}>{edition.data.rankingState === 'FINAL' ? 'Final' : 'Borrador'}</Badge><Button size="sm" variant="ink" disabled title="Disponible en la Fase 5">Congelar ranking</Button></>}
      />
      <PhaseNotice phase={5}>Editor de posiciones, comentarios y congelamiento con la edición en la Fase 5.</PhaseNotice>
      <ol className="mt-4 max-w-2xl border-y-2 border-rule">{ranking.data.map((r) => <PlayerRankCard key={r.position} entry={r} />)}</ol>
    </div>
  );
}
