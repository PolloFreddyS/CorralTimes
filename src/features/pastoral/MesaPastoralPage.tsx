import { AlertTriangle, BookOpen, CheckCircle2, Eye, OctagonX, Plus, Send, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader, PhaseNotice } from '@/components/layout/PageHeader';
import { PastoralColumn } from '@/components/pastoral/PastoralColumn';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { describedBy, Field, Input, NativeSelect, Textarea } from '@/components/ui/form';
import { demoPastoralArchive } from '@/demo/fixtures';
import { appConfig } from '@/lib/env';
import { p } from '@shared/domain/article-doc';
import { BIBLE_BOOKS, BIBLE_TRANSLATIONS, findTranslation, formatBibleReference } from '@shared/domain/bible';
import { canApprovePastoral, PASTORAL_THEMES, validatePastoralDraft, type PastoralDraft } from '@shared/domain/pastoral';
import type { PublicPastoralDetails } from '@shared/domain/public-content';

const EMPTY: PastoralDraft = {
  referenceInput: '',
  translationCode: 'RVR1960',
  passageMode: 'QUOTATION',
  passageText: '',
  title: '',
  subtitle: '',
  theme: '',
  reflection: '',
  applications: [''],
  prayerInvitation: '',
  prayerPrivacy: null,
  verified: false,
  verificationSource: '',
};

/**
 * MESA PASTORAL — edición de LA VOZ DEL PASTOR.
 * Las reglas (referencia válida, traducción, cita vs. paráfrasis, verificación, límite de versículos con derechos,
 * privacidad de oración) se evalúan en vivo con la misma función que usará el servidor en la Fase 4.
 */
