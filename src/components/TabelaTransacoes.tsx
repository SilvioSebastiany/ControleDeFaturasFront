import { useMemo, useState } from 'react';
import { classificarTransacaoManualmente } from '../api/transacoes.ts';
import { ApiError } from '../api/http.ts';
import { QuemResponsavel } from '../types/fatura.ts';
import type { Titular, Transacao } from '../types/fatura.ts';

const ROTULOS: Record<QuemResponsavel, string> = {
  [QuemResponsavel.Silvio]: 'Silvio',
  [QuemResponsavel.Claucia]: 'Claucia',
  [QuemResponsavel.Compartilhado]: 'Compartilhado',
  [QuemResponsavel.NaoDefinido]: '—',
};

const CLASSES_BADGE: Record<QuemResponsavel, string> = {
  [QuemResponsavel.Silvio]: 'badge-silvio',
  [QuemResponsavel.Claucia]: 'badge-claucia',
  [QuemResponsavel.Compartilhado]: 'badge-comp',
  [QuemResponsavel.NaoDefinido]: 'badge-nd',
};

// Opções de classificação manual expostas na UI — porta de setWho
// (js/app.js), que só permite silvio/claucia/comp/nd via botão.
const OPCOES_QUEM: QuemResponsavel[] = [
  QuemResponsavel.Silvio,
  QuemResponsavel.Claucia,
  QuemResponsavel.Compartilhado,
  QuemResponsavel.NaoDefinido,
];

function formatarValor(valor: number): string {
  const absoluto = Math.abs(valor).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (valor < 0 ? '− ' : '') + 'R$ ' + absoluto;
}

interface TabelaTransacoesProps {
  titular: Titular;
  rotuloTitular: string;
  transacoes: Transacao[];
  onTransacaoAtualizada: (transacao: Transacao) => void;
}

// Uma tabela por titular (substitui js/renderer.js#renderTable) — filtro por
// "quem", alerta de pendências (nd) e botões de classificação manual que
// chamam PUT /transacoes/{id}/classificacao (T11).
export function TabelaTransacoes({
  rotuloTitular,
  transacoes,
  onTransacaoAtualizada,
}: TabelaTransacoesProps) {
  const [filtro, setFiltro] = useState<QuemResponsavel | 'todos'>('todos');

  const { total: totalNd, quantidade: quantidadeNd } = useMemo(() => {
    return transacoes.reduce(
      (acc, t) => {
        if (t.quem === QuemResponsavel.NaoDefinido && t.valor > 0) {
          acc.total += t.valor;
          acc.quantidade += 1;
        }
        return acc;
      },
      { total: 0, quantidade: 0 },
    );
  }, [transacoes]);

  const filtradas = filtro === 'todos' ? transacoes : transacoes.filter((t) => t.quem === filtro);

  return (
    <section className="tabela-transacoes">
      <header>
        <h3>{rotuloTitular}</h3>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as QuemResponsavel | 'todos')}
        >
          <option value="todos">Todos</option>
          {OPCOES_QUEM.map((opcao) => (
            <option key={opcao} value={opcao}>
              {ROTULOS[opcao]}
            </option>
          ))}
        </select>
      </header>

      {quantidadeNd > 0 && (
        <p className="alerta-nd">
          ⚠️ {quantidadeNd} lançamento{quantidadeNd > 1 ? 's' : ''} sem classificação ({formatarValor(totalNd)})
        </p>
      )}

      {transacoes.length === 0 ? (
        <p className="tabela-vazia">Nenhum lançamento. Faça upload do PDF acima.</p>
      ) : (
        <>
          <p className="contagem">
            {transacoes.length} lançamentos — exibindo {filtradas.length}
          </p>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th style={{ textAlign: 'center' }}>Quem paga</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((transacao) => (
                <LinhaTransacao
                  key={transacao.id}
                  transacao={transacao}
                  onAtualizada={onTransacaoAtualizada}
                />
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}

function LinhaTransacao({
  transacao,
  onAtualizada,
}: {
  transacao: Transacao;
  onAtualizada: (transacao: Transacao) => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const isCredito = transacao.valor < 0;

  async function classificar(quem: QuemResponsavel) {
    if (quem === transacao.quem || enviando) return;
    setEnviando(true);
    try {
      const resultado = await classificarTransacaoManualmente(transacao.id, quem);
      onAtualizada({ ...transacao, quem: resultado.quem, classificacaoManual: resultado.classificacaoManual });
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Falha ao classificar a transação.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <tr className={transacao.quem === QuemResponsavel.NaoDefinido ? 'row-nd' : undefined}>
      <td className="date-col">{transacao.data}</td>
      <td className="desc-col" title={transacao.descricao}>
        {transacao.descricao}
      </td>
      <td className={`amount${isCredito ? ' credit' : ''}`}>{formatarValor(transacao.valor)}</td>
      <td style={{ textAlign: 'center' }}>
        <span className={`badge ${CLASSES_BADGE[transacao.quem]}`}>
          {ROTULOS[transacao.quem]}
          {transacao.automatica && <span className="badge-auto">auto</span>}
        </span>
        <div className="btn-group">
          {OPCOES_QUEM.map((opcao) => (
            <button
              key={opcao}
              type="button"
              disabled={enviando}
              className={transacao.quem === opcao ? 'btn-who active' : 'btn-who'}
              onClick={() => classificar(opcao)}
            >
              {opcao === QuemResponsavel.Compartilhado ? 'Comp.' : ROTULOS[opcao]}
            </button>
          ))}
        </div>
      </td>
    </tr>
  );
}
