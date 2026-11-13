import { describe, expect, it } from 'vitest';
import { formatLpDelta, INITIAL_LP_PLAYERS, parseRiotId, sumKnown } from '@shared/domain/lp';

describe('Wall Street del Tilt — utilidades', () => {
  it('todos los jugadores iniciales son Riot IDs válidos y conservan Unicode', () => {
    for (const id of INITIAL_LP_PLAYERS) expect(parseRiotId(id), id).not.toBeNull();
    expect(parseRiotId('En3ñemayPanekton#7756')).toEqual({ gameName: 'En3ñemayPanekton', tagLine: '7756' });
    expect(INITIAL_LP_PLAYERS).toHaveLength(11);
  });
  it('rechaza Riot IDs inválidos', () => {
    expect(parseRiotId('SinTag')).toBeNull();
    expect(parseRiotId('#LAN')).toBeNull();
    expect(parseRiotId('Nombre#')).toBeNull();
    expect(parseRiotId('Nombre#<script>')).toBeNull();
  });
  it('un dato ausente NUNCA se muestra como cero', () => {
    expect(formatLpDelta(null)).toBe('s/d');
    expect(formatLpDelta(0)).toBe('±0');
    expect(formatLpDelta(25)).toBe('+25');
    expect(formatLpDelta(-12)).toBe('−12');
  });
  it('los totales no convierten faltantes en cero', () => {
    expect(sumKnown([10, null, -4])).toEqual({ total: 6, missing: 1 });
    expect(sumKnown([null, null])).toEqual({ total: null, missing: 2 });
    expect(sumKnown([])).toEqual({ total: null, missing: 0 });
  });
});
