import { Rocket } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { summarizeReadiness, type ReadinessCheck } from '@shared/domain/readiness';
import { EditorialChecklist } from './EditorialChecklist';

/**
 * Preparación para publicar la edición en el periódico digital (v2).
 * La publicación real (snapshot congelado, programación, URL permanente) vive en el Centro de Publicación.
 */
export function PublicationReadinessPanel({ checks }: { checks: readonly ReadinessCheck[] }) {
  const s = summarizeReadiness(checks);
  return (
    <section aria-labelledby="ready-title" className="border-2 border-rule bg-surface-raised">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b-2 border-rule bg-fg px-4 py-2 text-surface">
        <h2 id="ready-title" className="kicker inline-flex items-center gap-2 whitespace-nowrap"><Rocket aria-hidden className="size-4" />Preparación de la edición</h2>
        <span className="font-mono text-xs whitespace-nowrap">{s.blockers} bloqueos · {s.warnings} avisos</span>
      </header>
      <div className="p-4">
        <EditorialChecklist checks={checks} />
        <Button asChild className="mt-4 w-full" size="lg">
          <Link to="/redaccion/publicacion">Ir al Centro de Publicación</Link>
        </Button>
        <p className="mt-2 text-xs text-fg-muted">{s.canExport ? 'Sin bloqueos: la edición puede validarse para publicar.' : 'Resuelve los bloqueos antes de publicar.'}</p>
      </div>
    </section>
  );
}
