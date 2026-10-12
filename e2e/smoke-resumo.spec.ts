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

    // Farmácia (cartão do Silvio) ficou sem categoria: alerta no topo, acima dos cartões
    // de acerto, com atalho só para o cartão que tem pendência.
    const alerta = page.getByRole('status');
    await expect(alerta).toContainText('1 lançamento sem categoria');
    await expect(alerta).toContainText('R$ 40,00 aguardando classificação');
    await expect(alerta.getByRole('button', { name: 'Cartão Claucia →' })).toHaveCount(0);
    const alertaAntesDoCartao = await page.evaluate(() => {
      const a = document.querySelector('.pendencia-resumo');
      const c = document.querySelector('.acerto-card');
      return !!a && !!c && !!(a.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(alertaAntesDoCartao).toBe(true);

    // Prestação de contas: um bloco por quem pagou, Claucia primeiro. Tudo está no cartão
    // do Silvio (a Claucia não lançou nada).
    const prestacao = page.getByRole('region', { name: 'Prestação de contas' });
    const blocoClaucia = prestacao.getByRole('region', { name: 'Claucia pagou' });
    await expect(blocoClaucia).toContainText('Nenhum gasto lançado ainda.');
    const blocoSilvio = prestacao.getByRole('region', { name: 'Silvio pagou' });
    const fatura = blocoSilvio.getByRole('button', { name: /Fatura do cartão/ });
    await expect(fatura).toContainText('R$ 195,00');
    await expect(fatura).toHaveAttribute('aria-expanded', 'false');
    await expect(blocoSilvio.getByText('Total desembolsado').locator('..')).toContainText('R$ 195,00');
    // "Deste total": mercado compartilhado (100), assinatura dele (25), presente da Claucia (30);
    // a farmácia ficou sem categoria e não entra em nenhuma parte. Metade do compartilhado: 50.
    const desteTotal = blocoSilvio.getByRole('group', { name: 'Deste total' });
    await expect(desteTotal.getByText('Compartilhado').locator('..')).toContainText('R$ 100,00');
    await expect(desteTotal.getByText('Pessoal dele').locator('..')).toContainText('R$ 25,00');
    await expect(desteTotal.getByText('Pessoal de Claucia').locator('..')).toContainText('R$ 30,00');
    await expect(blocoSilvio.getByText('compartilhado · 50% para cada um')).toBeVisible();
    await expect(blocoSilvio.getByRole('group', { name: 'Divisão do compartilhado' })).toContainText('R$ 50,00');
    await fatura.click();
    const itensFatura = blocoSilvio.getByRole('listitem');
    await expect(itensFatura).toHaveCount(4);
    await expect(itensFatura.filter({ hasText: 'Mercado Teste' })).toContainText('compartilhado');
    await expect(itensFatura.filter({ hasText: 'Presente Teste' })).toContainText('pessoal de Claucia');
    await expect(itensFatura.filter({ hasText: 'Assinatura Pessoal' })).toContainText('pessoal dele');
    await expect(itensFatura.filter({ hasText: 'Farmacia Teste' })).toContainText('sem categoria');

    // Seção "Acerto" (como no Divisor, sem pagamentos). Tudo saiu no cartão do Silvio: a Claucia
    // deve a metade do compartilhado (50) e o presente dela (30); acordo fixo de 20 abate.
    const consolidado = page.getByRole('region', { name: 'Acerto consolidado' });
    await expect(consolidado.getByRole('button', { name: /Claucia deve ao Silvio/ })).toContainText('R$ 50,00');
    await expect(consolidado.getByRole('button', { name: /Silvio deve à Claucia/ })).toHaveCount(0);
    await expect(consolidado.getByText('Saldo compartilhado').locator('..')).toContainText('R$ 50,00');
    await expect(consolidado.getByRole('button', { name: /Claucia no cartão dele/ })).toContainText('R$ 30,00');
    await expect(consolidado.getByRole('button', { name: /acordos fixos/ })).toContainText('R$ 20,00');
    await expect(consolidado.getByTestId('total-final')).toContainText('Claucia paga');
    await expect(consolidado.getByTestId('total-final')).toContainText('R$ 60,00');
    await consolidado.getByRole('button', { name: /Claucia deve ao Silvio/ }).click();
    await expect(consolidado.getByRole('listitem').filter({ hasText: 'Mercado Teste' })).toContainText('cartão Silvio');

    // O acerto do mes vem fechado por padrao (sem itens ate clicar).
    await expect(page.getByRole('group', { name: /Acerto do mês/ }).getByRole('listitem')).toHaveCount(0);

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
    // Fora da lista principal do acerto do mês (a prestação de contas, que lista tudo o que
    // saiu na fatura, é outra seção).
    await expect(
      page.getByRole('group', { name: /Acerto do mês/ }).getByRole('listitem').filter({ hasText: 'Assinatura Pessoal' }),
    ).toHaveCount(0);

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

    // O atalho do alerta leva à aba do cartão.
    await alerta.getByRole('button', { name: 'Cartão Silvio →' }).click();
    await expect(page.locator('.aba.active')).toContainText('Silvio');
  });
});
