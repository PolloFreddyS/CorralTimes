import { Lock } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { useDocumentMode } from './theme';
import { NewspaperMasthead } from '@/components/editorial';
import { Button } from '@/components/ui/button';
import { appConfig } from '@/lib/env';

/**
 * Puerta de la redacción. Falla cerrado: fuera de modo demo, y mientras no exista autenticación
 * (Fase 2), NO se renderiza ninguna pantalla administrativa. La autorización real se aplica en el
 * servidor; esta puerta solo evita mostrar UI vacía o engañosa.
 */
export function AdminGate() {
  if (appConfig.demoMode) return <Outlet />;
  return <AccessRequired />;
}

export function AccessRequired() {
  useDocumentMode('newspaper');
  return (
    <div className="mx-auto max-w-xl px-4 py-10 text-center">
      <NewspaperMasthead compact />
      <div className="rule-double my-4" />
      <Lock aria-hidden className="mx-auto size-10 text-accent" />
      <h1 className="headline mt-3 text-4xl">Acceso restringido</h1>
      <p className="mt-2 font-serif">La redacción es solo para la administración de EL CORRAL TIMES.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Button asChild variant="ink"><Link to="/acceso">Acceso de editores</Link></Button>
        <Button asChild variant="outline"><Link to="/">Reportar una noticia</Link></Button>
      </div>
    </div>
  );
}
