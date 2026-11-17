import { KeyRound, Loader2, LogOut, MailCheck, ShieldCheck, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { NewspaperMasthead } from '@/components/editorial';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { AdminSessionProvider, useAdminSession } from './session';

export function LoginPage() {
  return (
    <AdminSessionProvider>
      <div className="mx-auto max-w-md">
        <NewspaperMasthead compact />
        <div className="rule-double my-4" />
        <h1 className="headline text-4xl">Acceso de editores</h1>
        <p className="mt-1 font-serif text-sm text-fg-muted">Enlace mágico por correo + verificación en dos pasos. Solo cuentas autorizadas por el aprovisionamiento.</p>
        <div className="mt-6"><LoginFlow /></div>
        <p className="mt-8 text-center text-sm"><Link to="/" className="underline">Volver al periódico</Link></p>
      </div>
    </AdminSessionProvider>
  );
}

const codeInput = { inputMode: 'numeric' as const, autoComplete: 'one-time-code', pattern: '[0-9]{6}', maxLength: 6 };

function LoginFlow() {
  const { state, supabase, refresh, signOut } = useAdminSession();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enroll, setEnroll] = useState<{ factorId: string; qr: string; secret: string } | null>(null);

  // Inscripción TOTP: limpia factores sin verificar de intentos anteriores y crea uno nuevo.
  useEffect(() => {
    if (state.status !== 'mfa_enroll' || !supabase || enroll) return;
    let cancelled = false;
    (async () => {
      const list = await supabase.auth.mfa.listFactors();
      for (const f of list.data?.all ?? []) if (f.factor_type === 'totp' && f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id });
      const { data, error: err } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Corral Times HQ' });
      if (cancelled) return;
      if (err || !data) return setError('No pudimos iniciar la verificación en dos pasos.');
      setEnroll({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    })();
    return () => {
      cancelled = true;
    };
  }, [state.status, supabase, enroll]);

  const verify = async (factorId: string) => {
    if (!supabase || !/^\d{6}$/.test(code)) return setError('Escribe el código de 6 dígitos de tu app.');
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    setBusy(false);
    if (err) return setError('Código incorrecto o vencido. Intenta con el siguiente.');
    setCode('');
    await refresh();
  };

  if (state.status === 'loading') return <p className="flex items-center gap-2 text-sm text-fg-muted"><Loader2 aria-hidden className="size-4 animate-spin" />Comprobando sesión…</p>;
  if (state.status === 'ready') return <Navigate to="/redaccion" replace />;
  if (state.status === 'unconfigured') return <p role="alert" className="border-2 border-accent p-4 text-sm">El acceso de editores no está configurado en este entorno.</p>;
  if (state.status === 'error') return <p role="alert" className="border-2 border-accent p-4 text-sm">{state.message}</p>;

  if (state.status === 'not_admin') {
    return (
      <div role="alert" className="space-y-3 border-2 border-accent p-4 text-sm">
        <p className="font-semibold">Esta cuenta{state.email ? ` (${state.email})` : ''} no está autorizada para la redacción.</p>
        <p className="text-fg-muted">Los administradores se agregan solo mediante el proceso de aprovisionamiento.</p>
        <Button variant="outline" onClick={() => void signOut()}><LogOut aria-hidden />Cerrar sesión</Button>
      </div>
    );
  }

  if (state.status === 'mfa_enroll') {
    return (
      <div className="space-y-4">
        <p className="flex items-center gap-2 font-semibold"><Smartphone aria-hidden className="size-5 text-accent" />Activa la verificación en dos pasos</p>
        <p className="text-sm text-fg-muted">Escanea el código con Google Authenticator, 1Password, Authy o similar. Es obligatorio para entrar a la redacción.</p>
        {enroll ? (
          <>
            <img src={enroll.qr} alt="Código QR para la app de autenticación" width={200} height={200} className="mx-auto border border-rule bg-white p-2" />
            <p className="text-center font-mono text-xs break-all text-fg-muted">Clave manual: {enroll.secret}</p>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void verify(enroll.factorId); }}>
              <Field id="mfa-code" label="Código de 6 dígitos" required error={error ?? undefined}><Input id="mfa-code" {...codeInput} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} /></Field>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? <Loader2 aria-hidden className="animate-spin" /> : <ShieldCheck aria-hidden />}Activar y entrar</Button>
            </form>
          </>
        ) : (
          <p className="text-sm text-fg-muted">{error ?? 'Preparando el código…'}</p>
        )}
      </div>
    );
  }

  if (state.status === 'mfa_verify') {
    return (
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void verify(state.factor.id); }}>
        <p className="flex items-center gap-2 font-semibold"><ShieldCheck aria-hidden className="size-5 text-accent" />Verificación en dos pasos</p>
        <Field id="mfa-code" label="Código de tu app de autenticación" required error={error ?? undefined}><Input id="mfa-code" {...codeInput} autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} /></Field>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? <Loader2 aria-hidden className="animate-spin" /> : <KeyRound aria-hidden />}Entrar</Button>
        <Button type="button" variant="ghost" className="w-full" onClick={() => void signOut()}>Usar otra cuenta</Button>
      </form>
    );
  }

  // signed_out
  if (sent) {
    return (
      <div role="status" className="space-y-2 border-2 border-rule p-4 text-sm">
        <p className="flex items-center gap-2 font-semibold"><MailCheck aria-hidden className="size-5 text-green" />Revisa tu correo</p>
        <p className="text-fg-muted">Si la dirección está autorizada, recibirás un enlace para entrar. Ábrelo en este mismo navegador.</p>
        <Button variant="ghost" size="sm" onClick={() => setSent(false)}>Usar otro correo</Button>
      </div>
    );
  }
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!supabase || !/^\S+@\S+\.\S+$/.test(email)) return setError('Escribe un correo válido.');
        setBusy(true);
        setError(null);
        // shouldCreateUser: false → nadie crea cuentas desde aquí. Mismo mensaje exista o no la cuenta (sin enumeración).
        await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/acceso` } });
        setBusy(false);
        setSent(true);
      }}
    >
      <Field id="email" label="Correo" required error={error ?? undefined}>
        <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Button type="submit" className="w-full" disabled={busy}>{busy ? <Loader2 aria-hidden className="animate-spin" /> : <KeyRound aria-hidden />}Enviar enlace de acceso</Button>
    </form>
  );
}
