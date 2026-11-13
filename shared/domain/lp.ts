/**
 * Tipos y utilidades del módulo WALL STREET DEL TILT.
 * Regla de oro: un dato ausente es `null`, NUNCA 0. "Sin datos" no significa "no jugó".
 */

export const LP_QUEUES = ['RANKED_SOLO_5x5', 'RANKED_FLEX_SR'] as const;
export type LpQueue = (typeof LP_QUEUES)[number];
export const QUEUE_LABELS: Record<LpQueue, string> = {
  RANKED_SOLO_5x5: 'Solo/Duo',
  RANKED_FLEX_SR: 'Flex',
};

export const DATA_QUALITY = ['COMPLETE', 'SOURCE_PROVIDED', 'FALLBACK_BASELINE', 'PARTIAL', 'MISSING', 'ERROR'] as const;
export type DataQuality = (typeof DATA_QUALITY)[number];
export const DATA_QUALITY_LABELS: Record<DataQuality, string> = {
  COMPLETE: 'Completo',
  SOURCE_PROVIDED: 'Dato de la fuente',
  FALLBACK_BASELINE: 'Línea base de respaldo',
  PARTIAL: 'Parcial',
  MISSING: 'Sin datos',
  ERROR: 'Error',
};

/** Registro inicial de jugadores. Se siembra en la base de datos; no es lógica fija. */
export const INITIAL_LP_PLAYERS: readonly string[] = [
  'Barren Wuffet#LAN',
  'Webo De Frodo#LAN',
  'Toxic King Chiki#LAN',
  'Nunu y Pollo#Pollo',
  'Mi Momento Va#LAN12',
  'Itami4U#LAN',
  'En3ñemayPanekton#7756',
  'Edeeste#LAN',
  'DarkSaphiro#LAN',
  'AFK Rayser#LAN',
  'Sr Terro Rita#Pollo',
];

export interface RiotId {
  gameName: string;
  tagLine: string;
}

/** Separa "Nombre#TAG" respetando Unicode. Devuelve null si no es un Riot ID válido. */
export function parseRiotId(value: string): RiotId | null {
  const normalized = value.normalize('NFC').trim();
  const idx = normalized.lastIndexOf('#');
  if (idx <= 0 || idx === normalized.length - 1) return null;
  const gameName = normalized.slice(0, idx).trim();
  const tagLine = normalized.slice(idx + 1).trim();
  if ([...gameName].length < 3 || [...gameName].length > 16) return null;
  if ([...tagLine].length < 3 || [...tagLine].length > 5) return null;
  if (gameName.includes('#') || /\p{Cc}/u.test(gameName) || !/^[\p{L}\p{N}]+$/u.test(tagLine)) return null;
  return { gameName, tagLine };
}

/** Formatea un cambio de LP. `null` se muestra como "s/d" (sin datos), jamás como 0. */
export function formatLpDelta(delta: number | null): string {
  if (delta === null) return 's/d';
  if (delta === 0) return '±0';
  return delta > 0 ? `+${delta}` : `${delta}`.replace('-', '−');
}

/** Suma solo valores conocidos e informa cuántos faltaron, para no fabricar totales. */
export function sumKnown(values: readonly (number | null)[]): { total: number | null; missing: number } {
  const known = values.filter((v): v is number => v !== null);
  return { total: known.length ? known.reduce((a, b) => a + b, 0) : null, missing: values.length - known.length };
}
