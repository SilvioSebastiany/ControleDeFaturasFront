import { useCallback, useEffect, useState } from 'react';
import { criarRegra, listarRegras, removerRegra } from '../api/configuracao.ts';
import { ApiError } from '../api/http.ts';
import { QuemResponsavel } from '../types/fatura.ts';
import type { RegraClassificacao } from '../types/fatura.ts';

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

// Mesmas opções do <select id="ruleWho"> do legado (sem "nd").
const OPCOES_QUEM: QuemResponsavel[] = [
  QuemResponsavel.Silvio,
  QuemResponsavel.Claucia,
  QuemResponsavel.Compartilhado,
];

// Aba "Regras" (porta de js/rules.js#addRule/removeRule/renderRules).
// Diferente do legado, criar/remover regra não reclassifica as transações já
// importadas — só vale para as próximas faturas (decisão do usuário, T17).
export function AbaRegras() {
  const [regras, setRegras] = useState<RegraClassificacao[]>([]);
  const [palavraChave, setPalavraChave] = useState('');
  const [quem, setQuem] = useState<QuemResponsavel>(QuemResponsavel.Silvio);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(() => {
    listarRegras()
      .then(setRegras)
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Falha ao carregar as regras.'));
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function adicionar(evento: React.FormEvent) {
    evento.preventDefault();
    const texto = palavraChave.trim();
    if (!texto || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      await criarRegra(texto, quem);
      setPalavraChave('');
      carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Falha ao adicionar a regra.');
    } finally {
      setEnviando(false);
    }
  }

  async function remover(regra: RegraClassificacao) {
    setErro(null);
    try {
      await removerRegra(regra.id);
      carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Falha ao remover a regra.');
    }
  }

  return (
    <section className="config-card">
      <h2>Regras automáticas</h2>
      <p className="config-info">
        Quando a descrição da compra tiver essa palavra, ela será classificada sozinha. As regras valem
        para as próximas faturas importadas; as já importadas não são reclassificadas.
      </p>

      <form className="config-form" onSubmit={adicionar}>
        <input
          type="text"
          placeholder="Palavra-chave (ex: Shell Box)"
          value={palavraChave}
          onChange={(e) => setPalavraChave(e.target.value)}
        />
        <select value={quem} onChange={(e) => setQuem(e.target.value as QuemResponsavel)}>
          {OPCOES_QUEM.map((opcao) => (
            <option key={opcao} value={opcao}>
              {ROTULOS[opcao]}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary" disabled={enviando}>
          + Adicionar regra
        </button>
      </form>

      {erro && <p className="upload-erro">{erro}</p>}

      {regras.length === 0 ? (
        <p className="config-vazio">Nenhuma regra ainda. Adicione acima para classificar automaticamente!</p>
      ) : (
        <ul className="config-lista">
          {regras.map((regra) => (
            <li key={regra.id}>
              <span className="config-item-nome">{regra.palavraChave}</span>
              <span className={`badge ${CLASSES_BADGE[regra.quem]}`}>{ROTULOS[regra.quem]}</span>
              <button type="button" className="btn-del" onClick={() => remover(regra)}>
                remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
