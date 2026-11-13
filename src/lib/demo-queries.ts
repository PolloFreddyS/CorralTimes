import { queryOptions } from '@tanstack/react-query';
import {
  demoEdition,
  demoLpRows,
  demoRanking,
  demoSecurityEvents,
  demoStories,
  demoSubmissions,
} from '@/demo/fixtures';
import { appConfig } from './env';

/**
 * Consultas de la redacción. En la Fase 1 solo existe la fuente DEMO; las fases siguientes
 * reemplazan cada `queryFn` por llamadas autenticadas a /api/admin/* sin cambiar las pantallas.
 * Fuera de modo demo fallan explícitamente: jamás devolvemos datos ficticios en producción.
 */
function demoOnly<T>(data: T): () => Promise<T> {
  return async () => {
    if (!appConfig.demoMode) throw new Error('DATA_SOURCE_NOT_CONFIGURED');
    return structuredClone(data);
  };
}

export const editionQuery = queryOptions({ queryKey: ['edition', 'current'], queryFn: demoOnly(demoEdition) });
export const submissionsQuery = queryOptions({ queryKey: ['submissions'], queryFn: demoOnly(demoSubmissions) });
export const storiesQuery = queryOptions({ queryKey: ['stories'], queryFn: demoOnly(demoStories) });
export const rankingQuery = queryOptions({ queryKey: ['ranking', 'current'], queryFn: demoOnly(demoRanking) });
export const lpRowsQuery = queryOptions({ queryKey: ['lp', 'current'], queryFn: demoOnly(demoLpRows) });
export const securityEventsQuery = queryOptions({ queryKey: ['security-events'], queryFn: demoOnly(demoSecurityEvents) });
