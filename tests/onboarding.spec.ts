import { test, expect } from '@playwright/test';

test.describe('ConVive Onboarding e Proteção de Rotas', () => {
  test.beforeEach(async ({ page }) => {
    // Limpa o armazenamento local antes de cada teste para iniciar em estado limpo
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('deve redirecionar para a landing page da cidade após selecionar uma cidade', async ({ page }) => {
    await page.goto('/');
    
    // Verifica se a tela de onboarding está visível
    await expect(page.locator('[data-testid="city-onboarding-screen"]')).toBeVisible();
    
    // Seleciona o card da cidade de Mamborê
    const cardMambore = page.locator('[data-testid="city-onboarding-card-mambore"]');
    await expect(cardMambore).toBeVisible();
    await cardMambore.click();
    
    // Verifica se fomos redirecionados para /mambore
    await expect(page).toHaveURL(/\/mambore/);
  });

  test('deve bloquear /login se nenhuma cidade estiver selecionada e redirecionar para o onboarding', async ({ page }) => {
    await page.goto('/login');
    
    // O guard de rotas deve redirecionar de volta para o onboarding pois nenhuma cidade foi selecionada
    await expect(page).toHaveURL(/\/$/);
  });
});
