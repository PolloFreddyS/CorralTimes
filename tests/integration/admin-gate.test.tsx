import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/env', () => ({ appConfig: { demoMode: false } }));

describe('puerta de la redacción fuera de modo demo', () => {
  it('no renderiza pantallas administrativas sin autenticación', async () => {
    const { routes } = await import('@/app/router');
    const router = createMemoryRouter(routes, { initialEntries: ['/redaccion/buzon'] });
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole('heading', { name: /acceso restringido/i })).toBeInTheDocument();
    expect(screen.queryByText(/buzón de chismes/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\[DEMO\]/)).not.toBeInTheDocument();
  });

  it('las consultas de datos fallan explícitamente en lugar de devolver datos ficticios', async () => {
    const { submissionsQuery } = await import('@/lib/demo-queries');
    await expect(submissionsQuery.queryFn!({} as never)).rejects.toThrow('DATA_SOURCE_NOT_CONFIGURED');
  });
});
