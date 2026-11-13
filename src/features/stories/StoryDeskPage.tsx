import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { EvidenceViewer } from '@/components/editorial';
import { PageHeader, PhaseNotice } from '@/components/layout/PageHeader';
import { EmptyState, ErrorState, LoadingRows } from '@/components/layout/QueryState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input, NativeSelect, Textarea } from '@/components/ui/form';
import { storiesQuery, submissionsQuery } from '@/lib/demo-queries';
import { allowedTransitions, STATUS_LABELS } from '@shared/domain/submission';

const SECTIONS = [
  ['', 'Sin asignar'],
  ['PORTADA', 'Portada'],
  ['SECUNDARIA', 'Secundaria'],
  ['BREVES', 'Breves'],
  ['RUMORES', 'Rumores'],
  ['FRASES', 'Frases'],
  ['MEME', 'Meme'],
] as const;

export function StoryDeskPage() {
  const { submissionId } = useParams();
  const subs = useQuery(submissionsQuery);
  const stories = useQuery(storiesQuery);

  if (subs.error || stories.error) return <ErrorState error={subs.error ?? stories.error} />;
  if (!subs.data || !stories.data) return <LoadingRows />;

  if (!submissionId) {
    return (
      <div>
        <PageHeader kicker="Mesa Editorial" title="Elige un reporte" description="Abre un reporte del buzón para trabajar su versión editorial." />
        <ul className="divide-y divide-rule-soft border-y border-rule">
          {subs.data.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
              <Link className="font-headline font-bold hover:underline" to={`/redaccion/mesa/${s.id}`}>{s.headline}</Link>
              <Badge tone="muted">{STATUS_LABELS[s.status]}</Badge>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const submission = subs.data.find((s) => s.id === submissionId);
  if (!submission) return <EmptyState title="Reporte no encontrado"><Link className="underline" to="/redaccion/buzon">Volver al buzón</Link></EmptyState>;
  const story = stories.data.find((s) => s.submissionId === submission.id);

  return (
    <div>
      <PageHeader kicker="Mesa Editorial" title="Del chisme a la portada" description="Izquierda: evidencia original (inmutable). Derecha: versión editorial satírica." />
      <div className="grid gap-6 lg:grid-cols-2">
        <EvidenceViewer submission={submission} />
        <form className="space-y-4 border-2 border-rule p-4" onSubmit={(e) => e.preventDefault()} aria-label="Versión editorial">
          <p className="kicker text-accent">Versión editorial</p>
          <Field id="ed-headline" label="Titular editorial" required>
            <Input id="ed-headline" defaultValue={story?.headline ?? ''} />
          </Field>
          <Field id="ed-body" label="Descripción satírica">
            <Textarea id="ed-body" rows={5} defaultValue={story?.satiricalBody ?? ''} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="ed-section" label="Sección">
              <NativeSelect id="ed-section" defaultValue={story?.section ?? ''}>
                {SECTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </NativeSelect>
            </Field>
            <Field id="ed-priority" label="Prioridad">
              <Input id="ed-priority" type="number" min={1} max={10} defaultValue={story?.priority ?? 5} />
            </Field>
            <Field id="ed-verification" label="Verificación">
              <NativeSelect id="ed-verification" defaultValue={story?.verification ?? 'UNVERIFIED'}>
                <option value="UNVERIFIED">No verificado</option>
                <option value="PARTIALLY_VERIFIED">Parcial</option>
                <option value="VERIFIED">Verificado</option>
                <option value="DISPUTED">Disputado</option>
              </NativeSelect>
            </Field>
          </div>
          <Field id="ed-notes" label="Notas editoriales">
            <Textarea id="ed-notes" rows={2} className="min-h-16" />
          </Field>
          <div className="flex flex-wrap gap-2 border-t border-rule-soft pt-3">
            <span className="kicker w-full text-fg-muted">Decisión ({STATUS_LABELS[submission.status]} →)</span>
            {allowedTransitions(submission.status).map((t) => (
              <Button key={t} size="sm" variant={t === 'APPROVED' ? 'primary' : t === 'REJECTED' ? 'outline' : 'ghost'} disabled title="Disponible en la Fase 4">
                {STATUS_LABELS[t]}
              </Button>
            ))}
            <Button size="sm" variant="ink" className="ml-auto" disabled title="Disponible en la Fase 4">Guardar versión</Button>
          </div>
          <PhaseNotice phase={4}>Guardar, aprobar y el historial de decisiones (con control de concurrencia) se conectan al backend en la Fase 4. Los cambios aquí no se guardan.</PhaseNotice>
        </form>
      </div>
    </div>
  );
}
