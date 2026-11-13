import type { ReactNode } from 'react';

export function PageHeader({ kicker, title, description, actions }: { kicker: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 border-b-4 border-double border-rule pb-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="kicker text-accent">{kicker}</p>
        <h1 className="headline text-3xl sm:text-4xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl font-serif text-sm text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Aviso estándar para funciones cuyo backend llega en una fase posterior. */
export function PhaseNotice({ phase, children }: { phase: number; children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 border border-dashed border-rule-soft bg-surface-sunken/60 px-3 py-2 text-xs text-fg-muted">
      <span className="kicker shrink-0 text-gold">Fase {phase}</span>
      <span>{children}</span>
    </p>
  );
}
