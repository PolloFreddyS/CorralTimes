/** Generador del anuncio de WhatsApp (el envío es manual; no hay API de WhatsApp). */
export interface AnnouncementInput {
  editionNumber: number;
  headline: string;
  teaser: string;
  url: string;
  extras?: string[];
}

export const WHATSAPP_SOFT_LIMIT = 700;

export function buildWhatsAppAnnouncement(i: AnnouncementInput): string {
  const extras = (i.extras ?? []).slice(0, 3).map((e) => `• ${e}`);
  return [
    `🐓 *EL CORRAL TIMES* — Edición N.º ${i.editionNumber}`,
    '',
    `*${i.headline.trim()}*`,
    '',
    i.teaser.trim(),
    ...(extras.length ? ['', ...extras] : []),
    '',
    `📰 Léela aquí: ${i.url}`,
  ].join('\n');
}

/** Enlace de compartir para lectores (abre WhatsApp con el texto prellenado). */
export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
