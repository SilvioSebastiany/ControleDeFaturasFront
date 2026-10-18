import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PainelAcerto } from './PainelAcerto.tsx';
import { EtapaAcerto, MotivoSemEfeito, OrigemItemFatura, RegraAplicada, Titular } from '../types/fatura.ts';
import type { AcertoFinalMes, BlocoPagante } from '../types/fatura.ts';

const consolidadoVazio: AcertoFinalMes['acertoConsolidado'] = {
  metadeDoQueClauciaPagou: { valor: 0, itens: [] },
  metadeDoQueSilvioPagou: { valor: 0, itens: [] },
  saldoCompartilhado: 0,
  divisao: {
    pagoPorSilvio: 0,
    pagoPorClaucia: 0,
    total: 0,
    metadePorPessoa: 0,
    saldo: { quemDeve: null, valor: 0 },
  },
  silvioNoCartaoDela: { valor: 0, itens: [] },
  clauciaNoCartaoDele: { valor: 0, itens: [] },
  saldoPessoal: { quemDeve: null, valor: 0 },
  subtotalDoMes: { quemDeve: null, valor: 0 },
  acordosFixos: { valor: 0, itens: [] },
  total: { quemDeve: null, valor: 0 },
  provaReal: { titular: Titular.Silvio, deveriaArcar: 0, pagou: 0, divida: 0, confere: true },
};

// Pelo menos um lançamento, para o painel mostrar a conta em vez do estado vazio.
const blocoComLancamento = (pagante: Titular): BlocoPagante => ({
  pagante,
  itensFatura: [{ descricao: 'Mercado', valor: 100, origem: OrigemItemFatura.Compartilhado }],
  faturaTotal: 100,
  boletosPagos: [],
  totalDesembolsado: 100,
  compartilhado: 100,
  compartilhadoNoCartao: 100,
  pessoalProprio: 0,
  pessoalDoOutro: 0,
  semCategoria: 0,
  metadeDoCompartilhado: 50,
});
const blocosMinimos = [blocoComLancamento(Titular.Claucia), blocoComLancamento(Titular.Silvio)];

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
    lancamentosSemEfeito: [],
    aritmetica: { subtotalClauciaDeve: 50, subtotalSilvioDeve: 0, diferenca: 50 },
  },
  acertoFinal: {
    quemDeve: null,
    valor: 0,
    itens: [],
    lancamentosSemEfeito: [],
    aritmetica: { subtotalClauciaDeve: 0, subtotalSilvioDeve: 0, diferenca: 0 },
  },
  etapas: [],
  transacoesNaoDefinidas: { quantidade: 0, total: 0, porCartao: [] },
  prestacaoDeContas: blocosMinimos,
  acertoConsolidado: consolidadoVazio,
};

