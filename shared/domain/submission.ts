import { z } from 'zod';

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
  'NEEDS_INFO',
  'APPROVED',
  'REJECTED',
  'ARCHIVED',
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  SUBMITTED: 'Recibido',
  UNDER_REVIEW: 'En revisión',
  NEEDS_INFO: 'Falta información',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  ARCHIVED: 'Archivado',
};

/** Transiciones permitidas del ciclo de vida. Cualquier otra se rechaza. */
const TRANSITIONS: Record<SubmissionStatus, readonly SubmissionStatus[]> = {
  SUBMITTED: ['UNDER_REVIEW', 'REJECTED', 'ARCHIVED'],
  UNDER_REVIEW: ['NEEDS_INFO', 'APPROVED', 'REJECTED', 'ARCHIVED'],
  NEEDS_INFO: ['UNDER_REVIEW', 'REJECTED', 'ARCHIVED'],
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

const text = (min: number, max: number, label: string) =>
  z
    .string({ error: `${label} es obligatorio.` })
    .transform(normalizeText)
    .pipe(
      z
        .string()
        .min(min, `${label} debe tener al menos ${min} caracteres.`)
        .max(max, `${label} no puede pasar de ${max} caracteres.`),
    );

const optionalText = (max: number, label: string) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : normalizeText(v)))
    .pipe(
      z
        .string()
        .max(max, `${label} no puede pasar de ${max} caracteres.`)
        .optional()
        .transform((v) => (v ? v : undefined)),
    );

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Valida la fecha del evento contra "hoy" (fecha ISO en la zona del periódico).
 * Se inyecta `today` para que la regla sea determinista y testeable.
 */
export function buildSubmissionSchema(today: string) {
  return z
    .object({
      reporterAlias: text(SUBMISSION_LIMITS.reporterAlias.min, SUBMISSION_LIMITS.reporterAlias.max, 'Tu nombre de reportero'),
      category: z.enum(SUBMISSION_CATEGORIES, { error: 'Elige una categoría.' }),
      headline: text(SUBMISSION_LIMITS.headline.min, SUBMISSION_LIMITS.headline.max, 'El titular'),
      description: text(SUBMISSION_LIMITS.description.min, SUBMISSION_LIMITS.description.max, 'La descripción'),
      eventDate: z
        .string({ error: 'La fecha del evento es obligatoria.' })
        .regex(ISO_DATE, 'Usa el formato AAAA-MM-DD.')
        .refine((d) => !Number.isNaN(Date.parse(`${d}T00:00:00Z`)), 'Fecha inválida.')
        .refine((d) => d <= today, 'La fecha no puede estar en el futuro.')
        .refine(
          (d) => daysBetween(d, today) <= SUBMISSION_LIMITS.eventDateMaxAgeDays,
          `Solo aceptamos eventos de los últimos ${SUBMISSION_LIMITS.eventDateMaxAgeDays} días.`,
        ),
      peopleInvolved: optionalText(SUBMISSION_LIMITS.peopleInvolved.max, 'Personas involucradas'),
      exactQuote: optionalText(SUBMISSION_LIMITS.quote.max, 'La frase'),
      source: optionalText(SUBMISSION_LIMITS.source.max, 'La fuente'),
      notes: optionalText(SUBMISSION_LIMITS.notes.max, 'Las notas'),
      permissionAcknowledged: z.literal(true, {
        error: 'Debes confirmar que tienes permiso para enviar este material.',
      }),
    })
    .superRefine((value, ctx) => {
      if (value.category === 'FRASE_LEGENDARIA' && !value.exactQuote) {
        ctx.addIssue({
          code: 'custom',
          path: ['exactQuote'],
          message: 'Una frase legendaria necesita la frase exacta.',
        });
      }
    });
}

export type SubmissionInput = z.input<ReturnType<typeof buildSubmissionSchema>>;
export type SubmissionPayload = z.output<ReturnType<typeof buildSubmissionSchema>>;

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
