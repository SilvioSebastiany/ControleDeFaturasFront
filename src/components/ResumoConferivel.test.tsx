import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PainelAcerto } from './PainelAcerto.tsx';
import { EtapaAcerto, FonteItemConta, OrigemItemFatura, RegraAplicada, Titular } from '../types/fatura.ts';
import type { AcertoFinalMes, BlocoPagante } from '../types/fatura.ts';

// Cenário Julho/2026 do cenario-de-teste.md do Divisor: os valores abaixo são os esperados
// de lá (a API calcula; o front só mostra). Resultado: Silvio paga R$ 615,65.
const blocoSilvio: BlocoPagante = {
  pagante: Titular.Silvio,
  itensFatura: [
    { descricao: 'Shell Box', valor: 97.05, origem: OrigemItemFatura.Compartilhado },
    { descricao: 'Mercado Irmãos Schmitz', valor: 320.45, origem: OrigemItemFatura.Compartilhado },
    { descricao: 'Github', valor: 54.28, origem: OrigemItemFatura.PessoalProprio },
    { descricao: 'Presente mãe da Claucia', valor: 120, origem: OrigemItemFatura.PessoalDoOutro },
    { descricao: 'Estorno mercado', valor: -50, origem: OrigemItemFatura.Compartilhado },
  ],
  faturaTotal: 541.78,
  boletosPagos: [],
  totalDesembolsado: 541.78,
  compartilhado: 367.5,
  compartilhadoNoCartao: 367.5,
  pessoalProprio: 54.28,
  pessoalDoOutro: 120,
  semCategoria: 0,
  metadeDoCompartilhado: 183.75,
};

const blocoClaucia: BlocoPagante = {
  pagante: Titular.Claucia,
  itensFatura: [
    { descricao: 'Zaffari', valor: 1240.5, origem: OrigemItemFatura.Compartilhado },
    { descricao: 'Panvel', valor: 412.89, origem: OrigemItemFatura.Compartilhado },
    { descricao: 'Salão de beleza', valor: 180, origem: OrigemItemFatura.PessoalProprio },
    { descricao: 'Renner', valor: 290.17, origem: OrigemItemFatura.PessoalDoOutro },
  ],
  faturaTotal: 2123.56,
  boletosPagos: [{ descricao: 'Luz + internet', valor: 305.07 }],
  totalDesembolsado: 2428.63,
  compartilhado: 1958.46,
  compartilhadoNoCartao: 1653.39,
  pessoalProprio: 180,
  pessoalDoOutro: 290.17,
  semCategoria: 0,
  metadeDoCompartilhado: 979.23,
};

const cenario: AcertoFinalMes = {
  acerto: {
    quemDeve: Titular.Silvio,
    valor: 965.65,
    itens: [
      {
        descricao: 'Renner',
        valor: 290.17,
        quemDeve: Titular.Silvio,
        valorEfeito: 290.17,
        pagoPor: Titular.Claucia,
        regra: RegraAplicada.PessoalDoOutro,
      },
    ],
    lancamentosSemEfeito: [],
    aritmetica: { subtotalClauciaDeve: 0, subtotalSilvioDeve: 965.65, diferenca: 965.65 },
  },
  acertoFinal: {
    quemDeve: Titular.Silvio,
    valor: 615.65,
    itens: [],
    lancamentosSemEfeito: [],
    aritmetica: { subtotalClauciaDeve: 850, subtotalSilvioDeve: 1465.65, diferenca: 615.65 },
  },
  etapas: [
    { etapa: EtapaAcerto.AcertoDoMes, itens: [], saldoAcumulado: { quemDeve: Titular.Silvio, valor: 965.65 } },
    {
      etapa: EtapaAcerto.AcordosFixos,
      itens: [
        {
          descricao: 'Apartamento',
          valor: 500,
          quemDeve: Titular.Silvio,
          valorEfeito: 500,
          pagoPor: null,
          regra: RegraAplicada.AcordoFixo,
        },
      ],
      saldoAcumulado: { quemDeve: Titular.Silvio, valor: 1465.65 },
    },
    {
      etapa: EtapaAcerto.Pagamentos,
      itens: [
        {
          descricao: 'Pagamento',
          valor: 850,
          quemDeve: Titular.Claucia,
          valorEfeito: 850,
          pagoPor: Titular.Silvio,
          regra: RegraAplicada.Pagamento,
        },
      ],
      saldoAcumulado: { quemDeve: Titular.Silvio, valor: 615.65 },
    },
  ],
  transacoesNaoDefinidas: { quantidade: 0, total: 0, porCartao: [] },
  prestacaoDeContas: [blocoClaucia, blocoSilvio],
  acertoConsolidado: {
    metadeDoQueClauciaPagou: {
      valor: 979.23,
      itens: [
        { descricao: 'Zaffari', valor: 1240.5, fonte: FonteItemConta.CartaoClaucia },
        { descricao: 'Luz + internet', valor: 305.07, fonte: FonteItemConta.BoletoPagoPorClaucia },
      ],
    },
    metadeDoQueSilvioPagou: {
      valor: 183.75,
      itens: [{ descricao: 'Estorno mercado', valor: -50, fonte: FonteItemConta.CartaoSilvio }],
    },
    saldoCompartilhado: 795.48,
    divisao: {
      pagoPorSilvio: 367.5,
      pagoPorClaucia: 1958.46,
      total: 2325.96,
      metadePorPessoa: 1162.98,
      saldo: { quemDeve: Titular.Silvio, valor: 795.48 },
    },
    silvioNoCartaoDela: {
      valor: 290.17,
      itens: [{ descricao: 'Renner', valor: 290.17, fonte: FonteItemConta.CartaoClaucia }],
    },
    clauciaNoCartaoDele: {
      valor: 120,
      itens: [{ descricao: 'Presente mãe da Claucia', valor: 120, fonte: FonteItemConta.CartaoSilvio }],
    },
    saldoPessoal: { quemDeve: Titular.Silvio, valor: 170.17 },
    subtotalDoMes: { quemDeve: Titular.Silvio, valor: 965.65 },
    acordosFixos: { valor: 500, itens: [] },
    total: { quemDeve: Titular.Silvio, valor: 1465.65 },
    provaReal: { titular: Titular.Silvio, deveriaArcar: 1507.43, pagou: 541.78, divida: 965.65, confere: true },
  },
};

