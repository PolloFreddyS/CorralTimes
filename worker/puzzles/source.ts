import secrets from '../demo/puzzle-secrets.json';

export interface PuzzleRecord {
  id: string;
  editionNumber: number;
  answer: string;
  clue: string | null;
  /** ISO; null = sin límite. El puzzle solo se juega dentro de su ventana. */
  activeFrom: string | null;
  activeUntil: string | null;
}

/** Fuente de puzzles del servidor. La respuesta nunca sale de aquí salvo tras expirar (Fase 8). */
export interface PuzzleSource {
  get(id: string): Promise<PuzzleRecord | null>;
}

export const emptyPuzzleSource: PuzzleSource = { get: async () => null };

export const demoPuzzleSource: PuzzleSource = {
  get: async (id) => {
    const p = secrets.puzzles.find((x) => x.id === id);
    return p ? { id: p.id, editionNumber: p.editionNumber, answer: p.answer, clue: p.clue, activeFrom: null, activeUntil: null } : null;
  },
};

export function isPuzzleActive(p: PuzzleRecord, now: Date): boolean {
  if (p.activeFrom && now < new Date(p.activeFrom)) return false;
  if (p.activeUntil && now >= new Date(p.activeUntil)) return false;
  return true;
}
