import { describe, expect, it } from 'vitest';
import {
  addDays,
  coverageWindow,
  editionClock,
  formatCountdown,
  localDateIn,
  publicationDateFor,
  zonedTimeToUtc,
} from '@shared/domain/edition-calendar';

describe('calendario editorial', () => {
  it('el viernes de publicación es el mismo día si hoy es viernes', () => {
    expect(publicationDateFor('2026-11-13')).toBe('2026-11-13'); // viernes
  });
  it('de sábado a jueves apunta al próximo viernes', () => {
    expect(publicationDateFor('2026-11-14')).toBe('2026-11-20'); // sábado
    expect(publicationDateFor('2026-11-19')).toBe('2026-11-20'); // jueves
  });
  it('cruza fin de mes y de año', () => {
    expect(publicationDateFor('2026-12-29')).toBe('2027-01-01');
    expect(addDays('2027-01-01', -6)).toBe('2026-12-26');
  });
  it('la ventana de cobertura son 7 días que terminan el viernes', () => {
    expect(coverageWindow('2026-11-13')).toEqual({ start: '2026-11-07', end: '2026-11-13' });
  });
  it('usa la fecha local de Santo Domingo, no la UTC', () => {
    // 2026-11-14 02:00 UTC = 2026-11-13 22:00 en Santo Domingo (UTC-4)
    expect(localDateIn('America/Santo_Domingo', new Date('2026-11-14T02:00:00Z'))).toBe('2026-11-13');
  });
  it('convierte hora local a UTC (UTC-4 sin horario de verano)', () => {
    expect(zonedTimeToUtc('2026-11-13', 18, 0, 'America/Santo_Domingo').toISOString()).toBe('2026-11-13T22:00:00.000Z');
  });
  it('maneja zonas con horario de verano', () => {
    expect(zonedTimeToUtc('2026-07-03', 18, 0, 'America/New_York').toISOString()).toBe('2026-07-03T22:00:00.000Z');
    expect(zonedTimeToUtc('2026-12-04', 18, 0, 'America/New_York').toISOString()).toBe('2026-12-04T23:00:00.000Z');
  });
  it('calcula la cuenta regresiva hasta el cierre del viernes', () => {
    const clock = editionClock(new Date('2026-11-12T22:00:00Z')); // jueves 18:00 local
    expect(clock.publicationDate).toBe('2026-11-13');
    expect(clock.msUntilClose).toBe(24 * 3600_000);
    expect(clock.isClosed).toBe(false);
  });
  it('después del cierre del viernes la edición está cerrada', () => {
    const clock = editionClock(new Date('2026-11-13T23:30:00Z')); // viernes 19:30 local
    expect(clock.isPublicationDay).toBe(true);
    expect(clock.isClosed).toBe(true);
    expect(clock.msUntilClose).toBe(0);
  });
  it('formatea la cuenta regresiva', () => {
    expect(formatCountdown(0)).toBe('Cierre alcanzado');
    expect(formatCountdown((2 * 1440 + 3 * 60 + 4) * 60_000)).toBe('2d 3h 4m');
    expect(formatCountdown(45 * 60_000)).toBe('45m');
  });
});
