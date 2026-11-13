/**
 * Reglas de "preparación editorial". Toda señal de preparación que muestre la UI
 * se deriva de aquí — nunca de porcentajes inventados.
 */

export type CheckLevel = 'ok' | 'warning' | 'blocker' | 'info';

export interface ReadinessCheck {
  id: string;
  label: string;
  level: CheckLevel;
  detail: string;
}

export type LpSnapshotState = 'NONE' | 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'FROZEN';
export type RankingState = 'NONE' | 'DRAFT' | 'FINAL';
/** Columna pastoral: opcional, pero si está en la edición debe estar aprobada y con pasaje verificado. */
export type PastoralState = 'NONE' | 'DRAFT' | 'APPROVED';

export interface EditionReadinessInput {
  hasEditionNumber: boolean;
  publicationDate: string | null;
  mainHeadlineAssigned: boolean;
  approvedStories: number;
  selectedStories: number;
  /** Historias asignadas que no están APROBADAS (inconsistencia material). */
  selectedButNotApproved: number;
  pendingReview: number;
  quotesWithoutExactText: number;
  unlabeledRumors: number;
  lpSnapshotState: LpSnapshotState;
  rankingState: RankingState;
  rankingHasDuplicatePositions: boolean;
  attachmentsMissing: number;
  estimatedPages: number;
  pastoralState: PastoralState;
  pastoralPassageVerified: boolean;
}

export function evaluateReadiness(e: EditionReadinessInput): ReadinessCheck[] {
  const checks: ReadinessCheck[] = [];
  const push = (id: string, label: string, level: CheckLevel, detail: string) =>
    checks.push({ id, label, level, detail });

  push(
    'identity',
    'Identidad de la edición',
    e.hasEditionNumber && e.publicationDate ? 'ok' : 'blocker',
    e.hasEditionNumber && e.publicationDate ? 'Número y fecha definidos.' : 'Falta número de edición o fecha de publicación.',
  );
  push(
    'main-headline',
    'Titular de portada',
    e.mainHeadlineAssigned ? 'ok' : 'blocker',
    e.mainHeadlineAssigned ? 'Hay historia principal asignada.' : 'Asigna una historia aprobada como titular principal.',
  );
  push(
    'selected',
    'Historias seleccionadas',
    e.selectedStories > 0 ? 'ok' : 'blocker',
    `${e.selectedStories} seleccionadas de ${e.approvedStories} aprobadas.`,
  );
  if (e.selectedButNotApproved > 0) {
    push('not-approved', 'Historias sin aprobar en la edición', 'blocker', `${e.selectedButNotApproved} asignadas sin aprobación editorial.`);
  }
  push(
    'pending',
    'Buzón pendiente',
    e.pendingReview > 0 ? 'warning' : 'ok',
    e.pendingReview > 0 ? `${e.pendingReview} reportes sin revisar.` : 'Buzón al día.',
  );
  if (e.quotesWithoutExactText > 0) {
    push('quotes', 'Frases sin texto exacto', 'warning', `${e.quotesWithoutExactText} frases no tienen el texto original.`);
  }
  if (e.unlabeledRumors > 0) {
    push('rumors', 'Rumores sin etiqueta', 'blocker', `${e.unlabeledRumors} rumores no están marcados como no verificados.`);
  }
  const lpLevel: CheckLevel =
    e.lpSnapshotState === 'APPROVED' || e.lpSnapshotState === 'FROZEN'
      ? 'ok'
      : e.lpSnapshotState === 'NONE'
        ? 'info'
        : 'warning';
  push('lp', 'Bolsa LP', lpLevel, {
    NONE: 'Sin reporte LP esta semana (sección opcional).',
    DRAFT: 'Reporte LP en borrador.',
    PENDING_APPROVAL: 'Reporte LP pendiente de validación.',
    APPROVED: 'Reporte LP aprobado.',
    FROZEN: 'Reporte LP congelado.',
  }[e.lpSnapshotState]);
  const rankLevel: CheckLevel = e.rankingHasDuplicatePositions
    ? 'blocker'
    : e.rankingState === 'FINAL'
      ? 'ok'
      : e.rankingState === 'NONE'
        ? 'info'
        : 'warning';
  push(
    'ranking',
    'Power Ranking',
    rankLevel,
    e.rankingHasDuplicatePositions
      ? 'Hay posiciones duplicadas.'
      : { NONE: 'Sin Power Ranking esta semana (sección opcional).', DRAFT: 'Ranking en borrador.', FINAL: 'Ranking final.' }[e.rankingState],
  );
  if (e.pastoralState === 'NONE') {
    push('pastoral', 'La Voz del Pastor', 'info', 'Sin columna pastoral esta semana (sección opcional).');
  } else if (e.pastoralState === 'DRAFT') {
    push('pastoral', 'La Voz del Pastor', 'blocker', 'La columna pastoral está en la edición pero no ha sido aprobada.');
  } else if (!e.pastoralPassageVerified) {
    push('pastoral', 'La Voz del Pastor', 'blocker', 'El pasaje bíblico no ha sido verificado contra su traducción.');
  } else {
    push('pastoral', 'La Voz del Pastor', 'ok', 'Columna aprobada y pasaje verificado.');
  }
  if (e.attachmentsMissing > 0) {
    push('attachments', 'Adjuntos', 'warning', `${e.attachmentsMissing} adjuntos no están disponibles.`);
  }
  if (e.estimatedPages > 1) {
    push('pages', 'Espacio', 'warning', 'El contenido probablemente requiera Página 2.');
  }
  return checks;
}

export function summarizeReadiness(checks: readonly ReadinessCheck[]) {
  return {
    blockers: checks.filter((c) => c.level === 'blocker').length,
    warnings: checks.filter((c) => c.level === 'warning').length,
    ok: checks.filter((c) => c.level === 'ok').length,
    total: checks.length,
    canExport: checks.every((c) => c.level !== 'blocker'),
  };
}

/** Estimación conservadora del espacio: peso por tipo de pieza contra la capacidad de una página. */
export const PAGE_CAPACITY = 12;
const WEIGHTS = { main: 4, secondary: 2, brief: 1, rumor: 1, quote: 1, meme: 2, lp: 3, ranking: 3 } as const;
export function estimatePages(counts: Partial<Record<keyof typeof WEIGHTS, number>>): number {
  const units = Object.entries(counts).reduce(
    (sum, [k, n]) => sum + (WEIGHTS[k as keyof typeof WEIGHTS] ?? 0) * (n ?? 0),
    0,
  );
  return Math.max(1, Math.ceil(units / PAGE_CAPACITY));
}
