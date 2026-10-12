import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SecaoAcertoConsolidado } from './SecaoAcertoConsolidado.tsx';
import { FonteItemConta, Titular } from '../../types/fatura.ts';
import type { AcertoConsolidado, LinhaConta } from '../../types/fatura.ts';

const linhaVazia: LinhaConta = { valor: 0, itens: [] };

// Mesmo cenário do protótipo: cada número tem um dono conhecido.
const cenario: AcertoConsolidado = {
  metadeDoQueClauciaPagou: {
    valor: 200,
    itens: [
      { descricao: 'Mercado', valor: 300, fonte: FonteItemConta.CartaoClaucia },
      { descricao: 'Internet', valor: 100, fonte: FonteItemConta.BoletoPagoPorClaucia },
    ],
  },
  metadeDoQueSilvioPagou: {
    valor: 15,
    itens: [
      { descricao: 'Farmácia', valor: 80, fonte: FonteItemConta.CartaoSilvio },
      { descricao: 'Estorno Farmácia', valor: -50, fonte: FonteItemConta.CartaoSilvio },
    ],
  },
  saldoCompartilhado: 185,
  silvioNoCartaoDela: linhaVazia,
  clauciaNoCartaoDele: {
    valor: 120,
    itens: [{ descricao: 'Presente aniversário', valor: 120, fonte: FonteItemConta.CartaoSilvio }],
  },
  subtotalDoMes: { quemDeve: Titular.Silvio, valor: 65 },
  acordosFixos: {
    valor: 500,
    itens: [{ descricao: 'Financiamento', valor: 500, fonte: FonteItemConta.AcordoFixo }],
  },
  total: { quemDeve: Titular.Silvio, valor: 565 },
};

const semAjustes: AcertoConsolidado = {
  ...cenario,
  silvioNoCartaoDela: linhaVazia,
  clauciaNoCartaoDele: linhaVazia,
  acordosFixos: linhaVazia,
  subtotalDoMes: { quemDeve: Titular.Silvio, valor: 185 },
  total: { quemDeve: Titular.Silvio, valor: 185 },
};

function secao() {
  return within(screen.getByRole('region', { name: 'Acerto consolidado' }));
}

describe('SecaoAcertoConsolidado', () => {
  it('mostra as linhas na ordem do Divisor, com valor', () => {
    render(<SecaoAcertoConsolidado acerto={cenario} />);

    const linhas = secao()
      .getAllByTestId('linha-conta')
      .map((l) => l.textContent);
    expect(linhas).toEqual([
      'Silvio deve à Claucia · metade do compartilhado pago por elaR$ 200,00',
      'Claucia deve ao Silvio · metade do compartilhado pago por eleR$ 15,00',
      'Saldo compartilhadoR$ 185,00',
      '− Claucia no cartão deleR$ 120,00',
      'Silvio deveR$ 65,00',
      '+ acordos fixosR$ 500,00',
      'Silvio deveR$ 565,00',
    ]);
  });

  it('mostra o total final como "X paga"', () => {
    render(<SecaoAcertoConsolidado acerto={cenario} />);

    expect(secao().getByTestId('total-final')).toHaveTextContent('Silvio paga');
    expect(secao().getByTestId('total-final')).toHaveTextContent('R$ 565,00');
  });

  it('mostra "Claucia paga" quando é ela quem deve no total', () => {
    render(
      <SecaoAcertoConsolidado
        acerto={{ ...cenario, total: { quemDeve: Titular.Claucia, valor: 85 } }}
      />,
    );

    expect(secao().getByTestId('total-final')).toHaveTextContent('Claucia paga');
    expect(secao().getByTestId('total-final')).toHaveTextContent('R$ 85,00');
  });

  it('mostra "Estão quites", sem valor, quando o total zera', () => {
    render(
      <SecaoAcertoConsolidado
        acerto={{ ...semAjustes, total: { quemDeve: null, valor: 0 }, saldoCompartilhado: 0 }}
      />,
    );

    expect(secao().getByTestId('total-final')).toHaveTextContent('Estão quites');
    expect(secao().getByTestId('total-final')).not.toHaveTextContent('R$');
  });

  it('esconde as linhas de valor zero (pessoal no cartão dela, aqui)', () => {
    render(<SecaoAcertoConsolidado acerto={cenario} />);

    expect(secao().queryByText('+ Silvio no cartão dela')).not.toBeInTheDocument();
    expect(secao().getByText('− Claucia no cartão dele')).toBeInTheDocument();
  });

  it('só mostra o subtotal quando há pessoal no cartão do outro ou acordos', () => {
    render(<SecaoAcertoConsolidado acerto={semAjustes} />);

    expect(secao().queryByText('+ acordos fixos')).not.toBeInTheDocument();
    const linhas = secao()
      .getAllByTestId('linha-conta')
      .map((l) => l.textContent);
    expect(linhas).toEqual([
      'Silvio deve à Claucia · metade do compartilhado pago por elaR$ 200,00',
      'Claucia deve ao Silvio · metade do compartilhado pago por eleR$ 15,00',
      'Saldo compartilhadoR$ 185,00',
    ]);
    expect(secao().getByTestId('total-final')).toHaveTextContent('Silvio paga');
  });

  it('abre a linha e mostra cada item com a fonte', async () => {
    render(<SecaoAcertoConsolidado acerto={cenario} />);

    const linha = secao().getByRole('button', { name: /Silvio deve à Claucia/ });
    expect(linha).toHaveAttribute('aria-expanded', 'false');
    expect(secao().queryByText('Mercado')).not.toBeInTheDocument();

    await userEvent.click(linha);

    expect(linha).toHaveAttribute('aria-expanded', 'true');
    const itens = secao().getAllByRole('listitem');
    expect(itens[0]).toHaveTextContent('Mercado');
    expect(itens[0]).toHaveTextContent('cartão Claucia');
    expect(itens[0]).toHaveTextContent('R$ 300,00');
    expect(itens[1]).toHaveTextContent('Internet');
    expect(itens[1]).toHaveTextContent('débito conta claucia · em Outros Gastos');
  });

  it('mostra o estorno como crédito, com sinal de menos', async () => {
    render(<SecaoAcertoConsolidado acerto={cenario} />);

    await userEvent.click(secao().getByRole('button', { name: /Claucia deve ao Silvio/ }));

    const estorno = secao()
      .getAllByRole('listitem')
      .find((li) => li.textContent?.includes('Estorno Farmácia'));
    expect(estorno).toHaveTextContent('− R$ 50,00');
    expect(estorno).toHaveClass('credito');
  });

  it('explica de quem é o pessoal no cartão do outro e o acordo fixo', async () => {
    render(<SecaoAcertoConsolidado acerto={cenario} />);

    await userEvent.click(secao().getByRole('button', { name: /Claucia no cartão dele/ }));
    await userEvent.click(secao().getByRole('button', { name: /acordos fixos/ }));

    const itens = secao().getAllByRole('listitem');
    expect(itens[0]).toHaveTextContent('Presente aniversário');
    expect(itens[0]).toHaveTextContent('cartão Silvio · 100% Claucia');
    expect(itens[1]).toHaveTextContent('Financiamento');
    expect(itens[1]).toHaveTextContent('acordo mensal fixo');
  });

  it('abre e fecha pelo teclado', async () => {
    render(<SecaoAcertoConsolidado acerto={cenario} />);

    const linha = secao().getByRole('button', { name: /Silvio deve à Claucia/ });
    linha.focus();
    await userEvent.keyboard('{Enter}');
    expect(linha).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Enter}');
    expect(linha).toHaveAttribute('aria-expanded', 'false');
  });
});
