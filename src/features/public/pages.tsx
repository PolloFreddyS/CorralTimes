import type React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { NewspaperMasthead, PlayerRankCard } from '@/components/editorial';
import { LpGainLossChart } from '@/components/charts/LpGainLossChart';
import { LpHistoryChart } from '@/components/charts/LpHistoryChart';
import { ErrorState } from '@/components/layout/QueryState';
import { ArticleBody } from '@/components/newspaper/ArticleBody';
import { ArtworkSlot } from '@/components/newspaper/ArtworkSlot';
import { ShareButtons } from '@/components/newspaper/ShareButtons';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { articleQuery, editionBySlugQuery, editionsListQuery, latestEditionQuery } from '@/lib/public-api';
import { PalabreroGame } from '@/features/palabrero/PalabreroGame';
import { formatLongDate } from '@shared/domain/edition-calendar';
import { DATA_QUALITY_LABELS, formatLpDelta, QUEUE_LABELS, sumKnown } from '@shared/domain/lp';
import { ARTICLE_CATEGORY_LABELS, articlePath, editionPath } from '@shared/domain/public-content';
import { DemoNotice, EditionFront, NoEditionYet } from './EditionFront';

function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando" className="space-y-4 py-4">
      <Skeleton className="mx-auto h-20 w-3/4" />
      <Skeleton className="h-6 w-full" />
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
    </div>
  );
}

function NotFoundBlock({ what }: { what: string }) {
  return (
    <div className="py-16 text-center">
      <h1 className="headline text-4xl">{what} no encontrada</h1>
      <p className="mt-2 font-serif">Puede que no exista o que todavía no se haya publicado.</p>
      <Link className="mt-4 inline-block underline" to="/ediciones">Ver ediciones publicadas</Link>
    </div>
  );
}

function PageTitle({ kicker, title, children }: { kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="mb-6 border-b-4 border-double border-rule pb-3">
      <p className="kicker text-accent">{kicker}</p>
      <h1 className="headline text-4xl sm:text-5xl">{title}</h1>
      {children && <div className="mt-1 font-serif text-fg-muted">{children}</div>}
    </header>
  );
}

export function FrontPage() {
  const q = useQuery(latestEditionQuery);
  if (q.isLoading) return <PageSkeleton />;
  if (q.isError) return <ErrorState error={q.error} />;
  return q.data ? <EditionFront edition={q.data} /> : <NoEditionYet />;
}

export function EditionPage() {
  const { editionSlug = '' } = useParams();
  const q = useQuery(editionBySlugQuery(editionSlug));
  if (q.isLoading) return <PageSkeleton />;
  if (q.isError) return <ErrorState error={q.error} />;
  return q.data ? <EditionFront edition={q.data} /> : <NotFoundBlock what="Edición" />;
}

