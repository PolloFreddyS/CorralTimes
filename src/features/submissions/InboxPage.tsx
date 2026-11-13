import { useQuery } from '@tanstack/react-query';
import { Paperclip, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { RumorLabel } from '@/components/editorial';
import { PageHeader, PhaseNotice } from '@/components/layout/PageHeader';
import { EmptyState, ErrorState, LoadingRows } from '@/components/layout/QueryState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Label, NativeSelect } from '@/components/ui/form';
import { submissionsQuery } from '@/lib/demo-queries';
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  SUBMISSION_CATEGORIES,
  SUBMISSION_STATUSES,
  type SubmissionStatus,
} from '@shared/domain/submission';
import { DEFAULT_FILTERS, filterSubmissions, type InboxFilters } from './filter';

const STATUS_TONE: Record<SubmissionStatus, 'gold' | 'green' | 'redOutline' | 'muted' | 'neutral'> = {
  SUBMITTED: 'neutral',
  UNDER_REVIEW: 'gold',
  NEEDS_INFO: 'gold',
  APPROVED: 'green',
  REJECTED: 'redOutline',
  ARCHIVED: 'muted',
};

export function InboxPage() {
  const { data, error, isLoading } = useQuery(submissionsQuery);
  const [f, setF] = useState<InboxFilters>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const rows = useMemo(() => (data ? filterSubmissions(data, f) : []), [data, f]);
  const set = <K extends keyof InboxFilters>(k: K, v: InboxFilters[K]) => setF((p) => ({ ...p, [k]: v }));

  return (
    <div>
      <PageHeader kicker="Buzón de Chismes" title="Reportes recibidos" description="Cada reporte es evidencia original: se revisa, nunca se reescribe aquí." />

      <div className="grid gap-3 border-y-2 border-rule py-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative sm:col-span-2">
          <Label htmlFor="q" className="sr-only">Buscar</Label>
          <Search aria-hidden className="absolute top-3 left-3 size-4 text-fg-muted" />
          <Input id="q" type="search" placeholder="Buscar titular, reportero, persona, comprobante…" className="pl-9" value={f.q} onChange={(e) => set('q', e.target.value)} />
        </div>
        <NativeSelect aria-label="Estado" value={f.status} onChange={(e) => set('status', e.target.value as InboxFilters['status'])}>
          <option value="ALL">Todos los estados</option>
          {SUBMISSION_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </NativeSelect>
        <NativeSelect aria-label="Categoría" value={f.category} onChange={(e) => set('category', e.target.value as InboxFilters['category'])}>
          <option value="ALL">Todas las categorías</option>
          {SUBMISSION_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </NativeSelect>
        <div className="flex gap-2">
          <Input type="date" aria-label="Desde" value={f.from} onChange={(e) => set('from', e.target.value)} />
          <Input type="date" aria-label="Hasta" value={f.to} onChange={(e) => set('to', e.target.value)} />
        </div>
        <NativeSelect aria-label="Ordenar" value={f.sort} onChange={(e) => set('sort', e.target.value as InboxFilters['sort'])}>
          <option value="newest">Más recientes</option>
          <option value="oldest">Más antiguos</option>
          <option value="event">Por fecha del evento</option>
        </NativeSelect>
      </div>

      <div className="my-3 flex flex-wrap items-center gap-2">
        <span className="text-sm text-fg-muted">{selected.size} seleccionados</span>
        <Button size="sm" variant="outline" disabled title="Disponible en la Fase 4">Archivar seleccionados</Button>
        <Button size="sm" variant="ghost" disabled={selected.size === 0} onClick={() => setSelected(new Set())}>Limpiar selección</Button>
      </div>
      <PhaseNotice phase={4}>Las acciones masivas, la detección de duplicados y la vista segura de adjuntos se conectan al backend en la Fase 4.</PhaseNotice>

      <div className="mt-4">
        {error ? <ErrorState error={error} /> : isLoading ? <LoadingRows /> : rows.length === 0 ? (
          <EmptyState title="Nada por aquí">Ningún reporte coincide con los filtros.</EmptyState>
        ) : (
          <ul className="divide-y divide-rule-soft border-y border-rule">
            {rows.map((s) => (
              <li key={s.id} className="grid grid-cols-[auto_1fr] gap-3 py-3 sm:grid-cols-[auto_1fr_auto]">
                <input
                  type="checkbox"
                  aria-label={`Seleccionar ${s.headline}`}
                  className="mt-1 size-4 accent-[var(--accent)]"
                  checked={selected.has(s.id)}
                  onChange={(e) => setSelected((p) => { const n = new Set(p); if (e.target.checked) n.add(s.id); else n.delete(s.id); return n; })}
                />
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <Badge tone={STATUS_TONE[s.status]}>{STATUS_LABELS[s.status]}</Badge>
                    <Badge tone="muted">{CATEGORY_LABELS[s.category]}</Badge>
                    {s.category === 'RUMOR' && <RumorLabel />}
                    {s.hasAttachment && <Paperclip aria-label="Tiene adjunto" className="size-3.5 text-fg-muted" />}
                  </div>
                  <Link to={`/redaccion/mesa/${s.id}`} className="font-headline text-lg font-bold leading-tight hover:underline">{s.headline}</Link>
                  <p className="line-clamp-2 font-serif text-sm text-fg-muted">{s.description}</p>
                  <p className="mt-1 text-xs text-fg-muted">
                    Por <strong className="text-fg">{s.reporterAlias}</strong> · evento {s.eventDate}
                    {s.peopleInvolved && <> · con {s.peopleInvolved}</>}
                  </p>
                </div>
                <span className="col-start-2 font-mono text-xs text-fg-muted sm:col-start-auto">{s.receipt}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
