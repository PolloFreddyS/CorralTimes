import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithOtp = vi.fn(async () => ({ data: {}, error: null }));
const challengeAndVerify = vi.fn(async () => ({ data: {}, error: null }));
const state = { session: null as null | { user: { id: string; email: string } }, aal: 'aal1', factors: [] as { id: string; status: string; factor_type: string }[] };
const fakeClient = {
  auth: {
    getSession: async () => ({ data: { session: state.session } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithOtp,
    signOut: async () => ({ error: null }),
    mfa: {
      getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: state.aal }, error: null }),
      listFactors: async () => ({ data: { totp: state.factors, all: state.factors } }),
      unenroll: async () => ({}),
      enroll: async () => ({ data: { id: 'f1', totp: { qr_code: 'data:image/svg+xml;utf-8,<svg/>', secret: 'SECRETO' } }, error: null }),
      challengeAndVerify,
    },
  },
};
const adminFetch = vi.fn();
vi.mock('@/lib/supabase', () => ({ getSupabase: async () => fakeClient, adminFetch: (...a: unknown[]) => adminFetch(...a) }));

const { LoginPage } = await import('@/features/auth/LoginPage');
const { ApiError } = await import('@/lib/api');
const renderLogin = () => render(<MemoryRouter><LoginPage /></MemoryRouter>);

describe('acceso de editores', () => {
  beforeEach(() => {
    state.session = null;
    state.aal = 'aal1';
    state.factors = [];
    vi.clearAllMocks();
  });

  it('envía el enlace mágico SIN crear cuentas y no revela si el correo existe', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(await screen.findByLabelText(/correo/i), 'alguien@example.com');
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }));
    expect(signInWithOtp).toHaveBeenCalledWith(expect.objectContaining({ email: 'alguien@example.com', options: expect.objectContaining({ shouldCreateUser: false }) }));
    expect(await screen.findByText(/si la dirección está autorizada/i)).toBeInTheDocument();
  });

  it('con sesión pero sin MFA, obliga a inscribir TOTP', async () => {
    state.session = { user: { id: 'u1', email: 'a@b.c' } };
    renderLogin();
    expect(await screen.findByText(/activa la verificación en dos pasos/i)).toBeInTheDocument();
    expect(await screen.findByAltText(/código qr/i)).toBeInTheDocument();
    expect(screen.getByText(/SECRETO/)).toBeInTheDocument();
  });

  it('con factor ya inscrito pide el código y lo verifica', async () => {
    state.session = { user: { id: 'u1', email: 'a@b.c' } };
    state.factors = [{ id: 'f9', status: 'verified', factor_type: 'totp' }];
    const user = userEvent.setup();
    renderLogin();
    await user.type(await screen.findByLabelText(/código de tu app/i), '123456');
    await user.click(screen.getByRole('button', { name: /^entrar$/i }));
    expect(challengeAndVerify).toHaveBeenCalledWith({ factorId: 'f9', code: '123456' });
  });

  it('cuenta con MFA que no está en la lista de admins → no autorizada', async () => {
    state.session = { user: { id: 'u1', email: 'curioso@example.com' } };
    state.aal = 'aal2';
    adminFetch.mockRejectedValueOnce(new ApiError(403, 'NOT_ADMIN', 'No'));
    renderLogin();
    expect(await screen.findByText(/no está autorizada para la redacción/i)).toBeInTheDocument();
  });

  it('admin con MFA: registra el inicio de sesión una vez', async () => {
    state.session = { user: { id: 'u1', email: 'dueno@example.com' } };
    state.aal = 'aal2';
    adminFetch.mockImplementation(async (path: string) => (path === '/me' ? { userId: 'u1', displayName: 'Dueño' } : { ok: true }));
    renderLogin();
    await waitFor(() => expect(adminFetch).toHaveBeenCalledWith('/session', { method: 'POST' }));
  });
});
