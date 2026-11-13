import { describe, expect, it } from 'vitest';
import { BIBLE_BOOKS, BIBLE_TRANSLATIONS, findBook, formatBibleReference, parseBibleReference } from '@shared/domain/bible';

describe('referencias bíblicas', () => {
  it('canon de 66 libros con 1.189 capítulos', () => {
    expect(BIBLE_BOOKS).toHaveLength(66);
    expect(BIBLE_BOOKS.filter((b) => b.testament === 'AT')).toHaveLength(39);
    expect(BIBLE_BOOKS.reduce((n, b) => n + b.chapters, 0)).toBe(1189);
    expect(new Set(BIBLE_BOOKS.map((b) => b.code)).size).toBe(66);
  });
  it('reconoce nombres, abreviaturas y variantes sin tildes', () => {
    expect(findBook('filipenses')?.code).toBe('PHP');
    expect(findBook('Fil.')?.code).toBe('PHP');
    expect(findBook('Exodo')?.code).toBe('EXO');
    expect(findBook('Salmo')?.code).toBe('PSA');
    expect(findBook('1 cor')?.code).toBe('1CO');
    expect(findBook('Evangelio de Tomás')).toBeNull();
  });
  it('analiza referencias simples y rangos', () => {
    expect(parseBibleReference('Filipenses 4:13')).toEqual({ ok: true, ref: { bookCode: 'PHP', chapter: 4, verseStart: 13, verseEnd: 13 } });
    expect(parseBibleReference('1 Corintios 13:4-7')).toMatchObject({ ok: true, ref: { bookCode: '1CO', chapter: 13, verseStart: 4, verseEnd: 7 } });
    expect(parseBibleReference('Salmo 23:1–3')).toMatchObject({ ok: true, ref: { bookCode: 'PSA', verseEnd: 3 } });
  });
  it('rechaza referencias inventadas o mal formadas', () => {
    expect(parseBibleReference('Filipenses 5:1')).toEqual({ ok: false, error: 'CHAPTER_OUT_OF_RANGE' });
    expect(parseBibleReference('Hezekiah 3:16')).toEqual({ ok: false, error: 'UNKNOWN_BOOK' });
    expect(parseBibleReference('Juan 3')).toEqual({ ok: false, error: 'FORMAT' });
    expect(parseBibleReference('Juan 3:16-14')).toEqual({ ok: false, error: 'RANGE_REVERSED' });
    expect(parseBibleReference('Juan 3:0')).toEqual({ ok: false, error: 'VERSE_OUT_OF_RANGE' });
  });
  it('formatea referencias de forma canónica', () => {
    expect(formatBibleReference({ bookCode: '1CO', chapter: 13, verseStart: 4, verseEnd: 7 })).toBe('1 Corintios 13:4–7');
  });
  it('cada traducción declara licencia y titular', () => {
    for (const t of BIBLE_TRANSLATIONS) {
      expect(t.holder.length).toBeGreaterThan(3);
      expect(t.maxQuotedVerses).toBeGreaterThan(0);
    }
    expect(BIBLE_TRANSLATIONS.find((t) => t.code === 'RVR1909')?.license).toBe('PUBLIC_DOMAIN');
  });
});
