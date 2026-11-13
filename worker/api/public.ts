import { Hono } from 'hono';
import { z } from 'zod';
import { isWellFormed, MAX_ATTEMPTS, normalizeWord, scoreGuess, isSolved, WORD_LENGTH } from '@shared/domain/palabrero';
import { isValidSlug } from '@shared/domain/public-content';
import type { PublicContentSource } from '../content/source';
import type { Bindings } from '../env';
import { DICTIONARY } from '../puzzles/dictionary';
import { isPuzzleActive, type PuzzleSource } from '../puzzles/source';
import { apiError } from './errors';

export interface PublicDeps {
  content: (env: Bindings) => PublicContentSource;
  puzzles: (env: Bindings) => PuzzleSource;
  now?: () => Date;
}

const guessBody = z.object({ guess: z.string().max(32) });
const PUZZLE_ID = /^[a-z0-9-]{1,64}$/;

/**
 * API pública de LECTURA. Solo expone ediciones publicadas por slug; no hay endpoints por ID,
 * ni listados de borradores, ni filtros que permitan enumerar material no publicado.
 */
export function publicRoutes(deps: PublicDeps) {
  const r = new Hono<{ Bindings: Bindings }>();
  const now = deps.now ?? (() => new Date());

  r.get('/editions', async (c) => c.json({ editions: await deps.content(c.env).listEditions() }));

  r.get('/editions/latest', async (c) => {
    const e = await deps.content(c.env).latestEdition();
    return e ? c.json(e) : apiError(c, 404, 'NO_EDITIONS', 'Todavía no hay ediciones publicadas.');
  });

  r.get('/editions/:slug', async (c) => {
    const slug = c.req.param('slug');
    if (!isValidSlug(slug)) return apiError(c, 404, 'NOT_FOUND', 'Edición no encontrada.');
    const e = await deps.content(c.env).edition(slug);
    return e ? c.json(e) : apiError(c, 404, 'NOT_FOUND', 'Edición no encontrada.');
  });

  r.get('/editions/:slug/articles/:article', async (c) => {
    const { slug, article } = c.req.param();
    if (!isValidSlug(slug) || !isValidSlug(article)) return apiError(c, 404, 'NOT_FOUND', 'Artículo no encontrado.');
    const found = await deps.content(c.env).article(slug, article);
    if (!found) return apiError(c, 404, 'NOT_FOUND', 'Artículo no encontrado.');
    const { edition, article: a } = found;
    return c.json({
      article: a,
      edition: { slug: edition.slug, number: edition.number, publicationDate: edition.publicationDate, demo: edition.demo },
      // La columna pastoral no se mezcla con la sátira en "relacionados" (y viceversa).
      related: edition.articles.filter((x) => x.slug !== a.slug && (x.category === 'PASTORAL') === (a.category === 'PASTORAL')).slice(0, 3),
    });
  });

  r.get('/pastoral', async (c) => c.json({ columns: await deps.content(c.env).listPastoral() }));

  r.get('/puzzles/:id', async (c) => {
    const id = c.req.param('id');
    const p = PUZZLE_ID.test(id) ? await deps.puzzles(c.env).get(id) : null;
    if (!p || !isPuzzleActive(p, now())) return apiError(c, 404, 'PUZZLE_NOT_AVAILABLE', 'Este palabrero no está disponible.');
    // Nunca se incluye la respuesta.
    return c.json({ id: p.id, editionNumber: p.editionNumber, length: WORD_LENGTH, maxAttempts: MAX_ATTEMPTS, clue: p.clue });
  });

  r.post('/puzzles/:id/guess', async (c) => {
    const id = c.req.param('id');
    const p = PUZZLE_ID.test(id) ? await deps.puzzles(c.env).get(id) : null;
    if (!p || !isPuzzleActive(p, now())) return apiError(c, 404, 'PUZZLE_NOT_AVAILABLE', 'Este palabrero no está disponible.');
    const body = guessBody.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return apiError(c, 400, 'INVALID_REQUEST', 'Solicitud inválida.');
    const guess = normalizeWord(body.data.guess);
    if (!isWellFormed(guess)) return apiError(c, 422, 'INVALID_WORD', `La palabra debe tener ${WORD_LENGTH} letras.`);
    const answer = normalizeWord(p.answer);
    if (guess !== answer && !DICTIONARY.has(guess)) return apiError(c, 422, 'NOT_IN_DICTIONARY', 'Esa palabra no está en el diccionario del Corral.');
    const feedback = scoreGuess(guess, answer);
    return c.json({ guess, feedback, solved: isSolved(feedback) });
  });

  return r;
}
