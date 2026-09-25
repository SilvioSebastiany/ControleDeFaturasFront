import { Titular } from '../types/fatura.ts';
import type { AcertoFinalMes } from '../types/fatura.ts';

function formatarValor(valor: number): string {
  return 'R$ ' + Math.abs(valor).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

const ROTULO_TITULAR: Record<Titular, string> = {
  [Titular.Silvio]: 'Silvio',
  [Titular.Claucia]: 'Claucia',
};

// Painel de acerto do mês (substitui parte de js/totals.js#renderTotals) —
// mostra o acerto normal, o acerto final (com acordos fixos e pagamentos,
// T13) e o alerta de transações ainda sem classificação (nd). A prestação de
// contas detalhada por item do legado não tem endpoint equivalente na API
// nova (GET /faturas/{mes}/acerto-final só devolve os totais, ver T13) —
// fora do critério de aceite de T16.
export function PainelAcerto({ acertoFinalMes }: { acertoFinalMes: AcertoFinalMes }) {
  const { acerto, acertoFinal, transacoesNaoDefinidas } = acertoFinalMes;
  const quites = acertoFinal.valor < 0.01;

  return (
    <section className="painel-acerto">
      <div className={`acerto-card${quites ? ' quites' : ''}`}>
        <span className="acerto-card-label">Acerto do mês</span>
        {acerto.valor < 0.01 || acerto.quemDeve === null ? (
          <span className="acerto-card-valor">Estão quites</span>
        ) : (
          <span className="acerto-card-valor">
            {ROTULO_TITULAR[acerto.quemDeve]} deve {formatarValor(acerto.valor)}
          </span>
        )}
      </div>

      <div className={`acerto-card destaque${quites ? ' quites' : ''}`}>
        <span className="acerto-card-label">Acerto final (com acordos e pagamentos)</span>
        {quites || acertoFinal.quemDeve === null ? (
          <span className="acerto-card-valor">Estão quites</span>
        ) : (
          <span className="acerto-card-valor">
            {ROTULO_TITULAR[acertoFinal.quemDeve]} deve {formatarValor(acertoFinal.valor)}
          </span>
        )}
      </div>

      {transacoesNaoDefinidas.quantidade > 0 && (
        <p className="alerta-nd alerta-nd-resumo">
          ⚠️ {transacoesNaoDefinidas.quantidade} lançamento
          {transacoesNaoDefinidas.quantidade > 1 ? 's' : ''} sem classificação (
          {formatarValor(transacoesNaoDefinidas.total)}) — o acerto acima ainda não considera{' '}
          {transacoesNaoDefinidas.quantidade > 1 ? 'eles' : 'ele'}.
        </p>
      )}
    </section>
  );
}
