import { cn } from '@/lib/cn';
import type { EditionStatus as Status } from '@shared/domain/models';

const LABELS: Record<Status, { label: string; className: string }> = {
  PLANNING: { label: 'En planificación', className: 'border-rule-soft text-fg-muted' },
  OPEN: { label: 'Abierta', className: 'border-green text-green' },
  LOCKED: { label: 'Bloqueada', className: 'border-gold text-gold' },
  CLOSED: { label: 'Cerrada', className: 'border-fg text-fg' },
  REOPENED: { label: 'Reabierta', className: 'border-accent text-accent' },
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
