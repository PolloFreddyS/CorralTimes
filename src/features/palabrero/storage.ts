import type { LetterFeedback } from '@shared/domain/palabrero';

export interface GuessRow {
  guess: string;
  feedback: LetterFeedback[];
}
export interface SavedProgress {
  version: 1;
  rows: GuessRow[];
}

/** Clave específica por puzzle/edición. Solo se guardan intentos y su retroalimentación (nunca la respuesta). */
export const progressKey = (puzzleId: string) => `ct:palabrero:v1:${puzzleId}`;

export function loadProgress(puzzleId: string): GuessRow[] {
  try {
    const raw = window.localStorage.getItem(progressKey(puzzleId));
    if (!raw) return [];
    const data = JSON.parse(raw) as SavedProgress;
    if (data.version !== 1 || !Array.isArray(data.rows)) return [];
    return data.rows.filter((r) => typeof r.guess === 'string' && Array.isArray(r.feedback)).slice(0, 6);
  } catch {
    return [];
  }
}

export function saveProgress(puzzleId: string, rows: GuessRow[]) {
  try {
    window.localStorage.setItem(progressKey(puzzleId), JSON.stringify({ version: 1, rows } satisfies SavedProgress));
  } catch {
    /* almacenamiento no disponible: el juego sigue en memoria */
  }
}
