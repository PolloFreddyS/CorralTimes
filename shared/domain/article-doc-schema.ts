import { z } from 'zod';

/** Esquemas Zod del documento de artículo (validación en servidor y en el editor). */
const MAX_TEXT = 20_000;

export const textMarkSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('bold') }),
  z.object({ type: z.literal('italic') }),
  z.object({ type: z.literal('link'), attrs: z.object({ href: z.string().max(2048) }) }),
]);

export const textNodeSchema = z.object({
  type: z.literal('text'),
  text: z.string().max(MAX_TEXT),
  marks: z.array(textMarkSchema).max(4).optional(),
});
export type TextNode = z.infer<typeof textNodeSchema>;

const inline = z.array(textNodeSchema).max(200);

export const blockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('paragraph'), content: inline }),
  z.object({ type: z.literal('heading'), attrs: z.object({ level: z.union([z.literal(2), z.literal(3)]) }), content: inline }),
  /** Cita textual: `text` se conserva EXACTA (sin marcas, sin edición satírica). */
  z.object({ type: z.literal('quote'), attrs: z.object({ text: z.string().min(1).max(2000), attribution: z.string().max(200) }) }),
  /**
   * Pasaje bíblico. `quotation` = texto literal de la traducción (se muestra entre comillas con referencia);
   * `paraphrase` = resumen propio (se etiqueta como paráfrasis, sin comillas). Nunca se mezclan.
   */
  z.object({
    type: z.literal('scripture'),
    attrs: z.object({
      mode: z.enum(['quotation', 'paraphrase']),
      text: z.string().min(1).max(4000),
      reference: z.string().min(3).max(80),
      translation: z.string().min(2).max(20),
    }),
  }),
  z.object({ type: z.literal('callout'), attrs: z.object({ tone: z.enum(['info', 'breaking', 'rumor']), title: z.string().max(120) }), content: inline }),
  z.object({ type: z.literal('bulletList'), content: z.array(inline).max(50) }),
  z.object({
    type: z.literal('image'),
    /** Referencia a un media_asset aprobado; la URL la resuelve el servidor, nunca el autor. */
    attrs: z.object({ assetId: z.string().max(64), alt: z.string().max(300), caption: z.string().max(300).optional() }),
  }),
  z.object({
    type: z.literal('table'),
    attrs: z.object({ caption: z.string().max(200).optional() }),
    header: z.array(z.string().max(100)).min(1).max(8),
    rows: z.array(z.array(z.string().max(200)).max(8)).max(50),
  }),
]);
export type Block = z.infer<typeof blockSchema>;

export const articleDocSchema = z.object({ type: z.literal('doc'), content: z.array(blockSchema).max(300) });
export type ArticleDoc = z.infer<typeof articleDocSchema>;

