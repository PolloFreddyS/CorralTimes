/**
 * CONFIGURACIÓN DE MARCA CENTRALIZADA
 * ------------------------------------------------------------
 * Para reemplazar el logo oficial: coloca el archivo en /public/brand/
 * y asigna su ruta a `logo.src`. Mientras sea `null`, se usa la cabecera tipográfica temporal.
 * No se ha encontrado un logo oficial en el repositorio; NO inventamos uno.
 *
 * Los colores viven en src/styles/tokens.css (variables CSS) para que Tailwind y los
 * componentes los consuman sin reescribirse. Aquí se documentan como referencia.
 */
export const brand = {
  name: 'EL CORRAL TIMES',
  emoji: '🐓',
  appName: 'CORRAL TIMES HQ',
  /** Versión del producto. */
  productVersion: '2.0',
  subtitle: 'Noticias, dramas, memes y más caos del gallinero',
  motto: 'Filipenses 4:13',
  community: 'Los Gallos Sin Planes',
  communityNickname: 'El Corral',
  publicationDay: 'Viernes',
  logo: {
    /** Ruta pública del logo oficial, p. ej. "/brand/corral-times-logo.svg". */
    src: null as string | null,
    alt: 'EL CORRAL TIMES',
  },
  /** Ícono pequeño (favicon). Reemplazable en /public/favicon.svg. */
  icon: '/favicon.svg',
  colors: {
    paper: '#F5E8CC',
    ink: '#251F1B',
    breakingRed: '#A73429',
    editorialGold: '#D5AA4F',
    verifiedGreen: '#54624A',
  },
  fonts: {
    masthead: 'UnifrakturMaguntia',
    headline: 'Playfair Display Variable',
    body: 'Source Serif 4 Variable',
    ui: 'Inter Variable',
    mono: 'IBM Plex Mono',
  },
} as const;

export type Brand = typeof brand;
