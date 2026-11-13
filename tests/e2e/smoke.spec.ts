import { expect, test } from '@playwright/test';

test.describe('Corral Press Pass', () => {
  test('carga la portada pública con cabeceras de seguridad', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status()).toBe(200);
    const h = res!.headers();
    expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(h['x-content-type-options']).toBe('nosniff');
    await expect(page.getByRole('heading', { name: '¿QUÉ PASÓ EN EL GALLINERO?' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'newspaper');
  });

  test('valida y envía un reporte en modo demo', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /enviar a la redacción/i }).click();
    await expect(page.getByLabel(/nombre de reportero/i)).toHaveAttribute('aria-invalid', 'true');
    await page.getByLabel(/nombre de reportero/i).fill('Cronista E2E');
    await page.getByLabel(/categoría/i).selectOption('RUMOR');
    await expect(page.getByText(/rumor · no verificado/i).first()).toBeVisible();
    await page.getByLabel(/titular o resumen/i).fill('Rumor de prueba automatizada');
    await page.getByLabel(/qué pasó/i).fill('Descripción de prueba automatizada suficientemente larga.');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /enviar a la redacción/i }).click();
    await expect(page.getByRole('heading', { name: /recibido en la redacción/i })).toBeVisible();
    await expect(page.getByText(/CT-DEMO-/)).toBeVisible();
  });

  test('no hay desbordamiento horizontal', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('Redacción (modo demo)', () => {
  test('navega por las secciones principales', async ({ page, isMobile }) => {
    await page.goto('/redaccion');
    await expect(page.getByText(/MODO DEMO/)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Edición N\.º/ })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'newsroom');

    const go = async (name: RegExp) => {
      if (isMobile) await page.getByRole('button', { name: /abrir menú/i }).click();
      await page.getByRole('navigation', { name: /secciones/i }).getByRole('link', { name }).click();
    };
    await go(/buzón de chismes/i);
    await expect(page.getByRole('heading', { name: 'Reportes recibidos' })).toBeVisible();
    await page.getByRole('searchbox').fill('rechazado');
    await expect(page.getByRole('link', { name: /reporte rechazado de ejemplo/i })).toBeVisible();
    await page.getByRole('link', { name: /reporte rechazado de ejemplo/i }).click();
    await expect(page.getByText(/evidencia original · solo lectura/i)).toBeVisible();

    await go(/wall street del tilt/i);
    await page.getByRole('button', { name: /sincronizar bolsa lp/i }).click();
    await expect(page.getByText(/sincronización no configurada/i)).toBeVisible();
    await expect(page.getByText('s/d').first()).toBeVisible();

    await go(/la imprenta/i);
    await expect(page.getByRole('heading', { name: 'Armado de la edición' })).toBeVisible();
  });

  test('alterna entre modo redacción y modo periódico', async ({ page }) => {
    await page.goto('/redaccion');
    await page.getByRole('button', { name: /cambiar a modo periódico/i }).click();
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'newspaper');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'newspaper');
  });
});

test.describe('API', () => {
  test('rutas admin fallan cerrado con 401', async ({ request }) => {
    const res = await request.get('/api/admin/me', { headers: { Authorization: 'Bearer forged' } });
    expect(res.status()).toBe(401);
  });
  test('la recepción pública está cerrada hasta la Fase 3', async ({ request }) => {
    expect(await (await request.get('/api/public/intake-status')).json()).toEqual({ mode: 'not_configured', open: false });
  });
});
