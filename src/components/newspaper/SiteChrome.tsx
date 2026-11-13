import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import { brand } from '@/branding/brand.config';
import { cn } from '@/lib/cn';

export const PUBLIC_NAV = [
  { to: '/', label: 'Portada', end: true },
  { to: '/ediciones', label: 'Ediciones' },
  { to: '/bolsa-lp', label: 'Bolsa LP' },
  { to: '/power-rankings', label: 'Power Rankings' },
  { to: '/juegos', label: 'El Palabrero' },
  { to: '/archivo', label: 'Hemeroteca' },
  { to: '/enviar-noticia', label: 'Enviar noticia' },
];

/** Barra superior de secciones del periódico (estilo "section strip" de diario impreso). */
export function SectionNav() {
  const [open, setOpen] = useState(false);
  return (
    <nav aria-label="Secciones del periódico" className="border-y-2 border-rule">
      <div className="flex items-center justify-between sm:hidden">
        <Link to="/" className="py-2 font-masthead text-xl">{brand.emoji} El Corral Times</Link>
        <button className="p-2" aria-expanded={open} aria-controls="public-nav" aria-label={open ? 'Cerrar secciones' : 'Abrir secciones'} onClick={() => setOpen((v) => !v)}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      <ul id="public-nav" className={cn('flex-col gap-0 pb-2 sm:flex sm:flex-row sm:flex-wrap sm:justify-center sm:pb-0', open ? 'flex' : 'hidden')}>
        {PUBLIC_NAV.map((n) => (
          <li key={n.to}>
            <NavLink
              to={n.to}
              end={n.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn('block px-3 py-2.5 font-sans text-xs font-bold tracking-[0.14em] uppercase hover:text-accent sm:py-2', isActive && 'text-accent underline decoration-2 underline-offset-[6px]')
              }
            >
              {n.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-12 w-full max-w-6xl px-4 pb-8 text-center text-xs text-fg-muted">
      <div className="rule-double mb-4" />
      <p className="font-masthead text-2xl text-fg">{brand.emoji} El Corral Times</p>
      <p className="mt-1 font-headline italic">“{brand.subtitle}”</p>
      <p className="mt-2">Periódico satírico de {brand.community} · {brand.motto}</p>
      <p className="mt-1">Sátira: los titulares exageran; los datos (LP, rankings, frases) se publican tal cual fueron aprobados.</p>
      <p className="mt-3 flex justify-center gap-4"><Link className="underline" to="/enviar-noticia">Enviar una noticia</Link><Link className="underline" to="/archivo">Hemeroteca</Link></p>
    </footer>
  );
}
