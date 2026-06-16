import { test, expect } from '@playwright/test';

test.describe('Autenticação de Usuário', () => {
  test.beforeEach(async ({ page }) => {
    // Limpa o armazenamento local antes de cada teste para iniciar em estado limpo
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('deve realizar login com sucesso e depois fazer logout', async ({ page }) => {
    await page.goto('/');
    
    // Seleciona a cidade de Mamborê no onboarding
    await page.locator('[data-testid="city-onboarding-card-mambore"]').click();
    await expect(page).toHaveURL(/\/mambore/);
    
    // Acessa a tela de login
    const loginButton = page.locator('[data-testid="city-login-button-desktop"]');
    await expect(loginButton).toBeVisible();
    await loginButton.click();
    await expect(page).toHaveURL(/\/login/);
    
    // Preenche as credenciais do usuário admin
    await page.locator('[data-testid="login-email-input"]').fill('admin@convive.com');
    await page.locator('[data-testid="login-password-input"]').fill('admin123');
    
    // Envia o formulário de login
    await page.locator('[data-testid="login-submit-button"]').click();
    await expect(page).toHaveURL(/\/mambore/);
    
    // Confirma que o login foi bem-sucedido e o botão de logout está visível
    const logoutButton = page.locator('[data-testid="city-logout-button-desktop"]');
    await expect(logoutButton).toBeVisible();
    
    // Realiza o logout e garante que o botão de login voltou a aparecer
    await logoutButton.click();
    await expect(loginButton).toBeVisible();
  });

  test('deve atualizar os dados do perfil com sucesso', async ({ page }) => {
    await page.goto('/');
    
    // Seleciona a cidade e realiza o login
    await page.locator('[data-testid="city-onboarding-card-mambore"]').click();
    await expect(page).toHaveURL(/\/mambore/);
    
    await page.locator('[data-testid="city-login-button-desktop"]').click();
    await page.locator('[data-testid="login-email-input"]').fill('admin@convive.com');
    await page.locator('[data-testid="login-password-input"]').fill('admin123');
    await page.locator('[data-testid="login-submit-button"]').click();
    await expect(page).toHaveURL(/\/mambore/);
    
    // Acessa o perfil do usuário pelo menu do cabeçalho
    const profileButton = page.locator('header nav button').first();
    await expect(profileButton).toBeVisible();
    await profileButton.click();
    await expect(page).toHaveURL(/\/profile/);
    
    // Altera o nome do usuário
    await page.getByPlaceholder('Seu nome').fill('Admin Atualizado');
    
    // Clica para salvar as alterações e valida a mensagem de sucesso
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    await expect(page.locator('[data-testid="profile-success-alert"]')).toBeVisible();
    
    // Restaura o nome original para manter a integridade dos dados de seed
    await page.getByPlaceholder('Seu nome').fill('Admin');
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    await expect(page.locator('[data-testid="profile-success-alert"]')).toBeVisible();
  });
});
