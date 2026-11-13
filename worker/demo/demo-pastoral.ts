/**
 * Columnas pastorales de DEMOSTRACIÓN.
 * - Filipenses 4:13 se cita LITERALMENTE de la Reina-Valera 1909 (dominio público). Aun así, en producción
 *   todo pasaje se verifica manualmente en la Mesa Pastoral antes de aprobar.
 * - Mateo 11:28 se presenta como PARÁFRASIS (sin comillas) para mostrar la distinción.
 * Las reflexiones son textos de muestra escritos con respeto; no sustituyen la voz pastoral real de la comunidad.
 */
import { p, type ArticleDoc } from '@shared/domain/article-doc';
import { toPublicPastoralDetails, type PastoralDetails } from '@shared/domain/pastoral';

export const DEMO_PASTORAL_E2: { slug: string; title: string; subtitle: string; details: PastoralDetails; body: ArticleDoc } = {
  slug: 'todo-lo-puedo',
  title: 'La fuerza que no depende del marcador',
  subtitle: 'Columna de muestra sobre Filipenses 4:13, el versículo que encabeza este periódico.',
  details: {
    reference: { bookCode: 'PHP', chapter: 4, verseStart: 13, verseEnd: 13 },
    translationCode: 'RVR1909',
    passageMode: 'QUOTATION',
    passageText: 'Todo lo puedo en Cristo que me fortalece.',
    theme: 'Fortaleza',
    applications: [
      'Antes de la próxima partida difícil, respira y recuerda que tu valor no se mide en LP.',
      'Escríbele a alguien del Corral que esté pasando una semana pesada.',
      'Cuando ganes, agradece; cuando pierdas, también.',
    ],
    prayerInvitation: 'Te invitamos a dedicar un momento esta semana para orar por la paz y la salud de nuestra comunidad.',
    prayerPrivacy: 'NO_PRIVATE_REQUESTS',
    verification: { verified: true, verifiedBy: 'demo', verifiedAt: '2026-11-12T12:00:00Z', source: 'Reina-Valera 1909 (texto de dominio público)' },
  },
  body: {
    type: 'doc',
    content: [
      p('Texto de muestra. Cada viernes, en la parte de arriba de este periódico, aparece una referencia: Filipenses 4:13. Está ahí desde el principio, entre titulares exagerados y rankings imposibles.'),
      p('Pablo escribió estas palabras desde la cárcel, hablando de aprender a estar contento tanto en la abundancia como en la escasez. El versículo no promete que ganaremos todas las partidas; habla de una fortaleza que nos sostiene en cualquier circunstancia.'),
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Más allá del marcador' }] },
      p('En una comunidad donde todo se cuenta —victorias, derrotas, puntos—, esta columna es una pausa para recordar que hay cosas que no caben en una tabla.'),
    ],
  },
};

export const DEMO_PASTORAL_E1: typeof DEMO_PASTORAL_E2 = {
  slug: 'descanso-para-los-cansados',
  title: 'Descanso para los cansados',
  subtitle: 'Columna de muestra sobre Mateo 11:28 (presentado como paráfrasis).',
  details: {
    reference: { bookCode: 'MAT', chapter: 11, verseStart: 28, verseEnd: 28 },
    translationCode: 'RVR1909',
    passageMode: 'PARAPHRASE',
    passageText: 'Jesús invita a quienes están cansados y agobiados a acercarse a Él para encontrar descanso.',
    theme: 'Paz',
    applications: ['Esta semana, apaga la pantalla un rato antes de dormir.'],
    prayerInvitation: null,
    prayerPrivacy: 'NO_PRIVATE_REQUESTS',
    verification: { verified: true, verifiedBy: 'demo', verifiedAt: '2026-11-05T12:00:00Z', source: 'Paráfrasis revisada contra la Reina-Valera 1909' },
  },
  body: {
    type: 'doc',
    content: [
      p('Texto de muestra. Hay semanas en que el cansancio no viene de las partidas, sino de todo lo demás.'),
      p('Esta invitación sigue abierta, también para nosotros.'),
    ],
  },
};

export const publicDetails = (c: typeof DEMO_PASTORAL_E2) => toPublicPastoralDetails(c.details);