describe('PainelAcerto', () => {
  it('mostra o resultado no topo: "quites" quando o acerto final zera', () => {
    render(<PainelAcerto acertoFinalMes={acertoFinalMes} />);

    expect(screen.getByTestId('resultado-frase')).toHaveTextContent('Estão quites');
  });

  it('abre a regra aplicada a cada lançamento só ao clicar', async () => {
    render(<PainelAcerto acertoFinalMes={acertoFinalMes} />);

    const passo = within(screen.getByRole('region', { name: /Passo 4/ }));
    expect(passo.queryByText('Mercado')).not.toBeInTheDocument();
    await userEvent.click(passo.getByRole('button', { name: /regra aplicada a cada lançamento/ }));

    expect(passo.getByText('Mercado')).toBeInTheDocument();
  });

  describe('alerta de lançamentos sem categoria', () => {
    const comPendencias: AcertoFinalMes = {
      ...acertoFinalMes,
      transacoesNaoDefinidas: {
        quantidade: 2,
        total: 40,
        porCartao: [
          { titular: Titular.Silvio, quantidade: 1, total: 25 },
          { titular: Titular.Claucia, quantidade: 1, total: 15 },
        ],
      },
    };

    it('mostra quantos faltam classificar e quanto somam', () => {
      render(<PainelAcerto acertoFinalMes={comPendencias} />);

      const alerta = screen.getByRole('status');
      expect(alerta).toHaveTextContent('2 lançamentos sem categoria');
      expect(alerta).toHaveTextContent('R$ 40,00 aguardando classificação');
    });

    it('usa o singular quando falta só um', () => {
      render(
        <PainelAcerto
          acertoFinalMes={{
            ...acertoFinalMes,
            transacoesNaoDefinidas: {
              quantidade: 1,
              total: 25,
              porCartao: [{ titular: Titular.Silvio, quantidade: 1, total: 25 }],
            },
          }}
        />,
      );

      expect(screen.getByRole('status')).toHaveTextContent('1 lançamento sem categoria');
    });

    it('fica acima do resultado do mês', () => {
      render(<PainelAcerto acertoFinalMes={comPendencias} />);

      const alerta = screen.getByRole('status');
      const resultado = screen.getByRole('region', { name: 'Resultado do mês' });
      expect(alerta.compareDocumentPosition(resultado) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('oferece um atalho para cada cartão com pendência', async () => {
      const aoIr = vi.fn();
      render(<PainelAcerto acertoFinalMes={comPendencias} onIrParaCartao={aoIr} />);

      await userEvent.click(screen.getByRole('button', { name: 'Cartão Silvio →' }));
      expect(aoIr).toHaveBeenLastCalledWith(Titular.Silvio);

      await userEvent.click(screen.getByRole('button', { name: 'Cartão Claucia →' }));
      expect(aoIr).toHaveBeenLastCalledWith(Titular.Claucia);
    });

    it('só mostra o atalho do cartão que tem pendência', () => {
      render(
        <PainelAcerto
          acertoFinalMes={{
            ...acertoFinalMes,
            transacoesNaoDefinidas: {
              quantidade: 1,
              total: 25,
              porCartao: [{ titular: Titular.Silvio, quantidade: 1, total: 25 }],
            },
          }}
        />,
      );

      expect(screen.getByRole('button', { name: 'Cartão Silvio →' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Cartão Claucia →' })).not.toBeInTheDocument();
    });

    it('não aparece quando não há pendências', () => {
      render(<PainelAcerto acertoFinalMes={acertoFinalMes} />);

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('item do acerto', () => {
    async function abrirComItem(item: AcertoFinalMes['acerto']['itens'][number]) {
      render(
        <PainelAcerto
          acertoFinalMes={{
            ...acertoFinalMes,
            acerto: {
              quemDeve: item.quemDeve,
              valor: Math.abs(item.valorEfeito),
              itens: [item],
              lancamentosSemEfeito: [],
              aritmetica: { subtotalClauciaDeve: 0, subtotalSilvioDeve: 0, diferenca: 0 },
            },
            etapas: [],
          }}
        />,
      );
      await userEvent.click(screen.getByRole('button', { name: /regra aplicada a cada lançamento/ }));
      return within(screen.getByRole('region', { name: /Passo 4/ })).getByRole('listitem');
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
  describe('lançamentos sem efeito', () => {
    const comSemEfeito: AcertoFinalMes = {
      ...acertoFinalMes,
      acerto: {
        ...acertoFinalMes.acerto,
        lancamentosSemEfeito: [
          { descricao: 'Github', valor: 54.28, pagoPor: Titular.Silvio, motivo: MotivoSemEfeito.PessoalDeQuemPagou },
          { descricao: 'Anuidade isenta', valor: 0, pagoPor: Titular.Claucia, motivo: MotivoSemEfeito.ValorZero },
        ],
      },
    };

    it('lista cada um numa seção própria, com valor, quem pagou e o motivo, ao abrir', async () => {
      render(<PainelAcerto acertoFinalMes={comSemEfeito} />);

      const secao = screen.getByRole('region', { name: 'Lançamentos sem efeito' });
      await userEvent.click(within(secao).getByRole('button', { name: /Ver 2 lançamentos/ }));
      const [github, anuidade] = within(secao).getAllByRole('listitem');
      expect(github).toHaveTextContent('Github');
      expect(github).toHaveTextContent('R$ 54,28 pago pelo Silvio, gasto pessoal de quem pagou');
      expect(anuidade).toHaveTextContent('Anuidade isenta');
      expect(anuidade).toHaveTextContent('R$ 0,00 pago pela Claucia, valor zero');
    });

    it('vem recolhida e mostra quantos são; abre e fecha ao clicar', async () => {
      render(<PainelAcerto acertoFinalMes={comSemEfeito} />);

      const secao = within(screen.getByRole('region', { name: 'Lançamentos sem efeito' }));
      expect(secao.queryByRole('listitem')).not.toBeInTheDocument();

      await userEvent.click(secao.getByRole('button', { name: /Ver 2 lançamentos que não mudam o acerto/ }));
      expect(secao.getAllByRole('listitem')).toHaveLength(2);

      await userEvent.click(secao.getByRole('button', { name: /Esconder 2 lançamentos/ }));
      expect(secao.queryByRole('listitem')).not.toBeInTheDocument();
    });

    it('não polui a lista principal de itens do acerto', async () => {
      render(<PainelAcerto acertoFinalMes={comSemEfeito} />);
      await userEvent.click(screen.getByRole('button', { name: /regra aplicada a cada lançamento/ }));

      const lista = within(screen.getByRole('region', { name: /Passo 4/ })).getAllByRole('listitem');
      expect(lista).toHaveLength(1);
      expect(lista[0]).toHaveTextContent('Mercado');
    });

    it('não mostra a seção quando não há lançamentos sem efeito', () => {
      render(<PainelAcerto acertoFinalMes={acertoFinalMes} />);

      expect(screen.queryByRole('region', { name: 'Lançamentos sem efeito' })).not.toBeInTheDocument();
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
      acerto: {
        quemDeve: Titular.Silvio,
        valor: 50,
        itens: [mercado],
        lancamentosSemEfeito: [],
        aritmetica: { subtotalClauciaDeve: 0, subtotalSilvioDeve: 50, diferenca: 50 },
      },
      acertoFinal: {
        quemDeve: Titular.Claucia,
        valor: 150,
        itens: [mercado, apartamento, pix],
        lancamentosSemEfeito: [],
        aritmetica: { subtotalClauciaDeve: 700, subtotalSilvioDeve: 550, diferenca: 150 },
      },
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
      transacoesNaoDefinidas: {
        quantidade: 1,
        total: 30,
        porCartao: [{ titular: Titular.Silvio, quantidade: 1, total: 30 }],
      },
      prestacaoDeContas: blocosMinimos,
      acertoConsolidado: consolidadoVazio,
    };

    // Passo 5: as etapas depois do acerto do mês (acordos fixos e pagamentos).
    function passoCinco() {
      return within(screen.getByRole('region', { name: /Passo 5/ }));
    }

    it('mostra o ponto de partida e as etapas de acordos e pagamentos, com itens e saldo acumulado', () => {
      render(<PainelAcerto acertoFinalMes={comEtapas} />);

      const passo = passoCinco();
      expect(passo.getByText(/Ponto de partida \(passo 4\): Silvio deve R\$ 50,00/)).toBeInTheDocument();

      const [acordos, pagamentos] = passo.getAllByRole('region');
      expect(acordos).toHaveTextContent('Acordos fixos');
      expect(acordos).toHaveTextContent('Apartamento');
      expect(acordos).toHaveTextContent('Saldo acumulado: Silvio deve R$ 550,00');

      expect(pagamentos).toHaveTextContent('Pagamentos');
      expect(pagamentos).toHaveTextContent('R$ 700,00 pago pelo Silvio, pagamento → Claucia deve R$ 700,00');
      expect(pagamentos).toHaveTextContent('Saldo acumulado: Claucia deve R$ 150,00');
    });

    it('mostra o resultado do topo e o caminho até ele', () => {
      render(<PainelAcerto acertoFinalMes={comEtapas} />);

      const resultado = within(screen.getByRole('region', { name: 'Resultado do mês' }));
      expect(resultado.getByTestId('resultado-frase')).toHaveTextContent('Claucia paga R$ 150,00 para o Silvio');
      const caminho = resultado.getAllByRole('listitem');
      expect(caminho).toHaveLength(3);
      expect(caminho[0]).toHaveTextContent('Acerto do mêsSilvio deve R$ 50,00');
      expect(caminho[1]).toHaveTextContent('Com acordos fixosSilvio deve R$ 550,00');
      expect(caminho[2]).toHaveTextContent('Com pagamentosClaucia deve R$ 150,00');
    });

    it('explica a inversao quando o pagamento supera a divida', () => {
      render(<PainelAcerto acertoFinalMes={comEtapas} />);

      const [acordos, pagamentos] = passoCinco().getAllByRole('region');
      expect(pagamentos).toHaveTextContent('Pagamento maior que a dívida: agora Claucia deve');
      expect(acordos).not.toHaveTextContent('maior que a dívida');
    });

    it('nao explica "pagamento maior" quando um acordo fixo inverte quem deve', () => {
      const inverteNoAcordo: AcertoFinalMes = {
        ...comEtapas,
        etapas: [
          {
            etapa: EtapaAcerto.AcertoDoMes,
            itens: [mercado],
            saldoAcumulado: { quemDeve: Titular.Claucia, valor: 50 },
          },
          {
            etapa: EtapaAcerto.AcordosFixos,
            itens: [apartamento],
            saldoAcumulado: { quemDeve: Titular.Silvio, valor: 450 },
          },
          comEtapas.etapas[2],
        ],
      };
      render(<PainelAcerto acertoFinalMes={inverteNoAcordo} />);

      const [acordos] = passoCinco().getAllByRole('region');
      expect(acordos).toHaveTextContent('Saldo acumulado: Silvio deve R$ 450,00');
      expect(acordos).not.toHaveTextContent('maior que a dívida');
    });

    it('confia em quemDeve para o saldo: valor minusculo com devedor nao vira "quites"', () => {
      const minusculo: AcertoFinalMes = {
        ...comEtapas,
        etapas: [
          comEtapas.etapas[0],
          comEtapas.etapas[1],
          { etapa: EtapaAcerto.Pagamentos, itens: [], saldoAcumulado: { quemDeve: Titular.Silvio, valor: 0.009 } },
        ],
      };
      render(<PainelAcerto acertoFinalMes={minusculo} />);

      const pagamentos = passoCinco().getAllByRole('region')[1];
      expect(pagamentos).toHaveTextContent('Saldo acumulado: Silvio deve R$ 0,01');
    });

    it('mostra "Estão quites" no saldo quando a etapa zera a divida', () => {
      const quites: AcertoFinalMes = {
        ...comEtapas,
        acertoFinal: {
          quemDeve: null,
          valor: 0,
          itens: [],
          lancamentosSemEfeito: [],
          aritmetica: { subtotalClauciaDeve: 0, subtotalSilvioDeve: 0, diferenca: 0 },
        },
        etapas: [
          comEtapas.etapas[0],
          { etapa: EtapaAcerto.AcordosFixos, itens: [], saldoAcumulado: { quemDeve: Titular.Silvio, valor: 50 } },
          { etapa: EtapaAcerto.Pagamentos, itens: [], saldoAcumulado: { quemDeve: null, valor: 0 } },
        ],
      };
      render(<PainelAcerto acertoFinalMes={quites} />);

      const pagamentos = passoCinco().getAllByRole('region')[1];
      expect(pagamentos).toHaveTextContent('Saldo acumulado: Estão quites');
    });

    it('as etapas de acordos e pagamentos vêm abertas e os itens do acerto do mês vêm fechados', () => {
      render(<PainelAcerto acertoFinalMes={comEtapas} />);

      expect(passoCinco().getAllByRole('region')).toHaveLength(2);
      expect(within(screen.getByRole('region', { name: /Passo 4/ })).queryByText('Mercado')).not.toBeInTheDocument();
    });

    it('continua mostrando o alerta de lancamentos nao classificados', () => {
      render(<PainelAcerto acertoFinalMes={comEtapas} />);

      expect(screen.getByRole('status')).toHaveTextContent('1 lançamento sem categoria');
    });
  });

  describe('aritmetica do acerto', () => {
    const itemQualquer = acertoFinalMes.acerto.itens[0];

    it('mostra os subtotais e a diferenca no fim do acerto do mes, sem precisar abrir o detalhamento', () => {
      render(
        <PainelAcerto
          acertoFinalMes={{
            ...acertoFinalMes,
            acerto: {
              quemDeve: Titular.Claucia,
              valor: 200,
              itens: [itemQualquer],
              lancamentosSemEfeito: [],
              aritmetica: { subtotalClauciaDeve: 320, subtotalSilvioDeve: 120, diferenca: 200 },
            },
          }}
        />,
      );

      expect(screen.getByTestId('aritmetica-acerto-mes')).toHaveTextContent(
        'Claucia deve R$ 320,00 − Silvio deve R$ 120,00 = Claucia deve R$ 200,00',
      );
    });

    it('mostra a aritmetica do acerto final, inclusive quando inverte quem deve', () => {
      render(
        <PainelAcerto
          acertoFinalMes={{
            ...acertoFinalMes,
            acertoFinal: {
              quemDeve: Titular.Silvio,
              valor: 30,
              itens: [itemQualquer],
              lancamentosSemEfeito: [],
              aritmetica: { subtotalClauciaDeve: 20, subtotalSilvioDeve: 50, diferenca: 30 },
            },
          }}
        />,
      );

      expect(screen.getByTestId('aritmetica-acerto-final')).toHaveTextContent(
        'Claucia deve R$ 20,00 − Silvio deve R$ 50,00 = Silvio deve R$ 30,00',
      );
    });

    it('quites: explica o zero pela soma', () => {
      render(
        <PainelAcerto
          acertoFinalMes={{
            ...acertoFinalMes,
            acerto: {
              quemDeve: null,
              valor: 0,
              itens: [itemQualquer],
              lancamentosSemEfeito: [],
              aritmetica: { subtotalClauciaDeve: 50, subtotalSilvioDeve: 50, diferenca: 0 },
            },
          }}
        />,
      );

      expect(screen.getByTestId('aritmetica-acerto-mes')).toHaveTextContent(
        'Claucia deve R$ 50,00 − Silvio deve R$ 50,00 = Estão quites',
      );
    });

    it('avisa que o arredondamento e feito uma vez, no fim', () => {
      render(<PainelAcerto acertoFinalMes={acertoFinalMes} />);

      expect(screen.getByTestId('aritmetica-acerto-mes')).toHaveTextContent(
        'O arredondamento é feito uma vez, no fim.',
      );
    });

    it('mostra a aritmetica mesmo sem itens (0 = 0), para explicar o quites', () => {
      render(<PainelAcerto acertoFinalMes={acertoFinalMes} />);

      expect(screen.getByTestId('aritmetica-acerto-final')).toHaveTextContent(
        'Claucia deve R$ 0,00 − Silvio deve R$ 0,00 = Estão quites',
      );
    });

    it('mes que zera so por lancamentos sem efeito explica o quites', () => {
      render(
        <PainelAcerto
          acertoFinalMes={{
            ...acertoFinalMes,
            acerto: {
              quemDeve: null,
              valor: 0,
              itens: [],
              lancamentosSemEfeito: [
                { descricao: 'Github', valor: 54.28, pagoPor: Titular.Silvio, motivo: MotivoSemEfeito.PessoalDeQuemPagou },
              ],
              aritmetica: { subtotalClauciaDeve: 0, subtotalSilvioDeve: 0, diferenca: 0 },
            },
          }}
        />,
      );

      expect(screen.getByTestId('aritmetica-acerto-mes')).toHaveTextContent(
        'Claucia deve R$ 0,00 − Silvio deve R$ 0,00 = Estão quites',
      );
    });
  });
});
