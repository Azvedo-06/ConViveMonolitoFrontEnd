import { test, expect } from '@playwright/test';

test.describe('ConVive Onboarding e Proteção de Rotas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('deve redirecionar para a landing page da cidade após selecionar uma cidade', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('[data-testid="city-onboarding-screen"]')).toBeVisible();

    const cardMambore = page.locator('[data-testid="city-onboarding-card-mambore"]');
    await expect(cardMambore).toBeVisible();
    await cardMambore.click();

    await expect(page).toHaveURL(/\/mambore/);
  });

  test('deve bloquear /login se nenhuma cidade estiver selecionada e redirecionar para o onboarding', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveURL(/\/$/);
  });
});
