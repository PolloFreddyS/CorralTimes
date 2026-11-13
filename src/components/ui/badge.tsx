import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

export const badgeVariants = cva(
  'inline-flex items-center gap-1 border px-1.5 py-0.5 font-sans text-[0.65rem] font-bold tracking-[0.12em] uppercase leading-none',
  {
    variants: {
      tone: {
        neutral: 'border-rule text-fg',
        red: 'border-accent bg-accent text-accent-fg',
        redOutline: 'border-accent text-accent',
        gold: 'border-gold text-gold',
        green: 'border-green text-green',
        muted: 'border-rule-soft text-fg-muted',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export function Badge({ className, tone, ...props }: ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
