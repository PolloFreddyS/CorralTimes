import { cn } from '@/lib/cn';
import type { SecurityEvent } from '@shared/domain/models';

const KIND_LABELS: Record<SecurityEvent['kind'], string> = {
  ADMIN_SIGN_IN: 'Inicio de sesión',
  AUTHZ_DENIED: 'Acceso denegado',
  SENSITIVE_OPERATION: 'Operación sensible',
  EXPORT: 'Exportación',
  ADMIN_CHANGE: 'Cambio administrativo',
  INTEGRATION_FAILURE: 'Fallo de integración',
  ALERT: 'Alerta',
};

const dt = new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Santo_Domingo' });

export function SecurityEventList({ events }: { events: SecurityEvent[] }) {
  if (events.length === 0) return <p className="py-6 text-center text-sm text-fg-muted">Sin eventos registrados.</p>;
  return (
    <ol className="divide-y divide-rule-soft font-sans text-sm">
      {events.map((e) => (
        <li key={e.id} className="grid grid-cols-1 gap-1 py-2.5 sm:grid-cols-[10rem_9rem_1fr] sm:gap-3">
          <time dateTime={e.at} className="font-mono text-xs text-fg-muted">{dt.format(new Date(e.at))}</time>
          <span className={cn('kicker', e.severity === 'critical' ? 'text-accent' : e.severity === 'warning' ? 'text-gold' : 'text-fg-muted')}>
            {KIND_LABELS[e.kind]}
          </span>
          <span>{e.summary}</span>
        </li>
      ))}
    </ol>
  );
}
