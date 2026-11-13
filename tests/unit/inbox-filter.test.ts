import { describe, expect, it } from 'vitest';
import { demoSubmissions } from '@/demo/fixtures';
import { DEFAULT_FILTERS, filterSubmissions } from '@/features/submissions/filter';

describe('filtro del buzón', () => {
  it('ordena por más recientes por defecto', () => {
    const r = filterSubmissions(demoSubmissions, DEFAULT_FILTERS);
    expect(r.map((s) => s.receivedAt)).toEqual([...r.map((s) => s.receivedAt)].sort().reverse());
  });
  it('busca sin distinguir acentos ni mayúsculas', () => {
    const r = filterSubmissions(demoSubmissions, { ...DEFAULT_FILTERS, q: 'INFORMACION' });
    expect(r.length).toBeGreaterThan(0);
  });
  it('filtra por estado, categoría y rango de fechas', () => {
    expect(filterSubmissions(demoSubmissions, { ...DEFAULT_FILTERS, status: 'REJECTED' }).every((s) => s.status === 'REJECTED')).toBe(true);
    expect(filterSubmissions(demoSubmissions, { ...DEFAULT_FILTERS, category: 'RUMOR' }).every((s) => s.category === 'RUMOR')).toBe(true);
    const ranged = filterSubmissions(demoSubmissions, { ...DEFAULT_FILTERS, from: '2026-11-09', to: '2026-11-10' });
    expect(ranged.every((s) => s.eventDate >= '2026-11-09' && s.eventDate <= '2026-11-10')).toBe(true);
  });
  it('no muta la lista original', () => {
    const copy = structuredClone(demoSubmissions);
    filterSubmissions(demoSubmissions, { ...DEFAULT_FILTERS, sort: 'oldest' });
    expect(demoSubmissions).toEqual(copy);
  });
});
