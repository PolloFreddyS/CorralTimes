import { FileImage, ShieldCheck } from 'lucide-react';
import type { SubmissionSummary } from '@shared/domain/models';
import { CATEGORY_LABELS } from '@shared/domain/submission';
import { formatLongDate } from '@shared/domain/edition-calendar';
import { RumorLabel } from './RumorLabel';

/**
 * Visor del reporte ORIGINAL (evidencia). Solo lectura: la edición satírica vive aparte.
 * Las imágenes se servirán en la Fase 4 mediante URLs firmadas de corta duración.
 */
export function EvidenceViewer({ submission }: { submission: SubmissionSummary }) {
  const rows: [string, string | undefined][] = [
    ['Reportero (no verificado)', submission.reporterAlias],
    ['Categoría', CATEGORY_LABELS[submission.category]],
    ['Fecha del evento', formatLongDate(submission.eventDate)],
    ['Personas involucradas', submission.peopleInvolved],
    ['Fuente / contexto', submission.source],
  ];
  return (
    <section aria-label="Reporte original" className="border border-rule bg-surface-raised p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="kicker inline-flex items-center gap-1 text-green"><ShieldCheck aria-hidden className="size-3.5" />Evidencia original · solo lectura</span>
        <span className="font-mono text-xs text-fg-muted">{submission.receipt}</span>
      </div>
      {submission.category === 'RUMOR' && <RumorLabel className="mb-2" />}
      <h3 className="font-headline text-xl font-bold">{submission.headline}</h3>
      <p className="mt-2 font-serif text-sm leading-relaxed whitespace-pre-wrap">{submission.description}</p>
      {submission.exactQuote && (
        <blockquote className="mt-3 border-l-4 border-gold-strong pl-3 font-serif italic">“{submission.exactQuote}”</blockquote>
      )}
      <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <div key={k}>
            <dt className="kicker text-fg-muted">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex items-center gap-2 border-t border-rule-soft pt-3 text-xs text-fg-muted">
        <FileImage aria-hidden className="size-4" />
        {submission.hasAttachment ? 'Adjunto disponible (visualización segura en Fase 4).' : 'Sin adjuntos.'}
      </div>
    </section>
  );
}
