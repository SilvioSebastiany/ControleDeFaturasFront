import { useCallback, useEffect, useState } from 'react';
import {
  criarAcordoFixo,
  criarCategoriaBoleto,
  listarAcordosFixos,
  listarCategoriasBoleto,
  removerAcordoFixo,
  removerCategoriaBoleto,
} from '../api/configuracao.ts';
import { ApiError } from '../api/http.ts';
import { QuemBoleto, Titular } from '../types/fatura.ts';
import type { AcordoFixo, Boleto, CategoriaBoleto } from '../types/fatura.ts';
import { formatarValor, lerValor } from '../utils/dinheiro.ts';

const ROTULO_TITULAR: Record<Titular, string> = {
  [Titular.Silvio]: 'Silvio',
  [Titular.Claucia]: 'Claucia',
};

const ROTULO_QUEM_BOLETO: Record<QuemBoleto, string> = {
  [QuemBoleto.Silvio]: 'Silvio',
  [QuemBoleto.Claucia]: 'Claucia',
  [QuemBoleto.Compartilhado]: 'Compartilhado',
  [QuemBoleto.Fixo]: 'Valor fixo',
};

function mensagemDe(e: unknown, padrao: string): string {
  return e instanceof ApiError ? e.message : padrao;
}

interface AbaOutrosGastosProps {
  mesCarregado: boolean;
  boletos: Boleto[];
  onCategoriasAlteradas: () => void;
  onAcordosAlterados: () => void;
}

// Aba "Outros Gastos" (porta do tab-boletos do legado, js/boletos.js).
// Boletos do mês são só leitura na T17 — a edição (valor, de quem, quem pagou,
// valor fixo) é a T18. Categorias e acordos fixos são globais (todos os meses).
export function AbaOutrosGastos({
  mesCarregado,
  boletos,
  onCategoriasAlteradas,
  onAcordosAlterados,
}: AbaOutrosGastosProps) {
  return (
    <>
      <BoletosDoMes mesCarregado={mesCarregado} boletos={boletos} />
      <Categorias onAlteradas={onCategoriasAlteradas} />
      <AcordosFixos onAlterados={onAcordosAlterados} />
    </>
  );
}

