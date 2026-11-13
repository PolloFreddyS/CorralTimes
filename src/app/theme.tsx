import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type VisualMode = 'newspaper' | 'newsroom';
const STORAGE_KEY = 'ct-hq:newsroom-mode';

interface ThemeCtx {
  mode: VisualMode;
  setMode: (m: VisualMode) => void;
  toggle: () => void;
}
const Ctx = createContext<ThemeCtx | null>(null);

function readStored(): VisualMode | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'newspaper' || v === 'newsroom' ? v : null;
  } catch {
    return null;
  }
}

/** Proveedor del modo visual de la redacción (preferencia local por navegador, no estado crítico). */
export function ThemeProvider({ children, defaultMode = 'newsroom' }: { children: ReactNode; defaultMode?: VisualMode }) {
  const [mode, setModeState] = useState<VisualMode>(() => readStored() ?? defaultMode);
  const setMode = useCallback((m: VisualMode) => {
    setModeState(m);
    try {
      window.localStorage.setItem(STORAGE_KEY, m);
    } catch {
      /* almacenamiento no disponible: se mantiene en memoria */
    }
  }, []);
  const value = useMemo(() => ({ mode, setMode, toggle: () => setMode(mode === 'newsroom' ? 'newspaper' : 'newsroom') }), [mode, setMode]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme fuera de ThemeProvider');
  return v;
}

/** Aplica el modo al <html> mientras el componente está montado. */
export function useDocumentMode(mode: VisualMode) {
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.dataset.mode;
    root.dataset.mode = mode;
    return () => {
      if (prev) root.dataset.mode = prev;
      else delete root.dataset.mode;
    };
  }, [mode]);
}
