/**
 * ⚠️ CONTENIDO DE DEMOSTRACIÓN — FICTICIO ⚠️
 * Personajes, eventos, frases y cifras INVENTADOS para probar el diseño.
 * Solo se sirve cuando el Worker tiene DEMO_CONTENT="true" (local / preview explícito).
 * No usa los Riot IDs reales del registro para no atribuir estadísticas falsas a personas reales.
 */
import { p, t, type ArticleDoc } from '@shared/domain/article-doc';
import { readingMinutes } from '@shared/domain/article-doc';
import type { PublicArticle, PublicArticleSummary, PublicArtwork, PublicEdition } from '@shared/domain/public-content';
import type { PublicContentSource } from '../content/source';

const pending = (role: PublicArtwork['role'], alt: string, w: number, h: number, caption?: string): PublicArtwork => ({
  role,
  src: null,
  width: w,
  height: h,
  alt,
  source: 'CHATGPT',
  ...(caption ? { caption } : {}),
});

const leadBody: ArticleDoc = {
  type: 'doc',
  content: [
    p(t('SANTO DOMINGO DEL GALLINERO.', { type: 'bold' }), ' — En un hecho sin precedentes (y totalmente ficticio), el jugador de demostración Gallo Ejemplar abandonó su serie de promoción en el minuto 12 alegando que “el pica pollo se enfría y el LP no”.'),
    p('Fuentes cercanas a la cocina confirmaron que el pedido llegó a tiempo. Fuentes cercanas a la grieta confirmaron que el nexo no.'),
    { type: 'quote', attrs: { text: 'Esto es una frase de demostración, mano. Nadie la dijo de verdad.', attribution: 'Gallo Ejemplar (personaje ficticio)' } },
    { type: 'heading', attrs: { level: 2 }, content: [t('Reacción del mercado')] },
    p('La Bolsa LP de demostración registró una caída simbólica. Los analistas de Wall Street del Tilt recomiendan “comer antes de la promo”.'),
    { type: 'callout', attrs: { tone: 'info', title: 'Nota de la redacción' }, content: [t('Este artículo es contenido de muestra para probar el diseño del periódico digital.')] },
    { type: 'table', attrs: { caption: 'Cronología ficticia' }, header: ['Minuto', 'Evento'], rows: [['0', 'Inicio de la promo'], ['11', 'Llega el delivery'], ['12', 'Abandono histórico']] },
    { type: 'bulletList', content: [[t('Promo: perdida (demo).')], [t('Pica pollo: rescatado (demo).')], [t('Dignidad: en revisión editorial.')]] },
    p('Más información en el ', t('reglamento ficticio', { type: 'link', attrs: { href: 'https://example.com/' } }), '.'),
  ],
};

const simpleBody = (...paras: string[]): ArticleDoc => ({ type: 'doc', content: paras.map((x) => p(x)) });

function toSummary(a: PublicArticle): PublicArticleSummary {
  const { slug, title, subtitle, category, placement, summary, hero, credit, readingMinutes: rm } = a;
  return { slug, title, subtitle, category, placement, summary, hero, credit, readingMinutes: rm };
}

function article(a: Omit<PublicArticle, 'readingMinutes' | 'publishedAt'>, publishedAt: string): PublicArticle {
  return { ...a, readingMinutes: readingMinutes(a.body), publishedAt };
}

