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

        // Abre o acerto do mês (o final já vem aberto) para a tela mostrar tudo.
        const acertoDoMes = page.getByRole('button', { name: /Acerto do mês/ });
        await expect(acertoDoMes).toContainText('Claucia deve R$ 80,00');
        await acertoDoMes.click();
        await expect(page.getByRole('region', { name: 'Lançamentos sem efeito' })).toBeVisible();

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
