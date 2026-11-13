import { ArrowLeft, ArrowRight, Gamepad2 } from 'lucide-react';
import { Link } from 'react-router';
import { BreakingNewsBanner, EditorialStamp, NewspaperMasthead, PlayerRankCard, QuoteCard, RumorLabel } from '@/components/editorial';
import { ArtworkSlot } from '@/components/newspaper/ArtworkSlot';
import { PastoralBand } from '@/components/pastoral/PastoralBand';
import { ShareButtons } from '@/components/newspaper/ShareButtons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { formatLpDelta, sumKnown } from '@shared/domain/lp';
import { ARTICLE_CATEGORY_LABELS, articlePath, editionPath, type PublicArticleSummary, type PublicEdition } from '@shared/domain/public-content';

function SectionTitle({ children, id }: { children: string; id?: string }) {
  return (
    <h2 id={id} className="kicker mb-3 flex items-center gap-2 border-b-2 border-rule pb-1">
      {children}
    </h2>
  );
}

function ArticleTeaser({ a, edition, size }: { a: PublicArticleSummary; edition: string; size: 'md' | 'sm' }) {
  return (
    <article className="group">
      {a.hero && size === 'md' && <ArtworkSlot art={a.hero} className="mb-2" />}
      <p className="kicker text-accent">{ARTICLE_CATEGORY_LABELS[a.category]}</p>
      <h3 className={cn('headline mt-0.5', size === 'md' ? 'text-2xl' : 'text-lg')}>
        <Link to={articlePath(edition, a.slug)} className="hover:underline">{a.title}</Link>
      </h3>
      <p className="mt-1 font-serif text-sm leading-relaxed text-fg/85">{a.subtitle}</p>
      <p className="mt-1 font-sans text-[0.7rem] text-fg-muted">{a.credit} · {a.readingMinutes} min</p>
    </article>
  );
}

export function DemoNotice() {
  return (
    <BreakingNewsBanner label="Demo" className="mb-3">
      Edición de demostración con personajes, eventos y cifras ficticias. No es una noticia real.
    </BreakingNewsBanner>
  );
}

