import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  const notConfigured = error instanceof Error && error.message === 'DATA_SOURCE_NOT_CONFIGURED';
  return (
    <div role="alert" className="flex items-start gap-3 border-2 border-accent p-4">
      <AlertTriangle aria-hidden className="mt-0.5 size-5 text-accent" />
      <div>
        <p className="font-semibold">{notConfigured ? 'Fuente de datos no configurada' : 'No pudimos cargar esta sección'}</p>
        <p className="text-sm text-fg-muted">
          {notConfigured
            ? 'La conexión con la base de datos se habilita en la Fase 2. No se muestran datos ficticios fuera del modo demo.'
            : 'Intenta de nuevo en unos segundos.'}
        </p>
      </div>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="border border-dashed border-rule-soft px-4 py-10 text-center">
      <p className="headline text-xl">{title}</p>
      {children && <div className="mt-1 text-sm text-fg-muted">{children}</div>}
    </div>
  );
}
