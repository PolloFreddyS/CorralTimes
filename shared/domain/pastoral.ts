import { findTranslation, formatBibleReference, parseBibleReference, REFERENCE_ERROR_LABELS, verseCount, type BibleReference } from './bible';

/**
 * LA VOZ DEL PASTOR — columna pastoral semanal.
 * Se modela como un ARTÍCULO de categoría PASTORAL (mismo flujo de aprobación, versiones y publicación)
 * con un bloque de detalles estructurados. No hay un segundo sistema de contenido.
 */

export const PASTORAL_SECTION = {
  name: 'LA VOZ DEL PASTOR',
  subtitle: 'Una pausa entre el caos y el tilt',
  path: '/la-voz-del-pastor',
} as const;

/** QUOTATION = texto bíblico literal de la traducción indicada. PARAPHRASE = resumen en palabras propias (nunca entre comillas). */
export type PassageMode = 'QUOTATION' | 'PARAPHRASE';

/** Declaración obligatoria: la invitación a orar no expone peticiones privadas sin permiso. */
export type PrayerPrivacy = 'NO_PRIVATE_REQUESTS' | 'CONSENT_RECORDED';

export interface PastoralDetails {
  reference: BibleReference;
  translationCode: string;
  passageMode: PassageMode;
  passageText: string;
  theme: string;
  applications: string[];
  prayerInvitation: string | null;
  prayerPrivacy: PrayerPrivacy;
  /** Verificación humana del texto contra la traducción citada. */
  verification: { verified: boolean; verifiedBy: string | null; verifiedAt: string | null; source: string | null };
}

export const PASTORAL_THEMES = ['Fortaleza', 'Esperanza', 'Paz', 'Perdón', 'Gratitud', 'Fe', 'Amor', 'Comunidad', 'Paciencia', 'Propósito'] as const;

export interface PastoralDraft {
  referenceInput: string;
  translationCode: string;
  passageMode: PassageMode;
  passageText: string;
  title: string;
  subtitle: string;
  theme: string;
  reflection: string;
  applications: string[];
  prayerInvitation: string;
  prayerPrivacy: PrayerPrivacy | null;
  verified: boolean;
  verificationSource: string;
}

export interface PastoralIssue {
  field: keyof PastoralDraft;
  level: 'blocker' | 'warning';
  message: string;
}

const QUOTE_CHARS = /[“”"«»]/;

/**
 * Reglas editoriales de la columna. Bloqueantes = no se puede aprobar.
 * Nada de esto "corrige" texto bíblico: solo exige que una persona lo verifique.
 */
export function validatePastoralDraft(d: PastoralDraft): { issues: PastoralIssue[]; reference: BibleReference | null } {
  const issues: PastoralIssue[] = [];
  const add = (field: keyof PastoralDraft, level: PastoralIssue['level'], message: string) => issues.push({ field, level, message });

  const parsed = parseBibleReference(d.referenceInput);
  const reference = parsed.ok ? parsed.ref : null;
  if (!parsed.ok) add('referenceInput', 'blocker', REFERENCE_ERROR_LABELS[parsed.error]);

  const tr = findTranslation(d.translationCode);
  if (!tr) add('translationCode', 'blocker', 'Indica una traducción bíblica registrada.');

  const text = d.passageText.trim();
  if (!text) add('passageText', 'blocker', d.passageMode === 'QUOTATION' ? 'Copia el texto literal del pasaje.' : 'Escribe la paráfrasis del pasaje.');
  if (d.passageMode === 'PARAPHRASE' && QUOTE_CHARS.test(text)) {
    add('passageText', 'blocker', 'Una paráfrasis no lleva comillas: no debe presentarse como cita textual.');
  }
  if (d.passageMode === 'QUOTATION') {
    if (!d.verified) add('verified', 'blocker', 'Verifica el texto contra la traducción indicada antes de aprobar.');
    if (d.verified && !d.verificationSource.trim()) add('verificationSource', 'blocker', 'Indica contra qué fuente verificaste el texto.');
    if (reference && tr && verseCount(reference) > tr.maxQuotedVerses) {
      add('passageText', 'blocker', `${tr.name} tiene derechos de autor: cita como máximo ${tr.maxQuotedVerses} versículos por columna.`);
    }
  }

  if (d.title.trim().length < 3) add('title', 'blocker', 'Falta el título de la columna.');
  if (d.reflection.trim().length < 80) add('reflection', 'blocker', 'La reflexión es demasiado corta (mínimo 80 caracteres).');
  if (!d.theme.trim()) add('theme', 'warning', 'Asigna un tema para el archivo.');
  if (d.applications.filter((a) => a.trim()).length === 0) add('applications', 'warning', 'Añade al menos una aplicación práctica.');
  if (d.prayerInvitation.trim() && !d.prayerPrivacy) {
    add('prayerPrivacy', 'blocker', 'Confirma que la invitación a orar no expone peticiones privadas sin permiso.');
  }
  return { issues, reference };
}

export const canApprovePastoral = (issues: readonly PastoralIssue[]) => issues.every((i) => i.level !== 'blocker');

export function pastoralReferenceLabel(p: Pick<PastoralDetails, 'reference' | 'translationCode'>): string {
  return `${formatBibleReference(p.reference)} (${p.translationCode})`;
}

/**
 * Convierte los detalles internos al contrato público. Falla si una CITA no está verificada:
 * ninguna capa puede publicar texto bíblico sin verificación humana.
 */
export function toPublicPastoralDetails(d: PastoralDetails): import('./public-content').PublicPastoralDetails {
  const tr = findTranslation(d.translationCode);
  if (!tr) throw new Error('PASTORAL_UNKNOWN_TRANSLATION');
  if (d.passageMode === 'QUOTATION' && !d.verification.verified) throw new Error('PASTORAL_PASSAGE_NOT_VERIFIED');
  const { verification: _v, prayerPrivacy: _p, ...rest } = d;
  void _v;
  void _p;
  return {
    ...rest,
    referenceLabel: pastoralReferenceLabel(d),
    translationName: tr.name,
    translationNotice:
      tr.license === 'PUBLIC_DOMAIN'
        ? `Texto bíblico: ${tr.name} (dominio público).`
        : `Texto bíblico tomado de la ${tr.name}. © ${tr.holder}. Usado con fines devocionales; todos los derechos reservados.`,
  };
}
