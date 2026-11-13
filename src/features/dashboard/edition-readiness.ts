import type { Edition, EditorialStory, PowerRankingEntry, SubmissionSummary } from '@shared/domain/models';
import { estimatePages, evaluateReadiness, type EditionReadinessInput } from '@shared/domain/readiness';

/** Traduce el estado actual de la edición a la entrada de las reglas de preparación (sin inventar nada). */
export function readinessInputFrom(
  edition: Edition,
  submissions: SubmissionSummary[],
  stories: EditorialStory[],
  ranking: PowerRankingEntry[],
): EditionReadinessInput {
  const selected = stories.filter((s) => s.section !== null);
  const positions = ranking.map((r) => r.position);
  const count = (section: EditorialStory['section']) => selected.filter((s) => s.section === section).length;
  return {
    hasEditionNumber: Number.isInteger(edition.number),
    publicationDate: edition.publicationDate,
    mainHeadlineAssigned: selected.some((s) => s.section === 'PORTADA' && s.approved),
    approvedStories: stories.filter((s) => s.approved).length,
    selectedStories: selected.length,
    selectedButNotApproved: selected.filter((s) => !s.approved).length,
    pendingReview: submissions.filter((s) => s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW').length,
    quotesWithoutExactText: selected.filter((s) => s.section === 'FRASES' && !s.exactQuote).length,
    unlabeledRumors: selected.filter((s) => s.section === 'RUMORES' && !s.isRumor).length,
    lpSnapshotState: edition.lpSnapshotState,
    rankingState: edition.rankingState,
    rankingHasDuplicatePositions: new Set(positions).size !== positions.length,
    pastoralState: edition.pastoralState,
    pastoralPassageVerified: edition.pastoralPassageVerified,
    coverArtworkApproved: edition.coverArtworkApproved,
    puzzleState: edition.puzzleState,
    attachmentsMissing: 0,
    estimatedPages: estimatePages({
      main: count('PORTADA'),
      secondary: count('SECUNDARIA'),
      brief: count('BREVES'),
      rumor: count('RUMORES'),
      quote: count('FRASES'),
      meme: count('MEME'),
      lp: edition.lpSnapshotState === 'NONE' ? 0 : 1,
      ranking: ranking.length ? 1 : 0,
    }),
  };
}

export { evaluateReadiness };
