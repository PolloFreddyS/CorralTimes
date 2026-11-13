import { Outlet } from 'react-router';
import { useDocumentMode } from '@/app/theme';
import { brand } from '@/branding/brand.config';

export function PublicLayout() {
  useDocumentMode('newspaper');
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-4 sm:py-8">
        <Outlet />
      </main>
      <footer className="mx-auto w-full max-w-3xl px-4 pb-6 text-center text-xs text-fg-muted">
        <div className="rule-double mb-3" />
        {brand.name} · Periódico satírico de {brand.community} · {brand.motto}
      </footer>
    </div>
  );
}
