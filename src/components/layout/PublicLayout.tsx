import { Outlet, ScrollRestoration } from 'react-router';
import { useDocumentMode } from '@/app/theme';
import { SectionNav, SiteFooter } from '@/components/newspaper/SiteChrome';

export function PublicLayout() {
  useDocumentMode('newspaper');
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-fg">
        Saltar al contenido
      </a>
      <div className="mx-auto w-full max-w-6xl px-4 pt-2">
        <SectionNav />
      </div>
      <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:py-6">
        <Outlet />
      </main>
      <SiteFooter />
      <ScrollRestoration />
    </div>
  );
}
