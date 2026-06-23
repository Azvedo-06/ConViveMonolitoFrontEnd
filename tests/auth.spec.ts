import { test, expect } from '@playwright/test';

test.describe('Autenticação de Usuário', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('deve realizar login com sucesso e depois fazer logout', async ({ page }) => {
    await page.goto('/');

    await page.locator('[data-testid="city-onboarding-card-mambore"]').click();
    await expect(page).toHaveURL(/\/mambore/);

    const loginButton = page.locator('[data-testid="city-login-button-desktop"]');
    await expect(loginButton).toBeVisible();
    await loginButton.click();
    await expect(page).toHaveURL(/\/login/);

    await page.locator('[data-testid="login-email-input"]').fill('admin@convive.com');
    await page.locator('[data-testid="login-password-input"]').fill('admin123');

    await page.locator('[data-testid="login-submit-button"]').click();
    await expect(page).toHaveURL(/\/mambore/);

    const logoutButton = page.locator('[data-testid="city-logout-button-desktop"]');
    await expect(logoutButton).toBeVisible();

    await logoutButton.click();
    await expect(loginButton).toBeVisible();
  });

  test('deve atualizar os dados do perfil com sucesso', async ({ page }) => {
    await page.goto('/');

    await page.locator('[data-testid="city-onboarding-card-mambore"]').click();
    await expect(page).toHaveURL(/\/mambore/);

    await page.locator('[data-testid="city-login-button-desktop"]').click();
    await page.locator('[data-testid="login-email-input"]').fill('admin@convive.com');
    await page.locator('[data-testid="login-password-input"]').fill('admin123');
    await page.locator('[data-testid="login-submit-button"]').click();
    await expect(page).toHaveURL(/\/mambore/);

    const profileButton = page.locator('header nav button').first();
    await expect(profileButton).toBeVisible();
    await profileButton.click();
    await expect(page).toHaveURL(/\/profile/);

    await page.getByPlaceholder('Seu nome').fill('Admin Atualizado');

    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    await expect(page.locator('[data-testid="profile-success-alert"]')).toBeVisible();

    await page.getByPlaceholder('Seu nome').fill('Admin');
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    await expect(page.locator('[data-testid="profile-success-alert"]')).toBeVisible();
  });
});
