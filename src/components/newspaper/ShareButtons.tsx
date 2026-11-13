import { Check, Link2, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { whatsappShareUrl } from '@shared/creative/whatsapp';

export function ShareButtons({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}${path}`;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild variant="ink" size="sm">
        <a href={whatsappShareUrl(`🐓 ${title}\n${url}`)} target="_blank" rel="noopener noreferrer">
          <MessageCircle aria-hidden />Compartir por WhatsApp
        </a>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          } catch {
            window.prompt('Copia el enlace:', url);
          }
        }}
      >
        {copied ? <Check aria-hidden /> : <Link2 aria-hidden />}
        {copied ? 'Enlace copiado' : 'Copiar enlace'}
      </Button>
      <span className="sr-only" aria-live="polite">{copied ? 'Enlace copiado' : ''}</span>
    </div>
  );
}
