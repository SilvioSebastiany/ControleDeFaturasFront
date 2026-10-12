import type { BlocoPagante } from '../../types/fatura.ts';
import { BlocoDoPagante } from './BlocoDoPagante.tsx';

// Prestação de contas (porta de js/totals.js#buildResumoView): para cada titular, o
// que pagou no mês. Os totais vêm calculados da API; aqui só se formata.
export function PrestacaoDeContas({ blocos }: { blocos: BlocoPagante[] }) {
  return (
    <section className="prestacao" aria-label="Prestação de contas">
      <h3 className="prestacao-titulo">Prestação de contas</h3>
      <p className="prestacao-subtitulo">O que cada um pagou no mês.</p>
      <div className="prestacao-blocos">
        {blocos.map((bloco) => (
          <BlocoDoPagante key={bloco.pagante} bloco={bloco} />
        ))}
      </div>
    </section>
  );
}
