import { useCallback, useEffect, useState } from 'react';
import { listarMeses, obterAcertoFinal, obterDetalheMes, removerMes } from '../api/faturas.ts';
import { ApiError } from '../api/http.ts';
import { UploadFatura } from '../components/UploadFatura.tsx';
import { TabelaTransacoes } from '../components/TabelaTransacoes.tsx';
import { PainelAcerto } from '../components/PainelAcerto.tsx';
import { PillsMeses } from '../components/PillsMeses.tsx';
import { Titular } from '../types/fatura.ts';
import type { AcertoFinalMes, Transacao } from '../types/fatura.ts';

function mesAtual(): string {
  const agora = new Date();
  const mm = String(agora.getMonth() + 1).padStart(2, '0');
  return `${agora.getFullYear()}-${mm}`;
}

// Página única: seletor/pills de mês, upload por titular, painel de acerto
// (T16) e tabela de transações com classificação manual (T15). Telas de
// configuração (regras, boletos, acordos) ficam para T17.
export function FaturaMes() {
  const [mes, setMes] = useState(mesAtual());
  const [meses, setMeses] = useState<string[]>([]);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [acertoFinalMes, setAcertoFinalMes] = useState<AcertoFinalMes | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarMeses = useCallback(() => {
    listarMeses()
      .then((lista) => setMeses(lista.map((m) => m.chave)))
      .catch(() => {
        /* lista de pills é conveniência de navegação — falha aqui não impede o resto da página */
      });
  }, []);

  const carregar = useCallback((chave: string) => {
    setCarregando(true);
    setErro(null);
    Promise.all([obterDetalheMes(chave), obterAcertoFinal(chave)])
      .then(([detalhe, acerto]) => {
        setTransacoes(detalhe.transacoes);
        setAcertoFinalMes(acerto);
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) {
          setTransacoes([]);
          setAcertoFinalMes(null);
          return;
        }
        setErro(e instanceof ApiError ? e.message : 'Falha ao carregar o mês.');
      })
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    carregarMeses();
  }, [carregarMeses]);

  useEffect(() => {
    carregar(mes);
  }, [mes, carregar]);

  function atualizarTransacao(transacaoAtualizada: Transacao) {
    setTransacoes((atual) =>
      atual.map((t) => (t.id === transacaoAtualizada.id ? transacaoAtualizada : t)),
    );
    // Classificação manual muda o acerto (T13 exclui "nd" do cálculo) — o
    // painel ficaria com valor desatualizado até a próxima troca de mês sem
    // isto.
    obterAcertoFinal(mes)
      .then(setAcertoFinalMes)
      .catch(() => {
        /* o painel simplesmente mantém o valor anterior se essa atualização falhar */
      });
  }

  function handleImportado() {
    carregar(mes);
    carregarMeses();
  }

  async function handleRemoverMes(chave: string) {
    if (!confirm(`Remover o mês "${chave}" permanentemente? Essa ação não pode ser desfeita.`)) return;
    try {
      await removerMes(chave);
      carregarMeses();
      if (chave === mes) {
        setTransacoes([]);
        setAcertoFinalMes(null);
      }
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Falha ao remover o mês.');
    }
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

      <PillsMeses meses={meses} mesAtivo={mes} onSelecionar={setMes} onRemover={handleRemoverMes} />

      <UploadFatura mes={mes} onImportado={handleImportado} />

      {carregando && <p>Carregando...</p>}
      {erro && <p className="erro-carregamento">{erro}</p>}

      {acertoFinalMes && <PainelAcerto acertoFinalMes={acertoFinalMes} />}

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
