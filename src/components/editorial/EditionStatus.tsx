import { cn } from '@/lib/cn';
import type { EditionStatus as Status } from '@shared/domain/models';
import { EDITION_STATUS_LABELS } from '@shared/domain/workflow';

const LABELS: Record<Status, { label: string; className: string }> = {
  DRAFT: { label: EDITION_STATUS_LABELS.DRAFT, className: 'border-rule-soft text-fg-muted' },
  IN_REVIEW: { label: EDITION_STATUS_LABELS.IN_REVIEW, className: 'border-gold text-gold' },
  READY: { label: EDITION_STATUS_LABELS.READY, className: 'border-green text-green' },
  SCHEDULED: { label: EDITION_STATUS_LABELS.SCHEDULED, className: 'border-gold text-gold' },
  PUBLISHED: { label: EDITION_STATUS_LABELS.PUBLISHED, className: 'border-fg text-fg' },
  ARCHIVED: { label: EDITION_STATUS_LABELS.ARCHIVED, className: 'border-rule-soft text-fg-muted' },
};

export function EditionStatus({ status, revision, className }: { status: Status; revision?: number; className?: string }) {
  const s = LABELS[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 border px-2 py-0.5 kicker', s.className, className)}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {s.label}
      {revision && revision > 1 ? <span className="font-mono normal-case tracking-normal">· rev {revision}</span> : null}
    </span>
  );
}
