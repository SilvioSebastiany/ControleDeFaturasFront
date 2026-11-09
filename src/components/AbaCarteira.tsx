import { useMemo, useState } from 'react';
import { categorizarTransacao } from '../api/transacoes.ts';
import { ApiError } from '../api/http.ts';
import { CategoriaGasto, Titular } from '../types/fatura.ts';
import type { Transacao } from '../types/fatura.ts';
import {
  CATEGORIAS,
  ROTULOS_CATEGORIA,
  calcularRanking,
  filtrarPorCategoria,
  filtrarPorTitular,
  somar,
} from '../utils/carteira.ts';
import { formatarValor } from '../utils/dinheiro.ts';

const FILTROS_TITULAR: { valor: Titular | 'todos'; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: Titular.Silvio, rotulo: 'Silvio' },
  { valor: Titular.Claucia, rotulo: 'Claucia' },
];

interface AbaCarteiraProps {
  mesCarregado: boolean;
  transacoes: Transacao[];
  onTransacaoAtualizada: (transacao: Transacao) => void;
  onRecarregar: () => void;
}

// Gastos do mês de Silvio e Claucia (as transações da primeira aba) com a
// categoria de gasto de cada um e o ranking das categorias. O cálculo está em
// utils/carteira.ts; aqui só tela e a chamada de PUT /transacoes/{id}/categoria.
export function AbaCarteira({
  mesCarregado,
  transacoes,
  onTransacaoAtualizada,
  onRecarregar,
}: AbaCarteiraProps) {
  const [titular, setTitular] = useState<Titular | 'todos'>('todos');
  const [categoria, setCategoria] = useState<CategoriaGasto | 'todas'>('todas');

  const doTitular = useMemo(() => filtrarPorTitular(transacoes, titular), [transacoes, titular]);
  const ranking = useMemo(() => calcularRanking(doTitular), [doTitular]);
  const total = useMemo(() => somar(doTitular), [doTitular]);
  const lista = useMemo(() => filtrarPorCategoria(doTitular, categoria), [doTitular, categoria]);

  if (!mesCarregado || transacoes.length === 0) {
    return (
      <p className="config-vazio">
        Nenhuma fatura importada neste mês ainda. Importe o PDF na aba Silvio ou Claucia.
      </p>
    );
  }

  const maior = Math.max(...ranking.map((linha) => Math.abs(linha.total)), 1);
  const naoCategorizado = ranking.find((linha) => linha.categoria === CategoriaGasto.NaoCategorizado);

  return (
    <section className="carteira">
      <div className="carteira-filtros">
        <div className="carteira-segmento" role="group" aria-label="Titular">
          {FILTROS_TITULAR.map(({ valor, rotulo }) => (
            <button
              key={valor}
              type="button"
              className={titular === valor ? 'active' : undefined}
              aria-pressed={titular === valor}
              onClick={() => setTitular(valor)}
            >
              {rotulo}
            </button>
          ))}
        </div>
        <label>
          Categoria{' '}
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as CategoriaGasto | 'todas')}
          >
            <option value="todas">Todas</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {ROTULOS_CATEGORIA[c]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <h3 className="carteira-titulo">
        Onde mais se gasta <span className="carteira-total">Total {formatarValor(total)}</span>
      </h3>

      {naoCategorizado && (
        <p className="alerta-nd">
          ⚠️ {naoCategorizado.quantidade} gasto{naoCategorizado.quantidade > 1 ? 's' : ''} ainda não
          categorizado{naoCategorizado.quantidade > 1 ? 's' : ''} ({formatarValor(naoCategorizado.total)})
        </p>
      )}

      <ul className="carteira-ranking" aria-label="Ranking das categorias">
        {ranking.map((linha) => (
          <li
            key={linha.categoria}
            className={linha.categoria === CategoriaGasto.NaoCategorizado ? 'nao-categorizado' : undefined}
          >
            <span className="carteira-ranking-nome">
              {ROTULOS_CATEGORIA[linha.categoria]} <small>({linha.quantidade})</small>
            </span>
            <span className="amount">{formatarValor(linha.total)}</span>
            <span className="amount carteira-percentual">
              {linha.percentual === null ? '—' : `${Math.round(linha.percentual * 100)}%`}
            </span>
            <span className="carteira-barra" aria-hidden="true">
              <i style={{ width: `${Math.max(0, (Math.abs(linha.total) / maior) * 100)}%` }} />
            </span>
          </li>
        ))}
      </ul>

      <h3 className="carteira-titulo">
        Gastos{' '}
        <span className="carteira-total">
          {lista.length} de {doTitular.length}
        </span>
      </h3>

      {lista.length === 0 ? (
        <p className="tabela-vazia">Nenhum gasto nesse filtro.</p>
      ) : (
        <table className="carteira-tabela">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Titular</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
              <th>Categoria</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((transacao) => (
              <LinhaGasto
                key={transacao.id}
                transacao={transacao}
                onAtualizada={onTransacaoAtualizada}
                onRecarregar={onRecarregar}
              />
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function LinhaGasto({
  transacao,
  onAtualizada,
  onRecarregar,
}: {
  transacao: Transacao;
  onAtualizada: (transacao: Transacao) => void;
  onRecarregar: () => void;
}) {
  const [enviando, setEnviando] = useState(false);

  async function categorizar(nova: CategoriaGasto) {
    if (nova === transacao.categoria || enviando) return;
    setEnviando(true);
    try {
      const resultado = await categorizarTransacao(transacao.id, nova);
      onAtualizada({ ...transacao, categoria: resultado.categoria });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        alert('Esse gasto não existe mais. Recarregando o mês.');
        onRecarregar();
      } else {
        alert(e instanceof ApiError ? e.message : 'Falha ao salvar a categoria.');
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <tr className={transacao.categoria === CategoriaGasto.NaoCategorizado ? 'row-nd' : undefined}>
      <td data-rotulo="Data">{transacao.data}</td>
      <td data-rotulo="Descrição" className="desc-col" title={transacao.descricao}>
        {transacao.descricao}
      </td>
      <td data-rotulo="Titular">
        <span className={`badge ${transacao.titular === Titular.Silvio ? 'badge-silvio' : 'badge-claucia'}`}>
          {transacao.titular}
        </span>
      </td>
      <td data-rotulo="Valor" className={`amount${transacao.valor < 0 ? ' credit' : ''}`}>
        {formatarValor(transacao.valor)}
      </td>
      <td data-rotulo="Categoria">
        <select
          aria-label={`Categoria de ${transacao.descricao}`}
          value={transacao.categoria}
          disabled={enviando}
          onChange={(e) => categorizar(e.target.value as CategoriaGasto)}
        >
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {ROTULOS_CATEGORIA[c]}
            </option>
          ))}
        </select>
      </td>
    </tr>
  );
}
