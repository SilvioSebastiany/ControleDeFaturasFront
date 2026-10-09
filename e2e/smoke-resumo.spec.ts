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

    // Aritmética no fim de cada acerto (calculada pela API, o front só exibe).
    await expect(page.getByTestId('aritmetica-acerto-mes')).toContainText(
      'Claucia deve R$ 80,00 − Silvio deve R$ 0,00 = Claucia deve R$ 80,00',
    );
    await expect(page.getByTestId('aritmetica-acerto-final')).toContainText(
      'Claucia deve R$ 80,00 − Silvio deve R$ 20,00 = Claucia deve R$ 60,00',
    );
    await expect(page.getByTestId('aritmetica-acerto-final')).toContainText(
      'O arredondamento é feito uma vez, no fim.',
    );

    // Farmácia ficou sem classificação.
    await expect(page.getByText(/1 lançamento sem classificação/)).toBeVisible();

    // Cada item mostra valor original, quem pagou, regra e efeito.
    await acertoDoMes.click();
    await expect(page.getByRole('group', { name: /Acerto do mês/ }).getByRole('listitem').filter({ hasText: 'Mercado Teste' })).toContainText(
      'R$ 100,00 pago pelo Silvio, 50/50 → Claucia deve R$ 50,00',
    );
    await expect(page.getByRole('group', { name: /Acerto do mês/ }).getByRole('listitem').filter({ hasText: 'Presente Teste' })).toContainText(
      'R$ 30,00 pago pelo Silvio, pessoal do outro → Claucia deve R$ 30,00',
    );

    // Gasto pessoal de quem pagou fica numa seção própria, fora da lista principal.
    const semEfeito = page.getByRole('region', { name: 'Lançamentos sem efeito' });
    await expect(semEfeito.getByRole('listitem')).toHaveCount(1);
    await expect(semEfeito.getByRole('listitem')).toContainText(
      'Assinatura Pessoal',
    );
    await expect(semEfeito.getByRole('listitem')).toContainText(
      'R$ 25,00 pago pelo Silvio, gasto pessoal de quem pagou',
    );
    await expect(
      page.getByRole('listitem').filter({ hasText: 'Assinatura Pessoal' }),
    ).toHaveCount(1);

    // O acerto final vem aberto por padrao (nao precisa clicar) e mostra as etapas
    // com o saldo acumulado; o acerto do mes vem fechado e abre ao clicar (acima).
    const etapas = page.getByRole('group', { name: /Acerto final/ }).getByRole('region');
    await expect(etapas).toHaveCount(3);
    await expect(etapas.nth(0)).toContainText('Saldo acumulado: Claucia deve R$ 80,00');
    await expect(etapas.nth(1)).toContainText('R$ 20,00, acordo fixo → Silvio deve R$ 20,00');
    await expect(etapas.nth(1)).toContainText('Saldo acumulado: Claucia deve R$ 60,00');
    // Sem pagamento semeado (a API nao tem endpoint para criar): etapa vazia, mesmo saldo.
    await expect(etapas.nth(2)).toContainText('Saldo acumulado: Claucia deve R$ 60,00');

    // Ambos alternaveis: fecha o acerto final.
    await acertoFinal.click();
    await expect(etapas).toHaveCount(0);
  });

  test('acerto do mes vem fechado por padrao e o acerto final aberto', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Mês').fill(mes);

    const grupoMes = page.getByRole('group', { name: /Acerto do mês/ });
    await expect(grupoMes).toContainText('Claucia deve R$ 80,00');
    await expect(grupoMes.getByRole('listitem')).toHaveCount(0);
    await expect(page.getByRole('group', { name: /Acerto final/ }).getByRole('region')).toHaveCount(3);
  });
});