export function MesaPastoralPage() {
  const [d, setD] = useState<PastoralDraft>(EMPTY);
  const [showPreview, setShowPreview] = useState(false);
  const set = <K extends keyof PastoralDraft>(k: K, v: PastoralDraft[K]) => setD((x) => ({ ...x, [k]: v }));
  const { issues, reference } = useMemo(() => validatePastoralDraft(d), [d]);
  const err = (f: keyof PastoralDraft) => issues.find((i) => i.field === f && i.level === 'blocker')?.message;
  const ok = canApprovePastoral(issues);
  const tr = findTranslation(d.translationCode);

  const preview: PublicPastoralDetails | null =
    reference && tr
      ? {
          reference,
          translationCode: tr.code,
          translationName: tr.name,
          passageMode: d.passageMode,
          passageText: d.passageText.trim() || '…',
          theme: d.theme || 'Sin tema',
          applications: d.applications.map((a) => a.trim()).filter(Boolean),
          prayerInvitation: d.prayerInvitation.trim() || null,
          referenceLabel: `${formatBibleReference(reference)} (${tr.code})`,
          translationNotice: tr.license === 'PUBLIC_DOMAIN' ? `Texto bíblico: ${tr.name} (dominio público).` : `Texto bíblico tomado de la ${tr.name}. © ${tr.holder}.`,
        }
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Mesa Pastoral"
        title="La Voz del Pastor"
        description="“Una pausa entre el caos y el tilt”. Espacio de fe: sin sátira, con cada pasaje verificado contra su traducción."
        actions={<Badge tone={ok ? 'green' : 'gold'}>{ok ? 'Lista para aprobar' : 'Borrador'}</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()} aria-label="Columna pastoral" noValidate>
          <fieldset className="grid gap-4 border-2 border-rule p-4 sm:grid-cols-2">
            <legend className="kicker px-1">Pasaje bíblico</legend>
            <Field id="pa-ref" label="Referencia" required hint="Ej.: Filipenses 4:13 · 1 Corintios 13:4-7" error={d.referenceInput ? err('referenceInput') : undefined}>
              <Input id="pa-ref" list="bible-books" value={d.referenceInput} onChange={(e) => set('referenceInput', e.target.value)} aria-invalid={!!(d.referenceInput && err('referenceInput'))} aria-describedby={describedBy('pa-ref', { hint: true, error: !!(d.referenceInput && err('referenceInput')) })} />
              <datalist id="bible-books">{BIBLE_BOOKS.map((b) => <option key={b.code} value={`${b.name} `} />)}</datalist>
            </Field>
            <Field id="pa-tr" label="Traducción" required hint={tr ? (tr.license === 'PUBLIC_DOMAIN' ? 'Dominio público.' : `Con derechos (© ${tr.holder}). Máx. ${tr.maxQuotedVerses} versículos por columna.`) : undefined}>
              <NativeSelect id="pa-tr" value={d.translationCode} onChange={(e) => set('translationCode', e.target.value)}>
                {BIBLE_TRANSLATIONS.map((t) => <option key={t.code} value={t.code}>{t.code} — {t.name}</option>)}
              </NativeSelect>
            </Field>
            <div className="sm:col-span-2">
              <span className="kicker">Tipo de texto</span>
              <div className="mt-1.5 flex flex-wrap gap-4 text-sm" role="radiogroup" aria-label="Tipo de texto">
                <label className="flex items-center gap-2"><input type="radio" name="mode" checked={d.passageMode === 'QUOTATION'} onChange={() => set('passageMode', 'QUOTATION')} className="accent-[var(--accent)]" />Cita textual (literal de la traducción)</label>
                <label className="flex items-center gap-2"><input type="radio" name="mode" checked={d.passageMode === 'PARAPHRASE'} onChange={() => set('passageMode', 'PARAPHRASE')} className="accent-[var(--accent)]" />Paráfrasis (palabras propias, sin comillas)</label>
              </div>
            </div>
            <div className="sm:col-span-2">
              <Field id="pa-text" label={d.passageMode === 'QUOTATION' ? 'Texto bíblico exacto' : 'Paráfrasis'} required hint={d.passageMode === 'QUOTATION' ? 'Cópialo de una fuente confiable de esa traducción. No lo escribas de memoria.' : 'Resumen fiel del pasaje. Se mostrará etiquetado como paráfrasis.'} error={d.passageText ? err('passageText') : undefined}>
                <Textarea id="pa-text" rows={3} className="min-h-20 font-serif" value={d.passageText} onChange={(e) => set('passageText', e.target.value)} aria-describedby={describedBy('pa-text', { hint: true, error: !!(d.passageText && err('passageText')) })} />
              </Field>
            </div>
            {d.passageMode === 'QUOTATION' && (
              <div className="space-y-3 border-t border-rule-soft pt-3 sm:col-span-2">
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-0.5 size-5 accent-[var(--accent)]" checked={d.verified} onChange={(e) => set('verified', e.target.checked)} />
                  <span>Verifiqué palabra por palabra que el texto coincide con <strong>{tr?.name ?? 'la traducción indicada'}</strong>{reference ? <> en <strong>{formatBibleReference(reference)}</strong></> : null}.</span>
                </label>
                {d.verified && (
                  <Field id="pa-src" label="Fuente de verificación" required hint="Ej.: Biblia impresa RVR1960, edición de bolsillo · sitio oficial de la editorial" error={err('verificationSource')}>
                    <Input id="pa-src" value={d.verificationSource} onChange={(e) => set('verificationSource', e.target.value)} />
                  </Field>
                )}
              </div>
            )}
          </fieldset>

          <fieldset className="grid gap-4 border-2 border-rule p-4">
            <legend className="kicker px-1">Columna</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="pa-title" label="Título" required error={d.title ? err('title') : undefined}><Input id="pa-title" value={d.title} onChange={(e) => set('title', e.target.value)} /></Field>
              <Field id="pa-theme" label="Tema">
                <Input id="pa-theme" list="pastoral-themes" value={d.theme} onChange={(e) => set('theme', e.target.value)} />
                <datalist id="pastoral-themes">{PASTORAL_THEMES.map((t) => <option key={t} value={t} />)}</datalist>
              </Field>
            </div>
            <Field id="pa-sub" label="Subtítulo"><Input id="pa-sub" value={d.subtitle} onChange={(e) => set('subtitle', e.target.value)} /></Field>
            <Field id="pa-body" label="Reflexión" required hint="Comentario de la redacción. Separa párrafos con una línea en blanco. Si citas otro versículo, indica referencia y traducción." error={d.reflection ? err('reflection') : undefined} counter={{ value: d.reflection.length, max: 8000 }}>
              <Textarea id="pa-body" rows={9} className="font-serif" value={d.reflection} onChange={(e) => set('reflection', e.target.value)} />
            </Field>
            <div>
              <span className="kicker">Aplicaciones prácticas</span>
              <ul className="mt-1.5 space-y-2">
                {d.applications.map((a, i) => (
                  <li key={i} className="flex gap-2">
                    <Input aria-label={`Aplicación ${i + 1}`} value={a} onChange={(e) => set('applications', d.applications.map((x, j) => (j === i ? e.target.value : x)))} />
                    <Button type="button" variant="ghost" size="icon" aria-label={`Quitar aplicación ${i + 1}`} disabled={d.applications.length === 1} onClick={() => set('applications', d.applications.filter((_, j) => j !== i))}><Trash2 /></Button>
                  </li>
                ))}
              </ul>
              <Button type="button" variant="outline" size="sm" className="mt-2" disabled={d.applications.length >= 5} onClick={() => set('applications', [...d.applications, ''])}><Plus aria-hidden />Añadir aplicación</Button>
            </div>
            <Field id="pa-pray" label="Invitación a orar" hint="Invitación general. Nunca incluyas peticiones privadas sin permiso explícito.">
              <Textarea id="pa-pray" rows={2} className="min-h-16" value={d.prayerInvitation} onChange={(e) => set('prayerInvitation', e.target.value)} />
            </Field>
            {d.prayerInvitation.trim() && (
              <div className="space-y-1.5 text-sm" role="radiogroup" aria-label="Privacidad de la invitación a orar">
                <label className="flex items-start gap-2"><input type="radio" name="privacy" checked={d.prayerPrivacy === 'NO_PRIVATE_REQUESTS'} onChange={() => set('prayerPrivacy', 'NO_PRIVATE_REQUESTS')} className="mt-0.5 accent-[var(--accent)]" />No menciona peticiones privadas de ninguna persona.</label>
                <label className="flex items-start gap-2"><input type="radio" name="privacy" checked={d.prayerPrivacy === 'CONSENT_RECORDED'} onChange={() => set('prayerPrivacy', 'CONSENT_RECORDED')} className="mt-0.5 accent-[var(--accent)]" />Menciona una petición y la persona dio permiso explícito para publicarla.</label>
                {err('prayerPrivacy') && <p role="alert" className="text-xs font-semibold text-accent">{err('prayerPrivacy')}</p>}
              </div>
            )}
          </fieldset>

          <div className="border-2 border-dashed border-rule-soft p-4 text-sm text-fg-muted">
            <p className="font-semibold text-fg">Ilustración pastoral</p>
            <p>Prepara el brief en Creative Studio (tipo “Ilustración pastoral”), créala con ChatGPT y súbela aprobada. Asociación de imágenes: Fase 6.</p>
          </div>
        </form>

        <aside className="space-y-4" aria-label="Revisión editorial">
          <section className="border-2 border-rule p-4">
            <h2 className="kicker mb-2">Revisión</h2>
            {issues.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-green"><CheckCircle2 aria-hidden className="size-4" />Sin observaciones.</p>
            ) : (
              <ul className="space-y-2 text-xs" aria-label="Observaciones">
                {issues.map((i) => (
                  <li key={`${i.field}-${i.message}`} className="flex gap-2">
                    {i.level === 'blocker' ? <OctagonX aria-hidden className="size-4 shrink-0 text-accent" /> : <AlertTriangle aria-hidden className="size-4 shrink-0 text-gold" />}
                    <span><span className="sr-only">{i.level === 'blocker' ? 'Bloqueante: ' : 'Aviso: '}</span>{i.message}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex flex-col gap-2">
              <Button type="button" variant="outline" onClick={() => setShowPreview(true)} disabled={!preview}><Eye aria-hidden />Vista previa</Button>
              <Button type="button" disabled title={ok ? 'Disponible en la Fase 4' : 'Resuelve los bloqueos'}><Send aria-hidden />Aprobar para la edición</Button>
              {appConfig.demoMode && <p className="text-[0.7rem] text-fg-muted">Modo demo: nada se guarda.</p>}
            </div>
          </section>
          <section className="border-2 border-rule p-4">
            <h2 className="kicker mb-2 flex items-center gap-1.5"><BookOpen aria-hidden className="size-3.5" />Archivo (demo)</h2>
            <ul className="divide-y divide-rule-soft text-sm">
              {demoPastoralArchive.map((a) => (
                <li key={a.id} className="py-2">
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-xs text-fg-muted">N.º {a.editionNumber} · {a.reference} · {a.theme}</p>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {showPreview && preview && (
        <section aria-labelledby="pa-preview" className="border-2 border-rule">
          <header className="flex items-center justify-between border-b-2 border-rule bg-surface-raised px-3 py-2">
            <h2 id="pa-preview" className="kicker">Vista previa (así se verá en el periódico)</h2>
            {!ok && <Badge tone="redOutline">No publicable todavía</Badge>}
          </header>
          <PastoralColumn
            title={d.title || 'Título de la columna'}
            subtitle={d.subtitle}
            details={preview}
            body={{ type: 'doc', content: d.reflection.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean).map((x) => p(x)) }}
            artwork={null}
          />
        </section>
      )}
      <PhaseNotice phase={4}>Guardado, versiones, aprobación y asignación a la edición usan el mismo sistema de artículos (categoría PASTORAL) y quedan auditados.</PhaseNotice>
    </div>
  );
}
