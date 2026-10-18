import { expect, test } from '@playwright/test';
import { limparMesDeTeste, semearMesDeTeste } from './seed.ts';

// Teste visual do Resumo: abre a tela em celular (390 e 360 px) e desktop, em tema
// claro e escuro, tira prints de página inteira em e2e/capturas/ e confere que
// nada estoura a largura da tela (sem rolagem horizontal, nada cortado à direita).
// Os prints servem para olhar; a garantia automática é a checagem de largura.
const telas = [
  { nome: 'celular-390', largura: 390, altura: 844 },
  { nome: 'celular-360', largura: 360, altura: 740 },
  { nome: 'desktop-1280', largura: 1280, altura: 900 },
];
const temas = ['light', 'dark'] as const;

test.describe('Resumo do mês: visual', () => {
  const mes = '2998-03';

  test.beforeEach(async ({ request }) => {
    await limparMesDeTeste(request, mes);
    await semearMesDeTeste(request, mes);
  });

  test.afterEach(async ({ request }) => {
    await limparMesDeTeste(request, mes);
  });

  for (const tela of telas) {
    for (const tema of temas) {
      test(`${tela.nome} (${tema}) cabe na largura e gera print`, async ({ page }) => {
        await page.setViewportSize({ width: tela.largura, height: tela.altura });
        await page.emulateMedia({ colorScheme: tema });
        await page.goto('/');
        await page.getByLabel('Mês').fill(mes);

        // Abre o que vem recolhido para a captura mostrar tudo: itens da fatura do Silvio,
        // compras compartilhadas, regra de cada lançamento e a prova real.
        await expect(page.getByTestId('resultado-frase')).toContainText('Claucia paga R$ 60,00 para o Silvio');
        const faturaSilvio = page.getByRole('region', { name: 'Fatura do Silvio' });
        await faturaSilvio.getByRole('button', { name: /Ver os 4 itens da fatura/ }).click();
        await expect(faturaSilvio.getByRole('listitem')).toHaveCount(4);
        await page.getByRole('button', { name: /as compras compartilhadas/ }).click();
        await page.getByRole('button', { name: /regra aplicada a cada lançamento/ }).click();
        await page.getByRole('region', { name: 'Prova real' }).getByText('Ver a conta alternativa').click();
        await page.getByRole('region', { name: 'Lançamentos sem efeito' }).getByRole('button').click();
        await expect(page.getByRole('region', { name: 'Lançamentos sem efeito' }).getByRole('listitem')).toHaveCount(1);

        // A barra inferior é fixa; na captura de página inteira ela ficaria no meio.
        // Posicionada no fim, mostra como a tela aparece ao rolar até o final.
        await page.addStyleTag({ content: '.bottom-nav { position: static !important; }' });
        await page.screenshot({
          path: `e2e/capturas/resumo-${tela.nome}-${tema}.png`,
          fullPage: true,
        });

        // Sem rolagem horizontal na página.
        const larguras = await page.evaluate(() => ({
          conteudo: document.documentElement.scrollWidth,
          janela: document.documentElement.clientWidth,
        }));
        expect(larguras.conteudo).toBeLessThanOrEqual(larguras.janela);

        // Nenhum elemento do painel passa da borda direita da tela.
        const estourados = await page.evaluate(() => {
          const limite = document.documentElement.clientWidth + 1;
          return Array.from(document.querySelectorAll('.painel-acerto *'))
            .filter((el) => el.getBoundingClientRect().right > limite)
            .map((el) => `${el.tagName.toLowerCase()}.${el.className}: ${el.textContent?.slice(0, 60)}`);
        });
        expect(estourados).toEqual([]);
      });
    }
  }
});
