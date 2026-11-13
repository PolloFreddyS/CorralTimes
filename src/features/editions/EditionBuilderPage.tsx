import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { LPMarketTicker, NewspaperMasthead, PlayerRankCard, QuoteCard, StoryCard } from '@/components/editorial';
import { PageHeader, PhaseNotice } from '@/components/layout/PageHeader';
import { ErrorState, LoadingRows } from '@/components/layout/QueryState';
import { editionQuery, lpRowsQuery, rankingQuery, storiesQuery } from '@/lib/demo-queries';
import { estimatePages } from '@shared/domain/readiness';

/**
 * La Imprenta: vista previa de la jerarquía editorial en modo periódico.
 * No es un render "pixel-perfect" del resultado final de ChatGPT.
 */
export function EditionBuilderPage() {
  const edition = useQuery(editionQuery);
  const stories = useQuery(storiesQuery);
  const ranking = useQuery(rankingQuery);
  const lp = useQuery(lpRowsQuery);
  const err = edition.error ?? stories.error ?? ranking.error;
  if (err) return <ErrorState error={err} />;
  if (!edition.data || !stories.data || !ranking.data) return <LoadingRows rows={8} />;

  const lead = stories.data.find((s) => s.section === 'PORTADA');
  const secondary = stories.data.filter((s) => s.section === 'SECUNDARIA');
  const rumors = stories.data.filter((s) => s.section === 'RUMORES');
  const quotes = stories.data.filter((s) => s.section === 'FRASES' && s.exactQuote);
  const pages = estimatePages({ main: lead ? 1 : 0, secondary: secondary.length, rumor: rumors.length, quote: quotes.length, lp: 1, ranking: ranking.data.length ? 1 : 0 });

  return (
    <div>
      <PageHeader kicker="La Imprenta" title="Armado de la edición" description="Vista previa de la jerarquía editorial. El diseño final lo produce ChatGPT con el prompt del viernes." />
      <PhaseNotice phase={5}>Asignación, reordenamiento, bloqueo y revisiones de la edición se habilitan en la Fase 5.</PhaseNotice>
      {pages > 1 && (
        <p role="status" className="mt-3 flex items-center gap-2 border-2 border-gold px-3 py-2 text-sm"><AlertTriangle aria-hidden className="size-4 text-gold" />Esta edición probablemente necesite Página 2.</p>
      )}

      <div data-mode="newspaper" className="mt-5 border border-rule bg-surface p-4 text-fg shadow-[8px_8px_0_rgba(0,0,0,0.25)] sm:p-8">
        <NewspaperMasthead editionNumber={edition.data.number} publicationDate={edition.data.publicationDate} />
        <div className="mt-5 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            {lead ? <StoryCard story={lead} variant="lead" /> : <p className="text-sm text-fg-muted">Sin titular principal.</p>}
            <div className="rule-thin" />
            <div className="grid gap-6 sm:grid-cols-2">
              {secondary.map((s) => <StoryCard key={s.id} story={s} />)}
              {rumors.map((s) => <StoryCard key={s.id} story={s} />)}
            </div>
          </div>
          <aside className="space-y-6 border-rule lg:border-l lg:pl-6">
            {quotes.map((q) => <QuoteCard key={q.id} quote={q.exactQuote!} attribution={q.quoteAttribution ?? 'Anónimo'} displayTitle="Frase de la semana" />)}
            <section>
              <h3 className="kicker border-b-2 border-rule pb-1">Power Ranking</h3>
              <ol>{ranking.data.map((r) => <PlayerRankCard key={r.position} entry={r} />)}</ol>
            </section>
          </aside>
        </div>
        <div className="mt-6">
          <h3 className="kicker mb-1">Wall Street del Tilt</h3>
          <LPMarketTicker rows={lp.data ?? []} />
        </div>
      </div>
    </div>
  );
}
