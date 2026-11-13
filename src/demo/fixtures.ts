/**
 * ⚠️ DATOS DE DEMOSTRACIÓN — FICTICIOS ⚠️
 * Solo se cargan cuando appConfig.demoMode === true (desarrollo / preview con demo explícito).
 * No representan noticias, estadísticas ni posiciones reales de la comunidad.
 * Los valores LP son inventados para probar la UI y están marcados como demo en pantalla.
 */
import type {
  Edition,
  EditorialStory,
  LpPlayerRow,
  PowerRankingEntry,
  SecurityEvent,
  SubmissionSummary,
} from '@shared/domain/models';

export const DEMO_NOTICE = 'Datos ficticios de demostración — no son noticias reales.';

export const demoEdition: Edition = {
  id: '00000000-0000-4000-8000-0000000000e1',
  number: 0,
  publicationDate: '2026-11-13',
  status: 'IN_REVIEW',
  revision: 1,
  lpSnapshotState: 'PENDING_APPROVAL',
  rankingState: 'DRAFT',
};

export const demoSubmissions: SubmissionSummary[] = [
  {
    id: '7d1f4a0e-5b8c-4a51-9e0c-1a1d2a3b4c01',
    receipt: 'CT-DEMO-7Q2K',
    category: 'DRAMA_RANKED',
    status: 'SUBMITTED',
    reporterAlias: 'Reportero Demo',
    headline: '[DEMO] Jugador ficticio pierde promo por ir a buscar un pica pollo',
    description: 'Ejemplo ficticio para probar el buzón. Un jugador inventado dejó la partida en el minuto 12 alegando hambre.',
    eventDate: '2026-11-10',
    peopleInvolved: 'Personaje Demo A',
    hasAttachment: true,
    receivedAt: '2026-11-10T23:14:00Z',
  },
  {
    id: '7d1f4a0e-5b8c-4a51-9e0c-1a1d2a3b4c02',
    receipt: 'CT-DEMO-9F3M',
    category: 'RUMOR',
    status: 'UNDER_REVIEW',
    reporterAlias: 'Fuente Anónima Demo',
    headline: '[DEMO] Se dice que alguien compró una skin a las 4 de la mañana',
    description: 'Rumor ficticio de ejemplo. Nadie lo ha confirmado y así debe quedar marcado.',
    eventDate: '2026-11-09',
    hasAttachment: false,
    receivedAt: '2026-11-09T12:40:00Z',
  },
  {
    id: '7d1f4a0e-5b8c-4a51-9e0c-1a1d2a3b4c03',
    receipt: 'CT-DEMO-2B8X',
    category: 'FRASE_LEGENDARIA',
    status: 'APPROVED',
    reporterAlias: 'Cronista Demo',
    headline: '[DEMO] Frase de ejemplo para el Departamento del Caos',
    description: 'Cita inventada para comprobar que el texto exacto se conserva tal cual.',
    eventDate: '2026-11-08',
    exactQuote: 'Esto es una frase de demostración, mano.',
    hasAttachment: false,
    receivedAt: '2026-11-08T20:02:00Z',
  },
  {
    id: '7d1f4a0e-5b8c-4a51-9e0c-1a1d2a3b4c04',
    receipt: 'CT-DEMO-5H1P',
    category: 'MEME',
    status: 'NEEDS_INFORMATION',
    reporterAlias: 'Meme Lord Demo',
    headline: '[DEMO] Meme de prueba sin contexto suficiente',
    description: 'Ejemplo de reporte al que le falta información para ser evaluado.',
    eventDate: '2026-11-11',
    hasAttachment: true,
    receivedAt: '2026-11-11T02:31:00Z',
  },
  {
    id: '7d1f4a0e-5b8c-4a51-9e0c-1a1d2a3b4c05',
    receipt: 'CT-DEMO-0R6T',
    category: 'NOTICIA',
    status: 'REJECTED',
    reporterAlias: 'Spam Demo',
    headline: '[DEMO] Reporte rechazado de ejemplo',
    description: 'Ejemplo de reporte rechazado para probar filtros y estados.',
    eventDate: '2026-11-07',
    hasAttachment: false,
    receivedAt: '2026-11-07T15:00:00Z',
  },
];

