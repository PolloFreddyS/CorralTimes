import { expect, test, type Page } from '@playwright/test';

const noOverflow = async (page: Page) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
};

test.describe('Periódico digital público', () => {
  test('la portada llega con metadatos Open Graph en el HTML inicial', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain('<meta property="og:title"');
    expect(html).toContain('/social/og-default.png');
    expect(res.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  });

  test('portada → artículo → compartir', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'newspaper');
    await expect(page.getByText(/Edición de demostración con personajes/)).toBeVisible();
    const lead = page.getByRole('heading', { level: 2, name: /CRISIS ALIMENTARIA/ });
    await expect(lead).toBeVisible();
    await noOverflow(page);
    await lead.getByRole('link').click();
    await expect(page).toHaveURL(/\/ediciones\/edicion-002-2026-11-13\/crisis-alimentaria-en-la-grieta$/);
    await expect(page.getByRole('heading', { level: 1, name: /CRISIS ALIMENTARIA/ })).toBeVisible();
    await expect(page.getByText(/texto exacto/i)).toBeVisible();
    const wa = page.getByRole('link', { name: /compartir por whatsapp/i });
    await expect(wa).toHaveAttribute('href', /^https:\/\/wa\.me\/\?text=/);
    await noOverflow(page);
  });

  test('archivo y navegación entre ediciones', async ({ page }) => {
    await page.goto('/archivo');
    await page.getByRole('searchbox').fill('inauguran');
    await page.getByRole('link', { name: /INAUGURAN LA REDACCIÓN/ }).click();
    await expect(page).toHaveURL(/edicion-001/);
    await page.getByRole('link', { name: /N\.º 2/ }).click();
    await expect(page).toHaveURL(/edicion-002/);
  });

  test('Bolsa LP muestra s/d y nunca cero inventado', async ({ page }) => {
    await page.goto('/bolsa-lp');
    await expect(page.getByRole('heading', { name: /bolsa de valores del LP/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Guineo Demo.*sin datos/ })).toBeVisible();
    await expect(page.getByRole('table')).toContainText('s/d');
    await noOverflow(page);
  });

  test('El Palabrero se juega validando en el servidor y persiste al recargar', async ({ page }) => {
    await page.goto('/juegos');
    await expect(page.getByRole('grid', { name: /tablero/i })).toBeVisible();
    await page.keyboard.type('traje');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('gridcell', { name: /^T, / }).first()).toBeVisible();
    await page.reload();
    await expect(page.getByRole('gridcell', { name: /^T, / }).first()).toBeVisible();
    // palabra fuera del diccionario
    for (const k of 'QXZWV') await page.getByRole('button', { name: k, exact: true }).click();
    await page.getByRole('button', { name: 'ENVIAR' }).click();
    await expect(page.getByRole('status').filter({ hasText: /diccionario/ })).toBeVisible();
    await noOverflow(page);
  });

  test('ediciones inexistentes devuelven 404 sin filtrar borradores', async ({ request }) => {
    expect((await request.get('/ediciones/edicion-999-2099-01-01')).status()).toBe(404);
    expect((await request.get('/api/public/editions/edicion-999-2099-01-01')).status()).toBe(404);
  });
});

test.describe('Corral Press Pass', () => {
  test('valida y envía un reporte en modo demo', async ({ page }) => {
    await page.goto('/enviar-noticia');
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
});

test.describe('Corral Times HQ (modo demo)', () => {
  test('navega los módulos principales', async ({ page, isMobile }) => {
    await page.goto('/redaccion');
    await expect(page.getByText(/MODO DEMO/)).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'newsroom');
    const go = async (name: RegExp) => {
      if (isMobile) await page.getByRole('button', { name: /abrir menú/i }).click();
      await page.getByRole('navigation', { name: /secciones de la redacción/i }).getByRole('link', { name }).click();
    };
    await go(/buzón de chismes/i);
    await expect(page.getByRole('heading', { name: 'Reportes recibidos' })).toBeVisible();
    await go(/creative studio/i);
    await expect(page.getByRole('heading', { name: /brief para chatgpt/i })).toBeVisible();
    await page.getByLabel(/tipo de pieza/i).selectOption('SOCIAL_PREVIEW');
    await expect(page.locator('pre')).toContainText('1.91:1');
    await go(/centro de publicación/i);
    await expect(page.getByLabel(/mensaje/i)).toHaveValue(/EL CORRAL TIMES/);
    await go(/wall street del tilt/i);
    await page.getByRole('button', { name: /sincronizar bolsa lp/i }).click();
    await expect(page.getByText(/sincronización no configurada/i)).toBeVisible();
  });
});

test.describe('API', () => {
  test('rutas admin fallan cerrado con 401', async ({ request }) => {
    expect((await request.get('/api/admin/me', { headers: { Authorization: 'Bearer forged' } })).status()).toBe(401);
  });
  test('los metadatos del puzzle no revelan la respuesta', async ({ request }) => {
    const res = await request.get('/api/public/puzzles/demo-puzzle-002');
    expect(res.status()).toBe(200);
    expect(Object.keys(await res.json()).sort()).toEqual(['clue', 'editionNumber', 'id', 'length', 'maxAttempts']);
  });
});
