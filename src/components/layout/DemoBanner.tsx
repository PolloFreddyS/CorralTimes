import { FlaskConical } from 'lucide-react';
import { DEMO_NOTICE } from '@/demo/fixtures';

export function DemoBanner() {
  return (
    <div role="note" className="flex items-center justify-center gap-2 bg-gold-strong px-3 py-1 text-center font-sans text-xs font-bold text-ink">
      <FlaskConical aria-hidden className="size-3.5" />
      MODO DEMO · {DEMO_NOTICE} Sin autenticación hasta la Fase 2.
    </div>
  );
}
