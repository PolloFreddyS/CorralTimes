import { LoadingRows } from '@/components/layout/QueryState';

/** Mientras se descarga el código diferido de la redacción. */
export function AdminLoading() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <LoadingRows rows={6} />
    </div>
  );
}
