import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PrestacaoDeContas } from './PrestacaoDeContas.tsx';
import { OrigemItemFatura, Titular } from '../../types/fatura.ts';
import type { BlocoPagante } from '../../types/fatura.ts';

const vazio = (pagante: Titular): BlocoPagante => ({
  pagante,
  itensFatura: [],
  faturaTotal: 0,
  boletosPagos: [],
  totalDesembolsado: 0,
});

const blocoClaucia: BlocoPagante = {
  pagante: Titular.Claucia,
  itensFatura: [
    { descricao: 'Mercado', valor: 300, origem: OrigemItemFatura.Compartilhado },
    { descricao: 'Camisa do Silvio', valor: 90, origem: OrigemItemFatura.PessoalDoOutro },
    { descricao: 'Perfume', valor: 60, origem: OrigemItemFatura.PessoalProprio },
    { descricao: 'Sem classificar', valor: 10, origem: OrigemItemFatura.SemCategoria },
  ],
  faturaTotal: 460,
  boletosPagos: [{ descricao: 'Internet', valor: 100 }],
  totalDesembolsado: 560,
};

const blocoSilvio: BlocoPagante = {
  pagante: Titular.Silvio,
  itensFatura: [
    { descricao: 'Farmácia', valor: 80, origem: OrigemItemFatura.Compartilhado },
    { descricao: 'Estorno Farmácia', valor: -50, origem: OrigemItemFatura.Compartilhado },
    { descricao: 'Github', valor: 54.28, origem: OrigemItemFatura.PessoalProprio },
    { descricao: 'Presente', valor: 120, origem: OrigemItemFatura.PessoalDoOutro },
  ],
  faturaTotal: 204.28,
  boletosPagos: [],
  totalDesembolsado: 204.28,
};

function bloco(nome: RegExp) {
  return within(screen.getByRole('region', { name: nome }));
}

describe('PrestacaoDeContas', () => {
  it('mostra um bloco "Claucia pagou" e outro "Silvio pagou", nessa ordem', () => {
    render(<PrestacaoDeContas blocos={[blocoClaucia, blocoSilvio]} />);

    const regioes = screen.getAllByRole('region').map((r) => r.getAttribute('aria-label'));
    expect(regioes).toEqual(['Prestação de contas', 'Claucia pagou', 'Silvio pagou']);
  });

  it('mostra a fatura do cartão fechada por padrão, com o total', () => {
    render(<PrestacaoDeContas blocos={[blocoClaucia, blocoSilvio]} />);

    const botao = bloco(/Claucia pagou/).getByRole('button', { name: /Fatura do cartão/ });
    expect(botao).toHaveTextContent('R$ 460,00');
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    expect(bloco(/Claucia pagou/).queryByText('Mercado')).not.toBeInTheDocument();
  });

  it('abre a fatura e mostra cada item com a origem', async () => {
    render(<PrestacaoDeContas blocos={[blocoClaucia, blocoSilvio]} />);

    const botao = bloco(/Claucia pagou/).getByRole('button', { name: /Fatura do cartão/ });
    await userEvent.click(botao);

    expect(botao).toHaveAttribute('aria-expanded', 'true');
    const itens = bloco(/Claucia pagou/).getAllByRole('listitem');
    expect(itens).toHaveLength(4);
    expect(itens[0]).toHaveTextContent('Mercado');
    expect(itens[0]).toHaveTextContent('compartilhado');
    expect(itens[0]).toHaveTextContent('R$ 300,00');
    expect(itens[1]).toHaveTextContent('pessoal de Silvio');
    expect(itens[2]).toHaveTextContent('pessoal dela');
    expect(itens[3]).toHaveTextContent('sem categoria');
  });

  it('diz "pessoal dele" para o gasto próprio do Silvio e "pessoal de Claucia" para o dela no cartão dele', async () => {
    render(<PrestacaoDeContas blocos={[blocoClaucia, blocoSilvio]} />);

    await userEvent.click(bloco(/Silvio pagou/).getByRole('button', { name: /Fatura do cartão/ }));

    const itens = bloco(/Silvio pagou/).getAllByRole('listitem');
    expect(itens[2]).toHaveTextContent('pessoal dele');
    expect(itens[3]).toHaveTextContent('pessoal de Claucia');
  });

  it('mostra o estorno como crédito, com sinal de menos', async () => {
    render(<PrestacaoDeContas blocos={[blocoClaucia, blocoSilvio]} />);

    await userEvent.click(bloco(/Silvio pagou/).getByRole('button', { name: /Fatura do cartão/ }));

    const estorno = bloco(/Silvio pagou/)
      .getAllByRole('listitem')
      .find((li) => li.textContent?.includes('Estorno Farmácia'));
    expect(estorno).toHaveTextContent('− R$ 50,00');
    expect(estorno).toHaveClass('credito');
  });

  it('lista os boletos pagos e o total desembolsado', () => {
    render(<PrestacaoDeContas blocos={[blocoClaucia, blocoSilvio]} />);

    const claucia = bloco(/Claucia pagou/);
    expect(claucia.getByText('Internet')).toBeInTheDocument();
    expect(claucia.getByText('R$ 100,00')).toBeInTheDocument();
    expect(claucia.getByText('Total desembolsado').closest('div')).toHaveTextContent('R$ 560,00');
  });

  it('mostra "Nenhum gasto lançado ainda" quando o titular não pagou nada', () => {
    render(<PrestacaoDeContas blocos={[blocoClaucia, vazio(Titular.Silvio)]} />);

    const silvio = bloco(/Silvio pagou/);
    expect(silvio.getByText('Nenhum gasto lançado ainda.')).toBeInTheDocument();
    expect(silvio.queryByRole('button')).not.toBeInTheDocument();
    expect(silvio.queryByText('Total desembolsado')).not.toBeInTheDocument();
  });

  it('só mostra a fatura quando há itens (bloco só com boletos)', () => {
    const soBoleto: BlocoPagante = {
      ...vazio(Titular.Silvio),
      boletosPagos: [{ descricao: 'Luz', valor: 70 }],
      totalDesembolsado: 70,
    };
    render(<PrestacaoDeContas blocos={[vazio(Titular.Claucia), soBoleto]} />);

    const silvio = bloco(/Silvio pagou/);
    expect(silvio.queryByRole('button', { name: /Fatura do cartão/ })).not.toBeInTheDocument();
    expect(silvio.getByText('Luz')).toBeInTheDocument();
    expect(silvio.getByText('Total desembolsado').closest('div')).toHaveTextContent('R$ 70,00');
  });

  it('abre e fecha a fatura pelo teclado', async () => {
    render(<PrestacaoDeContas blocos={[blocoClaucia, blocoSilvio]} />);

    const botao = bloco(/Claucia pagou/).getByRole('button', { name: /Fatura do cartão/ });
    botao.focus();
    await userEvent.keyboard('{Enter}');
    expect(botao).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Enter}');
    expect(botao).toHaveAttribute('aria-expanded', 'false');
  });
});
