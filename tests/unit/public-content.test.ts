import { describe, expect, it } from 'vitest';
import { editionSlug, isValidSlug, slugify } from '@shared/domain/public-content';
import { canTransitionArticle, canTransitionEdition } from '@shared/domain/workflow';

describe('slugs y URLs permanentes', () => {
  it('genera slugs de edición estables', () => {
    expect(editionSlug(12, '2026-11-13')).toBe('edicion-012-2026-11-13');
    expect(isValidSlug(editionSlug(12, '2026-11-13'))).toBe(true);
  });
  it('slugify elimina acentos y símbolos', () => {
    expect(slugify('¡CRISIS en la Grieta: ñame & Pokémon!')).toBe('crisis-en-la-grieta-name-pokemon');
  });
  it('rechaza slugs con rutas o caracteres raros', () => {
    for (const bad of ['../x', 'a/b', 'A-B', 'a--b', '-a', 'a b', '%2e%2e']) expect(isValidSlug(bad), bad).toBe(false);
  });
});

describe('flujos editoriales v2', () => {
  it('un artículo no se publica por sí solo: solo vía la edición', () => {
    expect(canTransitionArticle('READY_FOR_PUBLICATION', 'PUBLISHED')).toBe(false);
    expect(canTransitionArticle('EDITORIAL_DRAFT', 'READY_FOR_LAYOUT')).toBe(true);
  });
  it('una edición no salta de borrador a publicada', () => {
    expect(canTransitionEdition('DRAFT', 'PUBLISHED')).toBe(false);
    expect(canTransitionEdition('READY', 'PUBLISHED')).toBe(true);
    expect(canTransitionEdition('PUBLISHED', 'READY')).toBe(true); // despublicación de emergencia
    expect(canTransitionEdition('ARCHIVED', 'PUBLISHED')).toBe(false);
  });
});
