import type { ArticleDoc } from './article-doc';
import type { PastoralDetails } from './pastoral';
import type { LpQueue, DataQuality } from './lp';
import type { ArtworkSource, MediaRole } from './workflow';

/**
 * Contrato de LECTURA PÚBLICA. Solo contiene material publicado y aprobado.
 * Nada de borradores, evidencias, alias de reporteros sin aprobar, ni IDs internos de reportes.
 */

export interface PublicArtwork {
  role: MediaRole;
  /** null = ilustración oficial pendiente (se muestra un espacio reservado, nunca una imagen inventada). */
  src: string | null;
  width: number;
  height: number;
  alt: string;
  caption?: string;
  source: ArtworkSource;
}

export type ArticleCategory = 'NOTICIA' | 'INVESTIGACION' | 'RANKED' | 'POKEMON' | 'COMUNIDAD' | 'OPINION' | 'EVENTO' | 'PASTORAL';
export const ARTICLE_CATEGORY_LABELS: Record<ArticleCategory, string> = {
  NOTICIA: 'Noticias',
  INVESTIGACION: 'Investigación',
  RANKED: 'Ranked',
  POKEMON: 'Pokémon',
  COMUNIDAD: 'Comunidad',
  OPINION: 'Opinión',
  EVENTO: 'Eventos',
  PASTORAL: 'La Voz del Pastor',
};

export type ArticlePlacement = 'LEAD' | 'SECONDARY' | 'BRIEF';

export interface PublicArticleSummary {
  slug: string;
  title: string;
  subtitle: string;
  category: ArticleCategory;
  placement: ArticlePlacement;
  summary: string;
  hero: PublicArtwork | null;
  credit: string;
  readingMinutes: number;
}

export interface PublicArticle extends PublicArticleSummary {
  body: ArticleDoc;
  publishedAt: string;
  /** Solo en artículos PASTORAL. Se publica únicamente con el pasaje verificado y la columna aprobada. */
  pastoral?: PublicPastoralDetails;
}

/** Detalles públicos de la columna pastoral (sin datos internos de verificación como quién verificó). */
export type PublicPastoralDetails = Omit<PastoralDetails, 'verification' | 'prayerPrivacy'> & { referenceLabel: string; translationName: string; translationNotice: string };

/** Avance de la columna en la portada de la edición. */
export interface PublicPastoralPreview {
  articleSlug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  details: PublicPastoralDetails;
  artwork: PublicArtwork | null;
}

/** Entrada del archivo pastoral (buscable por libro, tema y fecha). */
export interface PublicPastoralArchiveEntry {
  editionSlug: string;
  editionNumber: number;
  publicationDate: string;
  articleSlug: string;
  title: string;
  referenceLabel: string;
  bookCode: string;
  theme: string;
}

export interface PublicLpEntry {
  player: string;
  queue: LpQueue;
  startRank: string | null;
  endRank: string | null;
  lpChange: number | null;
  games: number | null;
  quality: DataQuality;
}

export interface PublicLpSnapshot {
  periodStart: string;
  periodEnd: string;
  collectedAt: string;
  source: string;
  method: 'DPM_LIKE' | 'STRICT' | 'SOURCE_PROVIDED';
  entries: PublicLpEntry[];
  /** Totales de grupo de semanas anteriores (snapshots congelados), del más viejo al más nuevo. */
  history: { editionNumber: number; periodEnd: string; total: number | null }[];
  commentary?: string;
}

export interface PublicRankingEntry {
  position: number;
  previousPosition: number | null;
  participant: string;
  commentary: string;
}

export interface PublicQuote {
  text: string;
  attribution: string;
  context?: string;
}

export interface PublicMeme {
  title: string;
  artwork: PublicArtwork;
}

export interface PublicRumor {
  title: string;
  body: string;
}

export interface PublicEditionSummary {
  slug: string;
  number: number;
  publicationDate: string;
  headline: string;
  dek: string;
  cover: PublicArtwork | null;
}

export interface PublicEdition extends PublicEditionSummary {
  timeZone: string;
  breaking: string | null;
  articles: PublicArticleSummary[];
  lp: PublicLpSnapshot | null;
  ranking: PublicRankingEntry[] | null;
  quote: PublicQuote | null;
  meme: PublicMeme | null;
  rumors: PublicRumor[];
  briefs: string[];
  puzzle: { id: string; available: boolean } | null;
  pastoral: PublicPastoralPreview | null;
  previous: { slug: string; number: number } | null;
  next: { slug: string; number: number } | null;
  /** true solo para contenido ficticio de desarrollo. La UI muestra un aviso visible. */
  demo: boolean;
}

export function editionPath(slug: string) {
  return `/ediciones/${slug}`;
}
export function articlePath(editionSlug: string, articleSlug: string) {
  return `/ediciones/${editionSlug}/${articleSlug}`;
}

/** Slug estable de edición: "edicion-012-2026-11-13". */
export function editionSlug(number: number, publicationDate: string): string {
  return `edicion-${String(number).padStart(3, '0')}-${publicationDate}`;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const isValidSlug = (s: string) => s.length <= 120 && SLUG_RE.test(s);

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}
