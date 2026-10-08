import { expect, test } from '@playwright/test';
import { limparMesDeTeste, semearMesDeTeste } from './seed.ts';

// Smoke E2E do Resumo: API (banco controle_de_faturas_test) + Vite sobem pelo
// webServer do playwright.config.ts; o mês é semeado só por endpoints existentes.
test.describe('Resumo do mês', () => {
  const mes = '2998-03';

  test.beforeEach(async ({ request }) => {
    await limparMesDeTeste(request, mes);
    await semearMesDeTeste(request, mes);
  });

  test.afterEach(async ({ request }) => {
    await limparMesDeTeste(request, mes);
  });

  test('mostra o acerto do mês, o acerto final e o alerta de não classificados', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Mês').fill(mes);

    // Mercado R$ 100,00 (Silvio pagou, compartilhado) => Claucia deve R$ 50,00.
    const acertoDoMes = page.getByRole('button', { name: /Acerto do mês/ });
    await expect(acertoDoMes).toContainText('Claucia deve R$ 50,00');

    // Acordo fixo "Silvio deve R$ 20,00" abate: Claucia deve R$ 30,00.
    await expect(page.getByRole('button', { name: /Acerto final/ })).toContainText(
      'Claucia deve R$ 30,00',
    );

    // Farmácia ficou sem classificação.
    await expect(page.getByText(/1 lançamento sem classificação/)).toBeVisible();

    await acertoDoMes.click();
    await expect(page.getByText('Mercado Teste')).toBeVisible();
  });
});
