import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PainelAcerto } from './PainelAcerto.tsx';
import { Titular } from '../types/fatura.ts';
import type { AcertoFinalMes } from '../types/fatura.ts';

const acertoFinalMes: AcertoFinalMes = {
  acerto: {
    quemDeve: Titular.Claucia,
    valor: 50,
    itens: [{ descricao: 'Mercado', valor: 100, quemDeve: Titular.Claucia, valorEfeito: 50 }],
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
});
