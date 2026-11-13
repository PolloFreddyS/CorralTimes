import { MEDIA_ROLE_SPECS, type MediaRole } from '../domain/workflow';
import { bibleToMarkdown, type CreativeBible } from './bible';

/**
 * Generador de briefs creativos para ChatGPT (Creative Studio, Modo A).
 * Puro y determinista: mismo input → mismo brief. No llama a ninguna API.
 */
export interface BriefInput {
  bible: CreativeBible;
  role: MediaRole;
  edition: { number: number; publicationDate: string; headline: string };
  article?: { title: string; summary: string; approvedFacts: string[] };
  characters: string[];
  composition: string;
  placement: string;
  exactText?: string;
  exclusions: string[];
  references: { label: string; description: string }[];
  quotes?: { text: string; attribution: string }[];
  lpFigures?: string[];
  /** Solo PASTORAL_ILLUSTRATION: referencia verificada (el texto bíblico no va dentro de la imagen). */
  scripture?: { reference: string; translation: string; theme: string };
}

export interface BriefWarning {
  code: 'NO_FACTS' | 'EXACT_TEXT_IN_IMAGE' | 'NO_ALT_CONTEXT' | 'LOGO_PENDING';
  message: string;
}

export function briefWarnings(i: BriefInput): BriefWarning[] {
  const w: BriefWarning[] = [];
  if (!i.article?.approvedFacts.length && !['SECTION_BANNER', 'CHARACTER_ASSET', 'PASTORAL_ILLUSTRATION'].includes(i.role)) {
    w.push({ code: 'NO_FACTS', message: 'No hay hechos aprobados: el brief no debe inventar contexto.' });
  }
  if (i.exactText && i.exactText.length > 40) {
    w.push({ code: 'EXACT_TEXT_IN_IMAGE', message: 'Texto largo dentro de la imagen: mejor componerlo en HTML para garantizar exactitud.' });
  }
  if (i.role === 'PASTORAL_ILLUSTRATION' && !i.scripture) {
    w.push({ code: 'NO_FACTS', message: 'Selecciona la columna pastoral para incluir la referencia bíblica verificada.' });
  }
  if (i.bible.logo.status === 'PENDING') {
    w.push({ code: 'LOGO_PENDING', message: 'El logo oficial no está registrado: no pedir a ChatGPT que lo dibuje.' });
  }
  return w;
}

export function buildCreativeBrief(i: BriefInput): string {
  const spec = MEDIA_ROLE_SPECS[i.role];
  const pastoral = i.role === 'PASTORAL_ILLUSTRATION';
  const list = (xs: string[]) => (xs.length ? xs.map((x) => `- ${x}`).join('\n') : '- _(ninguno)_');
  const sections = [
    `# Brief creativo — ${spec.label}`,
    `Actúa como **Director Creativo de EL CORRAL TIMES**. Prepara la propuesta visual descrita abajo. ` +
      `**No generes la imagen final hasta que el dueño lo pida explícitamente.**`,
    ...(pastoral
      ? [
          `## Sección: LA VOZ DEL PASTOR — “Una pausa entre el caos y el tilt”\n` +
            `Esta pieza NO es satírica. Es un espacio de fe y reflexión.\n${list(i.bible.pastoral.tone)}` +
            (i.scripture ? `\n\n### Pasaje de la semana\n- Referencia: ${i.scripture.reference} (${i.scripture.translation})\n- Tema: ${i.scripture.theme}\n- El texto del versículo NO se escribe en la imagen.` : ''),
        ]
      : []),
    `## Edición\n- Número: ${i.edition.number}\n- Fecha de publicación: ${i.edition.publicationDate}\n- Titular principal: “${i.edition.headline}”`,
    `## Pieza\n- Rol: ${i.role} (${spec.label})\n- Relación de aspecto: ${spec.aspect} · tamaño objetivo ${spec.width}×${spec.height} px\n- Ubicación: ${i.placement}`,
  ];
  if (i.article) {
    sections.push(`## Artículo\n**${i.article.title}**\n\n${i.article.summary}\n\n### Hechos aprobados (no añadir otros)\n${list(i.article.approvedFacts)}`);
  }
  if (i.quotes?.length) sections.push(`## Frases textuales (copiar EXACTAS si aparecen)\n${i.quotes.map((q) => `- “${q.text}” — ${q.attribution}`).join('\n')}`);
  if (i.lpFigures?.length) sections.push(`## Cifras LP (no alterar)\n${list(i.lpFigures)}`);
  sections.push(
    `## Personajes\n${list(i.characters)}`,
    `## Composición deseada\n${i.composition || '_(a propuesta del director creativo)_'}`,
    `## Texto exacto en la imagen\n${i.exactText ? `“${i.exactText}” (copiar letra por letra)` : 'Ninguno. Titulares, nombres y LP se componen fuera de la imagen.'}`,
    `## Exclusiones\n${list([...i.exclusions, ...i.bible.prohibited, ...(pastoral ? i.bible.pastoral.prohibited : [])])}`,
    `## Referencias aprobadas (el dueño las adjunta en ChatGPT)\n${i.references.length ? i.references.map((r) => `- **${r.label}**: ${r.description}`).join('\n') : '- _(ninguna)_'}`,
    `## Reglas editoriales\n${list(i.bible.editorialRules)}`,
    `---\n\n${bibleToMarkdown(i.bible)}`,
  );
  return sections.join('\n\n') + '\n';
}