/** Portada digital de una edición. Orden editorial fijo según la especificación v2 (§7). */
export function EditionFront({ edition: e }: { edition: PublicEdition }) {
  // La columna pastoral nunca se mezcla con las rejillas satíricas: tiene su propia franja.
  const satire = e.articles.filter((a) => a.category !== 'PASTORAL');
  const lead = satire.find((a) => a.placement === 'LEAD') ?? satire[0];
  const secondary = satire.filter((a) => a !== lead && a.placement !== 'BRIEF');
  const lpTotal = e.lp ? sumKnown(e.lp.entries.map((x) => x.lpChange)) : null;
  const movers = e.lp ? [...e.lp.entries].filter((x) => x.lpChange !== null).sort((a, b) => b.lpChange! - a.lpChange!) : [];

  return (
    <div>
      {e.demo && <DemoNotice />}
      <NewspaperMasthead editionNumber={e.number} publicationDate={e.publicationDate} />
      {e.breaking && <BreakingNewsBanner className="mt-3">{e.breaking}</BreakingNewsBanner>}

      {lead && (
        <section aria-labelledby="lead-title" className="mt-5 grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-start">
          <div className="lg:order-2">{e.cover ? <ArtworkSlot art={e.cover} priority /> : lead.hero && <ArtworkSlot art={lead.hero} priority />}</div>
          <div className="lg:order-1">
            <p className="kicker text-accent">{ARTICLE_CATEGORY_LABELS[lead.category]} · Titular principal</p>
            <h2 id="lead-title" className="headline mt-1 text-[2.1rem] min-[400px]:text-4xl sm:text-5xl lg:text-6xl">
              <Link to={articlePath(e.slug, lead.slug)} className="hover:underline">{lead.title}</Link>
            </h2>
            <p className="mt-3 font-headline text-lg italic sm:text-xl">{lead.subtitle}</p>
            <p className="dropcap mt-3 font-serif text-lg leading-relaxed">{lead.summary}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button asChild><Link to={articlePath(e.slug, lead.slug)}>Leer la noticia completa</Link></Button>
              <span className="font-sans text-xs text-fg-muted">{lead.credit} · {lead.readingMinutes} min</span>
            </div>
          </div>
        </section>
      )}

      {e.pastoral ? <div className="my-8"><PastoralBand editionSlug={e.slug} preview={e.pastoral} /></div> : <div className="rule-double my-6" />}

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="min-w-0 space-y-8">
          {secondary.length > 0 && (
            <section aria-labelledby="sec-more">
              <SectionTitle id="sec-more">Más noticias del gallinero</SectionTitle>
              <div className="grid gap-6 sm:grid-cols-2 sm:[&>*:nth-child(odd)]:border-r sm:[&>*:nth-child(odd)]:border-rule-soft sm:[&>*:nth-child(odd)]:pr-6">
                {secondary.map((a) => <ArticleTeaser key={a.slug} a={a} edition={e.slug} size="md" />)}
              </div>
            </section>
          )}

          {e.lp && lpTotal && (
            <section aria-labelledby="sec-lp" className="border-2 border-rule bg-surface-raised p-4">
              <SectionTitle id="sec-lp">Wall Street del Tilt</SectionTitle>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className={cn('headline text-3xl tabular-nums', lpTotal.total === null ? 'text-fg-muted' : '')}>{formatLpDelta(lpTotal.total)}</p>
                  <p className="kicker text-fg-muted">Total del grupo</p>
                </div>
                <div>
                  <p className="headline text-xl">{movers[0] ? movers[0].player.split('#')[0] : 's/d'}</p>
                  <p className="kicker text-fg-muted">▲ Mayor alza {movers[0] ? formatLpDelta(movers[0].lpChange) : ''}</p>
                </div>
                <div>
                  <p className="headline text-xl">{movers.at(-1) ? movers.at(-1)!.player.split('#')[0] : 's/d'}</p>
                  <p className="kicker text-fg-muted">▼ Mayor caída {movers.at(-1) ? formatLpDelta(movers.at(-1)!.lpChange) : ''}</p>
                </div>
              </div>
              {lpTotal.missing > 0 && <p className="mt-2 text-center text-xs text-gold">{lpTotal.missing} registro(s) sin datos: no se cuentan como cero.</p>}
              <p className="mt-2 text-center font-sans text-[0.7rem] text-fg-muted">Semana {e.lp.periodStart} → {e.lp.periodEnd} · fuente: {e.lp.source}</p>
              <div className="mt-3 text-center"><Button asChild variant="outline" size="sm"><Link to="/bolsa-lp">Ver la bolsa completa</Link></Button></div>
            </section>
          )}

          {(e.rumors.length > 0 || e.briefs.length > 0) && (
            <section aria-labelledby="sec-rumors">
              <SectionTitle id="sec-rumors">Rumores y breves</SectionTitle>
              <ul className="divide-y divide-rule-soft">
                {e.rumors.map((r) => (
                  <li key={r.title} className="py-2.5">
                    <RumorLabel />
                    <p className="mt-1 font-headline text-lg font-bold">{r.title}</p>
                    <p className="font-serif text-sm text-fg/85">{r.body}</p>
                  </li>
                ))}
                {e.briefs.map((b) => <li key={b} className="py-2.5 font-serif text-sm">■ {b}</li>)}
              </ul>
            </section>
          )}
        </div>

        <aside className="min-w-0 space-y-8 lg:border-l lg:border-rule lg:pl-6" aria-label="Columna lateral">
          {e.ranking && e.ranking.length > 0 && (
            <section aria-labelledby="sec-rank">
              <SectionTitle id="sec-rank">Power Rankings</SectionTitle>
              <ol>{e.ranking.slice(0, 5).map((r) => <PlayerRankCard key={r.position} entry={r} />)}</ol>
              <Link to="/power-rankings" className="mt-2 inline-block font-sans text-xs font-semibold underline">Ranking completo</Link>
            </section>
          )}
          {e.meme && (
            <section aria-labelledby="sec-meme">
              <SectionTitle id="sec-meme">Meme de la semana</SectionTitle>
              <ArtworkSlot art={e.meme.artwork} />
              <p className="mt-1 font-headline font-bold">{e.meme.title}</p>
            </section>
          )}
          {e.quote && (
            <section aria-labelledby="sec-quote">
              <SectionTitle id="sec-quote">Frase de la semana</SectionTitle>
              <QuoteCard quote={e.quote.text} attribution={e.quote.attribution} />
            </section>
          )}
          {e.puzzle?.available && (
            <section aria-labelledby="sec-game" className="border-2 border-rule p-4 text-center">
              <SectionTitle id="sec-game">El Palabrero del Corral</SectionTitle>
              <Gamepad2 aria-hidden className="mx-auto size-8 text-accent" />
              <p className="headline mt-1 text-2xl">¡Adivina el tilt!</p>
              <p className="mt-1 text-sm text-fg-muted">Cinco letras. Seis intentos. Cero excusas.</p>
              <Button asChild className="mt-3" variant="ink"><Link to="/juegos">Jugar ahora</Link></Button>
            </section>
          )}
        </aside>
      </div>

      <div className="rule-double my-6" />
      <section aria-label="Compartir y navegar" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ShareButtons title={`EL CORRAL TIMES N.º ${e.number}: ${e.headline}`} path={editionPath(e.slug)} />
        <div className="flex gap-2">
          {e.previous && <Button asChild variant="outline" size="sm"><Link to={editionPath(e.previous.slug)}><ArrowLeft aria-hidden />N.º {e.previous.number}</Link></Button>}
          {e.next && <Button asChild variant="outline" size="sm"><Link to={editionPath(e.next.slug)}>N.º {e.next.number}<ArrowRight aria-hidden /></Link></Button>}
          <Button asChild variant="ghost" size="sm"><Link to="/archivo">Hemeroteca</Link></Button>
        </div>
      </section>
    </div>
  );
}

export function NoEditionYet() {
  return (
    <div className="py-6 text-center">
      <NewspaperMasthead />
      <EditorialStamp tone="pending" className="mt-8">En imprenta</EditorialStamp>
      <h2 className="headline mt-4 text-4xl sm:text-5xl">La primera edición está en imprenta</h2>
      <p className="mx-auto mt-3 max-w-lg font-serif text-lg">Mientras tanto, ¿pasó algo en el gallinero? Repórtalo y nosotros hacemos el escándalo.</p>
      <Button asChild className="mt-6" size="lg"><Link to="/enviar-noticia">Enviar una noticia</Link></Button>
    </div>
  );
}
