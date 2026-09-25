import { useCallback, useEffect, useState } from 'react';
import { obterDetalheMes } from '../api/faturas.ts';
import { ApiError } from '../api/http.ts';
import { UploadFatura } from '../components/UploadFatura.tsx';
import { TabelaTransacoes } from '../components/TabelaTransacoes.tsx';
import { Titular } from '../types/fatura.ts';
import type { Transacao } from '../types/fatura.ts';

function mesAtual(): string {
  const agora = new Date();
  const mm = String(agora.getMonth() + 1).padStart(2, '0');
  return `${agora.getFullYear()}-${mm}`;
}

// Página única de T15: seletor de mês, upload por titular e tabela de
// transações com classificação manual. Navegação por pills e acerto/resumo
// ficam para T16 (js/totals.js + parte de js/app.js).
export function FaturaMes() {
  const [mes, setMes] = useState(mesAtual());
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback((chave: string) => {
    setCarregando(true);
    setErro(null);
    obterDetalheMes(chave)
      .then((detalhe) => setTransacoes(detalhe.transacoes))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) {
          setTransacoes([]);
          return;
        }
        setErro(e instanceof ApiError ? e.message : 'Falha ao carregar o mês.');
      })
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    carregar(mes);
  }, [mes, carregar]);

  function atualizarTransacao(transacaoAtualizada: Transacao) {
    setTransacoes((atual) =>
      atual.map((t) => (t.id === transacaoAtualizada.id ? transacaoAtualizada : t)),
    );
  }

  const transacoesSilvio = transacoes.filter((t) => t.titular === Titular.Silvio);
  const transacoesClaucia = transacoes.filter((t) => t.titular === Titular.Claucia);

  return (
    <div className="fatura-mes">
      <header className="fatura-mes-header">
        <h1>Controle de Faturas</h1>
        <label>
          Mês
          <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} />
        </label>
      </header>

      <UploadFatura mes={mes} onImportado={() => carregar(mes)} />

      {carregando && <p>Carregando...</p>}
      {erro && <p className="erro-carregamento">{erro}</p>}

      <div className="tabelas-transacoes">
        <TabelaTransacoes
          titular={Titular.Silvio}
          rotuloTitular="Silvio"
          transacoes={transacoesSilvio}
          onTransacaoAtualizada={atualizarTransacao}
        />
        <TabelaTransacoes
          titular={Titular.Claucia}
          rotuloTitular="Claucia"
          transacoes={transacoesClaucia}
          onTransacaoAtualizada={atualizarTransacao}
        />
      </div>
    </div>
  );
}