const E2_DATE = '2026-11-13';
const E2_PUB = '2026-11-13T22:00:00Z';
const e2Articles: PublicArticle[] = [
  article(
    {
      slug: 'crisis-alimentaria-en-la-grieta',
      title: 'CRISIS ALIMENTARIA EN LA GRIETA: PROMO SACRIFICADA POR UN PICA POLLO',
      subtitle: 'Un jugador de demostración elige el delivery sobre el ascenso. La comunidad, dividida.',
      category: 'RANKED',
      placement: 'LEAD',
      summary: 'Contenido ficticio de muestra: un abandono histórico en plena serie de promoción.',
      hero: pending('ARTICLE_HERO', 'Espacio para la ilustración oficial del artículo principal', 1536, 1024, 'Ilustración oficial pendiente (ChatGPT).'),
      credit: 'Redacción de EL CORRAL TIMES',
      body: leadBody,
    },
    E2_PUB,
  ),
  article(
    {
      slug: 'el-nexo-que-nadie-defendio',
      title: 'EL NEXO QUE NADIE DEFENDIÓ',
      subtitle: 'Investigación especial (de muestra) sobre la jugada más silenciosa de la semana.',
      category: 'INVESTIGACION',
      placement: 'SECONDARY',
      summary: 'Cinco jugadores ficticios, cero defensores y un base que cayó en silencio.',
      hero: null,
      credit: 'Unidad de Investigación (demo)',
      body: simpleBody('Texto de demostración. La unidad de investigación revisó las repeticiones imaginarias cuadro por cuadro.', 'Conclusión preliminar: todos pensaron que otro iba a defender.'),
    },
    E2_PUB,
  ),
  article(
    {
      slug: 'torneo-pokemon-de-bolsillo',
      title: 'TORNEO POKÉMON DE BOLSILLO TERMINA EN EMPATE TÉCNICO',
      subtitle: 'Dos entrenadores de demostración se niegan a aceptar la derrota.',
      category: 'POKEMON',
      placement: 'SECONDARY',
      summary: 'Un torneo ficticio con más reclamos que combates.',
      hero: null,
      credit: 'Corresponsal Pokémon (demo)',
      body: simpleBody('Contenido de demostración para la sección de Pokémon.', 'El árbitro ficticio sigue revisando el VAR del Pokédex.'),
    },
    E2_PUB,
  ),
  article(
    {
      slug: 'tribunal-del-discord',
      title: 'EL TRIBUNAL DEL DISCORD SESIONA DE MADRUGADA',
      subtitle: 'Opinión: ¿por qué todo drama importante ocurre a las 3:00 a. m.?',
      category: 'OPINION',
      placement: 'SECONDARY',
      summary: 'Columna de opinión de muestra.',
      hero: null,
      credit: 'Columnista invitado (demo)',
      body: simpleBody('Columna de demostración.'),
    },
    E2_PUB,
  ),
];

const demoLp: PublicEdition['lp'] = {
  periodStart: '2026-11-07',
  periodEnd: '2026-11-13',
  collectedAt: '2026-11-13T20:00:00Z',
  source: 'Importación manual (demo)',
  method: 'DPM_LIKE',
  commentary: 'Mercado volátil (ficticio). Se recomienda no operar después de medianoche.',
  entries: [
    { player: 'Gallo Ejemplar#DEMO', queue: 'RANKED_SOLO_5x5', startRank: 'ORO II 40', endRank: 'ORO I 12', lpChange: 72, games: 9, quality: 'COMPLETE' },
    { player: 'Pollo de Prueba#DEMO', queue: 'RANKED_SOLO_5x5', startRank: 'PLATA I 80', endRank: 'PLATA II 31', lpChange: -49, games: 11, quality: 'COMPLETE' },
    { player: 'Gallina Ficticia#DEMO', queue: 'RANKED_SOLO_5x5', startRank: 'PLATINO IV 20', endRank: 'PLATINO IV 54', lpChange: 34, games: 6, quality: 'COMPLETE' },
    { player: 'Pavo Simulado#DEMO', queue: 'RANKED_SOLO_5x5', startRank: 'BRONCE I 10', endRank: 'HIERRO I 70', lpChange: -60, games: 14, quality: 'COMPLETE' },
    { player: 'Gallo Ejemplar#DEMO', queue: 'RANKED_FLEX_SR', startRank: null, endRank: 'PLATINO IV 5', lpChange: 18, games: null, quality: 'SOURCE_PROVIDED' },
    { player: 'Pollito Muestra#DEMO', queue: 'RANKED_FLEX_SR', startRank: 'ORO III 50', endRank: 'ORO III 41', lpChange: -9, games: 3, quality: 'COMPLETE' },
    { player: 'Guineo Demo#DEMO', queue: 'RANKED_SOLO_5x5', startRank: null, endRank: null, lpChange: null, games: null, quality: 'MISSING' },
  ],
  history: [
    { editionNumber: 1, periodEnd: '2026-11-06', total: -35 },
    { editionNumber: 2, periodEnd: '2026-11-13', total: 6 },
  ],
};

