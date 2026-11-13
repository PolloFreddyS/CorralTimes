import { describe, expect, it } from 'vitest';
import { canApprovePastoral, toPublicPastoralDetails, validatePastoralDraft, type PastoralDetails, type PastoralDraft } from '@shared/domain/pastoral';

const ok: PastoralDraft = {
  referenceInput: 'Filipenses 4:13',
  translationCode: 'RVR1909',
  passageMode: 'QUOTATION',
  passageText: 'Todo lo puedo en Cristo que me fortalece.',
  title: 'Título',
  subtitle: '',
  theme: 'Fortaleza',
  reflection: 'r'.repeat(100),
  applications: ['Una aplicación'],
  prayerInvitation: '',
  prayerPrivacy: null,
  verified: true,
  verificationSource: 'Biblia impresa',
};
const blockers = (d: PastoralDraft) => validatePastoralDraft(d).issues.filter((i) => i.level === 'blocker').map((i) => i.field);

describe('Mesa Pastoral — reglas editoriales', () => {
  it('una columna completa y verificada se puede aprobar', () => {
    expect(canApprovePastoral(validatePastoralDraft(ok).issues)).toBe(true);
  });
  it('una cita sin verificar (o sin fuente) no se aprueba', () => {
    expect(blockers({ ...ok, verified: false })).toContain('verified');
    expect(blockers({ ...ok, verificationSource: '  ' })).toContain('verificationSource');
  });
  it('una paráfrasis no puede llevar comillas (no se presenta como cita)', () => {
    expect(blockers({ ...ok, passageMode: 'PARAPHRASE', passageText: '“Todo lo puedo”' })).toContain('passageText');
    expect(blockers({ ...ok, passageMode: 'PARAPHRASE', verified: false, passageText: 'Pablo dice que Cristo le da fuerza.' })).toEqual([]);
  });
  it('limita los versículos citados de traducciones con derechos', () => {
    expect(blockers({ ...ok, translationCode: 'RVR1960', referenceInput: 'Salmo 119:1-20' })).toContain('passageText');
    expect(blockers({ ...ok, translationCode: 'RVR1960', referenceInput: 'Salmo 23:1-6' })).toEqual([]);
  });
  it('referencias o traducciones inválidas bloquean', () => {
    expect(blockers({ ...ok, referenceInput: 'Filipenses 9:1' })).toContain('referenceInput');
    expect(blockers({ ...ok, translationCode: 'INVENTADA' })).toContain('translationCode');
  });
  it('la invitación a orar exige declarar la privacidad', () => {
    expect(blockers({ ...ok, prayerInvitation: 'Oremos por la comunidad.' })).toContain('prayerPrivacy');
    expect(blockers({ ...ok, prayerInvitation: 'Oremos por la comunidad.', prayerPrivacy: 'NO_PRIVATE_REQUESTS' })).toEqual([]);
  });
});

describe('contrato público pastoral', () => {
  const details: PastoralDetails = {
    reference: { bookCode: 'PHP', chapter: 4, verseStart: 13, verseEnd: 13 },
    translationCode: 'RVR1960',
    passageMode: 'QUOTATION',
    passageText: 'texto',
    theme: 'Fe',
    applications: [],
    prayerInvitation: null,
    prayerPrivacy: 'NO_PRIVATE_REQUESTS',
    verification: { verified: true, verifiedBy: 'uuid-admin', verifiedAt: '2026-11-12T00:00:00Z', source: 'x' },
  };
  it('nunca publica una cita sin verificar', () => {
    expect(() => toPublicPastoralDetails({ ...details, verification: { ...details.verification, verified: false } })).toThrow('PASTORAL_PASSAGE_NOT_VERIFIED');
  });
  it('incluye aviso de traducción y omite datos internos', () => {
    const pub = toPublicPastoralDetails(details);
    expect(pub.referenceLabel).toBe('Filipenses 4:13 (RVR1960)');
    expect(pub.translationNotice).toContain('©');
    expect(pub).not.toHaveProperty('verification');
    expect(JSON.stringify(pub)).not.toContain('uuid-admin');
  });
});
