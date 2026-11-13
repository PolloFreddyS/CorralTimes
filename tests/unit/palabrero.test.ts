import { describe, expect, it } from 'vitest';
import { isWellFormed, keyboardState, normalizeWord, scoreGuess, shareText } from '@shared/domain/palabrero';

describe('El Palabrero — normalización', () => {
  it('quita tildes y diéresis pero conserva la Ñ', () => {
    expect(normalizeWord('  canción ')).toBe('CANCION');
    expect(normalizeWord('pingüino')).toBe('PINGUINO');
    expect(normalizeWord('añejo')).toBe('AÑEJO');
    expect(normalizeWord('AÑEJO')).not.toBe(normalizeWord('anejo'));
  });
  it('solo acepta 5 letras A–Z/Ñ', () => {
    expect(isWellFormed('GALLO')).toBe(true);
    expect(isWellFormed('NIÑOS')).toBe(true);
    expect(isWellFormed('GALL0')).toBe(false);
    expect(isWellFormed('GALLOS')).toBe(false);
    expect(isWellFormed('GA LO')).toBe(false);
    expect(isWellFormed(normalizeWord('ab#cd'))).toBe(false);
  });
});

describe('El Palabrero — retroalimentación', () => {
  it('acierto total', () => {
    expect(scoreGuess('TRUCO', 'TRUCO')).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
  });
  it('maneja letras repetidas: no marca más "presentes" de las que hay', () => {
    // respuesta con una sola L: la exacta la consume, la otra L queda ausente
    expect(scoreGuess('LLAMA', 'PLATO')).toEqual(['absent', 'correct', 'correct', 'absent', 'absent']);
    // la exacta tiene prioridad sobre la presente
    expect(scoreGuess('ROBOT', 'TORRE')).toEqual(['present', 'correct', 'absent', 'absent', 'present']);
    // dos letras repetidas en la respuesta
    expect(scoreGuess('ARRAS', 'BARRA')).toEqual(['present', 'present', 'correct', 'present', 'absent']);
  });
  it('trata la Ñ como letra propia', () => {
    expect(scoreGuess('NIÑOS', 'NIÑOS')).toEqual(Array(5).fill('correct'));
    expect(scoreGuess('NINOS', 'NIÑOS')[2]).toBe('absent');
  });
  it('el teclado guarda la mejor información por letra', () => {
    const k = keyboardState([
      { guess: 'LLAMA', feedback: ['present', 'correct', 'correct', 'absent', 'absent'] },
    ]);
    expect(k.L).toBe('correct');
    expect(k.A).toBe('correct');
    expect(k.M).toBe('absent');
  });
  it('el resultado compartido no revela letras', () => {
    const text = shareText({ editionNumber: 2, rows: [['absent', 'present', 'correct', 'absent', 'absent'], Array(5).fill('correct')], solved: true, url: 'https://x.test/juegos' });
    expect(text).toContain('2/6');
    expect(text).toContain('🟩🟩🟩🟩🟩');
    expect(text).not.toMatch(/TRUCO|LLAMA/);
  });
});
