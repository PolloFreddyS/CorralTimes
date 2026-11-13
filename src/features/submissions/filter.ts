import type { SubmissionSummary } from '@shared/domain/models';
import type { SubmissionCategory, SubmissionStatus } from '@shared/domain/submission';

export interface InboxFilters {
  q: string;
  status: SubmissionStatus | 'ALL';
  category: SubmissionCategory | 'ALL';
  from: string;
  to: string;
  sort: 'newest' | 'oldest' | 'event';
}

export const DEFAULT_FILTERS: InboxFilters = { q: '', status: 'ALL', category: 'ALL', from: '', to: '', sort: 'newest' };

const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** Filtro/orden del buzón. Puro y testeable; en la Fase 4 se replica en SQL para paginar en servidor. */
export function filterSubmissions(items: readonly SubmissionSummary[], f: InboxFilters): SubmissionSummary[] {
  const q = fold(f.q.trim());
  const out = items.filter((s) => {
    if (f.status !== 'ALL' && s.status !== f.status) return false;
    if (f.category !== 'ALL' && s.category !== f.category) return false;
    if (f.from && s.eventDate < f.from) return false;
    if (f.to && s.eventDate > f.to) return false;
    if (q) {
      const hay = fold([s.headline, s.description, s.reporterAlias, s.peopleInvolved ?? '', s.receipt].join(' '));
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  return out.sort((a, b) =>
    f.sort === 'oldest'
      ? a.receivedAt.localeCompare(b.receivedAt)
      : f.sort === 'event'
        ? b.eventDate.localeCompare(a.eventDate)
        : b.receivedAt.localeCompare(a.receivedAt),
  );
}
