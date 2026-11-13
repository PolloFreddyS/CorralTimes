import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function BreakingNewsBanner({ label = 'Última hora', children, className }: { label?: string; children: ReactNode; className?: string }) {
  return (
    <div role="status" className={cn('flex items-stretch border-2 border-accent bg-surface-raised text-sm', className)}>
      <span className="kicker flex shrink-0 items-center bg-accent px-2.5 py-1.5 text-accent-fg">{label}</span>
      <span className="flex items-center px-3 py-1.5 font-serif leading-snug">{children}</span>
    </div>
  );
}
