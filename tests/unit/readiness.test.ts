import { describe, expect, it } from 'vitest';
import { estimatePages, evaluateReadiness, summarizeReadiness, type EditionReadinessInput } from '@shared/domain/readiness';

const base: EditionReadinessInput = {
  hasEditionNumber: true,
  publicationDate: '2026-11-13',
  mainHeadlineAssigned: true,
  approvedStories: 4,
  selectedStories: 3,
  selectedButNotApproved: 0,
  pendingReview: 0,
  quotesWithoutExactText: 0,
  unlabeledRumors: 0,
  lpSnapshotState: 'APPROVED',
  rankingState: 'FINAL',
  rankingHasDuplicatePositions: false,
  attachmentsMissing: 0,
  estimatedPages: 1,
  pastoralState: 'APPROVED',
  pastoralPassageVerified: true,
  coverArtworkApproved: true,
  puzzleState: 'READY',
};

describe('preparación editorial', () => {
  it('una edición completa puede exportarse', () => {
    expect(summarizeReadiness(evaluateReadiness(base))).toMatchObject({ blockers: 0, warnings: 0, canExport: true });
  });
  it('las secciones opcionales vacías no bloquean la exportación', () => {
    const s = summarizeReadiness(evaluateReadiness({ ...base, lpSnapshotState: 'NONE', rankingState: 'NONE' }));
    expect(s.canExport).toBe(true);
  });
  it('sin titular principal o con rumores sin etiqueta se bloquea', () => {
    expect(summarizeReadiness(evaluateReadiness({ ...base, mainHeadlineAssigned: false })).canExport).toBe(false);
    expect(summarizeReadiness(evaluateReadiness({ ...base, unlabeledRumors: 1 })).canExport).toBe(false);
    expect(summarizeReadiness(evaluateReadiness({ ...base, selectedButNotApproved: 1 })).canExport).toBe(false);
    expect(summarizeReadiness(evaluateReadiness({ ...base, rankingHasDuplicatePositions: true })).canExport).toBe(false);
  });
  it('LP pendiente y Página 2 son advertencias, no bloqueos', () => {
    const s = summarizeReadiness(evaluateReadiness({ ...base, lpSnapshotState: 'PENDING_APPROVAL', estimatedPages: 2 }));
    expect(s).toMatchObject({ canExport: true, warnings: 2 });
  });
  it('la columna pastoral es opcional, pero nunca se publica sin aprobación ni verificación', () => {
    expect(summarizeReadiness(evaluateReadiness({ ...base, pastoralState: 'NONE', pastoralPassageVerified: false })).canExport).toBe(true);
    expect(summarizeReadiness(evaluateReadiness({ ...base, pastoralState: 'DRAFT' })).canExport).toBe(false);
    expect(summarizeReadiness(evaluateReadiness({ ...base, pastoralState: 'APPROVED', pastoralPassageVerified: false })).canExport).toBe(false);
  });
  it('portada pendiente y palabrero sin activar son avisos; sin palabrero es informativo', () => {
    const s = summarizeReadiness(evaluateReadiness({ ...base, coverArtworkApproved: false, puzzleState: 'DRAFT' }));
    expect(s).toMatchObject({ canExport: true, warnings: 2 });
    expect(evaluateReadiness({ ...base, puzzleState: 'NONE' }).find((c) => c.id === 'puzzle')?.level).toBe('info');
  });
  it('estima páginas según el contenido', () => {
    expect(estimatePages({})).toBe(1);
    expect(estimatePages({ main: 1, secondary: 2, lp: 1 })).toBe(1);
    expect(estimatePages({ main: 1, secondary: 4, brief: 3, lp: 1, ranking: 1 })).toBe(2);
  });
});
