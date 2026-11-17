import { useQuery } from '@tanstack/react-query';
import { SecurityEventList } from '@/components/editorial';
import { PageHeader, PhaseNotice } from '@/components/layout/PageHeader';
import { ErrorState, LoadingRows } from '@/components/layout/QueryState';
import { securityEventsQuery } from '@/lib/demo-queries';
import { appConfig } from '@/lib/env';
import { adminFetch } from '@/lib/supabase';
import type { SecurityEvent } from '@shared/domain/models';

interface Row {
  id: string;
  kind: SecurityEvent['kind'];
  severity: SecurityEvent['severity'];
  actor_id: string | null;
  summary: string;
  created_at: string;
}

const liveEventsQuery = {
  queryKey: ['admin', 'security-events'],
  queryFn: async (): Promise<SecurityEvent[]> =>
    (await adminFetch<{ events: Row[] }>('/security-events')).events.map((r) => ({
      id: r.id,
      kind: r.kind,
      severity: r.severity,
      actor: r.actor_id,
      summary: r.summary,
      at: r.created_at,
    })),
};

export function SecurityPage() {
  const { data, error } = useQuery(appConfig.demoMode ? securityEventsQuery : liveEventsQuery);
  return (
    <div>
      <PageHeader kicker="Centro de Seguridad" title="Bitácora de seguridad" description="Inicios de sesión, cambios de administradores, operaciones sensibles y exportaciones. Nunca se muestran secretos ni tokens." />
      {appConfig.demoMode && <PhaseNotice phase={2}>Modo demo: eventos ficticios. Con Supabase conectado se muestra la bitácora real (security_audit_events).</PhaseNotice>}
      <div className="mt-4 border-y-2 border-rule">{error ? <ErrorState error={error} /> : data ? <SecurityEventList events={data} /> : <LoadingRows />}</div>
    </div>
  );
}
