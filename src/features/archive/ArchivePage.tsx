import { PageHeader, PhaseNotice } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/QueryState';
import { Input } from '@/components/ui/form';

export function ArchivePage() {
  return (
    <div>
      <PageHeader kicker="Hemeroteca" title="Archivo del Gallinero" description="Ediciones cerradas, de solo lectura. Nada del archivo se reutiliza sin una acción editorial explícita." />
      <Input type="search" placeholder="Buscar en ediciones anteriores…" aria-label="Buscar en el archivo" disabled className="max-w-md" />
      <div className="mt-4"><EmptyState title="Aún no hay ediciones cerradas">Las ediciones aparecerán aquí al cerrarse con el flujo del viernes.</EmptyState></div>
      <div className="mt-4"><PhaseNotice phase={5}>Búsqueda, filtros, rankings y snapshots LP históricos, y descarga de exportaciones previas.</PhaseNotice></div>
    </div>
  );
}