export function ArticlePage() {
  const { editionSlug = '', articleSlug = '' } = useParams();
  const q = useQuery(articleQuery(editionSlug, articleSlug));
  if (q.isLoading) return <PageSkeleton />;
  if (q.isError) return <ErrorState error={q.error} />;
  if (!q.data) return <NotFoundBlock what="Noticia" />;
  const { article: a, edition, related } = q.data;
  return (
    <div>
      {edition.demo && <DemoNotice />}
      <NewspaperMasthead compact />
      <nav aria-label="Ruta" className="mt-2 border-y border-rule py-1.5 font-sans text-xs">
        <Link to={editionPath(edition.slug)} className="inline-flex items-center gap-1 font-semibold hover:underline">
          <ArrowLeft aria-hidden className="size-3.5" />Edición N.º {edition.number} · {formatLongDate(edition.publicationDate)}
        </Link>
      </nav>
      <article className="mx-auto mt-6 max-w-3xl">
        <p className="kicker text-accent">{ARTICLE_CATEGORY_LABELS[a.category]}</p>
        <h1 className="headline mt-1 text-[2.1rem] min-[400px]:text-4xl sm:text-6xl">{a.title}</h1>
        <p className="mt-3 font-headline text-xl italic sm:text-2xl">{a.subtitle}</p>
        <p className="mt-3 border-y border-rule-soft py-2 font-sans text-xs text-fg-muted">
          Por <strong className="text-fg">{a.credit}</strong> · <time dateTime={a.publishedAt}>{formatLongDate(edition.publicationDate)}</time> · {a.readingMinutes} min de lectura
        </p>
        {a.hero && <ArtworkSlot art={a.hero} priority className="mt-5" />}
        <div className="mt-6"><ArticleBody doc={a.body} /></div>
        <div className="mt-8 border-t-2 border-rule pt-4"><ShareButtons title={a.title} path={articlePath(edition.slug, a.slug)} /></div>
      </article>
      {related.length > 0 && (
        <section aria-labelledby="related" className="mx-auto mt-10 max-w-5xl">
          <h2 id="related" className="kicker mb-3 border-b-2 border-rule pb-1">Más de esta edición</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {related.map((r) => (
              <article key={r.slug}>
                <p className="kicker text-accent">{ARTICLE_CATEGORY_LABELS[r.category]}</p>
                <h3 className="headline mt-0.5 text-lg"><Link className="hover:underline" to={articlePath(edition.slug, r.slug)}>{r.title}</Link></h3>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export function EditionsPage({ archive = false }: { archive?: boolean }) {
  const q = useQuery(editionsListQuery);
  const [term, setTerm] = useState('');
  const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const list = useMemo(() => (q.data ?? []).filter((e) => !term || fold(`${e.headline} ${e.dek} ${e.number} ${e.publicationDate}`).includes(fold(term))), [q.data, term]);
  return (
    <div>
      <PageTitle kicker={archive ? 'Hemeroteca' : 'Ediciones'} title={archive ? 'El archivo del gallinero' : 'Todas las ediciones'}>
        Cada edición conserva su contenido, ranking y bolsa tal como se publicaron.
      </PageTitle>
      {archive && <Input type="search" aria-label="Buscar en la hemeroteca" placeholder="Buscar por titular, número o fecha…" value={term} onChange={(ev) => setTerm(ev.target.value)} className="mb-5 max-w-md" />}
      {q.isLoading ? <PageSkeleton /> : q.isError ? <ErrorState error={q.error} /> : list.length === 0 ? (
        <p className="border border-dashed border-rule-soft p-8 text-center font-serif">{term ? 'Ninguna edición coincide.' : 'Todavía no hay ediciones publicadas.'}</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => (
            <li key={e.slug} className="border-t-4 border-rule pt-3">
              <p className="kicker text-fg-muted">N.º {e.number} · {formatLongDate(e.publicationDate)}</p>
              <h2 className="headline mt-1 text-xl"><Link to={editionPath(e.slug)} className="hover:underline">{e.headline}</Link></h2>
              <p className="mt-1 font-serif text-sm text-fg/80">{e.dek}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function BolsaLpPage() {
  const q = useQuery(latestEditionQuery);
  if (q.isLoading) return <PageSkeleton />;
  if (q.isError) return <ErrorState error={q.error} />;
  const lp = q.data?.lp;
  if (!lp) {
    return (
      <div>
        <PageTitle kicker="Wall Street del Tilt" title="La bolsa está cerrada" />
        <p className="font-serif">Todavía no hay un reporte LP aprobado y publicado.</p>
      </div>
    );
  }
  const solo = sumKnown(lp.entries.filter((x) => x.queue === 'RANKED_SOLO_5x5').map((x) => x.lpChange));
  const flex = sumKnown(lp.entries.filter((x) => x.queue === 'RANKED_FLEX_SR').map((x) => x.lpChange));
  const total = sumKnown([solo.total, flex.total]);
  const card = (label: string, v: { total: number | null; missing: number }) => (
    <div className="border-2 border-rule bg-surface-raised p-3 text-center">
      <p className="kicker text-fg-muted">{label}</p>
      <p className="headline mt-1 text-4xl tabular-nums">{v.total === null ? 's/d' : `${v.total >= 0 ? '▲' : '▼'} ${formatLpDelta(v.total)}`}</p>
      <p className="font-sans text-[0.7rem] text-fg-muted">LP{v.missing ? ` · ${v.missing} sin datos` : ''}</p>
    </div>
  );
  return (
    <div>
      {q.data?.demo && <DemoNotice />}
      <PageTitle kicker="Wall Street del Tilt" title="La bolsa de valores del LP">
        Semana del {lp.periodStart} al {lp.periodEnd} · datos recopilados el {new Date(lp.collectedAt).toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' })} · fuente: {lp.source}
      </PageTitle>
      {lp.commentary && <p className="mb-5 border-l-4 border-gold-strong pl-3 font-headline text-lg italic">“{lp.commentary}”</p>}
      <div className="grid gap-3 sm:grid-cols-3">{card('Solo/Duo', solo)}{card('Flex', flex)}{card('Total del grupo', total)}</div>
      <div className="mt-8 grid gap-8 lg:grid-cols-2 [&>*]:min-w-0">
        <LpGainLossChart entries={lp.entries} title="Ganancias y pérdidas por jugador" />
        <LpHistoryChart points={lp.history} title="Total del grupo por edición" />
      </div>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[38rem] border-collapse text-sm">
          <caption className="kicker mb-2 text-left">Tabla completa</caption>
          <thead><tr className="border-b-2 border-rule text-left kicker"><th scope="col" className="py-2 pr-3">Jugador</th><th scope="col" className="pr-3">Cola</th><th scope="col" className="pr-3">Inicio → Fin</th><th scope="col" className="pr-3 text-right">Δ LP</th><th scope="col" className="pr-3 text-right">Partidas</th><th scope="col">Calidad</th></tr></thead>
          <tbody className="font-mono text-xs">
            {lp.entries.map((r) => (
              <tr key={`${r.player}-${r.queue}`} className="border-b border-rule-soft">
                <th scope="row" className="py-2 pr-3 text-left font-sans font-semibold">{r.player}</th>
                <td className="pr-3">{QUEUE_LABELS[r.queue]}</td>
                <td className="pr-3">{r.startRank ?? 's/d'} → {r.endRank ?? 's/d'}</td>
                <td className="pr-3 text-right font-semibold">{r.lpChange === null ? 's/d' : `${r.lpChange >= 0 ? '▲' : '▼'} ${formatLpDelta(r.lpChange)}`}</td>
                <td className="pr-3 text-right">{r.games ?? 's/d'}</td>
                <td><Badge tone={r.quality === 'COMPLETE' ? 'green' : r.quality === 'MISSING' || r.quality === 'ERROR' ? 'redOutline' : 'gold'}>{DATA_QUALITY_LABELS[r.quality]}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PowerRankingsPage() {
  const q = useQuery(latestEditionQuery);
  if (q.isLoading) return <PageSkeleton />;
  if (q.isError) return <ErrorState error={q.error} />;
  const r = q.data?.ranking;
  return (
    <div>
      {q.data?.demo && <DemoNotice />}
      <PageTitle kicker="Power Rankings" title={q.data ? `Edición N.º ${q.data.number}` : 'Power Rankings'}>Orden curado por la redacción. Las posiciones nunca se generan automáticamente.</PageTitle>
      {r && r.length ? <ol className="max-w-2xl border-y-2 border-rule">{r.map((x) => <PlayerRankCard key={x.position} entry={x} />)}</ol> : <p className="font-serif">No hay un ranking publicado todavía.</p>}
    </div>
  );
}

export function JuegosPage() {
  const q = useQuery(latestEditionQuery);
  const id = q.data?.puzzle?.available ? q.data.puzzle.id : null;
  return (
    <div>
      {q.data?.demo && <DemoNotice />}
      <PageTitle kicker="Juegos" title="El Palabrero del Corral">“Adivina el tilt” · Un juego de palabras por edición.</PageTitle>
      {q.isLoading ? <PageSkeleton /> : id ? <PalabreroGame puzzleId={id} /> : (
        <p className={cn('border border-dashed border-rule-soft p-8 text-center font-serif')}>No hay un palabrero activo para la edición actual.</p>
      )}
    </div>
  );
}
