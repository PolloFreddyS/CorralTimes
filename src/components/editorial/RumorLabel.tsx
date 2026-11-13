import { CircleHelp } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Etiqueta obligatoria para cualquier rumor: siempre visible, nunca solo color. */
export function RumorLabel({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 border border-dashed border-accent px-1.5 py-0.5 kicker text-accent', className)}>
      <CircleHelp aria-hidden className="size-3" />
      Rumor · No verificado
    </span>
  );
}
