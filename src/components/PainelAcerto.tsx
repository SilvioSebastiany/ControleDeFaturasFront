import { useState } from 'react';
import { MotivoSemEfeito, RegraAplicada, Titular } from '../types/fatura.ts';
import type { Acerto, AcertoFinalMes, ItemAcerto, LancamentoSemEfeito } from '../types/fatura.ts';

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

const ROTULO_MOTIVO: Record<MotivoSemEfeito, string> = {
  [MotivoSemEfeito.PessoalDeQuemPagou]: 'gasto pessoal de quem pagou',
  [MotivoSemEfeito.ValorZero]: 'valor zero',
};

// "R$ 54,28 pago pelo Silvio, gasto pessoal de quem pagou"
function descreverSemEfeito(l: LancamentoSemEfeito): string {
  return `${formatarValor(l.valor)} pago ${PAGO_POR[l.pagoPor]}, ${ROTULO_MOTIVO[l.motivo]}`;
}

// Seção discreta, separada da lista principal: lançamentos que não geraram dívida.
function SecaoSemEfeito({ lancamentos }: { lancamentos: LancamentoSemEfeito[] }) {
  if (lancamentos.length === 0) return null;
  return (
    <section className="sem-efeito" aria-label="Lançamentos sem efeito">
      <h4 className="sem-efeito-titulo">Lançamentos sem efeito</h4>
      <ul className="sem-efeito-lista">
        {lancamentos.map((l, i) => (
          <li key={i}>
            <span className="acerto-item-descricao">{l.descricao}</span>
            <span className="acerto-item-valor">{descreverSemEfeito(l)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Cartão de acerto expansível — clicar mostra os itens (transações, boletos,
// acordos, pagamentos) que compõem o valor, igual ao accordion "Prestação de
// Contas" do legado (js/totals.js#buildResumoView).
function CartaoAcerto({
  titulo,
  destaque,
  acerto,
}: {
  titulo: string;
  destaque?: boolean;
  acerto: Acerto;
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
      <CartaoAcerto titulo="Acerto do mês" acerto={acerto} />
      <CartaoAcerto titulo="Acerto final (com acordos e pagamentos)" destaque acerto={acertoFinal} />
      <SecaoSemEfeito lancamentos={acerto.lancamentosSemEfeito} />

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