export const demoStories: EditorialStory[] = [
  {
    id: 'a1b2c3d4-0000-4000-8000-000000000001',
    submissionId: demoSubmissions[0]!.id,
    headline: '[DEMO] CRISIS ALIMENTARIA EN LA GRIETA: PROMO SACRIFICADA POR UN PICA POLLO',
    satiricalBody:
      'Texto satírico de ejemplo. Fuentes cercanas al gallinero (ficticias) confirman que el olor a pica pollo pudo más que la disciplina competitiva.',
    section: 'PORTADA',
    priority: 1,
    verification: 'VERIFIED',
    approved: true,
    isRumor: false,
  },
  {
    id: 'a1b2c3d4-0000-4000-8000-000000000002',
    submissionId: demoSubmissions[1]!.id,
    headline: '[DEMO] ¿COMPRA NOCTURNA? LA TIENDA NUNCA DUERME',
    satiricalBody: 'Rumor de ejemplo, sin verificar. La redacción no ha podido confirmar nada.',
    section: 'RUMORES',
    priority: 3,
    verification: 'UNVERIFIED',
    approved: true,
    isRumor: true,
  },
  {
    id: 'a1b2c3d4-0000-4000-8000-000000000003',
    submissionId: demoSubmissions[2]!.id,
    headline: '[DEMO] LA FRASE DE LA SEMANA',
    satiricalBody: '',
    section: 'FRASES',
    priority: 4,
    verification: 'VERIFIED',
    approved: true,
    isRumor: false,
    exactQuote: 'Esto es una frase de demostración, mano.',
    quoteAttribution: 'Personaje Demo B',
  },
];

export const demoRanking: PowerRankingEntry[] = [
  { position: 1, previousPosition: 3, participant: 'Personaje Demo A', commentary: 'Comentario de ejemplo.' },
  { position: 2, previousPosition: 1, participant: 'Personaje Demo B', commentary: 'Comentario de ejemplo.' },
  { position: 3, previousPosition: null, participant: 'Personaje Demo C', commentary: 'Nuevo en el ranking (demo).' },
];

/** LP inventado para pruebas de UI. Incluye un caso "sin datos" a propósito. */
export const demoLpRows: LpPlayerRow[] = [
  { riotId: 'Jugador Demo Uno#DEMO', queue: 'RANKED_SOLO_5x5', startRank: 'GOLD II 40', endRank: 'GOLD I 12', lpChange: 72, games: 9, quality: 'COMPLETE' },
  { riotId: 'Jugador Demo Dos#DEMO', queue: 'RANKED_SOLO_5x5', startRank: 'SILVER I 80', endRank: 'SILVER II 31', lpChange: -49, games: 11, quality: 'COMPLETE' },
  { riotId: 'Jugador Demo Tres#DEMO', queue: 'RANKED_FLEX_SR', startRank: null, endRank: 'PLATINUM IV 5', lpChange: 18, games: null, quality: 'SOURCE_PROVIDED' },
  { riotId: 'Jugador Demo Cuatro#DEMO', queue: 'RANKED_SOLO_5x5', startRank: null, endRank: null, lpChange: null, games: null, quality: 'MISSING' },
];

export const demoSecurityEvents: SecurityEvent[] = [
  { id: 'se-1', kind: 'AUTHZ_DENIED', at: '2026-11-12T03:12:00Z', actor: null, summary: '[DEMO] Solicitud sin sesión a /api/admin rechazada (401).', severity: 'warning' },
  { id: 'se-2', kind: 'ADMIN_SIGN_IN', at: '2026-11-11T22:00:00Z', actor: 'admin-demo', summary: '[DEMO] Inicio de sesión con MFA.', severity: 'info' },
  { id: 'se-3', kind: 'INTEGRATION_FAILURE', at: '2026-11-10T18:45:00Z', actor: null, summary: '[DEMO] Proveedor LP no configurado.', severity: 'info' },
];
