import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Check, Copy, Eye, Rocket, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { EditionStatus, EditorialChecklist } from '@/components/editorial';
import { PageHeader, PhaseNotice } from '@/components/layout/PageHeader';
import { ErrorState, LoadingRows } from '@/components/layout/QueryState';
import { Button } from '@/components/ui/button';
import { Field, Textarea } from '@/components/ui/form';
import { editionQuery, rankingQuery, storiesQuery, submissionsQuery } from '@/lib/demo-queries';
import { copyText } from '@/lib/download';
import { buildWhatsAppAnnouncement, WHATSAPP_SOFT_LIMIT } from '@shared/creative/whatsapp';
import { formatLongDate } from '@shared/domain/edition-calendar';
import { editionSlug } from '@shared/domain/public-content';
import { evaluateReadiness, summarizeReadiness } from '@shared/domain/readiness';
import { readinessInputFrom } from '@/features/dashboard/edition-readiness';

export function PublicationCenterPage() {
  const edition = useQuery(editionQuery);
  const stories = useQuery(storiesQuery);
  const subs = useQuery(submissionsQuery);
  const ranking = useQuery(rankingQuery);
  const [draft, setDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const err = edition.error ?? stories.error ?? subs.error ?? ranking.error;
  if (err) return <ErrorState error={err} />;
  if (!edition.data || !stories.data || !subs.data || !ranking.data) return <LoadingRows />;

  const checks = evaluateReadiness(readinessInputFrom(edition.data, subs.data, stories.data, ranking.data));
  const summary = summarizeReadiness(checks);
  const lead = stories.data.find((s) => s.section === 'PORTADA');
  const url = `${window.location.origin}/ediciones/${editionSlug(edition.data.number, edition.data.publicationDate)}`;
  const generated = buildWhatsAppAnnouncement({
    editionNumber: edition.data.number,
    headline: lead?.headline ?? '(sin titular principal)',
    teaser: lead?.satiricalBody.split('. ')[0] ?? '',
    url,
    extras: ['📈 Wall Street del Tilt', '🏆 Power Rankings', '🎮 El Palabrero del Corral'],
  });
  const message = draft ?? generated;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Centro de Publicación"
        title={`Edición N.º ${edition.data.number}`}
        description={<>Publicación prevista: <strong>{formatLongDate(edition.data.publicationDate)}</strong> · URL canónica: <code className="font-mono text-xs">{url}</code></>}
        actions={<EditionStatus status={edition.data.status} revision={edition.data.revision} />}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="val" className="border-2 border-rule p-4">
          <h2 id="val" className="kicker mb-2">Validación · {summary.blockers} bloqueos · {summary.warnings} avisos</h2>
          <EditorialChecklist checks={checks} />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled><Eye aria-hidden />Vista previa segura</Button>
            <Button variant="outline" size="sm" disabled><CalendarClock aria-hidden />Programar</Button>
            <Button size="sm" disabled><Rocket aria-hidden />Publicar ahora</Button>
            <Button variant="ghost" size="sm" disabled><Undo2 aria-hidden />Despublicar (emergencia)</Button>
          </div>
          <div className="mt-3"><PhaseNotice phase={5}>Snapshot congelado al publicar, revisiones, programación, despublicación de emergencia auditada y purga de caché.</PhaseNotice></div>
        </section>

        <section aria-labelledby="wa" className="border-2 border-rule p-4">
          <h2 id="wa" className="kicker mb-2">Generar anuncio de WhatsApp</h2>
          <Field id="wa-msg" label="Mensaje (editable)" counter={{ value: message.length, max: WHATSAPP_SOFT_LIMIT }}>
            <Textarea id="wa-msg" rows={10} value={message} onChange={(e) => setDraft(e.target.value)} className="font-mono text-xs" />
          </Field>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="gold" size="sm" onClick={async () => { setCopied(await copyText(message)); window.setTimeout(() => setCopied(false), 2000); }}>
              {copied ? <Check aria-hidden /> : <Copy aria-hidden />}{copied ? 'Copiado' : 'Copiar mensaje'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDraft(null)} disabled={draft === null}>Restaurar texto generado</Button>
          </div>
          <p className="mt-2 text-xs text-fg-muted">El envío es manual: no se usa la API de WhatsApp. En producción, el mensaje solo se genera para ediciones publicadas.</p>

          <h3 className="kicker mt-5 mb-2">Vista previa del enlace</h3>
          <div className="max-w-sm overflow-hidden rounded-md border border-rule bg-surface-raised font-sans">
            <div className="halftone flex aspect-[1.91/1] items-center justify-center text-xs text-fg-muted">Imagen social (1200×630) · pendiente de arte aprobado</div>
            <div className="p-2.5">
              <p className="line-clamp-2 text-sm font-semibold">Edición N.º {edition.data.number}: {lead?.headline}</p>
              <p className="mt-0.5 truncate text-xs text-fg-muted">{new URL(url).host}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
