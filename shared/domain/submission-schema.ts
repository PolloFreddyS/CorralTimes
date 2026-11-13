import { z } from 'zod';
import { daysBetween, normalizeText, SUBMISSION_CATEGORIES, SUBMISSION_LIMITS } from './submission';

/** Esquema Zod del envío público (cliente y Worker). Separado para no cargar Zod en la portada pública. */
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

