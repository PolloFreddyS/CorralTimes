import { describe, expect, it } from 'vitest';
import {
  allowedTransitions,
  canTransition,
  normalizeText,
  sniffImageMime,
  SUBMISSION_LIMITS,
} from '@shared/domain/submission';
import { buildSubmissionSchema } from '@shared/domain/submission-schema';

const TODAY = '2026-11-13';
const schema = buildSubmissionSchema(TODAY);
const valid = {
  reporterAlias: 'Reportero',
  category: 'NOTICIA',
  headline: 'Algo pasó en el gallinero',
  description: 'Una descripción lo suficientemente larga para pasar.',
  eventDate: '2026-11-10',
  permissionAcknowledged: true,
};

describe('esquema de envío público', () => {
  it('acepta un reporte válido y omite opcionales vacíos', () => {
    const r = schema.safeParse({ ...valid, notes: '   ' });
    expect(r.success).toBe(true);
    expect(r.data?.notes).toBeUndefined();
  });
  it('exige el reconocimiento de permiso', () => {
    expect(schema.safeParse({ ...valid, permissionAcknowledged: false }).success).toBe(false);
  });
  it('rechaza categorías desconocidas', () => {
    expect(schema.safeParse({ ...valid, category: 'ADMIN' }).success).toBe(false);
  });
  it('rechaza fechas futuras y demasiado antiguas', () => {
    expect(schema.safeParse({ ...valid, eventDate: '2026-11-14' }).success).toBe(false);
    expect(schema.safeParse({ ...valid, eventDate: '2026-01-01' }).success).toBe(false);
    expect(schema.safeParse({ ...valid, eventDate: '13/11/2026' }).success).toBe(false);
  });
  it('aplica límites de longitud después de normalizar', () => {
    expect(schema.safeParse({ ...valid, headline: 'x'.repeat(SUBMISSION_LIMITS.headline.max + 1) }).success).toBe(false);
    // Solo espacios → vacío → inválido
    expect(schema.safeParse({ ...valid, reporterAlias: '      ' }).success).toBe(false);
  });
  it('una frase legendaria requiere la frase exacta', () => {
    const r = schema.safeParse({ ...valid, category: 'FRASE_LEGENDARIA' });
    expect(r.success).toBe(false);
    expect(r.error?.issues.some((i) => i.path[0] === 'exactQuote')).toBe(true);
  });
  it('preserva la frase exacta (incluyendo Unicode) sin reescribirla', () => {
    const quote = 'Diablo, mano… ¡qué ñame!';
    const r = schema.safeParse({ ...valid, category: 'FRASE_LEGENDARIA', exactQuote: quote });
    expect(r.data?.exactQuote).toBe(quote);
  });
  it('ignora campos extra no declarados (no hay asignación masiva)', () => {
    const r = schema.safeParse({ ...valid, status: 'APPROVED', isAdmin: true });
    expect(r.success).toBe(true);
    expect(r.data).not.toHaveProperty('status');
    expect(r.data).not.toHaveProperty('isAdmin');
  });
});

describe('normalizeText', () => {
  it('elimina caracteres de control y bidi invisibles', () => {
    expect(normalizeText('hola\u0000‮mundo​ ')).toBe('holamundo');
  });
  it('conserva saltos de línea y normaliza CRLF', () => {
    expect(normalizeText('a\r\nb')).toBe('a\nb');
  });
});

describe('ciclo de vida del reporte', () => {
  it('permite solo transiciones válidas', () => {
    expect(canTransition('SUBMITTED', 'UNDER_REVIEW')).toBe(true);
    expect(canTransition('SUBMITTED', 'APPROVED')).toBe(false);
    expect(canTransition('ARCHIVED', 'UNDER_REVIEW')).toBe(false);
    expect(allowedTransitions('ARCHIVED')).toEqual([]);
  });
});

describe('sniffImageMime', () => {
  it('detecta PNG, JPEG y WebP por magic bytes', () => {
    expect(sniffImageMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png');
    expect(sniffImageMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(sniffImageMime(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))).toBe('image/webp');
  });
  it('rechaza HTML/SVG disfrazado de imagen', () => {
    expect(sniffImageMime(new TextEncoder().encode('<svg onload=alert(1)>'))).toBeNull();
    expect(sniffImageMime(new TextEncoder().encode('<!doctype html>'))).toBeNull();
  });
});
