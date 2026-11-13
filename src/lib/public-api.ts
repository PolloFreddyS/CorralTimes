import { queryOptions } from '@tanstack/react-query';
import type { PublicArticle, PublicArticleSummary, PublicEdition, PublicEditionSummary } from '@shared/domain/public-content';
import { apiFetch, ApiError } from './api';

/** Consultas públicas: siempre contra el Worker. El cliente no incluye contenido propio. */
const nullOn404 = async <T,>(p: Promise<T>): Promise<T | null> => {
  try {
    return await p;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
};

export const latestEditionQuery = queryOptions({
  queryKey: ['public', 'edition', 'latest'],
  queryFn: () => nullOn404(apiFetch<PublicEdition>('/public/editions/latest')),
});

export const editionBySlugQuery = (slug: string) =>
  queryOptions({ queryKey: ['public', 'edition', slug], queryFn: () => nullOn404(apiFetch<PublicEdition>(`/public/editions/${encodeURIComponent(slug)}`)) });

export interface ArticleResponse {
  article: PublicArticle;
  edition: { slug: string; number: number; publicationDate: string; demo: boolean };
  related: PublicArticleSummary[];
}
export const articleQuery = (edition: string, article: string) =>
  queryOptions({
    queryKey: ['public', 'article', edition, article],
    queryFn: () => nullOn404(apiFetch<ArticleResponse>(`/public/editions/${encodeURIComponent(edition)}/articles/${encodeURIComponent(article)}`)),
  });

export const editionsListQuery = queryOptions({
  queryKey: ['public', 'editions'],
  queryFn: async () => (await apiFetch<{ editions: PublicEditionSummary[] }>('/public/editions')).editions,
});
