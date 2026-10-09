import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PainelAcerto } from './PainelAcerto.tsx';
import { RegraAplicada, Titular } from '../types/fatura.ts';
import type { AcertoFinalMes } from '../types/fatura.ts';

const acertoFinalMes: AcertoFinalMes = {
  acerto: {
    quemDeve: Titular.Claucia,
    valor: 50,
    itens: [
      {
        descricao: 'Mercado',
        valor: 100,
        quemDeve: Titular.Claucia,
        valorEfeito: 50,
        pagoPor: Titular.Silvio,
        regra: RegraAplicada.MeioAMeio,
      },
    ],
  },
  acertoFinal: { quemDeve: null, valor: 0, itens: [] },
  transacoesNaoDefinidas: { quantidade: 0, total: 0 },
};

describe('PainelAcerto', () => {
  it('mostra quem deve quanto no acerto do mês e "quites" no acerto final zerado', () => {
    render(<PainelAcerto acertoFinalMes={acertoFinalMes} />);

    expect(screen.getByRole('button', { name: /Acerto do mês/ })).toHaveTextContent(
      'Claucia deve R$ 50,00',
    );
    expect(screen.getByRole('button', { name: /Acerto final/ })).toHaveTextContent('Estão quites');
  });

  it('abre o detalhamento dos itens ao clicar no cartão', async () => {
    render(<PainelAcerto acertoFinalMes={acertoFinalMes} />);

    expect(screen.queryByText('Mercado')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Acerto do mês/ }));

    expect(screen.getByText('Mercado')).toBeInTheDocument();
  });

  it('avisa quando há lançamentos sem classificação', () => {
    render(
      <PainelAcerto
        acertoFinalMes={{ ...acertoFinalMes, transacoesNaoDefinidas: { quantidade: 2, total: 40 } }}
      />,
    );

    expect(screen.getByText(/2 lançamentos sem classificação/)).toBeInTheDocument();
  });

  describe('item do acerto', () => {
    async function abrirComItem(item: AcertoFinalMes['acerto']['itens'][number]) {
      render(
        <PainelAcerto
          acertoFinalMes={{
            ...acertoFinalMes,
            acerto: { quemDeve: item.quemDeve, valor: Math.abs(item.valorEfeito), itens: [item] },
          }}
        />,
      );
      await userEvent.click(screen.getByRole('button', { name: /Acerto do mês/ }));
      return screen.getByRole('listitem');
    }

    it('meio a meio: mostra valor original, quem pagou, regra e efeito', async () => {
      const item = await abrirComItem({
        descricao: 'Mercado',
        valor: 100,
        quemDeve: Titular.Silvio,
        valorEfeito: 50,
        pagoPor: Titular.Claucia,
        regra: RegraAplicada.MeioAMeio,
      });

      expect(item).toHaveTextContent('Mercado');
      expect(item).toHaveTextContent('R$ 100,00 pago pela Claucia, 50/50 → Silvio deve R$ 50,00');
    });

    it('valor fixo: mostra o valor combinado como efeito', async () => {
      const item = await abrirComItem({
        descricao: 'Financiamento',
        valor: 1200,
        quemDeve: Titular.Silvio,
        valorEfeito: 500,
        pagoPor: Titular.Claucia,
        regra: RegraAplicada.ValorFixo,
      });

      expect(item).toHaveTextContent('R$ 1.200,00 pago pela Claucia, valor fixo → Silvio deve R$ 500,00');
    });

    it('pessoal do outro: efeito e o valor integral', async () => {
      const item = await abrirComItem({
        descricao: 'Renner',
        valor: 290.17,
        quemDeve: Titular.Silvio,
        valorEfeito: 290.17,
        pagoPor: Titular.Claucia,
        regra: RegraAplicada.PessoalDoOutro,
      });

      expect(item).toHaveTextContent(
        'R$ 290,17 pago pela Claucia, pessoal do outro → Silvio deve R$ 290,17',
      );
    });

    it('acordo fixo: sem pagador na frase', async () => {
      const item = await abrirComItem({
        descricao: 'Apartamento',
        valor: 500,
        quemDeve: Titular.Silvio,
        valorEfeito: 500,
        pagoPor: null,
        regra: RegraAplicada.AcordoFixo,
      });

      expect(item).toHaveTextContent('R$ 500,00, acordo fixo → Silvio deve R$ 500,00');
      expect(item).not.toHaveTextContent('pago');
    });

    it('pagamento: mostra quem pagou', async () => {
      const item = await abrirComItem({
        descricao: 'Pagamento',
        valor: 850,
        quemDeve: Titular.Claucia,
        valorEfeito: 850,
        pagoPor: Titular.Silvio,
        regra: RegraAplicada.Pagamento,
      });

      expect(item).toHaveTextContent('R$ 850,00 pago pelo Silvio, pagamento → Claucia deve R$ 850,00');
    });

    it('estorno: mostra o efeito invertido de forma clara', async () => {
      const item = await abrirComItem({
        descricao: 'Estorno mercado',
        valor: -50,
        quemDeve: Titular.Claucia,
        valorEfeito: -25,
        pagoPor: Titular.Silvio,
        regra: RegraAplicada.MeioAMeio,
      });

      expect(item).toHaveTextContent(
        'estorno de R$ 50,00 pago pelo Silvio, 50/50 → Claucia deve R$ 25,00 a menos',
      );
    });
  });
});