function passo(nome: RegExp) {
  return within(screen.getByRole('region', { name: nome }));
}

describe('Resumo conferível: cenário do Divisor', () => {
  it('mostra o resultado no topo, conferido por dois caminhos', () => {
    render(<PainelAcerto acertoFinalMes={cenario} />);

    const resultado = within(screen.getByRole('region', { name: 'Resultado do mês' }));
    expect(resultado.getByTestId('resultado-frase')).toHaveTextContent('Silvio paga R$ 615,65 para a Claucia');
    expect(resultado.getByText(/Conta conferida por dois caminhos/)).toBeInTheDocument();
  });

  it('põe os passos na ordem da conta, do resultado à prova real', () => {
    render(<PainelAcerto acertoFinalMes={cenario} />);

    const nomes = screen.getAllByRole('region').map((r) => r.getAttribute('aria-label'));
    const esperado = [
      'Resultado do mês',
      'Passo 1: As duas faturas',
      'Passo 2: Divisão do compartilhado',
      'Passo 3: Gastos pessoais no cartão do outro',
      'Passo 4: Acerto do mês',
      'Passo 5: Acordos fixos e pagamentos',
      'Prova real',
    ];
    const posicoes = esperado.map((n) => nomes.indexOf(n));
    expect(posicoes.every((p) => p >= 0)).toBe(true);
    expect([...posicoes].sort((a, b) => a - b)).toEqual(posicoes);
  });

  describe('passo 1: as duas faturas', () => {
    it('mostra a fatura do Silvio antes da da Claucia, com as origens somando o total', () => {
      render(<PainelAcerto acertoFinalMes={cenario} />);

      const faturas = passo(/Passo 1/).getAllByRole('region');
      expect(faturas.map((f) => f.getAttribute('aria-label'))).toEqual(['Fatura do Silvio', 'Fatura da Claucia']);

      const silvio = within(faturas[0]);
      expect(silvio.getByText('Compartilhado').closest('div')).toHaveTextContent('R$ 367,50');
      expect(silvio.getByText('Pessoal dele').closest('div')).toHaveTextContent('R$ 54,28');
      expect(silvio.getByText('Pessoal do outro').closest('div')).toHaveTextContent('R$ 120,00');
      expect(silvio.getByText('Total da fatura').closest('div')).toHaveTextContent('R$ 541,78');
      expect(silvio.getByText('✓ As origens somam o total da fatura.')).toBeInTheDocument();
    });

    it('mostra o que foi pago fora da fatura', () => {
      render(<PainelAcerto acertoFinalMes={cenario} />);

      const claucia = within(passo(/Passo 1/).getByRole('region', { name: 'Fatura da Claucia' }));
      expect(claucia.getByText('Pago fora da fatura')).toBeInTheDocument();
      expect(claucia.getByText('Luz + internet').closest('div')).toHaveTextContent('R$ 305,07');
    });

    it('recolhe os itens e mostra o estorno como crédito ao abrir', async () => {
      render(<PainelAcerto acertoFinalMes={cenario} />);

      const silvio = within(passo(/Passo 1/).getByRole('region', { name: 'Fatura do Silvio' }));
      expect(silvio.queryByText('Estorno mercado')).not.toBeInTheDocument();

      await userEvent.click(silvio.getByRole('button', { name: /Ver os 5 itens da fatura/ }));
      const estorno = silvio.getByText('Estorno mercado').closest('li')!;
      expect(estorno).toHaveTextContent('− R$ 50,00');
      expect(estorno).toHaveTextContent('estorno reduz o total');
      expect(estorno).toHaveClass('credito');
    });

    it('avisa que o sem categoria está no total da fatura mas fora do acerto', () => {
      const comPendencia: AcertoFinalMes = {
        ...cenario,
        prestacaoDeContas: [
          blocoClaucia,
          {
            ...blocoSilvio,
            itensFatura: [
              ...blocoSilvio.itensFatura,
              { descricao: 'Sem classificar', valor: 59, origem: OrigemItemFatura.SemCategoria },
            ],
            faturaTotal: 600.78,
            semCategoria: 59,
          },
        ],
        transacoesNaoDefinidas: {
          quantidade: 1,
          total: 59,
          porCartao: [{ titular: Titular.Silvio, quantidade: 1, total: 59 }],
        },
      };
      render(<PainelAcerto acertoFinalMes={comPendencia} />);

      const silvio = within(passo(/Passo 1/).getByRole('region', { name: 'Fatura do Silvio' }));
      expect(silvio.getByText('Sem categoria').closest('div')).toHaveTextContent('R$ 59,00');
      expect(silvio.getByText(/Inclui R\$ 59,00 ainda sem categoria/)).toBeInTheDocument();
      expect(silvio.queryByText(/As origens somam/)).not.toBeInTheDocument();
      expect(screen.getByText(/Resultado parcial: 1 lançamento sem categoria/)).toBeInTheDocument();
    });

    it('avisa quando as origens não somam o total da fatura', () => {
      render(
        <PainelAcerto
          acertoFinalMes={{
            ...cenario,
            prestacaoDeContas: [blocoClaucia, { ...blocoSilvio, faturaTotal: 600 }],
          }}
        />,
      );

      const silvio = within(passo(/Passo 1/).getByRole('region', { name: 'Fatura do Silvio' }));
      expect(silvio.getByText('⚠ As origens não somam o total da fatura.')).toBeInTheDocument();
    });
  });

  it('passo 2: divide o compartilhado e diz quanto o Silvio deve', () => {
    render(<PainelAcerto acertoFinalMes={cenario} />);

    const p = passo(/Passo 2/);
    expect(p.getByText('Compartilhado pago pelo Silvio').closest('div')).toHaveTextContent('R$ 367,50');
    expect(p.getByText('Compartilhado pago pela Claucia').closest('div')).toHaveTextContent('R$ 1.958,46');
    expect(p.getByText('Total compartilhado').closest('div')).toHaveTextContent('R$ 2.325,96');
    expect(p.getByText('Metade de cada um (÷ 2)').closest('div')).toHaveTextContent('R$ 1.162,98');
    expect(p.getByText('Silvio pagou').closest('div')).toHaveTextContent('R$ 367,50');
    expect(p.getByText('Silvio deve do compartilhado').closest('div')).toHaveTextContent('R$ 795,48');
    expect(p.getByText(/Cada um deveria arcar com R\$ 1\.162,98/)).toBeInTheDocument();
  });

  it('passo 2: quando o compartilhado empata, ninguém deve', () => {
    const empate: AcertoFinalMes = {
      ...cenario,
      acertoConsolidado: {
        ...cenario.acertoConsolidado,
        divisao: { ...cenario.acertoConsolidado.divisao, saldo: { quemDeve: null, valor: 0 } },
      },
    };
    render(<PainelAcerto acertoFinalMes={empate} />);

    expect(passo(/Passo 2/).getByText(/nenhum deve ao outro/)).toBeInTheDocument();
  });

  it('passo 3: soma o pessoal cruzado e não conta Github nem Salão', () => {
    render(<PainelAcerto acertoFinalMes={cenario} />);

    const p = passo(/Passo 3/);
    expect(p.getByRole('button', { name: /gastos dele no cartão da Claucia/ })).toHaveTextContent('R$ 290,17');
    expect(p.getByRole('button', { name: /gastos dela no cartão do Silvio/ })).toHaveTextContent('R$ 120,00');
    expect(p.getByText('Silvio deve do pessoal').closest('div')).toHaveTextContent('R$ 170,17');
    expect(p.queryByText('Github')).not.toBeInTheDocument();
  });

  it('passo 3: sem pessoal cruzado diz isso em vez de mostrar zeros', () => {
    const semCruzado: AcertoFinalMes = {
      ...cenario,
      acertoConsolidado: {
        ...cenario.acertoConsolidado,
        silvioNoCartaoDela: { valor: 0, itens: [] },
        clauciaNoCartaoDele: { valor: 0, itens: [] },
        saldoPessoal: { quemDeve: null, valor: 0 },
      },
    };
    render(<PainelAcerto acertoFinalMes={semCruzado} />);

    expect(passo(/Passo 3/).getByText(/Nenhum gasto pessoal foi pago no cartão do outro/)).toBeInTheDocument();
  });

  it('passo 4: compartilhado + pessoal = acerto do mês', () => {
    render(<PainelAcerto acertoFinalMes={cenario} />);

    const p = passo(/Passo 4/);
    expect(p.getByText('Silvio deve do compartilhado').closest('div')).toHaveTextContent('R$ 795,48');
    expect(p.getByText('Silvio deve do pessoal').closest('div')).toHaveTextContent('+Silvio deve do pessoalR$ 170,17');
    expect(p.getByText('Silvio deve no mês').closest('div')).toHaveTextContent('=Silvio deve no mêsR$ 965,65');
  });

  it('passo 4: desconta quando os devedores são diferentes', () => {
    const cruzado: AcertoFinalMes = {
      ...cenario,
      acertoConsolidado: {
        ...cenario.acertoConsolidado,
        saldoPessoal: { quemDeve: Titular.Claucia, valor: 100 },
        subtotalDoMes: { quemDeve: Titular.Silvio, valor: 695.48 },
      },
    };
    render(<PainelAcerto acertoFinalMes={cruzado} />);

    expect(passo(/Passo 4/).getByText('Claucia deve do pessoal').closest('div')).toHaveTextContent('−Claucia deve do pessoalR$ 100,00');
  });

  it('passo 5: parte do acerto do mês, soma o acordo e abate o pagamento', () => {
    render(<PainelAcerto acertoFinalMes={cenario} />);

    const p = passo(/Passo 5/);
    expect(p.getByText(/Ponto de partida \(passo 4\): Silvio deve R\$ 965,65/)).toBeInTheDocument();
    const [acordos, pagamentos] = p.getAllByRole('region');
    expect(acordos).toHaveTextContent('R$ 500,00, acordo fixo → Silvio deve R$ 500,00');
    expect(acordos).toHaveTextContent('Saldo acumulado: Silvio deve R$ 1.465,65');
    expect(pagamentos).toHaveTextContent('R$ 850,00 pago pelo Silvio, pagamento');
    expect(pagamentos).toHaveTextContent('Saldo acumulado: Silvio deve R$ 615,65');
  });

  describe('prova real', () => {
    it('vem recolhida quando bate com o passo 4', () => {
      render(<PainelAcerto acertoFinalMes={cenario} />);

      const prova = within(screen.getByRole('region', { name: 'Prova real' }));
      expect(prova.getByText('✓ Bate com o passo 4.')).toBeInTheDocument();
      expect(prova.getByText('Ver a conta alternativa').closest('details')).not.toHaveAttribute('open');
      expect(prova.getByText('Silvio deve no mês').closest('div')).toHaveTextContent('R$ 965,65');
    });

    it('abre sozinha e avisa quando as duas contas divergem', () => {
      const diverge: AcertoFinalMes = {
        ...cenario,
        acertoConsolidado: {
          ...cenario.acertoConsolidado,
          provaReal: { ...cenario.acertoConsolidado.provaReal, divida: 900, confere: false },
        },
      };
      render(<PainelAcerto acertoFinalMes={diverge} />);

      const prova = within(screen.getByRole('region', { name: 'Prova real' }));
      expect(prova.getByText(/Não bate com o passo 4/)).toBeInTheDocument();
      expect(prova.getByText('Ver a conta alternativa').closest('details')).toHaveAttribute('open');
      expect(screen.getByText(/As duas contas não batem/)).toBeInTheDocument();
    });
  });

  it('mostra o estado vazio, sem passos, quando o mês não tem lançamentos', () => {
    const vazio = (pagante: Titular): BlocoPagante => ({
      ...blocoSilvio,
      pagante,
      itensFatura: [],
      faturaTotal: 0,
      boletosPagos: [],
    });
    render(<PainelAcerto acertoFinalMes={{ ...cenario, prestacaoDeContas: [vazio(Titular.Claucia), vazio(Titular.Silvio)] }} />);

    expect(screen.getByText(/Nenhum lançamento neste mês/)).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /Passo 1/ })).not.toBeInTheDocument();
  });

  it('mostra "Estão quites" no topo quando o resultado zera', () => {
    render(
      <PainelAcerto
        acertoFinalMes={{ ...cenario, acertoFinal: { ...cenario.acertoFinal, quemDeve: null, valor: 0 } }}
      />,
    );

    expect(screen.getByTestId('resultado-frase')).toHaveTextContent('Estão quites');
  });
});
