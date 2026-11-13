import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

const control =
  'w-full border border-rule bg-surface-raised px-3 py-2 font-sans text-base text-fg placeholder:text-fg-muted/70 focus-visible:outline-2 focus-visible:outline-focus aria-[invalid=true]:border-accent aria-[invalid=true]:bg-accent/5 sm:text-sm';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(control, 'h-11', className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(control, 'min-h-28 resize-y leading-relaxed', className)} {...props} />;
}

export function NativeSelect({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(control, 'h-11 appearance-auto', className)} {...props} />;
}

export function Label({ className, ...props }: ComponentProps<'label'>) {
  return <label className={cn('kicker text-fg', className)} {...props} />;
}

interface FieldProps {
  id: string;
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: string | undefined;
  counter?: { value: number; max: number };
  children: ReactNode;
}

/** Campo accesible: etiqueta asociada, pista y error conectados con aria-describedby desde el control. */
export function Field({ id, label, required, hint, error, counter, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>
          {label}
          {required ? <span className="text-accent" aria-hidden> *</span> : <span className="ml-1 font-normal tracking-normal normal-case text-fg-muted">(opcional)</span>}
        </Label>
        {counter ? (
          <span className={cn('font-mono text-[0.7rem]', counter.value > counter.max ? 'text-accent' : 'text-fg-muted')} aria-hidden>
            {counter.value}/{counter.max}
          </span>
        ) : null}
      </div>
      {children}
      {hint ? <p id={`${id}-hint`} className="text-xs text-fg-muted">{hint}</p> : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-semibold text-accent">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function describedBy(id: string, opts: { hint?: boolean; error?: boolean }) {
  return [opts.hint ? `${id}-hint` : null, opts.error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;
}
