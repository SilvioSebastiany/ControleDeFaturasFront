import { useState } from 'react';
import { RegraAplicada, Titular } from '../types/fatura.ts';
import type { Acerto, AcertoFinalMes, ItemAcerto } from '../types/fatura.ts';

function formatarValor(valor: number): string {
  return 'R$ ' + Math.abs(valor).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

const ROTULO_TITULAR: Record<Titular, string> = {
  [Titular.Silvio]: 'Silvio',
  [Titular.Claucia]: 'Claucia',
};

const ROTULO_REGRA: Record<RegraAplicada, string> = {
  [RegraAplicada.MeioAMeio]: '50/50',
  [RegraAplicada.ValorFixo]: 'valor fixo',
  [RegraAplicada.PessoalDoOutro]: 'pessoal do outro',
  [RegraAplicada.AcordoFixo]: 'acordo fixo',
  [RegraAplicada.Pagamento]: 'pagamento',
};

const PAGO_POR: Record<Titular, string> = {
  [Titular.Silvio]: 'pelo Silvio',
  [Titular.Claucia]: 'pela Claucia',
};

// "R$ 100,00 pago pela Claucia, 50/50 → Silvio deve R$ 50,00". Estorno (valor
// negativo) inverte o efeito: "... → Claucia deve R$ 25,00 a menos".
function descreverItem(item: ItemAcerto): string {
  const estorno = item.valor < 0;
  const original = (estorno ? 'estorno de ' : '') + formatarValor(item.valor);
  const pagoPor = item.pagoPor ? ` pago ${PAGO_POR[item.pagoPor]}` : '';
  const efeito =
    `${ROTULO_TITULAR[item.quemDeve]} deve ${formatarValor(item.valorEfeito)}` +
    (item.valorEfeito < 0 ? ' a menos' : '');
  return `${original}${pagoPor}, ${ROTULO_REGRA[item.regra]} → ${efeito}`;
}

// "Claucia deve R$ 320,00 − Silvio deve R$ 120,00 = Claucia deve R$ 200,00". Os
// subtotais e a diferença vêm prontos da API; aqui só se formata.
function AritmeticaDoAcerto({ acerto, testId }: { acerto: Acerto; testId: string }) {
  const { subtotalClauciaDeve, subtotalSilvioDeve, diferenca } = acerto.aritmetica;
  const resultado =
    acerto.quemDeve === null
      ? 'Estão quites'
      : `${ROTULO_TITULAR[acerto.quemDeve]} deve ${formatarValor(diferenca)}`;

  return (
    <div className="acerto-aritmetica" data-testid={testId}>
      <p className="acerto-aritmetica-conta">
        Claucia deve {formatarValor(subtotalClauciaDeve)} − Silvio deve{' '}
        {formatarValor(subtotalSilvioDeve)} = {resultado}
      </p>
      <p className="acerto-aritmetica-nota">O arredondamento é feito uma vez, no fim.</p>
    </div>
  );
}

// Cartão de acerto expansível — clicar mostra os itens (transações, boletos,
// acordos, pagamentos) que compõem o valor, igual ao accordion "Prestação de
// Contas" do legado (js/totals.js#buildResumoView).
function CartaoAcerto({
  titulo,
  destaque,
  acerto,
  idAritmetica,
}: {
  titulo: string;
  destaque?: boolean;
  acerto: Acerto;
  idAritmetica: string;
}) {
  const [aberto, setAberto] = useState(false);
  const quites = acerto.valor < 0.01 || acerto.quemDeve === null;
  const temItens = acerto.itens.length > 0;

  return (
    <div className={`acerto-card${destaque ? ' destaque' : ''}${quites ? ' quites' : ''}`}>
      <button
        type="button"
        className="acerto-card-toggle"
        onClick={() => setAberto((a) => !a)}
        disabled={!temItens}
      >
        <span className="acerto-card-label">{titulo}</span>
        {quites ? (
          <span className="acerto-card-valor">Estão quites</span>
        ) : (
          <span className="acerto-card-valor">
            {ROTULO_TITULAR[acerto.quemDeve!]} deve {formatarValor(acerto.valor)}
          </span>
        )}
        {temItens && <span className="acerto-card-seta">{aberto ? '▲' : '▼'}</span>}
      </button>

      {aberto && temItens && (
        <ul className="acerto-itens">
          {acerto.itens.map((item, i) => (
            <li key={i}>
              <span className="acerto-item-descricao">{item.descricao}</span>
              <span className="acerto-item-valor">{descreverItem(item)}</span>
            </li>
          ))}
        </ul>
      )}

      {temItens && <AritmeticaDoAcerto acerto={acerto} testId={idAritmetica} />}
    </div>
  );
}

// Painel de acerto do mês (substitui parte de js/totals.js#renderTotals) —
// mostra o acerto normal, o acerto final (com acordos fixos e pagamentos,
// T13), o alerta de transações ainda sem classificação (nd) e o
// detalhamento por item de cada acerto (accordion, igual ao legado).
export function PainelAcerto({ acertoFinalMes }: { acertoFinalMes: AcertoFinalMes }) {
  const { acerto, acertoFinal, transacoesNaoDefinidas } = acertoFinalMes;

  return (
    <section className="painel-acerto">
      <CartaoAcerto titulo="Acerto do mês" acerto={acerto} idAritmetica="aritmetica-acerto-mes" />
      <CartaoAcerto
        titulo="Acerto final (com acordos e pagamentos)"
        destaque
        acerto={acertoFinal}
        idAritmetica="aritmetica-acerto-final"
      />

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
