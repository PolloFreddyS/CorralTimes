import { Menu, Moon, Newspaper, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { useDocumentMode, useTheme } from '@/app/theme';
import { brand } from '@/branding/brand.config';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { DemoBanner } from './DemoBanner';
import { ADMIN_NAV } from './nav';

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {ADMIN_NAV.map(({ to, label, Icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 border-l-4 px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'border-accent bg-surface-sunken text-fg' : 'border-transparent text-fg-muted hover:bg-surface-sunken hover:text-fg',
              )
            }
          >
            <Icon aria-hidden className="size-4" />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export function AdminLayout() {
  const { mode, toggle } = useTheme();
  useDocumentMode(mode);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-fg">
        Saltar al contenido
      </a>
      <DemoBanner />
      <header className="sticky top-0 z-30 border-b-2 border-rule bg-surface/95 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} aria-controls="admin-drawer" onClick={() => setOpen((v) => !v)}>
            {open ? <X /> : <Menu />}
          </Button>
          <NavLink to="/redaccion" className="flex items-baseline gap-2">
            <span className="font-masthead text-2xl leading-none">{brand.emoji} El Corral Times</span>
            <span className="kicker hidden text-gold sm:inline">HQ · Redacción</span>
          </NavLink>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggle} aria-label={mode === 'newsroom' ? 'Cambiar a modo periódico' : 'Cambiar a modo redacción'}>
              {mode === 'newsroom' ? <Newspaper /> : <Moon />}
              <span className="hidden sm:inline">{mode === 'newsroom' ? 'Modo periódico' : 'Modo redacción'}</span>
            </Button>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <nav aria-label="Secciones de la redacción" className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-rule py-4 lg:block">
          <NavList />
          <p className="mt-6 px-3 text-[0.7rem] leading-snug text-fg-muted">{brand.motto}</p>
        </nav>
        {open && (
          <div className="fixed inset-0 z-20 lg:hidden" key={location.pathname}>
            <button aria-label="Cerrar menú" className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
            <nav id="admin-drawer" aria-label="Secciones de la redacción" className="absolute top-14 bottom-0 left-0 w-72 overflow-y-auto border-r-2 border-rule bg-surface py-4">
              <NavList onNavigate={() => setOpen(false)} />
            </nav>
          </div>
        )}
        <main id="contenido" className="min-w-0 flex-1 px-3 py-5 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
