import { useQuery } from '@tanstack/react-query';
import { QuoteCard, StoryCard } from '@/components/editorial';
import { PageHeader, PhaseNotice } from '@/components/layout/PageHeader';
import { EmptyState, ErrorState, LoadingRows } from '@/components/layout/QueryState';
import { storiesQuery } from '@/lib/demo-queries';

export function ChaosPage() {
  const { data, error } = useQuery(storiesQuery);
  if (error) return <ErrorState error={error} />;
  if (!data) return <LoadingRows />;
  const quotes = data.filter((s) => s.exactQuote);
  const rumors = data.filter((s) => s.isRumor);
  const memes = data.filter((s) => s.section === 'MEME');
  return (
    <div>
      <PageHeader kicker="Departamento del Caos" title="Memes, frases, rumores y logros" description="Las frases se guardan exactas. Los rumores siempre van marcados como no verificados. Los títulos satíricos son aparte." />
      <PhaseNotice phase={4}>La gestión (crear, editar títulos satíricos, vincular a ediciones) se conecta al backend en la Fase 4.</PhaseNotice>
      <div className="mt-5 grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="h-quotes">
          <h2 id="h-quotes" className="kicker mb-2 border-b-2 border-rule pb-1">Frases legendarias</h2>
          {quotes.length ? quotes.map((q) => <QuoteCard key={q.id} quote={q.exactQuote!} attribution={q.quoteAttribution ?? 'Anónimo'} displayTitle={q.headline} />) : <EmptyState title="Sin frases" />}
        </section>
        <section aria-labelledby="h-rumors">
          <h2 id="h-rumors" className="kicker mb-2 border-b-2 border-rule pb-1">Rumores</h2>
          <div className="space-y-4">{rumors.length ? rumors.map((r) => <StoryCard key={r.id} story={r} />) : <EmptyState title="Sin rumores" />}</div>
        </section>
        <section aria-labelledby="h-memes">
          <h2 id="h-memes" className="kicker mb-2 border-b-2 border-rule pb-1">Memes</h2>
          {memes.length ? memes.map((m) => <StoryCard key={m.id} story={m} />) : <EmptyState title="Sin memes seleccionados">Los memes aprobados aparecerán aquí.</EmptyState>}
        </section>
        <section aria-labelledby="h-logros">
          <h2 id="h-logros" className="kicker mb-2 border-b-2 border-rule pb-1">Logros de la comunidad</h2>
          <EmptyState title="Sin logros registrados">Los logros aprobados aparecerán aquí.</EmptyState>
        </section>
      </div>
    </div>
  );
}
