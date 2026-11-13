import { cn } from '@/lib/cn';

export type StampTone = 'approved' | 'rejected' | 'pending' | 'unverified' | 'frozen' | 'demo';

const TONES: Record<StampTone, string> = {
  approved: 'border-green text-green',
  rejected: 'border-accent text-accent',
  pending: 'border-gold text-gold',
  unverified: 'border-accent text-accent',
  frozen: 'border-fg text-fg',
  demo: 'border-gold text-gold',
};

/** Sello editorial tipo "tinta de goma": rotado, doble borde, mayúsculas. */
export function EditorialStamp({ children, tone, className, rotate = true }: { children: string; tone: StampTone; className?: string; rotate?: boolean }) {
  return (
    <span
      className={cn(
        'inline-block border-[3px] border-double px-2 py-0.5 font-sans text-[0.7rem] font-black tracking-[0.2em] uppercase opacity-90 select-none',
        rotate && '-rotate-3',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
