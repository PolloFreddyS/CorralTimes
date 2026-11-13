/**
 * Referencias bíblicas — LA VOZ DEL PASTOR.
 * Canon protestante de 66 libros con nombres en español y número de capítulos según la tradición
 * Reina-Valera (p. ej. Joel 3 y Malaquías 4). El número de VERSÍCULOS por capítulo no se valida aquí:
 * la existencia exacta del versículo y su texto los verifica un administrador contra la traducción citada.
 * Este módulo nunca genera texto bíblico.
 */

export interface BibleBook {
  code: string;
  name: string;
  testament: 'AT' | 'NT';
  chapters: number;
  aliases: string[];
}

const B = (code: string, name: string, testament: 'AT' | 'NT', chapters: number, ...aliases: string[]): BibleBook => ({ code, name, testament, chapters, aliases });

export const BIBLE_BOOKS: readonly BibleBook[] = [
  B('GEN', 'Génesis', 'AT', 50, 'Gn', 'Gen'),
  B('EXO', 'Éxodo', 'AT', 40, 'Ex', 'Éx'),
  B('LEV', 'Levítico', 'AT', 27, 'Lv'),
  B('NUM', 'Números', 'AT', 36, 'Nm'),
  B('DEU', 'Deuteronomio', 'AT', 34, 'Dt'),
  B('JOS', 'Josué', 'AT', 24, 'Jos'),
  B('JDG', 'Jueces', 'AT', 21, 'Jue'),
  B('RUT', 'Rut', 'AT', 4, 'Rt'),
  B('1SA', '1 Samuel', 'AT', 31, '1 S', '1 Sam'),
  B('2SA', '2 Samuel', 'AT', 24, '2 S', '2 Sam'),
  B('1KI', '1 Reyes', 'AT', 22, '1 R'),
  B('2KI', '2 Reyes', 'AT', 25, '2 R'),
  B('1CH', '1 Crónicas', 'AT', 29, '1 Cr'),
  B('2CH', '2 Crónicas', 'AT', 36, '2 Cr'),
  B('EZR', 'Esdras', 'AT', 10, 'Esd'),
  B('NEH', 'Nehemías', 'AT', 13, 'Neh'),
  B('EST', 'Ester', 'AT', 10, 'Est'),
  B('JOB', 'Job', 'AT', 42),
  B('PSA', 'Salmos', 'AT', 150, 'Salmo', 'Sal'),
  B('PRO', 'Proverbios', 'AT', 31, 'Pr', 'Prov'),
  B('ECC', 'Eclesiastés', 'AT', 12, 'Ec', 'Ecl'),
  B('SNG', 'Cantares', 'AT', 8, 'Cantar de los Cantares', 'Cnt', 'Cant'),
  B('ISA', 'Isaías', 'AT', 66, 'Is'),
  B('JER', 'Jeremías', 'AT', 52, 'Jer'),
  B('LAM', 'Lamentaciones', 'AT', 5, 'Lm', 'Lam'),
  B('EZK', 'Ezequiel', 'AT', 48, 'Ez'),
  B('DAN', 'Daniel', 'AT', 12, 'Dn'),
  B('HOS', 'Oseas', 'AT', 14, 'Os'),
  B('JOL', 'Joel', 'AT', 3, 'Jl'),
  B('AMO', 'Amós', 'AT', 9, 'Am'),
  B('OBA', 'Abdías', 'AT', 1, 'Abd'),
  B('JON', 'Jonás', 'AT', 4, 'Jon'),
  B('MIC', 'Miqueas', 'AT', 7, 'Mi', 'Miq'),
  B('NAM', 'Nahúm', 'AT', 3, 'Nah'),
  B('HAB', 'Habacuc', 'AT', 3, 'Hab'),
  B('ZEP', 'Sofonías', 'AT', 3, 'Sof'),
  B('HAG', 'Hageo', 'AT', 2, 'Hag'),
  B('ZEC', 'Zacarías', 'AT', 14, 'Zac'),
  B('MAL', 'Malaquías', 'AT', 4, 'Mal'),
  B('MAT', 'Mateo', 'NT', 28, 'Mt'),
  B('MRK', 'Marcos', 'NT', 16, 'Mr', 'Mc'),
  B('LUK', 'Lucas', 'NT', 24, 'Lc'),
  B('JHN', 'Juan', 'NT', 21, 'Jn'),
  B('ACT', 'Hechos', 'NT', 28, 'Hch'),
  B('ROM', 'Romanos', 'NT', 16, 'Ro', 'Rom'),
  B('1CO', '1 Corintios', 'NT', 16, '1 Co', '1 Cor'),
  B('2CO', '2 Corintios', 'NT', 13, '2 Co', '2 Cor'),
  B('GAL', 'Gálatas', 'NT', 6, 'Gá', 'Gal'),
  B('EPH', 'Efesios', 'NT', 6, 'Ef'),
  B('PHP', 'Filipenses', 'NT', 4, 'Fil', 'Flp'),
  B('COL', 'Colosenses', 'NT', 4, 'Col'),
  B('1TH', '1 Tesalonicenses', 'NT', 5, '1 Ts', '1 Tes'),
  B('2TH', '2 Tesalonicenses', 'NT', 3, '2 Ts', '2 Tes'),
  B('1TI', '1 Timoteo', 'NT', 6, '1 Ti', '1 Tim'),
  B('2TI', '2 Timoteo', 'NT', 4, '2 Ti', '2 Tim'),
  B('TIT', 'Tito', 'NT', 3, 'Tit'),
  B('PHM', 'Filemón', 'NT', 1, 'Flm'),
  B('HEB', 'Hebreos', 'NT', 13, 'He', 'Heb'),
  B('JAS', 'Santiago', 'NT', 5, 'Stg'),
  B('1PE', '1 Pedro', 'NT', 5, '1 P', '1 Pe'),
  B('2PE', '2 Pedro', 'NT', 3, '2 P', '2 Pe'),
  B('1JN', '1 Juan', 'NT', 5, '1 Jn'),
  B('2JN', '2 Juan', 'NT', 1, '2 Jn'),
  B('3JN', '3 Juan', 'NT', 1, '3 Jn'),
  B('JUD', 'Judas', 'NT', 1, 'Jud'),
  B('REV', 'Apocalipsis', 'NT', 22, 'Ap', 'Apoc'),
];

