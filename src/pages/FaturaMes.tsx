import { useCallback, useEffect, useState } from 'react';
import { listarMeses, obterAcertoFinal, obterDetalheMes, removerMes } from '../api/faturas.ts';
import { ApiError } from '../api/http.ts';
import { UploadFatura } from '../components/UploadFatura.tsx';
import { TabelaTransacoes } from '../components/TabelaTransacoes.tsx';
import { PainelAcerto } from '../components/PainelAcerto.tsx';
import { PillsMeses } from '../components/PillsMeses.tsx';
import { AbaOutrosGastos } from '../components/AbaOutrosGastos.tsx';
import { AbaRegras } from '../components/AbaRegras.tsx';
import { Titular } from '../types/fatura.ts';
import type { AcertoFinalMes, Boleto, Transacao } from '../types/fatura.ts';

type Aba = 'resumo' | 'silvio' | 'claucia' | 'outros-gastos' | 'regras';

const ABAS: { id: Aba; rotulo: string }[] = [
  { id: 'resumo', rotulo: '📊 Resumo' },
  { id: 'silvio', rotulo: '💳 Silvio' },
  { id: 'claucia', rotulo: '💳 Claucia' },
  { id: 'outros-gastos', rotulo: '💸 Outros Gastos' },
  { id: 'regras', rotulo: '⚙️ Regras' },
];

function mesAtual(): string {
  const agora = new Date();
  const mm = String(agora.getMonth() + 1).padStart(2, '0');
  return `${agora.getFullYear()}-${mm}`;
}

// Página única com abas, como o legado (index.html): seletor/pills de mês
// fixos no topo; Resumo (T16), cartões Silvio/Claucia (T15), Outros Gastos e
// Regras (T17).
export function FaturaMes() {
  const [aba, setAba] = useState<Aba>('resumo');
  const [mes, setMes] = useState(mesAtual());
  const [meses, setMeses] = useState<string[]>([]);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [mesCarregado, setMesCarregado] = useState(false);
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

  const limparMes = useCallback(() => {
    setTransacoes([]);
    setBoletos([]);
    setAcertoFinalMes(null);
    setMesCarregado(false);
  }, []);

  // GET /faturas/{mes} também sincroniza os boletos do mês com as categorias
  // globais (T12) — por isso é recarregado quando uma categoria muda.
  const carregar = useCallback(
    (chave: string) => {
      setCarregando(true);
      setErro(null);
      Promise.all([obterDetalheMes(chave), obterAcertoFinal(chave)])
        .then(([detalhe, acerto]) => {
          setTransacoes(detalhe.transacoes);
          setBoletos(detalhe.boletos);
          setAcertoFinalMes(acerto);
          setMesCarregado(true);
        })
        .catch((e) => {
          if (e instanceof ApiError && e.status === 404) {
            limparMes();
            return;
          }
          setErro(e instanceof ApiError ? e.message : 'Falha ao carregar o mês.');
        })
        .finally(() => setCarregando(false));
    },
    [limparMes],
  );

  const recarregarAcertoFinal = useCallback(() => {
    obterAcertoFinal(mes)
      .then(setAcertoFinalMes)
      .catch(() => {
        /* o painel simplesmente mantém o valor anterior se essa atualização falhar */
      });
  }, [mes]);

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
    // Classificação manual muda o acerto (T13 exclui "nd" do cálculo).
    recarregarAcertoFinal();
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
      if (chave === mes) limparMes();
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

      <nav className="abas">
        {ABAS.map(({ id, rotulo }) => (
          <button
            key={id}
            type="button"
            className={aba === id ? 'aba active' : 'aba'}
            onClick={() => setAba(id)}
          >
            {rotulo}
          </button>
        ))}
      </nav>

      {carregando && <p>Carregando...</p>}
      {erro && <p className="erro-carregamento">{erro}</p>}

      {aba === 'resumo' &&
        (acertoFinalMes ? (
          <PainelAcerto acertoFinalMes={acertoFinalMes} />
        ) : (
          <p className="config-vazio">Nenhuma fatura importada neste mês ainda.</p>
        ))}

      {aba === 'silvio' && (
        <>
          <UploadFatura titular={Titular.Silvio} rotulo="Silvio" mes={mes} onImportado={handleImportado} />
          <TabelaTransacoes
            titular={Titular.Silvio}
            rotuloTitular="Silvio"
            transacoes={transacoesSilvio}
            onTransacaoAtualizada={atualizarTransacao}
          />
        </>
      )}

      {aba === 'claucia' && (
        <>
          <UploadFatura titular={Titular.Claucia} rotulo="Claucia" mes={mes} onImportado={handleImportado} />
          <TabelaTransacoes
            titular={Titular.Claucia}
            rotuloTitular="Claucia"
            transacoes={transacoesClaucia}
            onTransacaoAtualizada={atualizarTransacao}
          />
        </>
      )}

      {aba === 'outros-gastos' && (
        <AbaOutrosGastos
          mesCarregado={mesCarregado}
          boletos={boletos}
          onCategoriasAlteradas={() => carregar(mes)}
          onAcordosAlterados={recarregarAcertoFinal}
        />
      )}

      {aba === 'regras' && <AbaRegras />}
    </div>
  );
}
