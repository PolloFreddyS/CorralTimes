/**
 * CORRAL CREATIVE BIBLE — versión base, versionada.
 * Fuente para los briefs que el dueño lleva a ChatGPT (director creativo oficial).
 * En la Fase 6 se guarda en `creative_bible_versions` y se edita desde HQ; esta es la semilla.
 * No contiene noticias: los ejemplos históricos guían ESTILO, nunca aportan hechos nuevos.
 */
export interface CreativeBible {
  version: string;
  identity: { name: string; tagline: string; header: string; community: string };
  visualPrinciples: string[];
  palette: { name: string; hex: string; use: string }[];
  typography: string[];
  humor: string[];
  editorialRules: string[];
  prohibited: string[];
  logo: { status: 'OFFICIAL' | 'PENDING'; notes: string };
  characters: { name: string; description: string; approvedAssetIds: string[] }[];
}

export const CREATIVE_BIBLE_V1: CreativeBible = {
  version: '1.0.0',
  identity: {
    name: 'EL CORRAL TIMES',
    tagline: 'Noticias, dramas, memes y más caos del gallinero',
    header: 'Filipenses 4:13',
    community: 'Los Gallos Sin Planes — El Corral',
  },
  visualPrinciples: [
    'Periódico impreso clásico: papel crema, tinta oscura, jerarquía tipográfica fuerte.',
    'Tabloide deportivo vintage y revista satírica, con guiños retro gamer discretos.',
    'Presentación seria, contenido absurdo: el drama se actúa con total solemnidad.',
    'Legibilidad primero: nada de ruido de escaneo, texturas pesadas ni efectos que tapen el sujeto.',
  ],
  palette: [
    { name: 'Paper Cream', hex: '#F5E8CC', use: 'Fondo principal' },
    { name: 'Dark Ink', hex: '#251F1B', use: 'Texto y líneas' },
    { name: 'Breaking Red', hex: '#A73429', use: 'Última hora, acentos' },
    { name: 'Editorial Gold', hex: '#D5AA4F', use: 'Sellos y detalles' },
    { name: 'Verified Green', hex: '#54624A', use: 'Verificado / aprobado' },
  ],
  typography: [
    'Cabecera: blackletter tradicional (texto temporal hasta tener el logo oficial).',
    'Titulares: serif editorial pesada y condensada.',
    'No generar texto crítico dentro de la imagen: titulares, nombres, rangos y LP se componen en HTML.',
  ],
  humor: [
    'Humor dominicano y gamer: exageración dramática, expresiones criollas, tono de noticiero solemne.',
    'Se satiriza la situación, no se humilla a la persona.',
    'Metáforas de bolsa de valores, deportes y política para eventos de ranked.',
  ],
  editorialRules: [
    'Usar solo información aprobada de la edición actual.',
    'No reutilizar eventos de ediciones anteriores.',
    'Preservar valores LP exactos, posiciones del Power Ranking y frases textuales.',
    'Marcar los rumores como rumores.',
    'Señalar información faltante en vez de inventarla.',
    'Recomendar varias imágenes cuando ayuden a la edición.',
  ],
  prohibited: [
    'Inventar eventos, estadísticas, rangos, frases o participantes.',
    'Atribuir frases a una persona distinta.',
    'Crear o alterar el logo oficial o una mascota oficial sin aprobación.',
    'Usar logotipos, arte o personajes protegidos de terceros como elementos principales.',
    'Contenido sexual, de odio o que exponga datos privados de miembros.',
  ],
  logo: { status: 'PENDING', notes: 'No hay logo oficial en el repositorio. Usar solo la cabecera tipográfica temporal.' },
  characters: [],
};

export function bibleToMarkdown(b: CreativeBible): string {
  const list = (xs: string[]) => xs.map((x) => `- ${x}`).join('\n');
  return [
    `# Corral Creative Bible v${b.version}`,
    `**${b.identity.name}** — “${b.identity.tagline}” · ${b.identity.header} · ${b.identity.community}`,
    `## Principios visuales\n${list(b.visualPrinciples)}`,
    `## Paleta\n${b.palette.map((c) => `- ${c.name} \`${c.hex}\` — ${c.use}`).join('\n')}`,
    `## Tipografía\n${list(b.typography)}`,
    `## Humor\n${list(b.humor)}`,
    `## Reglas editoriales\n${list(b.editorialRules)}`,
    `## Prohibido\n${list(b.prohibited)}`,
    `## Logo\n${b.logo.status === 'OFFICIAL' ? 'Oficial' : 'Pendiente'} — ${b.logo.notes}`,
    `## Personajes registrados\n${b.characters.length ? b.characters.map((c) => `- **${c.name}**: ${c.description}`).join('\n') : '_Ninguno registrado todavía._'}`,
  ].join('\n\n');
}
