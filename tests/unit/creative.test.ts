import { describe, expect, it } from 'vitest';
import { bibleToMarkdown, CREATIVE_BIBLE_V1 } from '@shared/creative/bible';
import { briefWarnings, buildCreativeBrief, type BriefInput } from '@shared/creative/brief';
import { buildWhatsAppAnnouncement, whatsappShareUrl } from '@shared/creative/whatsapp';

const base: BriefInput = {
  bible: CREATIVE_BIBLE_V1,
  role: 'COVER',
  edition: { number: 7, publicationDate: '2026-11-13', headline: 'TITULAR APROBADO' },
  article: { title: 'Artículo', summary: 'Resumen', approvedFacts: ['Hecho aprobado 1'] },
  characters: ['Personaje A'],
  composition: 'Plano general',
  placement: 'Portada',
  exclusions: ['Sin sangre'],
  references: [],
  quotes: [{ text: 'Frase EXACTA, mano…', attribution: 'Personaje A' }],
  lpFigures: ['Grupo: +6 LP'],
};

describe('Creative Studio — brief para ChatGPT', () => {
  const brief = buildCreativeBrief(base);
  it('incluye metadatos, especificación y reglas editoriales', () => {
    expect(brief).toContain('Director Creativo de EL CORRAL TIMES');
    expect(brief).toContain('No generes la imagen final');
    expect(brief).toContain('16:9');
    expect(brief).toContain('TITULAR APROBADO');
    expect(brief).toContain('No reutilizar eventos de ediciones anteriores.');
    expect(brief).toContain('Filipenses 4:13');
  });
  it('preserva frases y cifras exactas', () => {
    expect(brief).toContain('“Frase EXACTA, mano…” — Personaje A');
    expect(brief).toContain('Grupo: +6 LP');
  });
  it('es determinista', () => {
    expect(buildCreativeBrief(base)).toBe(brief);
  });
  it('advierte cuando faltan hechos aprobados o el logo está pendiente', () => {
    const w = briefWarnings({ ...base, article: { title: 'x', summary: 'y', approvedFacts: [] } }).map((x) => x.code);
    expect(w).toContain('NO_FACTS');
    expect(w).toContain('LOGO_PENDING');
  });
  it('la biblia se exporta a Markdown sin noticias', () => {
    const md = bibleToMarkdown(CREATIVE_BIBLE_V1);
    expect(md).toContain('# Corral Creative Bible v1.0.0');
    expect(md).toContain('#A73429');
  });
});

describe('anuncio de WhatsApp', () => {
  it('incluye titular real y URL canónica', () => {
    const msg = buildWhatsAppAnnouncement({ editionNumber: 3, headline: 'SE PRENDIÓ EL GALLINERO', teaser: 'Resumen.', url: 'https://corral.test/ediciones/edicion-003-2026-11-20' });
    expect(msg).toContain('Edición N.º 3');
    expect(msg).toContain('*SE PRENDIÓ EL GALLINERO*');
    expect(msg.trim().endsWith('https://corral.test/ediciones/edicion-003-2026-11-20')).toBe(true);
  });
  it('codifica el texto en el enlace wa.me', () => {
    expect(whatsappShareUrl('a b&c')).toBe('https://wa.me/?text=a%20b%26c');
  });
});

describe('brief de ilustración pastoral', () => {
  const pastoral = buildCreativeBrief({ ...base, role: 'PASTORAL_ILLUSTRATION', article: undefined, quotes: undefined, lpFigures: undefined, scripture: { reference: 'Filipenses 4:13', translation: 'RVR1909', theme: 'Fortaleza' } });
  it('declara que no es satírico e incluye la referencia sin pedir texto en la imagen', () => {
    expect(pastoral).toContain('LA VOZ DEL PASTOR');
    expect(pastoral).toContain('NO es satírica');
    expect(pastoral).toContain('Filipenses 4:13 (RVR1909)');
    expect(pastoral).toContain('El texto del versículo NO se escribe en la imagen.');
    expect(pastoral).toContain('Caricaturizar o ridiculizar');
    expect(pastoral).toContain('3:2');
  });
  it('advierte si falta la referencia bíblica', () => {
    expect(briefWarnings({ ...base, role: 'PASTORAL_ILLUSTRATION' }).map((w) => w.message).join(' ')).toMatch(/referencia bíblica/);
  });
});
