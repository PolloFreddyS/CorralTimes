/**
 * Calendario editorial centralizado. EL CORRAL TIMES publica los viernes.
 * Todas las fechas "de calendario" se manejan como cadenas ISO (AAAA-MM-DD) en la zona del periódico,
 * para evitar errores de zona horaria en el navegador o en el Worker.
 */

export const NEWSROOM_TIME_ZONE = 'America/Santo_Domingo';
/** 5 = viernes (0 = domingo). */
export const PUBLICATION_WEEKDAY = 5;
/** Hora local (24h) a la que se cierra la edición el día de publicación. */
export const DEFAULT_CLOSING_HOUR = 18;

export type IsoDate = string;

export function localDateIn(timeZone: string, instant: Date): IsoDate {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekdayOf(date: IsoDate): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** Viernes de publicación correspondiente a una fecha local: el mismo día si es viernes, si no el próximo. */
export function publicationDateFor(today: IsoDate): IsoDate {
  const diff = (PUBLICATION_WEEKDAY - weekdayOf(today) + 7) % 7;
  return addDays(today, diff);
}

/**
 * Ventana de cobertura de una edición: los 7 días calendario que terminan en el viernes de publicación
 * (sábado → viernes, ambos inclusive). Coincide con la ventana "DPM-like" del mercado LP.
 */
export function coverageWindow(publicationDate: IsoDate): { start: IsoDate; end: IsoDate } {
  return { start: addDays(publicationDate, -6), end: publicationDate };
}

/** Offset (minutos) de una zona horaria en un instante dado. */
function tzOffsetMinutes(timeZone: string, instant: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(n('year'), n('month') - 1, n('day'), n('hour'), n('minute'), n('second'));
  return Math.round((asUtc - instant.getTime()) / 60_000);
}

/** Convierte "fecha + hora local en la zona" a un instante UTC. */
export function zonedTimeToUtc(date: IsoDate, hour: number, minute: number, timeZone: string): Date {
  const naive = Date.parse(`${date}T00:00:00Z`) + (hour * 60 + minute) * 60_000;
  let guess = naive - tzOffsetMinutes(timeZone, new Date(naive)) * 60_000;
  // Segunda pasada por si el offset cambia (horario de verano) entre la suposición y el resultado.
  guess = naive - tzOffsetMinutes(timeZone, new Date(guess)) * 60_000;
  return new Date(guess);
}

export interface EditionClock {
  today: IsoDate;
  publicationDate: IsoDate;
  closesAt: Date;
  /** Milisegundos hasta el cierre; 0 si ya cerró. */
  msUntilClose: number;
  isPublicationDay: boolean;
  isClosed: boolean;
}

export function editionClock(
  now: Date,
  opts: { timeZone?: string; closingHour?: number } = {},
): EditionClock {
  const timeZone = opts.timeZone ?? NEWSROOM_TIME_ZONE;
  const closingHour = opts.closingHour ?? DEFAULT_CLOSING_HOUR;
  const today = localDateIn(timeZone, now);
  const publicationDate = publicationDateFor(today);
  const closesAt = zonedTimeToUtc(publicationDate, closingHour, 0, timeZone);
  const ms = closesAt.getTime() - now.getTime();
  return {
    today,
    publicationDate,
    closesAt,
    msUntilClose: Math.max(0, ms),
    isPublicationDay: today === publicationDate,
    isClosed: ms <= 0,
  };
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Cierre alcanzado';
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

const LONG_DATE = new Intl.DateTimeFormat('es-DO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "viernes, 13 de noviembre de 2026" — formatea una fecha calendario sin desplazamientos de zona. */
export function formatLongDate(date: IsoDate): string {
  return LONG_DATE.format(new Date(`${date}T00:00:00Z`));
}
