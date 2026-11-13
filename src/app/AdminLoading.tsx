import { LoadingRows } from '@/components/layout/QueryState';

/** Mientras se descarga el código diferido de la redacción. */
export function AdminLoading() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <LoadingRows rows={6} />
    </div>
  );
}

/** Mientras se descarga una página pública diferida. */
export function PublicLoading() {
  return (
    <div className="mx-auto max-w-6xl p-4">
      <LoadingRows rows={5} />
    </div>
  );
}
