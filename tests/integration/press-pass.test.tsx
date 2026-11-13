import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { PressPassPage } from '@/features/press-pass/PressPassPage';

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <PressPassPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Corral Press Pass (modo demo)', () => {
  it('muestra el encabezado editorial', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: '¿QUÉ PASÓ EN EL GALLINERO?' })).toBeInTheDocument();
    expect(screen.getByText('Reporta la noticia. Nosotros hacemos el escándalo.')).toBeInTheDocument();
  });

  it('muestra errores accesibles al enviar vacío', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /enviar a la redacción/i }));
    const alerts = await screen.findAllByRole('alert');
    expect(alerts.length).toBeGreaterThanOrEqual(4);
    expect(screen.getByLabelText(/nombre de reportero/i)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/nombre de reportero/i)).toHaveAttribute('aria-describedby', 'reporterAlias-error');
  });

  it('etiqueta los rumores como no verificados al elegir la categoría', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.selectOptions(screen.getByLabelText(/categoría/i), 'RUMOR');
    expect(screen.getByText(/rumor · no verificado/i)).toBeInTheDocument();
  });

  it('envía en modo demo y muestra un comprobante marcado como demo', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/nombre de reportero/i), 'Cronista');
    await user.selectOptions(screen.getByLabelText(/categoría/i), 'NOTICIA');
    await user.type(screen.getByLabelText(/titular o resumen/i), 'Titular de prueba');
    await user.type(screen.getByLabelText(/qué pasó/i), 'Descripción de prueba con suficiente longitud.');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /enviar a la redacción/i }));
    const heading = await screen.findByRole('heading', { name: /recibido en la redacción/i }, { timeout: 3000 });
    const status = heading.closest('section')!;
    expect(within(status).getByText(/CT-DEMO-[A-Z0-9]{4}/)).toBeInTheDocument();
    expect(within(status).getByText(/demo · no enviado/i)).toBeInTheDocument();
  });

  it('rechaza archivos con formato no permitido', async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderPage();
    await user.upload(screen.getByLabelText(/imagen de apoyo/i), new File(['<svg/>'], 'x.svg', { type: 'image/svg+xml' }));
    expect(await screen.findByText(/formato no permitido/i)).toBeInTheDocument();
  });
});
