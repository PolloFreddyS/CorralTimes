import { FileArchive, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { summarizeReadiness, type ReadinessCheck } from '@shared/domain/readiness';
import { EditorialChecklist } from './EditorialChecklist';

/**
 * Panel del cierre del viernes. En la Fase 1 la acción está deshabilitada con explicación:
 * la exportación real (snapshot inmutable + ZIP) se implementa en la Fase 7.
 */
export function FridayExportPanel({ checks, available = false }: { checks: readonly ReadinessCheck[]; available?: boolean }) {
  const s = summarizeReadiness(checks);
  return (
    <section aria-labelledby="export-title" className="border-2 border-rule bg-surface-raised">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b-2 border-rule bg-fg px-4 py-2 text-surface">
        <h2 id="export-title" className="kicker inline-flex items-center gap-2 whitespace-nowrap"><FileArchive aria-hidden className="size-4" />Cierre del viernes</h2>
        <span className="font-mono text-xs whitespace-nowrap">{s.blockers} bloqueos · {s.warnings} avisos</span>
      </header>
      <div className="p-4">
        <EditorialChecklist checks={checks} />
        <Button className="mt-4 w-full" size="lg" disabled={!available || !s.canExport} aria-describedby="export-help">
          <Lock aria-hidden />
          Cerrar edición y preparar prompt
        </Button>
        <p id="export-help" className="mt-2 text-xs text-fg-muted">
          {!available
            ? 'Disponible en la Fase 7: genera master-prompt.md, edition.json, auditoría y ZIP a partir de un snapshot inmutable.'
            : s.canExport
              ? 'Listo para cerrar. Se pedirá confirmación.'
              : 'Resuelve los bloqueos antes de cerrar.'}
        </p>
      </div>
    </section>
  );
}
