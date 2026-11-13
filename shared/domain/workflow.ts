/**
 * Ciclos de vida editoriales (v2). Tres máquinas de estado separadas:
 *  - Reporte (evidencia original)  → submission.ts
 *  - Artículo (texto satírico)     → ARTICLE_*
 *  - Edición (paquete semanal)     → EDITION_*
 * Ningún estado avanza solo: toda transición es una acción explícita de un administrador.
 */

export const ARTICLE_STATUSES = ['EDITORIAL_DRAFT', 'READY_FOR_LAYOUT', 'READY_FOR_PUBLICATION', 'PUBLISHED', 'ARCHIVED'] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];
export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  EDITORIAL_DRAFT: 'Borrador editorial',
  READY_FOR_LAYOUT: 'Listo para diagramar',
  READY_FOR_PUBLICATION: 'Listo para publicar',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Archivado',
};
const ARTICLE_TRANSITIONS: Record<ArticleStatus, readonly ArticleStatus[]> = {
  EDITORIAL_DRAFT: ['READY_FOR_LAYOUT', 'ARCHIVED'],
  READY_FOR_LAYOUT: ['EDITORIAL_DRAFT', 'READY_FOR_PUBLICATION', 'ARCHIVED'],
  // PUBLISHED solo se alcanza publicando la EDICIÓN completa (snapshot), nunca artículo por artículo.
  READY_FOR_PUBLICATION: ['READY_FOR_LAYOUT', 'EDITORIAL_DRAFT'],
  PUBLISHED: ['ARCHIVED'],
  ARCHIVED: [],
};
export const canTransitionArticle = (from: ArticleStatus, to: ArticleStatus) => ARTICLE_TRANSITIONS[from].includes(to);

export const EDITION_STATUSES = ['DRAFT', 'IN_REVIEW', 'READY', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'] as const;
export type EditionStatus = (typeof EDITION_STATUSES)[number];
export const EDITION_STATUS_LABELS: Record<EditionStatus, string> = {
  DRAFT: 'Borrador',
  IN_REVIEW: 'En revisión',
  READY: 'Lista',
  SCHEDULED: 'Programada',
  PUBLISHED: 'Publicada',
  ARCHIVED: 'Archivada',
};
const EDITION_TRANSITIONS: Record<EditionStatus, readonly EditionStatus[]> = {
  DRAFT: ['IN_REVIEW'],
  IN_REVIEW: ['DRAFT', 'READY'],
  READY: ['IN_REVIEW', 'SCHEDULED', 'PUBLISHED'],
  SCHEDULED: ['READY', 'PUBLISHED'],
  // Despublicar de emergencia vuelve a READY y queda auditado; editar algo publicado exige una revisión nueva.
  PUBLISHED: ['READY', 'ARCHIVED'],
  ARCHIVED: [],
};
export const canTransitionEdition = (from: EditionStatus, to: EditionStatus) => EDITION_TRANSITIONS[from].includes(to);

/** Lo único que el público puede ver. */
export const PUBLICLY_VISIBLE_EDITION_STATUSES: readonly EditionStatus[] = ['PUBLISHED', 'ARCHIVED'];

export const MEDIA_ROLES = ['COVER', 'ARTICLE_HERO', 'MEME', 'SOCIAL_PREVIEW', 'SECTION_BANNER', 'CHARACTER_ASSET', 'PASTORAL_ILLUSTRATION'] as const;
export type MediaRole = (typeof MEDIA_ROLES)[number];
export const MEDIA_ROLE_SPECS: Record<MediaRole, { label: string; aspect: string; width: number; height: number }> = {
  COVER: { label: 'Portada', aspect: '16:9', width: 1920, height: 1080 },
  ARTICLE_HERO: { label: 'Ilustración de artículo', aspect: '3:2', width: 1536, height: 1024 },
  MEME: { label: 'Meme', aspect: '1:1', width: 1080, height: 1080 },
  SOCIAL_PREVIEW: { label: 'Vista previa WhatsApp / Open Graph', aspect: '1.91:1', width: 1200, height: 630 },
  SECTION_BANNER: { label: 'Banner de sección', aspect: '4:1', width: 1600, height: 400 },
  CHARACTER_ASSET: { label: 'Personaje', aspect: '1:1', width: 1024, height: 1024 },
  PASTORAL_ILLUSTRATION: { label: 'Ilustración pastoral', aspect: '3:2', width: 1536, height: 1024 },
};

export type ArtworkSource = 'CHATGPT' | 'OPENAI_API' | 'UPLOAD';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
