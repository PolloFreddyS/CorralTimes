import { Lock } from 'lucide-react';
import { Link, Navigate, Outlet } from 'react-router';
import { useDocumentMode } from './theme';
import { AdminLoading } from './AdminLoading';
import { NewspaperMasthead } from '@/components/editorial';
import { Button } from '@/components/ui/button';
import { AdminSessionProvider, useAdminSession } from '@/features/auth/session';
import { appConfig } from '@/lib/env';

/**
 * Puerta de la redacción. La autorización real se aplica en el servidor (Worker + RLS);
 * esta puerta solo decide qué mostrar. Modo demo (solo desarrollo): sin autenticación y con datos ficticios.
 */
export function AdminGate() {
  if (appConfig.demoMode) return <Outlet />;
  return (
    <AdminSessionProvider>
      <GateInner />
    </AdminSessionProvider>
  );
}

function GateInner() {
  const { state } = useAdminSession();
  if (state.status === 'loading') return <AdminLoading />;
  if (state.status === 'ready') return <Outlet />;
  if (state.status === 'unconfigured' || state.status === 'error') return <AccessRequired />;
  return <Navigate to="/acceso" replace />;
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
        <Button asChild variant="outline"><Link to="/enviar-noticia">Reportar una noticia</Link></Button>
      </div>
    </div>
  );
}
