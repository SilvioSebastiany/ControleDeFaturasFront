import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PainelAcerto } from './PainelAcerto.tsx';
import { EtapaAcerto, RegraAplicada, Titular } from '../types/fatura.ts';
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
  etapas: [],
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
            etapas: [],
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

  describe('acerto final em etapas', () => {
    const mercado = {
      descricao: 'Mercado',
      valor: 100,
      quemDeve: Titular.Silvio,
      valorEfeito: 50,
      pagoPor: Titular.Claucia,
      regra: RegraAplicada.MeioAMeio,
    };
    const apartamento = {
      descricao: 'Apartamento',
      valor: 500,
      quemDeve: Titular.Silvio,
      valorEfeito: 500,
      pagoPor: null,
      regra: RegraAplicada.AcordoFixo,
    };
    const pix = {
      descricao: 'Pagamento',
      valor: 700,
      quemDeve: Titular.Claucia,
      valorEfeito: 700,
      pagoPor: Titular.Silvio,
      regra: RegraAplicada.Pagamento,
    };

    const comEtapas: AcertoFinalMes = {
      acerto: { quemDeve: Titular.Silvio, valor: 50, itens: [mercado] },
      acertoFinal: { quemDeve: Titular.Claucia, valor: 150, itens: [mercado, apartamento, pix] },
      etapas: [
        {
          etapa: EtapaAcerto.AcertoDoMes,
          itens: [mercado],
          saldoAcumulado: { quemDeve: Titular.Silvio, valor: 50 },
        },
        {
          etapa: EtapaAcerto.AcordosFixos,
          itens: [apartamento],
          saldoAcumulado: { quemDeve: Titular.Silvio, valor: 550 },
        },
        {
          etapa: EtapaAcerto.Pagamentos,
          itens: [pix],
          saldoAcumulado: { quemDeve: Titular.Claucia, valor: 150 },
        },
      ],
      transacoesNaoDefinidas: { quantidade: 1, total: 30 },
    };

    function cartao(nome: RegExp) {
      return within(screen.getByRole('group', { name: nome }));
    }

    it('mostra as etapas com itens e saldo acumulado, aberto por padrao', () => {
      render(<PainelAcerto acertoFinalMes={comEtapas} />);

      const final = cartao(/Acerto final/);
      const etapas = final.getAllByRole('region');
      expect(etapas).toHaveLength(3);

      expect(etapas[0]).toHaveTextContent('Acerto do mês');
      expect(etapas[0]).toHaveTextContent('Mercado');
      expect(etapas[0]).toHaveTextContent('Saldo acumulado: Silvio deve R$ 50,00');

      expect(etapas[1]).toHaveTextContent('Acordos fixos');
      expect(etapas[1]).toHaveTextContent('Apartamento');
      expect(etapas[1]).toHaveTextContent('Saldo acumulado: Silvio deve R$ 550,00');

      expect(etapas[2]).toHaveTextContent('Pagamentos');
      expect(etapas[2]).toHaveTextContent('R$ 700,00 pago pelo Silvio, pagamento → Claucia deve R$ 700,00');
      expect(etapas[2]).toHaveTextContent('Saldo acumulado: Claucia deve R$ 150,00');
    });

    it('explica a inversao quando o pagamento supera a divida', () => {
      render(<PainelAcerto acertoFinalMes={comEtapas} />);

      const [mes, acordos, pagamentos] = cartao(/Acerto final/).getAllByRole('region');
      expect(pagamentos).toHaveTextContent('Pagamento maior que a dívida: agora Claucia deve');
      expect(mes).not.toHaveTextContent('maior que a dívida');
      expect(acordos).not.toHaveTextContent('maior que a dívida');
    });

    it('mostra "Estão quites" no saldo quando a etapa zera a divida', () => {
      const quites: AcertoFinalMes = {
        ...comEtapas,
        acertoFinal: { quemDeve: null, valor: 0, itens: [] },
        etapas: [
          comEtapas.etapas[0],
          { etapa: EtapaAcerto.AcordosFixos, itens: [], saldoAcumulado: { quemDeve: Titular.Silvio, valor: 50 } },
          { etapa: EtapaAcerto.Pagamentos, itens: [], saldoAcumulado: { quemDeve: null, valor: 0 } },
        ],
      };
      render(<PainelAcerto acertoFinalMes={quites} />);

      const pagamentos = cartao(/Acerto final/).getAllByRole('region')[2];
      expect(pagamentos).toHaveTextContent('Saldo acumulado: Estão quites');
    });

    it('detalhamento do acerto final vem aberto e o do acerto do mes vem fechado', () => {
      render(<PainelAcerto acertoFinalMes={comEtapas} />);

      expect(cartao(/Acerto final/).getAllByRole('region')).toHaveLength(3);
      expect(cartao(/Acerto do mês/).queryByText('Mercado')).not.toBeInTheDocument();
    });

    it('permite fechar o acerto final e abrir o acerto do mes', async () => {
      render(<PainelAcerto acertoFinalMes={comEtapas} />);

      await userEvent.click(screen.getByRole('button', { name: /Acerto final/ }));
      expect(cartao(/Acerto final/).queryAllByRole('region')).toHaveLength(0);

      await userEvent.click(screen.getByRole('button', { name: /Acerto do mês/ }));
      expect(cartao(/Acerto do mês/).getByText('Mercado')).toBeInTheDocument();
    });

    it('continua mostrando o alerta de lancamentos nao classificados', () => {
      render(<PainelAcerto acertoFinalMes={comEtapas} />);

      expect(screen.getByText(/1 lançamento sem classificação/)).toBeInTheDocument();
    });
  });
});
