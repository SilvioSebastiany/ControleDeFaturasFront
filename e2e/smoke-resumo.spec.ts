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

  test('mostra o resultado e a conta em passos, de ponta a ponta', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Mês').fill(mes);

    // Mês semeado: tudo no cartão do Silvio. Mercado R$ 100,00 (compartilhado), Presente R$ 30,00
    // (pessoal da Claucia), Assinatura R$ 25,00 (pessoal dele) e Farmácia R$ 40,00 sem categoria.
    // Claucia deve 50 (metade do mercado) + 30 (presente) = 80; o acordo fixo de 20 do Silvio abate: 60.
    const resultado = page.getByRole('region', { name: 'Resultado do mês' });
    await expect(resultado.getByTestId('resultado-frase')).toContainText('Claucia paga R$ 60,00 para o Silvio');

    // Farmácia ficou sem categoria: alerta no topo, acima do resultado, e o resultado avisa que é parcial.
    const alerta = page.getByRole('status');
    await expect(alerta).toContainText('1 lançamento sem categoria');
    await expect(alerta).toContainText('R$ 40,00 aguardando classificação');
    await expect(alerta.getByRole('button', { name: 'Cartão Claucia →' })).toHaveCount(0);
    await expect(resultado).toContainText('Resultado parcial');
    const alertaAntesDoResultado = await page.evaluate(() => {
      const a = document.querySelector('.pendencia-resumo');
      const r = document.querySelector('.resultado');
      return !!a && !!r && !!(a.compareDocumentPosition(r) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(alertaAntesDoResultado).toBe(true);
    const caminho = resultado.getByRole('listitem');
    await expect(caminho.nth(0)).toContainText('Claucia deve R$ 80,00');
    await expect(caminho.nth(1)).toContainText('Claucia deve R$ 60,00');

    // Passo 1: as duas faturas. A do Silvio soma as origens (100 + 25 + 30) e o sem categoria (40).
    const passo1 = page.getByRole('region', { name: /Passo 1/ });
    const faturaSilvio = passo1.getByRole('region', { name: 'Fatura do Silvio' });
    await expect(faturaSilvio.getByText('Total da fatura').locator('..')).toContainText('R$ 195,00');
    await expect(faturaSilvio.getByTestId('linha-conta').filter({ hasText: 'Sem categoria' })).toContainText('R$ 40,00');
    await expect(faturaSilvio).toContainText('Inclui R$ 40,00 ainda sem categoria');
    await expect(passo1.getByRole('region', { name: 'Fatura da Claucia' })).toContainText('Nenhum gasto lançado ainda.');
    // Itens recolhidos até clicar; cada um mostra a origem.
    await expect(faturaSilvio.getByRole('listitem')).toHaveCount(0);
    await faturaSilvio.getByRole('button', { name: /Ver os 4 itens da fatura/ }).click();
    const itens = faturaSilvio.getByRole('listitem');
    await expect(itens).toHaveCount(4);
    await expect(itens.filter({ hasText: 'Mercado Teste' })).toContainText('compartilhado');
    await expect(itens.filter({ hasText: 'Presente Teste' })).toContainText('pessoal de Claucia');
    await expect(itens.filter({ hasText: 'Assinatura Pessoal' })).toContainText('pessoal dele');
    await expect(itens.filter({ hasText: 'Farmacia Teste' })).toContainText('sem categoria');

    // Passo 2: o Silvio pagou os 100 do compartilhado, cada um deveria arcar com 50; a Claucia deve 50.
    const passo2 = page.getByRole('region', { name: /Passo 2/ });
    await expect(passo2.getByText('Total compartilhado').locator('..')).toContainText('R$ 100,00');
    await expect(passo2.getByText('Metade de cada um (÷ 2)').locator('..')).toContainText('R$ 50,00');
    await expect(passo2.getByText('Claucia deve do compartilhado').locator('..')).toContainText('R$ 50,00');

    // Passo 3: o presente da Claucia no cartão dele. A assinatura do Silvio no cartão dele não entra.
    const passo3 = page.getByRole('region', { name: /Passo 3/ });
    await expect(passo3.getByRole('button', { name: /gastos dela no cartão do Silvio/ })).toContainText('R$ 30,00');
    await expect(passo3.getByText('Claucia deve do pessoal').locator('..')).toContainText('R$ 30,00');

    // Passo 4: 50 + 30 = 80, com a aritmética por titular (calculada pela API, o front só exibe).
    const passo4 = page.getByRole('region', { name: /Passo 4/ });
    await expect(passo4.getByText('Claucia deve no mês').locator('..')).toContainText('R$ 80,00');
    await expect(page.getByTestId('aritmetica-acerto-mes')).toContainText(
      'Claucia deve R$ 80,00 − Silvio deve R$ 0,00 = Claucia deve R$ 80,00',
    );
    await expect(page.getByTestId('aritmetica-acerto-mes')).toContainText('O arredondamento é feito uma vez, no fim.');
    // Regra aplicada a cada lançamento: fechada até clicar.
    await expect(passo4.getByRole('listitem')).toHaveCount(0);
    await passo4.getByRole('button', { name: /regra aplicada a cada lançamento/ }).click();
    await expect(passo4.getByRole('listitem').filter({ hasText: 'Mercado Teste' })).toContainText(
      'R$ 100,00 pago pelo Silvio, 50/50 → Claucia deve R$ 50,00',
    );
    await expect(passo4.getByRole('listitem').filter({ hasText: 'Presente Teste' })).toContainText(
      'R$ 30,00 pago pelo Silvio, pessoal do outro → Claucia deve R$ 30,00',
    );

    // Passo 5: parte de 80, o acordo fixo de 20 abate. Sem pagamento semeado (a API não tem
    // endpoint para criar): etapa vazia, mesmo saldo.
    const passo5 = page.getByRole('region', { name: /Passo 5/ });
    await expect(passo5).toContainText('Ponto de partida (passo 4): Claucia deve R$ 80,00');
    const etapas = passo5.getByRole('region');
    await expect(etapas).toHaveCount(2);
    await expect(etapas.nth(0)).toContainText('R$ 20,00, acordo fixo → Silvio deve R$ 20,00');
    await expect(etapas.nth(0)).toContainText('Saldo acumulado: Claucia deve R$ 60,00');
    await expect(etapas.nth(1)).toContainText('Saldo acumulado: Claucia deve R$ 60,00');
    await expect(page.getByTestId('aritmetica-acerto-final')).toContainText(
      'Claucia deve R$ 80,00 − Silvio deve R$ 20,00 = Claucia deve R$ 60,00',
    );

    // Prova real: a conta alternativa chega no mesmo valor do passo 4 (a Claucia deveria arcar com 50 + 30
    // e pagou 0).
    const prova = page.getByRole('region', { name: 'Prova real' });
    await expect(prova).toContainText('Bate com o passo 4');
    await prova.getByText('Ver a conta alternativa').click();
    await expect(prova.getByText('Claucia deve no mês').locator('..')).toContainText('R$ 80,00');

    // Gasto pessoal de quem pagou fica numa seção própria, fora das contas dos passos.
    const semEfeito = page.getByRole('region', { name: 'Lançamentos sem efeito' });
    await expect(semEfeito.getByRole('listitem')).toHaveCount(0);
    await semEfeito.getByRole('button', { name: /Ver 1 lançamento/ }).click();
    await expect(semEfeito.getByRole('listitem')).toHaveCount(1);
    await expect(semEfeito.getByRole('listitem')).toContainText('Assinatura Pessoal');
    await expect(semEfeito.getByRole('listitem')).toContainText('R$ 25,00 pago pelo Silvio, gasto pessoal de quem pagou');
    await expect(passo4.getByRole('listitem').filter({ hasText: 'Assinatura Pessoal' })).toHaveCount(0);

    // O atalho do alerta leva à aba do cartão.
    await alerta.getByRole('button', { name: 'Cartão Silvio →' }).click();
    await expect(page.locator('.aba.active')).toContainText('Silvio');
  });
});
