import { KeyRound } from 'lucide-react';
import { Link } from 'react-router';
import { NewspaperMasthead } from '@/components/editorial';
import { PhaseNotice } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';

export function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <NewspaperMasthead compact />
      <div className="rule-double my-4" />
      <h1 className="headline text-4xl">Acceso de editores</h1>
      <p className="mt-1 font-serif text-sm text-fg-muted">Enlace mágico por correo + MFA. Solo cuentas autorizadas explícitamente por el proceso de aprovisionamiento.</p>
      <form className="mt-5 space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Field id="email" label="Correo" required>
          <Input id="email" type="email" autoComplete="email" disabled />
        </Field>
        <Button type="submit" className="w-full" disabled><KeyRound aria-hidden />Enviar enlace de acceso</Button>
      </form>
      <div className="mt-4"><PhaseNotice phase={2}>El inicio de sesión con Supabase Auth, la allowlist de administradores y MFA se implementan en la Fase 2.</PhaseNotice></div>
      <p className="mt-6 text-center text-sm"><Link to="/" className="underline">Volver al periódico</Link></p>
    </div>
  );
}