const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').replace(/\./g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const BOOK_INDEX = new Map<string, BibleBook>();
for (const b of BIBLE_BOOKS) for (const n of [b.name, b.code, ...b.aliases]) BOOK_INDEX.set(fold(n), b);

export function findBook(nameOrCode: string): BibleBook | null {
  return BOOK_INDEX.get(fold(nameOrCode)) ?? null;
}

export interface BibleReference {
  bookCode: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
}

/** Máximo de versículos en un capítulo de la Biblia (Salmo 119). Cota superior de sanidad, no validación exacta. */
const MAX_VERSE = 176;

export type ReferenceError = 'FORMAT' | 'UNKNOWN_BOOK' | 'CHAPTER_OUT_OF_RANGE' | 'VERSE_OUT_OF_RANGE' | 'RANGE_REVERSED';

/** "Filipenses 4:13", "1 Co 13:4-7", "Salmo 23:1–3". Un solo capítulo por referencia. */
export function parseBibleReference(input: string): { ok: true; ref: BibleReference } | { ok: false; error: ReferenceError } {
  const m = input.trim().match(/^(.+?)\s+(\d{1,3})\s*:\s*(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?$/);
  if (!m) return { ok: false, error: 'FORMAT' };
  const book = findBook(m[1]!);
  if (!book) return { ok: false, error: 'UNKNOWN_BOOK' };
  const chapter = Number(m[2]);
  if (chapter < 1 || chapter > book.chapters) return { ok: false, error: 'CHAPTER_OUT_OF_RANGE' };
  const verseStart = Number(m[3]);
  const verseEnd = m[4] ? Number(m[4]) : verseStart;
  if (verseStart < 1 || verseEnd > MAX_VERSE) return { ok: false, error: 'VERSE_OUT_OF_RANGE' };
  if (verseEnd < verseStart) return { ok: false, error: 'RANGE_REVERSED' };
  return { ok: true, ref: { bookCode: book.code, chapter, verseStart, verseEnd } };
}

export function formatBibleReference(ref: BibleReference): string {
  const book = BIBLE_BOOKS.find((b) => b.code === ref.bookCode);
  const verses = ref.verseEnd > ref.verseStart ? `${ref.verseStart}–${ref.verseEnd}` : `${ref.verseStart}`;
  return `${book?.name ?? ref.bookCode} ${ref.chapter}:${verses}`;
}

export const verseCount = (ref: BibleReference) => ref.verseEnd - ref.verseStart + 1;

export const REFERENCE_ERROR_LABELS: Record<ReferenceError, string> = {
  FORMAT: 'Usa el formato “Libro capítulo:versículo” (p. ej. Filipenses 4:13 o 1 Corintios 13:4-7).',
  UNKNOWN_BOOK: 'No reconocemos ese libro de la Biblia.',
  CHAPTER_OUT_OF_RANGE: 'Ese libro no tiene ese capítulo.',
  VERSE_OUT_OF_RANGE: 'Número de versículo inválido.',
  RANGE_REVERSED: 'El rango de versículos está invertido.',
};

/**
 * Traducciones registradas. Los datos de derechos son informativos y deben confirmarse con cada editorial
 * antes de producción (ver docs/PASTORAL.md). La política de la app limita las citas de traducciones con
 * derechos de autor a pasajes breves con aviso de traducción; no es asesoría legal.
 */
export interface BibleTranslation {
  code: string;
  name: string;
  license: 'PUBLIC_DOMAIN' | 'COPYRIGHTED';
  holder: string;
  /** Política interna de la app: versículos consecutivos máximos por columna. */
  maxQuotedVerses: number;
}

export const BIBLE_TRANSLATIONS: readonly BibleTranslation[] = [
  { code: 'RVR1909', name: 'Reina-Valera 1909', license: 'PUBLIC_DOMAIN', holder: 'Dominio público', maxQuotedVerses: 30 },
  { code: 'RVR1960', name: 'Reina-Valera 1960', license: 'COPYRIGHTED', holder: 'Sociedades Bíblicas en América Latina; renovado por Sociedades Bíblicas Unidas', maxQuotedVerses: 10 },
  { code: 'NVI', name: 'Nueva Versión Internacional', license: 'COPYRIGHTED', holder: 'Biblica, Inc.', maxQuotedVerses: 10 },
  { code: 'NTV', name: 'Nueva Traducción Viviente', license: 'COPYRIGHTED', holder: 'Tyndale House Foundation', maxQuotedVerses: 10 },
  { code: 'LBLA', name: 'La Biblia de las Américas', license: 'COPYRIGHTED', holder: 'The Lockman Foundation', maxQuotedVerses: 10 },
  { code: 'DHH', name: 'Dios Habla Hoy', license: 'COPYRIGHTED', holder: 'Sociedades Bíblicas Unidas', maxQuotedVerses: 10 },
];

export const findTranslation = (code: string) => BIBLE_TRANSLATIONS.find((t) => t.code === code) ?? null;
