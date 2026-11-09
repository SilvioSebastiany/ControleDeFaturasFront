import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AbaCarteira } from './AbaCarteira.tsx';
import { ApiError } from '../api/http.ts';
import { categorizarTransacao } from '../api/transacoes.ts';
import { CategoriaGasto, QuemResponsavel, Titular } from '../types/fatura.ts';
import type { Transacao } from '../types/fatura.ts';

vi.mock('../api/transacoes.ts', () => ({ categorizarTransacao: vi.fn() }));

const categorizar = vi.mocked(categorizarTransacao);

function gasto(id: string, titular: Titular, descricao: string, valor: number, categoria: CategoriaGasto): Transacao {
  return {
    id,
    titular,
    data: '01 OUT',
    descricao,
    valor,
    quem: QuemResponsavel.NaoDefinido,
    automatica: false,
    classificacaoManual: false,
    categoria,
  };
}

const TRANSACOES: Transacao[] = [
  gasto('1', Titular.Claucia, 'Zaffari', 400, CategoriaGasto.Mercado),
  gasto('2', Titular.Silvio, 'Shell Box', 100, CategoriaGasto.Combustivel),
  gasto('3', Titular.Silvio, 'Pag*Joao', 150, CategoriaGasto.NaoCategorizado),
  gasto('4', Titular.Silvio, 'Estorno mercado', -50, CategoriaGasto.Mercado),
];

// Faz o papel de FaturaMes: guarda as transações e aplica a atualização.
function Hospedeiro({ inicial = TRANSACOES, onRecarregar = () => {} }: { inicial?: Transacao[]; onRecarregar?: () => void }) {
  const [transacoes, setTransacoes] = useState(inicial);
  return (
    <AbaCarteira
      mesCarregado
      transacoes={transacoes}
      onTransacaoAtualizada={(t) => setTransacoes((atual) => atual.map((x) => (x.id === t.id ? t : x)))}
      onRecarregar={onRecarregar}
    />
  );
}

function ranking() {
  return within(screen.getByRole('list', { name: 'Ranking das categorias' }));
}

describe('AbaCarteira', () => {
  beforeEach(() => {
    categorizar.mockReset();
    vi.stubGlobal('alert', vi.fn());
  });

  it('mostra os gastos dos dois titulares e o ranking do maior para o menor (C01)', () => {
    render(<Hospedeiro />);

    expect(screen.getByText('Zaffari')).toBeInTheDocument();
    expect(screen.getByText('Shell Box')).toBeInTheDocument();
    const itens = ranking().getAllByRole('listitem');
    expect(itens[0]).toHaveTextContent('Mercado');
    expect(itens[0]).toHaveTextContent('R$ 350,00');
    expect(itens[1]).toHaveTextContent('Não categorizado');
    expect(itens[2]).toHaveTextContent('Combustível');
    expect(screen.getByText(/1 gasto ainda não categorizado/)).toBeInTheDocument();
  });

  it('avisa quando o mês não está carregado ou não tem gastos (C03, C04)', () => {
    const { rerender } = render(
      <AbaCarteira mesCarregado={false} transacoes={[]} onTransacaoAtualizada={() => {}} onRecarregar={() => {}} />,
    );
    expect(screen.getByText(/Nenhuma fatura importada neste mês/)).toBeInTheDocument();

    rerender(<AbaCarteira mesCarregado transacoes={[]} onTransacaoAtualizada={() => {}} onRecarregar={() => {}} />);
    expect(screen.getByText(/Nenhuma fatura importada neste mês/)).toBeInTheDocument();
  });

  it('trocar a categoria chama a API e atualiza lista e ranking (C07, C08)', async () => {
    categorizar.mockResolvedValue({ id: '3', categoria: CategoriaGasto.Mercado });
    render(<Hospedeiro />);

    await userEvent.selectOptions(screen.getByLabelText('Categoria de Pag*Joao'), CategoriaGasto.Mercado);

    expect(categorizar).toHaveBeenCalledWith('3', CategoriaGasto.Mercado);
    await screen.findByText(/R\$ 500,00/);
    const itens = ranking().getAllByRole('listitem');
    expect(itens).toHaveLength(2);
    expect(itens[0]).toHaveTextContent('R$ 500,00');
    expect(screen.queryByText(/ainda não categorizado/)).not.toBeInTheDocument();
  });

  it('falha ao salvar mantém a categoria anterior e avisa', async () => {
    categorizar.mockRejectedValue(new ApiError('Erro interno', 500));
    render(<Hospedeiro />);

    await userEvent.selectOptions(screen.getByLabelText('Categoria de Zaffari'), CategoriaGasto.Outros);

    expect(alert).toHaveBeenCalledWith('Erro interno');
    expect(screen.getByLabelText('Categoria de Zaffari')).toHaveValue(CategoriaGasto.Mercado);
  });

  it('404 avisa e pede para recarregar o mês', async () => {
    categorizar.mockRejectedValue(new ApiError('Not found', 404));
    const onRecarregar = vi.fn();
    render(<Hospedeiro onRecarregar={onRecarregar} />);

    await userEvent.selectOptions(screen.getByLabelText('Categoria de Zaffari'), CategoriaGasto.Outros);

    expect(alert).toHaveBeenCalled();
    expect(onRecarregar).toHaveBeenCalledTimes(1);
  });

  it('filtro por titular muda lista e ranking (C24)', async () => {
    render(<Hospedeiro />);

    await userEvent.click(screen.getByRole('button', { name: 'Claucia' }));

    expect(screen.queryByText('Shell Box')).not.toBeInTheDocument();
    expect(ranking().getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('1 de 1')).toBeInTheDocument();
  });

  it('filtro por categoria muda só a lista; o ranking continua completo (C25)', async () => {
    render(<Hospedeiro />);

    await userEvent.selectOptions(screen.getByLabelText('Categoria'), CategoriaGasto.Combustivel);

    expect(screen.queryByText('Zaffari')).not.toBeInTheDocument();
    expect(screen.getByText('Shell Box')).toBeInTheDocument();
    expect(ranking().getAllByRole('listitem')).toHaveLength(3);
  });
});
