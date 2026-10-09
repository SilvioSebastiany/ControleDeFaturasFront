import { useState } from 'react';
import { EtapaAcerto, MotivoSemEfeito, RegraAplicada, Titular } from '../types/fatura.ts';
import type {
  Acerto,
  AcertoFinalMes,
  EtapaAcertoFinal,
  ItemAcerto,
  LancamentoSemEfeito,
  SaldoAcerto,
} from '../types/fatura.ts';

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

const ROTULO_ETAPA: Record<EtapaAcerto, string> = {
  [EtapaAcerto.AcertoDoMes]: 'Acerto do mês',
  [EtapaAcerto.AcordosFixos]: 'Acordos fixos',
  [EtapaAcerto.Pagamentos]: 'Pagamentos',
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

function descreverSaldo(saldo: SaldoAcerto): string {
  return saldo.quemDeve === null
    ? 'Estão quites'
    : `${ROTULO_TITULAR[saldo.quemDeve]} deve ${formatarValor(saldo.valor)}`;
}

// Etapa do acerto final: itens que ela acrescenta e saldo acumulado depois dela.
// Na etapa de Pagamentos, se o saldo muda de devedor (pagamento maior que a divida), explica a inversao.
function EtapaDoAcerto({
  etapa,
  anterior,
}: {
  etapa: EtapaAcertoFinal;
  anterior: SaldoAcerto | null;
}) {
  const { saldoAcumulado } = etapa;
  const inverteu =
    etapa.etapa === EtapaAcerto.Pagamentos &&
    anterior?.quemDeve != null &&
    saldoAcumulado.quemDeve !== null &&
    anterior.quemDeve !== saldoAcumulado.quemDeve;

  return (
    <section className="acerto-etapa" aria-label={ROTULO_ETAPA[etapa.etapa]}>
      <h4 className="acerto-etapa-titulo">{ROTULO_ETAPA[etapa.etapa]}</h4>
      {etapa.itens.length > 0 && (
        <ul className="acerto-itens">
          {etapa.itens.map((item, i) => (
            <li key={i}>
              <span className="acerto-item-descricao">{item.descricao}</span>
              <span className="acerto-item-valor">{descreverItem(item)}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="acerto-etapa-saldo">Saldo acumulado: {descreverSaldo(saldoAcumulado)}</p>
      {inverteu && (
        <p className="acerto-etapa-inversao">
          Pagamento maior que a dívida: agora {ROTULO_TITULAR[saldoAcumulado.quemDeve!]} deve.
        </p>
      )}
    </section>
  );
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
  etapas = [],
  abertoPorPadrao = false,
  idAritmetica,
}: {
  titulo: string;
  destaque?: boolean;
  acerto: Acerto;
  etapas?: EtapaAcertoFinal[];
  abertoPorPadrao?: boolean;
  idAritmetica: string;
}) {
  const [aberto, setAberto] = useState(abertoPorPadrao);
  const quites = acerto.quemDeve === null;
  const temEtapas = etapas.length > 0;
  const temItens = acerto.itens.length > 0 || temEtapas;

  return (
    <div
      role="group"
      aria-label={titulo}
      className={`acerto-card${destaque ? ' destaque' : ''}${quites ? ' quites' : ''}`}
    >
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

      {aberto && temEtapas && (
        <div className="acerto-etapas">
          {etapas.map((etapa, i) => (
            <EtapaDoAcerto
              key={etapa.etapa}
              etapa={etapa}
              anterior={i > 0 ? etapas[i - 1].saldoAcumulado : null}
            />
          ))}
        </div>
      )}

      {aberto && !temEtapas && temItens && (
        <ul className="acerto-itens">
          {acerto.itens.map((item, i) => (
            <li key={i}>
              <span className="acerto-item-descricao">{item.descricao}</span>
              <span className="acerto-item-valor">{descreverItem(item)}</span>
            </li>
          ))}
        </ul>
      )}

      <AritmeticaDoAcerto acerto={acerto} testId={idAritmetica} />
    </div>
  );
}

// Painel de acerto do mês (substitui parte de js/totals.js#renderTotals) —
// mostra o acerto normal, o acerto final (com acordos fixos e pagamentos,
// T13), o alerta de transações ainda sem classificação (nd) e o
// detalhamento por item de cada acerto (accordion, igual ao legado).
export function PainelAcerto({ acertoFinalMes }: { acertoFinalMes: AcertoFinalMes }) {
  const { acerto, acertoFinal, etapas, transacoesNaoDefinidas } = acertoFinalMes;

  return (
    <section className="painel-acerto">
      <CartaoAcerto
        titulo="Acerto do mês"
        acerto={acerto}
        idAritmetica="aritmetica-acerto-mes"
      />
      <CartaoAcerto
        titulo="Acerto final (com acordos e pagamentos)"
        destaque
        acerto={acertoFinal}
        etapas={etapas}
        abertoPorPadrao
        idAritmetica="aritmetica-acerto-final"
      />
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
