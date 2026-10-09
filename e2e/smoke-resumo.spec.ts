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

    // Mercado R$ 100,00 (Silvio pagou, 50/50) => Claucia deve R$ 50,00; Presente R$ 30,00
    // (Silvio pagou, pessoal da Claucia) => Claucia deve R$ 30,00. Total: Claucia deve R$ 80,00.
    const acertoDoMes = page.getByRole('button', { name: /Acerto do mês/ });
    await expect(acertoDoMes).toContainText('Claucia deve R$ 80,00');

    // Acordo fixo "Silvio deve R$ 20,00" abate: Claucia deve R$ 60,00.
    const acertoFinal = page.getByRole('button', { name: /Acerto final/ });
    await expect(acertoFinal).toContainText('Claucia deve R$ 60,00');

    // Farmácia ficou sem classificação.
    await expect(page.getByText(/1 lançamento sem classificação/)).toBeVisible();

    // Cada item mostra valor original, quem pagou, regra e efeito.
    await acertoDoMes.click();
    await expect(page.getByRole('listitem').filter({ hasText: 'Mercado Teste' })).toContainText(
      'R$ 100,00 pago pelo Silvio, 50/50 → Claucia deve R$ 50,00',
    );
    await expect(page.getByRole('listitem').filter({ hasText: 'Presente Teste' })).toContainText(
      'R$ 30,00 pago pelo Silvio, pessoal do outro → Claucia deve R$ 30,00',
    );

    await acertoFinal.click();
    await expect(page.getByRole('listitem').filter({ hasText: 'Acordo E2E' })).toContainText(
      'R$ 20,00, acordo fixo → Silvio deve R$ 20,00',
    );
  });
});
