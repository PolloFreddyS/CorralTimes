import type React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Check, CircleDot, Delete, HelpCircle, Minus, Share2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiFetch, ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { isWellFormed, keyboardState, MAX_ATTEMPTS, normalizeWord, shareText, WORD_LENGTH, type LetterFeedback } from '@shared/domain/palabrero';
import { loadProgress, saveProgress, type GuessRow } from './storage';

interface PuzzleMeta {
  id: string;
  editionNumber: number;
  length: number;
  maxAttempts: number;
  clue: string | null;
}

const ROWS = ['QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM'];

/** Estilo de cada estado: color + forma/ícono (no depende solo del color). */
const TILE: Record<LetterFeedback, string> = {
  correct: 'bg-verified text-paper border-verified',
  present: 'bg-editorial-gold text-ink border-editorial-gold border-dashed',
  absent: 'bg-fg-muted/70 text-surface border-fg-muted',
};
const FEEDBACK_LABEL: Record<LetterFeedback, string> = { correct: 'en su lugar', present: 'está en otra posición', absent: 'no está' };
const FeedbackIcon = ({ f }: { f: LetterFeedback }) =>
  f === 'correct' ? <Check aria-hidden className="absolute top-0.5 right-0.5 size-3" /> : f === 'present' ? <CircleDot aria-hidden className="absolute top-0.5 right-0.5 size-3" /> : <Minus aria-hidden className="absolute top-0.5 right-0.5 size-3" />;

