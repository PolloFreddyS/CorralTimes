/**
 * EL PALABRERO DEL CORRAL — motor puro del juego de palabras (original, sin activos de terceros).
 *
 * Reglas de normalización (explícitas):
 *  1. Mayúsculas.
 *  2. Se eliminan tildes y diéresis (Á→A, Ü→U).
 *  3. La Ñ es una letra distinta y se conserva (AÑEJO ≠ ANEJO).
 *  4. Solo se aceptan letras A–Z y Ñ; cualquier otro carácter invalida el intento.
 * La respuesta NUNCA vive en el cliente: el servidor compara y devuelve solo la retroalimentación.
 */

export const WORD_LENGTH = 5;
export const MAX_ATTEMPTS = 6;

export type LetterFeedback = 'correct' | 'present' | 'absent';

export function normalizeWord(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .normalize('NFD')
    // Ñ en NFD es N + U+0303: se recompone antes de quitar el resto de diacríticos.
    .replace(/N\u0303/g, 'Ñ')
    .replace(/\p{M}/gu, '');
}

export function isWellFormed(word: string, length = WORD_LENGTH): boolean {
  return new RegExp(`^[A-ZÑ]{${length}}$`).test(word) && [...word].length === length;
}

/**
 * Retroalimentación con manejo correcto de letras repetidas (dos pasadas):
 * primero las exactas consumen su letra; luego las "presentes" consumen lo que queda.
 */
export function scoreGuess(guess: string, answer: string): LetterFeedback[] {
  const g = [...guess];
  const a = [...answer];
  if (g.length !== a.length) throw new Error('Longitudes distintas');
  const result: LetterFeedback[] = g.map(() => 'absent');
  const remaining = new Map<string, number>();
  g.forEach((ch, i) => {
    if (ch === a[i]) result[i] = 'correct';
    else remaining.set(a[i]!, (remaining.get(a[i]!) ?? 0) + 1);
  });
  g.forEach((ch, i) => {
    if (result[i] === 'correct') return;
    const left = remaining.get(ch) ?? 0;
    if (left > 0) {
      result[i] = 'present';
      remaining.set(ch, left - 1);
    }
  });
  return result;
}

export const isSolved = (fb: readonly LetterFeedback[]) => fb.length > 0 && fb.every((f) => f === 'correct');

/** Estado de teclado: la mejor información conocida por letra. */
export function keyboardState(rows: { guess: string; feedback: LetterFeedback[] }[]): Record<string, LetterFeedback> {
  const rank: Record<LetterFeedback, number> = { absent: 0, present: 1, correct: 2 };
  const out: Record<string, LetterFeedback> = {};
  for (const { guess, feedback } of rows) {
    [...guess].forEach((ch, i) => {
      const f = feedback[i]!;
      if (out[ch] === undefined || rank[f] > rank[out[ch]!]) out[ch] = f;
    });
  }
  return out;
}

const EMOJI: Record<LetterFeedback, string> = { correct: '🟩', present: '🟨', absent: '⬛' };

/** Resultado compartible: solo cuadros, nunca letras (no revela la solución). */
export function shareText(opts: { editionNumber: number; rows: LetterFeedback[][]; solved: boolean; url: string }): string {
  const score = opts.solved ? `${opts.rows.length}/${MAX_ATTEMPTS}` : `X/${MAX_ATTEMPTS}`;
  const grid = opts.rows.map((r) => r.map((f) => EMOJI[f]).join('')).join('\n');
  return `🐓 El Palabrero del Corral · Edición N.º ${opts.editionNumber} · ${score}\n\n${grid}\n\n${opts.url}`;
}
