import type { DataQuality, LpQueue } from './lp';
import type { LpSnapshotState, RankingState } from './readiness';
import type { SubmissionCategory, SubmissionStatus } from './submission';

/**
 * Modelos de lectura compartidos por la API y la UI.
 * Los IDs públicos son UUID opacos; nunca exponemos IDs secuenciales.
 */

export type EditionStatus = 'PLANNING' | 'OPEN' | 'LOCKED' | 'CLOSED' | 'REOPENED';

export type VerificationStatus = 'UNVERIFIED' | 'PARTIALLY_VERIFIED' | 'VERIFIED' | 'DISPUTED';

export type NewspaperSection = 'PORTADA' | 'SECUNDARIA' | 'BREVES' | 'RUMORES' | 'FRASES' | 'MEME' | 'BOLSA_LP' | 'POWER_RANKING';

export interface Edition {
  id: string;
  number: number;
  publicationDate: string;
  status: EditionStatus;
  revision: number;
  lpSnapshotState: LpSnapshotState;
  rankingState: RankingState;
}

export interface SubmissionSummary {
  id: string;
  receipt: string;
  category: SubmissionCategory;
  status: SubmissionStatus;
  reporterAlias: string;
  headline: string;
  description: string;
  eventDate: string;
  peopleInvolved?: string;
  exactQuote?: string;
  source?: string;
  hasAttachment: boolean;
  receivedAt: string;
}

export interface EditorialStory {
  id: string;
  submissionId: string | null;
  headline: string;
  satiricalBody: string;
  section: NewspaperSection | null;
  priority: number;
  verification: VerificationStatus;
  approved: boolean;
  isRumor: boolean;
  exactQuote?: string;
  quoteAttribution?: string;
}

export interface PowerRankingEntry {
  position: number;
  previousPosition: number | null;
  participant: string;
  commentary: string;
}

export interface LpPlayerRow {
  riotId: string;
  queue: LpQueue;
  startRank: string | null;
  endRank: string | null;
  lpChange: number | null;
  games: number | null;
  quality: DataQuality;
}

export type SecurityEventKind =
  | 'ADMIN_SIGN_IN'
  | 'AUTHZ_DENIED'
  | 'SENSITIVE_OPERATION'
  | 'EXPORT'
  | 'ADMIN_CHANGE'
  | 'INTEGRATION_FAILURE'
  | 'ALERT';

export interface SecurityEvent {
  id: string;
  kind: SecurityEventKind;
  at: string;
  actor: string | null;
  summary: string;
  severity: 'info' | 'warning' | 'critical';
}
