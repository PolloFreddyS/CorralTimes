import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Megaphone, PauseCircle, Send } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { brand } from '@/branding/brand.config';
import { BreakingNewsBanner, EditorialStamp, NewspaperMasthead, RumorLabel } from '@/components/editorial';
import { Button } from '@/components/ui/button';
import { describedBy, Field, Input, NativeSelect, Textarea } from '@/components/ui/form';
import { apiFetch, ApiError, type IntakeStatus } from '@/lib/api';
import { appConfig } from '@/lib/env';
import { editionClock, localDateIn, NEWSROOM_TIME_ZONE } from '@shared/domain/edition-calendar';
import {
  buildSubmissionSchema,
  CATEGORY_LABELS,
  SUBMISSION_CATEGORIES,
  SUBMISSION_LIMITS,
  type SubmissionInput,
  type SubmissionPayload,
} from '@shared/domain/submission';

type Receipt = { receipt: string; demo: boolean };

function demoReceipt(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return `CT-DEMO-${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')}`;
}

export function PressPassPage() {
  const today = useMemo(() => localDateIn(NEWSROOM_TIME_ZONE, new Date()), []);
  const clock = useMemo(() => editionClock(new Date()), []);
  const schema = useMemo(() => buildSubmissionSchema(today), [today]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const idempotencyKey = useRef<string>(crypto.randomUUID());

  const intake = useQuery({
    queryKey: ['intake-status'],
    queryFn: () => apiFetch<IntakeStatus>('/public/intake-status'),
    enabled: !appConfig.demoMode,
    retry: 1,
  });

  const form = useForm<SubmissionInput, unknown, SubmissionPayload>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { reporterAlias: '', headline: '', description: '', eventDate: today, permissionAcknowledged: false as unknown as true },
  });
  const { register, handleSubmit, control, formState, reset } = form;
  const errors = formState.errors;
  const category = useWatch({ control, name: 'category' });
  const headline = useWatch({ control, name: 'headline' }) ?? '';
  const description = useWatch({ control, name: 'description' }) ?? '';

  const submit = useMutation({
    mutationFn: async (payload: SubmissionPayload): Promise<Receipt> => {
      if (appConfig.demoMode) {
        await new Promise((r) => setTimeout(r, 400));
        return { receipt: demoReceipt(), demo: true };
      }
      const res = await apiFetch<{ receipt: string }>('/public/submissions', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Idempotency-Key': idempotencyKey.current },
      });
      return { receipt: res.receipt, demo: false };
    },
    onSuccess: (r) => {
      setReceipt(r);
      reset();
      idempotencyKey.current = crypto.randomUUID();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  const closed = !appConfig.demoMode && intake.data && !intake.data.open;

  return (
    <div>
      <NewspaperMasthead publicationDate={clock.publicationDate} />
      <section className="mt-5">
        <p className="kicker text-accent">Corral Press Pass</p>
        <h2 className="headline mt-1 text-4xl sm:text-6xl">¿QUÉ PASÓ EN EL GALLINERO?</h2>
        <p className="mt-2 font-headline text-lg italic sm:text-xl">Reporta la noticia. Nosotros hacemos el escándalo.</p>
      </section>

      {appConfig.demoMode && (
        <BreakingNewsBanner label="Modo demo" className="mt-4">
          Este formulario no envía nada a la redacción: es una vista previa de desarrollo.
        </BreakingNewsBanner>
      )}

      {receipt ? (
        <section role="status" aria-live="polite" className="mt-6 border-2 border-rule bg-surface-raised p-6 text-center">
          <CheckCircle2 aria-hidden className="mx-auto size-10 text-green" />
          <h3 className="headline mt-2 text-3xl">¡Recibido en la redacción!</h3>
          <p className="mt-2 font-serif">Tu reporte queda en manos de los editores. Toda noticia pasa por revisión antes de imprimirse.</p>
          <p className="mt-4 kicker text-fg-muted">Comprobante</p>
          <p className="font-mono text-xl font-semibold">{receipt.receipt}</p>
          {receipt.demo && <EditorialStamp tone="demo" className="mt-3">Demo · no enviado</EditorialStamp>}
          <div className="mt-6">
            <Button variant="ink" onClick={() => setReceipt(null)}>Reportar otra noticia</Button>
          </div>
        </section>
      ) : closed ? (
        <section role="status" className="mt-6 border-2 border-rule bg-surface-raised p-6 text-center">
          <PauseCircle aria-hidden className="mx-auto size-10 text-accent" />
          <h3 className="headline mt-2 text-3xl">Rotativas en pausa</h3>
          <p className="mt-2 font-serif">
            {intake.data?.mode === 'paused'
              ? 'La redacción no está recibiendo noticias en este momento. Vuelve pronto: el gallinero nunca descansa.'
              : 'La recepción de noticias todavía no está habilitada. Vuelve pronto.'}
          </p>
        </section>
      ) : intake.isLoading ? (
        <p className="mt-8 flex items-center justify-center gap-2 text-sm text-fg-muted"><Loader2 aria-hidden className="size-4 animate-spin" />Consultando a la redacción…</p>
      ) : intake.isError ? (
        <section role="alert" className="mt-6 border-2 border-accent p-6 text-center">
          <h3 className="headline text-2xl">Se cayó la línea con la redacción</h3>
          <p className="mt-2 font-serif text-sm">Intenta de nuevo en unos minutos.</p>
          <Button className="mt-4" variant="outline" onClick={() => void intake.refetch()}>Reintentar</Button>
        </section>
      ) : (
        <form noValidate onSubmit={handleSubmit((d) => submit.mutate(d))} className="mt-6 space-y-5" aria-describedby="form-intro">
          <p id="form-intro" className="text-sm text-fg-muted">
            Los campos con <span className="text-accent">*</span> son obligatorios. Tu nombre de reportero no se verifica: es solo para la firma.
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="reporterAlias" label="Nombre de reportero" required error={errors.reporterAlias?.message}>
              <Input id="reporterAlias" autoComplete="nickname" maxLength={SUBMISSION_LIMITS.reporterAlias.max} aria-invalid={!!errors.reporterAlias} aria-describedby={describedBy('reporterAlias', { error: !!errors.reporterAlias })} {...register('reporterAlias')} />
            </Field>
            <Field id="category" label="Categoría" required error={errors.category?.message}>
              <NativeSelect id="category" defaultValue="" aria-invalid={!!errors.category} aria-describedby={describedBy('category', { error: !!errors.category })} {...register('category')}>
                <option value="" disabled>Elige una…</option>
                {SUBMISSION_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </NativeSelect>
            </Field>
          </div>

          {category === 'RUMOR' && (
            <div className="flex flex-wrap items-center gap-2 border border-dashed border-accent p-3 text-sm">
              <RumorLabel />
              <span>Los rumores se publican siempre como <strong>no verificados</strong>.</span>
            </div>
          )}

          <Field id="headline" label="Titular o resumen corto" required error={errors.headline?.message} counter={{ value: headline.length, max: SUBMISSION_LIMITS.headline.max }}>
            <Input id="headline" aria-invalid={!!errors.headline} aria-describedby={describedBy('headline', { error: !!errors.headline })} {...register('headline')} />
          </Field>

          <Field id="description" label="¿Qué pasó?" required hint="Cuéntalo con detalle: quién, qué, dónde, cómo." error={errors.description?.message} counter={{ value: description.length, max: SUBMISSION_LIMITS.description.max }}>
            <Textarea id="description" rows={6} aria-invalid={!!errors.description} aria-describedby={describedBy('description', { hint: true, error: !!errors.description })} {...register('description')} />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="eventDate" label="Fecha del evento" required error={errors.eventDate?.message}>
              <Input id="eventDate" type="date" max={today} aria-invalid={!!errors.eventDate} aria-describedby={describedBy('eventDate', { error: !!errors.eventDate })} {...register('eventDate')} />
            </Field>
            <Field id="peopleInvolved" label="Personas involucradas" error={errors.peopleInvolved?.message}>
              <Input id="peopleInvolved" aria-invalid={!!errors.peopleInvolved} {...register('peopleInvolved')} />
            </Field>
          </div>

          <Field id="exactQuote" label="Frase exacta" required={category === 'FRASE_LEGENDARIA'} hint="Copia la frase tal cual. La redacción la conserva sin cambios." error={errors.exactQuote?.message}>
            <Textarea id="exactQuote" rows={2} className="min-h-16" aria-invalid={!!errors.exactQuote} aria-describedby={describedBy('exactQuote', { hint: true, error: !!errors.exactQuote })} {...register('exactQuote')} />
          </Field>

          <Field id="evidence" label="Imagen de apoyo" hint={`PNG, JPG o WebP · máximo ${SUBMISSION_LIMITS.imageMaxBytes / 1024 / 1024} MB. La subida segura se habilita en la Fase 3.`} error={fileError ?? undefined}>
            <Input
              id="evidence"
              type="file"
              accept={SUBMISSION_LIMITS.imageMimeTypes.join(',')}
              className="h-auto py-2 file:mr-3 file:border file:border-rule file:bg-surface-sunken file:px-2 file:py-1 file:font-sans file:text-xs file:font-semibold"
              aria-describedby={describedBy('evidence', { hint: true, error: !!fileError })}
              onChange={(e) => {
                const f = e.currentTarget.files?.[0];
                if (!f) return setFileError(null);
                if (!(SUBMISSION_LIMITS.imageMimeTypes as readonly string[]).includes(f.type)) return setFileError('Formato no permitido. Usa PNG, JPG o WebP.');
                if (f.size > SUBMISSION_LIMITS.imageMaxBytes) return setFileError('La imagen pasa de 5 MB.');
                setFileError(null);
              }}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="source" label="Fuente o contexto" error={errors.source?.message}>
              <Input id="source" placeholder="Partida, canal, captura…" aria-invalid={!!errors.source} {...register('source')} />
            </Field>
            <Field id="notes" label="Notas para la redacción" error={errors.notes?.message}>
              <Input id="notes" aria-invalid={!!errors.notes} {...register('notes')} />
            </Field>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" aria-invalid={!!errors.permissionAcknowledged} aria-describedby={describedBy('permissionAcknowledged', { error: !!errors.permissionAcknowledged })} {...register('permissionAcknowledged')} />
              <span>Confirmo que tengo permiso para enviar este material y que no incluye conversaciones privadas sin consentimiento.</span>
            </label>
            {errors.permissionAcknowledged && (
              <p id="permissionAcknowledged-error" role="alert" className="text-xs font-semibold text-accent">{errors.permissionAcknowledged.message}</p>
            )}
          </div>

          <div className="border border-dashed border-rule-soft p-3 text-xs text-fg-muted">
            Verificación anti-bots (Cloudflare Turnstile) — se activa en la Fase 3.
          </div>

          {submit.isError && (
            <p role="alert" className="border-2 border-accent p-3 text-sm">
              {submit.error instanceof ApiError ? submit.error.message : 'No pudimos enviar tu reporte. Intenta de nuevo.'}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={submit.isPending || !!fileError}>
            {submit.isPending ? <Loader2 aria-hidden className="animate-spin" /> : <Send aria-hidden />}
            {submit.isPending ? 'Enviando…' : 'Enviar a la redacción'}
          </Button>
        </form>
      )}

      <aside className="mt-10 grid gap-4 border-t-4 border-double border-rule pt-4 text-sm sm:grid-cols-3">
        <div className="flex gap-2"><Megaphone aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" /><p>Toda noticia pasa por revisión editorial antes de publicarse.</p></div>
        <div className="flex gap-2"><Megaphone aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" /><p>Nadie puede ver ni editar tu reporte después de enviarlo.</p></div>
        <div className="flex gap-2"><Megaphone aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" /><p>{brand.name} sale los {brand.publicationDay.toLowerCase()}.</p></div>
      </aside>
    </div>
  );
}
