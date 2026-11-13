import type { PublicArticle, PublicEdition, PublicEditionSummary } from '@shared/domain/public-content';

/**
 * Fuente de contenido PÚBLICO. En producción (Fase 5) lee snapshots congelados de ediciones
 * PUBLICADAS en Supabase. Nunca devuelve borradores: la interfaz no tiene forma de pedirlos.
 */
export interface PublicContentSource {
  listEditions(): Promise<PublicEditionSummary[]>;
  latestEdition(): Promise<PublicEdition | null>;
  edition(slug: string): Promise<PublicEdition | null>;
  article(editionSlug: string, articleSlug: string): Promise<{ edition: PublicEdition; article: PublicArticle } | null>;
}

/** Fuente vacía: lo que se usa sin base de datos conectada y sin modo demo. No inventa nada. */
export const emptyContentSource: PublicContentSource = {
  listEditions: async () => [],
  latestEdition: async () => null,
  edition: async () => null,
  article: async () => null,
};
