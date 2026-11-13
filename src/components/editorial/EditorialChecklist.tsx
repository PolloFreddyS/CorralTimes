import { AlertTriangle, CheckCircle2, Info, OctagonX } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { CheckLevel, ReadinessCheck } from '@shared/domain/readiness';

const ICON: Record<CheckLevel, { Icon: typeof Info; className: string; sr: string }> = {
  ok: { Icon: CheckCircle2, className: 'text-green', sr: 'Correcto' },
  warning: { Icon: AlertTriangle, className: 'text-gold', sr: 'Advertencia' },
  blocker: { Icon: OctagonX, className: 'text-accent', sr: 'Bloqueante' },
  info: { Icon: Info, className: 'text-fg-muted', sr: 'Información' },
};

export function EditorialChecklist({ checks, className }: { checks: readonly ReadinessCheck[]; className?: string }) {
  return (
    <ul className={cn('divide-y divide-rule-soft', className)}>
      {checks.map((c) => {
        const { Icon, className: tone, sr } = ICON[c.level];
        return (
          <li key={c.id} className="flex items-start gap-2.5 py-2">
            <Icon aria-hidden className={cn('mt-0.5 size-4 shrink-0', tone)} />
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                <span className="sr-only">{sr}: </span>
                {c.label}
              </p>
              <p className="text-xs text-fg-muted">{c.detail}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