const e2: PublicEdition = {
  slug: `edicion-002-${E2_DATE}`,
  number: 2,
  publicationDate: E2_DATE,
  timeZone: 'America/Santo_Domingo',
  headline: e2Articles[0]!.title,
  dek: 'Edición de demostración con contenido ficticio para probar el periódico digital.',
  cover: pending('COVER', 'Espacio para la portada oficial de la edición', 1920, 1080, 'Portada oficial pendiente — se crea con ChatGPT y se aprueba en HQ.'),
  breaking: 'ÚLTIMA HORA (demo): la redacción confirma que este periódico es una vista previa con datos ficticios.',
  articles: e2Articles.map(toSummary),
  lp: demoLp,
  ranking: [
    { position: 1, previousPosition: 3, participant: 'Gallo Ejemplar (demo)', commentary: 'Subió pese al pica pollo. Ciencia inexplicable.' },
    { position: 2, previousPosition: 1, participant: 'Gallina Ficticia (demo)', commentary: 'Cae un puesto, mantiene la dignidad.' },
    { position: 3, previousPosition: null, participant: 'Pollito Muestra (demo)', commentary: 'Nueva entrada en el ranking.' },
    { position: 4, previousPosition: 2, participant: 'Pavo Simulado (demo)', commentary: 'Semana para olvidar.' },
  ],
  quote: { text: 'Esto es una frase de demostración, mano. Nadie la dijo de verdad.', attribution: 'Gallo Ejemplar (personaje ficticio)', context: 'Durante la promo ficticia.' },
  meme: { title: 'El meme de la semana (demo)', artwork: pending('MEME', 'Espacio para el meme oficial de la semana', 1080, 1080, 'Meme oficial pendiente.') },
  rumors: [{ title: '¿Compra nocturna de skins?', body: 'Rumor de demostración. La redacción no ha podido confirmar nada.' }],
  briefs: ['Breve de demo: se reporta lag selectivo solo en partidas perdidas.', 'Breve de demo: alguien juró no volver a jugar ARAM. Duró 40 minutos.'],
  puzzle: { id: 'demo-puzzle-002', available: true },
  previous: { slug: 'edicion-001-2026-11-06', number: 1 },
  next: null,
  demo: true,
};

const e1Articles: PublicArticle[] = [
  article(
    {
      slug: 'inauguracion-de-la-redaccion',
      title: 'INAUGURAN LA REDACCIÓN DIGITAL DEL GALLINERO',
      subtitle: 'Primera edición de muestra del periódico digital.',
      category: 'COMUNIDAD',
      placement: 'LEAD',
      summary: 'Edición ficticia anterior para probar la navegación del archivo.',
      hero: null,
      credit: 'Redacción de EL CORRAL TIMES',
      body: simpleBody('Contenido de demostración de una edición anterior.'),
    },
    '2026-11-06T22:00:00Z',
  ),
];

const e1: PublicEdition = {
  ...e2,
  slug: 'edicion-001-2026-11-06',
  number: 1,
  publicationDate: '2026-11-06',
  headline: e1Articles[0]!.title,
  dek: 'Edición de demostración anterior.',
  cover: null,
  breaking: null,
  articles: e1Articles.map(toSummary),
  lp: null,
  ranking: null,
  quote: null,
  meme: null,
  rumors: [],
  briefs: [],
  puzzle: null,
  previous: null,
  next: { slug: e2.slug, number: 2 },
};

const EDITIONS = [e2, e1];
const ARTICLES = new Map<string, PublicArticle[]>([
  [e2.slug, e2Articles],
  [e1.slug, e1Articles],
]);

export const demoContentSource: PublicContentSource = {
  listEditions: async () => EDITIONS.map(({ slug, number, publicationDate, headline, dek, cover }) => ({ slug, number, publicationDate, headline, dek, cover })),
  latestEdition: async () => structuredClone(EDITIONS[0]!),
  edition: async (slug) => {
    const e = EDITIONS.find((x) => x.slug === slug);
    return e ? structuredClone(e) : null;
  },
  article: async (editionSlug, articleSlug) => {
    const e = EDITIONS.find((x) => x.slug === editionSlug);
    const a = ARTICLES.get(editionSlug)?.find((x) => x.slug === articleSlug);
    return e && a ? structuredClone({ edition: e, article: a }) : null;
  },
};