export function PalabreroGame({ puzzleId }: { puzzleId: string }) {
  const meta = useQuery({ queryKey: ['puzzle', puzzleId], queryFn: () => apiFetch<PuzzleMeta>(`/public/puzzles/${encodeURIComponent(puzzleId)}`), retry: false });
  const [rows, setRows] = useState<GuessRow[]>(() => loadProgress(puzzleId));
  const [current, setCurrent] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const solved = rows.some((r) => r.feedback.every((f) => f === 'correct'));
  const over = solved || rows.length >= MAX_ATTEMPTS;

  const guess = useMutation({
    mutationFn: (word: string) =>
      apiFetch<{ guess: string; feedback: LetterFeedback[]; solved: boolean }>(`/public/puzzles/${encodeURIComponent(puzzleId)}/guess`, {
        method: 'POST',
        body: JSON.stringify({ guess: word }),
      }),
    onSuccess: (r) => {
      const next = [...rows, { guess: r.guess, feedback: r.feedback }];
      setRows(next);
      saveProgress(puzzleId, next);
      setCurrent('');
      setMessage(r.solved ? '¡Lo adivinaste! El Corral te saluda.' : next.length >= MAX_ATTEMPTS ? 'Se acabaron los intentos. Vuelve con la próxima edición.' : null);
    },
    onError: (e) => setMessage(e instanceof ApiError ? e.message : 'No pudimos validar la palabra.'),
  });

  const submit = useCallback(() => {
    if (over || guess.isPending) return;
    const w = normalizeWord(current);
    if (!isWellFormed(w)) return setMessage(`Faltan letras: la palabra tiene ${WORD_LENGTH}.`);
    if (rows.some((r) => r.guess === w)) return setMessage('Ya probaste esa palabra.');
    setMessage(null);
    guess.mutate(w);
  }, [current, guess, over, rows]);

  const press = useCallback(
    (key: string) => {
      if (over) return;
      if (key === 'ENTER') return submit();
      if (key === 'BACKSPACE') return setCurrent((c) => [...c].slice(0, -1).join(''));
      const k = normalizeWord(key);
      if (/^[A-ZÑ]$/.test(k)) setCurrent((c) => ([...c].length < WORD_LENGTH ? c + k : c));
    },
    [over, submit],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'Enter') {
        // No interferir con Enter sobre botones (activa el botón en foco).
        if (t?.tagName === 'BUTTON') return;
        e.preventDefault();
        press('ENTER');
      } else if (e.key === 'Backspace') press('BACKSPACE');
      else if (e.key.length === 1) press(e.key.toUpperCase());
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press]);

  if (meta.isLoading) return <p className="text-sm text-fg-muted">Cargando el palabrero…</p>;
  if (meta.isError || !meta.data) {
    return (
      <div className="border-2 border-dashed border-rule-soft p-6 text-center">
        <p className="headline text-2xl">El palabrero está descansando</p>
        <p className="mt-1 text-sm text-fg-muted">No hay un juego activo para esta edición.</p>
      </div>
    );
  }

  const keys = keyboardState(rows);
  const grid = Array.from({ length: MAX_ATTEMPTS }, (_, i) => rows[i] ?? (i === rows.length && !over ? { guess: current, feedback: null } : { guess: '', feedback: null }));

  return (
    <div className="mx-auto max-w-md">
      {meta.data.clue && (
        <p className="mb-3 flex items-start gap-2 border-l-4 border-gold-strong bg-surface-raised px-3 py-2 text-sm">
          <HelpCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-gold" /><span><strong>Pista:</strong> {meta.data.clue}</span>
        </p>
      )}
      <div role="grid" aria-label="Tablero del palabrero" className="mx-auto grid w-full max-w-[19rem] gap-1.5">
        {grid.map((row, ri) => (
          <div role="row" key={ri} className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: WORD_LENGTH }, (_, ci) => {
              const ch = [...row.guess][ci] ?? '';
              const f = row.feedback?.[ci];
              return (
                <div
                  role="gridcell"
                  key={ci}
                  aria-label={ch ? `${ch}${f ? `, ${FEEDBACK_LABEL[f]}` : ''}` : 'vacío'}
                  className={cn(
                    'relative flex aspect-square items-center justify-center border-2 font-headline text-2xl font-black select-none',
                    f ? TILE[f] : ch ? 'border-fg bg-surface-raised' : 'border-rule-soft bg-surface-raised/60',
                  )}
                >
                  {ch}
                  {f && <FeedbackIcon f={f} />}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <p role="status" aria-live="polite" className="mt-3 min-h-6 text-center text-sm font-semibold">
        {guess.isPending ? 'Consultando a la redacción…' : message}
      </p>

      {over ? (
        <div className="mt-2 flex justify-center">
          <Button
            variant="ink"
            onClick={async () => {
              const text = shareText({ editionNumber: meta.data.editionNumber, rows: rows.map((r) => r.feedback), solved, url: `${window.location.origin}/juegos` });
              try {
                await navigator.clipboard.writeText(text);
                setCopied(true);
              } catch {
                window.prompt('Copia tu resultado:', text);
              }
            }}
          >
            <Share2 aria-hidden />{copied ? 'Resultado copiado' : 'Compartir resultado'}
          </Button>
        </div>
      ) : (
        <div className="mt-2 space-y-1.5" aria-label="Teclado">
          {ROWS.map((r, i) => (
            <div key={r} className="flex justify-center gap-1">
              {i === 2 && <Key label="ENVIAR" wide onPress={() => press('ENTER')} />}
              {[...r].map((k) => <Key key={k} label={k} state={keys[k]} onPress={() => press(k)} />)}
              {i === 2 && <Key label="⌫" aria="Borrar" wide onPress={() => press('BACKSPACE')} icon={<Delete aria-hidden className="size-5" />} />}
            </div>
          ))}
        </div>
      )}

      <details className="mt-6 border-t border-rule-soft pt-3 text-sm">
        <summary className="cursor-pointer font-semibold">¿Cómo se juega?</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-fg-muted">
          <li>Adivina la palabra de {WORD_LENGTH} letras en {MAX_ATTEMPTS} intentos.</li>
          <li><Check aria-hidden className="inline size-3.5" /> Verde con ✓: letra en su lugar. <CircleDot aria-hidden className="inline size-3.5" /> Dorado punteado con ◉: está, pero en otra posición. <Minus aria-hidden className="inline size-3.5" /> Gris con –: no está.</li>
          <li>Las tildes no cuentan (Á = A), pero la Ñ es su propia letra.</li>
          <li>Tu progreso se guarda solo en este dispositivo.</li>
        </ul>
      </details>
    </div>
  );
}

function Key({ label, aria, state, wide, icon, onPress }: { label: string; aria?: string; state?: LetterFeedback; wide?: boolean; icon?: React.ReactNode; onPress: () => void }) {
  return (
    <button
      type="button"
      aria-label={aria ?? (state ? `${label}, ${FEEDBACK_LABEL[state]}` : label)}
      onClick={onPress}
      className={cn(
        'flex h-12 min-w-0 flex-1 items-center justify-center rounded-sm border font-sans text-sm font-bold sm:h-13',
        wide ? 'max-w-16 flex-[1.5] text-[0.65rem]' : 'max-w-10',
        state ? TILE[state] : 'border-rule bg-surface-sunken text-fg',
      )}
    >
      {icon ?? label}
    </button>
  );
}
