import { Dialog as D } from 'radix-ui';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './button';

interface ConfirmDialogProps {
  trigger: ReactNode;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  tone?: 'primary' | 'ink';
}

/** Diálogo de confirmación accesible (foco atrapado, Escape, aria-modal) basado en Radix. */
export function ConfirmDialog({ trigger, title, description, confirmLabel, onConfirm, tone = 'primary' }: ConfirmDialogProps) {
  return (
    <D.Root>
      <D.Trigger asChild>{trigger}</D.Trigger>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-40 bg-ink/60" />
        <D.Content className="fixed top-1/2 left-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 border-2 border-rule bg-surface-raised p-5 text-fg shadow-[6px_6px_0_var(--rule)]">
          <D.Title className="headline text-2xl">{title}</D.Title>
          <D.Description asChild>
            <div className="mt-3 font-serif text-sm leading-relaxed text-fg-muted">{description}</div>
          </D.Description>
          <div className="mt-5 flex justify-end gap-2">
            <D.Close asChild>
              <Button variant="outline">Cancelar</Button>
            </D.Close>
            <D.Close asChild>
              <Button variant={tone} onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </D.Close>
          </div>
          <D.Close aria-label="Cerrar" className="absolute top-3 right-3 text-fg-muted hover:text-fg">
            <X className="size-4" />
          </D.Close>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
