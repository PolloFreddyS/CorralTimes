import { Link } from 'react-router';
import { useDocumentMode } from './theme';
import { EditorialStamp } from '@/components/editorial';

export function NotFound() {
  useDocumentMode('newspaper');
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <EditorialStamp tone="rejected">Fe de erratas</EditorialStamp>
      <h1 className="headline mt-4 text-5xl">404: Noticia no encontrada</h1>
      <p className="mt-2 font-serif">Esta página se perdió en el gallinero.</p>
      <Link to="/" className="mt-6 inline-block underline">Volver a la portada</Link>
    </div>
  );
}
