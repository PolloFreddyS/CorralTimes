import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Check, Copy, Download, Sparkles, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader, PhaseNotice } from '@/components/layout/PageHeader';
import { ErrorState, LoadingRows } from '@/components/layout/QueryState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input, NativeSelect, Textarea } from '@/components/ui/form';
import { demoPastoralArchive } from '@/demo/fixtures';
import { editionQuery, storiesQuery } from '@/lib/demo-queries';
import { copyText, downloadText } from '@/lib/download';
import { bibleToMarkdown, CREATIVE_BIBLE_SEED } from '@shared/creative/bible';
import { briefWarnings, buildCreativeBrief, type BriefInput } from '@shared/creative/brief';
import { MEDIA_ROLE_SPECS, MEDIA_ROLES, type MediaRole } from '@shared/domain/workflow';

/**
 * CORRAL AI CREATIVE STUDIO.
 * Modo A (por defecto): genera un brief estructurado → el dueño lo lleva a ChatGPT → sube la imagen aprobada.
 * Modo B (opcional, Fase 10): generación vía API de OpenAI con claves solo en el servidor.
 */
export function CreativeStudioPage() {
  const edition = useQuery(editionQuery);
  const stories = useQuery(storiesQuery);
  const [role, setRole] = useState<MediaRole>('COVER');
  const [storyId, setStoryId] = useState<string>('');
  const [composition, setComposition] = useState('');
  const [exactText, setExactText] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [copied, setCopied] = useState(false);

  const story = stories.data?.find((s) => s.id === storyId);
  const input: BriefInput | null = useMemo(() => {
    if (!edition.data) return null;
    return {
      bible: CREATIVE_BIBLE_SEED,
      role,
      edition: { number: edition.data.number, publicationDate: edition.data.publicationDate, headline: stories.data?.find((s) => s.section === 'PORTADA')?.headline ?? '(sin titular principal)' },
      ...(story ? { article: { title: story.headline, summary: story.satiricalBody, approvedFacts: story.approved ? [story.satiricalBody].filter(Boolean) : [] } } : {}),
      characters: [],
      composition,
      placement: MEDIA_ROLE_SPECS[role].label,
      ...(exactText ? { exactText } : {}),
      exclusions: exclusions.split('\n').map((x) => x.trim()).filter(Boolean),
      references: [],
      ...(story?.exactQuote ? { quotes: [{ text: story.exactQuote, attribution: story.quoteAttribution ?? 'Sin atribución' }] } : {}),
      ...(role === 'PASTORAL_ILLUSTRATION' && demoPastoralArchive[0] ? { scripture: { reference: demoPastoralArchive[0].verse, translation: demoPastoralArchive[0].translation, theme: demoPastoralArchive[0].theme } } : {}),
    };
  }, [edition.data, stories.data, story, role, composition, exactText, exclusions]);

  if (edition.error || stories.error) return <ErrorState error={edition.error ?? stories.error} />;
  if (!input) return <LoadingRows />;
  const brief = buildCreativeBrief(input);
  const warnings = briefWarnings(input);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Corral AI Creative Studio"
        title="Del brief a la portada"
        description="ChatGPT es el director creativo oficial. Aquí se prepara el brief; la imagen se crea y aprueba en ChatGPT y luego se sube a HQ."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => downloadText(`creative-bible-v${CREATIVE_BIBLE_SEED.version}.md`, bibleToMarkdown(CREATIVE_BIBLE_SEED))}><Download aria-hidden />Biblia (.md)</Button>
            <Button variant="outline" size="sm" onClick={() => downloadText(`creative-bible-v${CREATIVE_BIBLE_SEED.version}.json`, JSON.stringify(CREATIVE_BIBLE_SEED, null, 2), 'application/json')}><Download aria-hidden />Biblia (.json)</Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border-2 border-green p-3">
          <p className="kicker text-green">Modo A · ChatGPT (por defecto)</p>
          <p className="mt-1 text-sm">Brief → ChatGPT → aprobación del dueño → subida a HQ. <Badge tone="green">Activo</Badge></p>
        </div>
        <div className="border-2 border-dashed border-rule-soft p-3">
          <p className="kicker text-fg-muted">Modo B · API de OpenAI (opcional)</p>
          <p className="mt-1 text-sm text-fg-muted">No configurado. Requiere clave en el servidor, modelo configurable y presupuesto (Fase 10). El resto del sistema funciona sin él.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[22rem_1fr]">
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()} aria-label="Parámetros del brief">
          <Field id="cs-role" label="Tipo de pieza" required>
            <NativeSelect id="cs-role" value={role} onChange={(e) => setRole(e.target.value as MediaRole)}>
              {MEDIA_ROLES.map((r) => <option key={r} value={r}>{MEDIA_ROLE_SPECS[r].label} · {MEDIA_ROLE_SPECS[r].aspect}</option>)}
            </NativeSelect>
          </Field>
          <Field id="cs-story" label="Artículo asociado">
            <NativeSelect id="cs-story" value={storyId} onChange={(e) => setStoryId(e.target.value)}>
              <option value="">Ninguno (pieza de edición)</option>
              {stories.data?.map((s) => <option key={s.id} value={s.id}>{s.headline}</option>)}
            </NativeSelect>
          </Field>
          <Field id="cs-comp" label="Composición deseada">
            <Textarea id="cs-comp" rows={3} value={composition} onChange={(e) => setComposition(e.target.value)} placeholder="Plano general de una redacción caótica, estilo grabado de periódico…" />
          </Field>
          <Field id="cs-text" label="Texto exacto dentro de la imagen" hint="Mejor dejarlo vacío: titulares y LP se componen en HTML.">
            <Input id="cs-text" value={exactText} onChange={(e) => setExactText(e.target.value)} />
          </Field>
          <Field id="cs-excl" label="Exclusiones (una por línea)">
            <Textarea id="cs-excl" rows={2} className="min-h-16" value={exclusions} onChange={(e) => setExclusions(e.target.value)} />
          </Field>
          {warnings.length > 0 && (
            <ul className="space-y-1.5" aria-label="Advertencias del brief">
              {warnings.map((w) => <li key={w.code} className="flex items-start gap-2 text-xs"><AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0 text-gold" />{w.message}</li>)}
            </ul>
          )}
        </form>

        <section aria-labelledby="brief-out" className="min-w-0 border-2 border-rule">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-rule bg-surface-raised px-3 py-2">
            <h2 id="brief-out" className="kicker inline-flex items-center gap-1.5"><Sparkles aria-hidden className="size-4 text-gold" />Brief para ChatGPT</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="gold" onClick={async () => { setCopied(await copyText(brief)); window.setTimeout(() => setCopied(false), 2000); }}>
                {copied ? <Check aria-hidden /> : <Copy aria-hidden />}{copied ? 'Copiado' : 'Copiar brief'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadText(`brief-${role.toLowerCase()}.md`, brief)}><Download aria-hidden />.md</Button>
            </div>
          </header>
          <pre className="max-h-[32rem] overflow-auto p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">{brief}</pre>
        </section>
      </div>

      <section aria-labelledby="upload-title" className="border-2 border-dashed border-rule-soft p-6 text-center">
        <Upload aria-hidden className="mx-auto size-8 text-fg-muted" />
        <h2 id="upload-title" className="headline mt-2 text-xl">Subir imagen aprobada en ChatGPT</h2>
        <p className="mt-1 text-sm text-fg-muted">Arrastrar y soltar, versiones, recortes, derivados WebP/AVIF, texto alternativo y aprobación.</p>
        <Button className="mt-3" variant="outline" disabled>Seleccionar archivo</Button>
      </section>
      <PhaseNotice phase={6}>Biblioteca de medios (Supabase Storage privado → derivados públicos solo tras aprobación) y exportación del paquete creativo ZIP.</PhaseNotice>
    </div>
  );
}