function BoletosDoMes({ mesCarregado, boletos }: { mesCarregado: boolean; boletos: Boleto[] }) {
  return (
    <section className="config-card">
      <h2>Outros gastos do mês</h2>
      <p className="config-info">
        Um boleto por categoria cadastrada abaixo, criado automaticamente ao abrir o mês. A edição dos
        valores ainda não está disponível.
      </p>
      {!mesCarregado ? (
        <p className="config-vazio">Este mês ainda não tem fatura importada.</p>
      ) : boletos.length === 0 ? (
        <p className="config-vazio">Nenhum boleto. Cadastre uma categoria abaixo.</p>
      ) : (
        <table className="config-tabela">
          <thead>
            <tr>
              <th>Gasto</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
              <th>De quem é</th>
              <th>Quem pagou</th>
              <th style={{ textAlign: 'right' }}>Valor fixo</th>
            </tr>
          </thead>
          <tbody>
            {boletos.map((boleto) => (
              <tr key={boleto.id}>
                <td>{boleto.nome}</td>
                <td className="amount">{formatarValor(boleto.valor)}</td>
                <td>{ROTULO_QUEM_BOLETO[boleto.quem]}</td>
                <td>{ROTULO_TITULAR[boleto.pagoPor]}</td>
                <td className="amount">{boleto.valorFixo != null ? formatarValor(boleto.valorFixo) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function Categorias({ onAlteradas }: { onAlteradas: () => void }) {
  const [categorias, setCategorias] = useState<CategoriaBoleto[]>([]);
  const [nome, setNome] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(() => {
    listarCategoriasBoleto()
      .then(setCategorias)
      .catch((e) => setErro(mensagemDe(e, 'Falha ao carregar as categorias.')));
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function adicionar(evento: React.FormEvent) {
    evento.preventDefault();
    const texto = nome.trim();
    if (!texto || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      await criarCategoriaBoleto(texto);
      setNome('');
      carregar();
      onAlteradas();
    } catch (e) {
      setErro(mensagemDe(e, 'Falha ao adicionar a categoria.'));
    } finally {
      setEnviando(false);
    }
  }

  async function remover(categoria: CategoriaBoleto) {
    if (!confirm(`Remover "${categoria.nome}"?`)) return;
    setErro(null);
    try {
      await removerCategoriaBoleto(categoria.id);
      carregar();
      onAlteradas();
    } catch (e) {
      setErro(mensagemDe(e, 'Falha ao remover a categoria.'));
    }
  }

  return (
    <section className="config-card">
      <h2>Categorias de gastos</h2>
      <p className="config-info">As categorias aparecem automaticamente em todos os meses.</p>

      <form className="config-form" onSubmit={adicionar}>
        <input
          type="text"
          placeholder="Nome do gasto (ex: Água, Parcela Apto)"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={enviando}>
          + Adicionar
        </button>
      </form>

      {erro && <p className="upload-erro">{erro}</p>}

      {categorias.length === 0 ? (
        <p className="config-vazio">Nenhuma categoria cadastrada.</p>
      ) : (
        <ul className="config-lista">
          {categorias.map((categoria) => (
            <li key={categoria.id}>
              <span className="config-item-nome">{categoria.nome}</span>
              <button type="button" className="btn-del" onClick={() => remover(categoria)}>
                remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AcordosFixos({ onAlterados }: { onAlterados: () => void }) {
  const [acordos, setAcordos] = useState<AcordoFixo[]>([]);
  const [descricao, setDescricao] = useState('');
  const [devedor, setDevedor] = useState<Titular>(Titular.Silvio);
  const [valorTexto, setValorTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(() => {
    listarAcordosFixos()
      .then(setAcordos)
      .catch((e) => setErro(mensagemDe(e, 'Falha ao carregar os acordos.')));
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function adicionar(evento: React.FormEvent) {
    evento.preventDefault();
    const texto = descricao.trim();
    const valor = lerValor(valorTexto);
    if (!texto || valor <= 0 || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      await criarAcordoFixo(texto, devedor, valor);
      setDescricao('');
      setValorTexto('');
      carregar();
      onAlterados();
    } catch (e) {
      setErro(mensagemDe(e, 'Falha ao adicionar o acordo.'));
    } finally {
      setEnviando(false);
    }
  }

  async function remover(acordo: AcordoFixo) {
    if (!confirm(`Remover acordo "${acordo.descricao}"?`)) return;
    setErro(null);
    try {
      await removerAcordoFixo(acordo.id);
      carregar();
      onAlterados();
    } catch (e) {
      setErro(mensagemDe(e, 'Falha ao remover o acordo.'));
    }
  }

  return (
    <section className="config-card">
      <h2>🤝 Acordos fixos entre pessoas</h2>
      <p className="config-info">
        Valores fixos mensais entre Silvio e Claucia. <strong>Não entram no total do mês</strong> — apenas
        somam no acerto final, em todos os meses.
      </p>

      <form className="config-form" onSubmit={adicionar}>
        <input
          type="text"
          placeholder="Descrição (ex: Parcela apartamento)"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <select value={devedor} onChange={(e) => setDevedor(e.target.value as Titular)}>
          <option value={Titular.Silvio}>Silvio deve</option>
          <option value={Titular.Claucia}>Claucia deve</option>
        </select>
        <input
          type="text"
          inputMode="decimal"
          placeholder="R$ 0,00"
          className="config-input-valor"
          value={valorTexto}
          onChange={(e) => setValorTexto(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={enviando}>
          + Adicionar
        </button>
      </form>

      {erro && <p className="upload-erro">{erro}</p>}

      {acordos.length === 0 ? (
        <p className="config-vazio">Nenhum acordo fixo cadastrado.</p>
      ) : (
        <ul className="config-lista">
          {acordos.map((acordo) => {
            const credor = acordo.devedor === Titular.Silvio ? Titular.Claucia : Titular.Silvio;
            return (
              <li key={acordo.id}>
                <span className="config-item-nome">{acordo.descricao}</span>
                <span>
                  <span className={`badge badge-${acordo.devedor.toLowerCase()}`}>
                    {ROTULO_TITULAR[acordo.devedor]}
                  </span>{' '}
                  →{' '}
                  <span className={`badge badge-${credor.toLowerCase()}`}>{ROTULO_TITULAR[credor]}</span>
                </span>
                <span className="amount">{formatarValor(acordo.valor)}</span>
                <button type="button" className="btn-del" onClick={() => remover(acordo)}>
                  remover
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
