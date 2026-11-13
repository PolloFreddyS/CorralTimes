import { useQuery } from '@tanstack/react-query';
import { SecurityEventList } from '@/components/editorial';
import { PageHeader, PhaseNotice } from '@/components/layout/PageHeader';
import { ErrorState, LoadingRows } from '@/components/layout/QueryState';
import { securityEventsQuery } from '@/lib/demo-queries';

export function SecurityPage() {
  const { data, error } = useQuery(securityEventsQuery);
  return (
    <div>
      <PageHeader kicker="Centro de Seguridad" title="Bitácora de seguridad" description="Inicios de sesión, accesos denegados, operaciones sensibles y exportaciones. Nunca se muestran secretos ni tokens." />
      <PhaseNotice phase={2}>La bitácora real (tabla security_audit_events con retención configurable) se conecta en la Fase 2.</PhaseNotice>
      <div className="mt-4 border-y-2 border-rule">{error ? <ErrorState error={error} /> : data ? <SecurityEventList events={data} /> : <LoadingRows />}</div>
    </div>
  );
}
