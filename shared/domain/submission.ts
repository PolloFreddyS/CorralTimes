/**
 * Reglas de negocio de los reportes enviados desde CORRAL PRESS PASS.
 * Compartidas entre el frontend (validación en cliente) y el Worker (validación en servidor).
 * El servidor SIEMPRE vuelve a validar: la validación del cliente es solo ergonomía.
 */

export const SUBMISSION_CATEGORIES = [
  'NOTICIA',
  'RUMOR',
  'MEME',
  'FRASE_LEGENDARIA',
  'LOGRO',
  'DRAMA_RANKED',
  'OTRO',
] as const;
export type SubmissionCategory = (typeof SUBMISSION_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<SubmissionCategory, string> = {
  NOTICIA: 'Noticia',
  RUMOR: 'Rumor',
  MEME: 'Meme',
  FRASE_LEGENDARIA: 'Frase legendaria',
  LOGRO: 'Logro o récord',
  DRAMA_RANKED: 'Drama del ranked',
  OTRO: 'Otro acontecimiento',
};

export const SUBMISSION_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'NEEDS_INFORMATION',
  'APPROVED',
  'REJECTED',
  'ARCHIVED',
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  SUBMITTED: 'Recibido',
  UNDER_REVIEW: 'En revisión',
  NEEDS_INFORMATION: 'Falta información',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  ARCHIVED: 'Archivado',
};

/**
 * Transiciones permitidas del ciclo de vida del REPORTE (evidencia).
 * Aprobar un reporte NO lo publica: el artículo editorial tiene su propio ciclo (ver workflow.ts).
 */
const TRANSITIONS: Record<SubmissionStatus, readonly SubmissionStatus[]> = {
  SUBMITTED: ['UNDER_REVIEW', 'REJECTED', 'ARCHIVED'],
  UNDER_REVIEW: ['NEEDS_INFORMATION', 'APPROVED', 'REJECTED', 'ARCHIVED'],
  NEEDS_INFORMATION: ['UNDER_REVIEW', 'REJECTED', 'ARCHIVED'],
  APPROVED: ['UNDER_REVIEW', 'ARCHIVED'],
  REJECTED: ['UNDER_REVIEW', 'ARCHIVED'],
  ARCHIVED: [],
};

export function canTransition(from: SubmissionStatus, to: SubmissionStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function allowedTransitions(from: SubmissionStatus): readonly SubmissionStatus[] {
  return TRANSITIONS[from];
}

export const SUBMISSION_LIMITS = {
  reporterAlias: { min: 2, max: 40 },
  headline: { min: 5, max: 140 },
  description: { min: 20, max: 4000 },
  peopleInvolved: { max: 300 },
  quote: { max: 600 },
  source: { max: 500 },
  notes: { max: 1000 },
  /** Tamaño máximo de imagen de evidencia en bytes (5 MB). */
  imageMaxBytes: 5 * 1024 * 1024,
  imageMimeTypes: ['image/png', 'image/jpeg', 'image/webp'] as const,
  /** Cuántos días hacia atrás se acepta como fecha del evento. */
  eventDateMaxAgeDays: 60,
} as const;

/** Elimina caracteres de control (excepto saltos de línea y tabulaciones) y normaliza Unicode. */
export function normalizeText(value: string): string {
  return (
    value
      .normalize('NFC')
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, '')
      .replace(/\r\n?/g, '\n')
      .trim()
  );
}

export function daysBetween(fromIso: string, toIso: string): number {
  const ms = Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/** Verifica la "firma" (magic bytes) del archivo; no confiamos en la extensión ni en el MIME declarado. */
export function sniffImageMime(bytes: Uint8Array): (typeof SUBMISSION_LIMITS.imageMimeTypes)[number] | null {
  const b = bytes;
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) {
    return 'image/png';
  }
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}
