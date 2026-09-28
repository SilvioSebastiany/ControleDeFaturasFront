import { useCallback, useEffect, useState } from 'react';
import {
  criarAcordoFixo,
  criarCategoriaBoleto,
  listarAcordosFixos,
  listarCategoriasBoleto,
  removerAcordoFixo,
  removerCategoriaBoleto,
} from '../api/configuracao.ts';
import {
  atualizarPagoPorBoleto,
  atualizarQuemBoleto,
  atualizarValorBoleto,
  atualizarValorFixoBoleto,
  fixarBoleto,
} from '../api/boletos.ts';
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
  onBoletoAtualizado: (boleto: Boleto) => void;
  onCategoriasAlteradas: () => void;
  onAcordosAlterados: () => void;
}

// Aba "Outros Gastos" (porta do tab-boletos do legado, js/boletos.js).
// Boletos do mês são editáveis (T18: valor, de quem, quem pagou, valor fixo,
// fixar). Categorias e acordos fixos são globais (todos os meses).
export function AbaOutrosGastos({
  mesCarregado,
  boletos,
  onBoletoAtualizado,
  onCategoriasAlteradas,
  onAcordosAlterados,
}: AbaOutrosGastosProps) {
  return (
    <>
      <BoletosDoMes mesCarregado={mesCarregado} boletos={boletos} onAtualizado={onBoletoAtualizado} />
      <Categorias onAlteradas={onCategoriasAlteradas} />
      <AcordosFixos onAlterados={onAcordosAlterados} />
    </>
  );
}

const OPCOES_QUEM_BOLETO: QuemBoleto[] = [QuemBoleto.Silvio, QuemBoleto.Claucia, QuemBoleto.Compartilhado];

function BoletosDoMes({
  mesCarregado,
  boletos,
  onAtualizado,
}: {
  mesCarregado: boolean;
  boletos: Boleto[];
  onAtualizado: (boleto: Boleto) => void;
}) {
  return (
    <section className="config-card">
      <h2>Outros gastos do mês</h2>
      <p className="config-info">
        Um boleto por categoria cadastrada abaixo, criado automaticamente ao abrir o mês. 📌 fixa o valor
        atual como padrão para os próximos meses.
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {boletos.map((boleto) => (
              <LinhaBoleto key={boleto.id} boleto={boleto} onAtualizado={onAtualizado} />
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function LinhaBoleto({
  boleto,
  onAtualizado,
}: {
  boleto: Boleto;
  onAtualizado: (boleto: Boleto) => void;
}) {
  const [valorTexto, setValorTexto] = useState(formatarValor(boleto.valor).replace('R$ ', ''));
  const [valorFixoTexto, setValorFixoTexto] = useState(
    boleto.valorFixo != null ? formatarValor(boleto.valorFixo).replace('R$ ', '') : '',
  );
  const [enviando, setEnviando] = useState(false);

  const fixado = boleto.quem === QuemBoleto.Fixo;

  async function salvarValor() {
    const valor = lerValor(valorTexto);
    if (valor === boleto.valor || enviando) return;
    setEnviando(true);
    try {
      const resultado = await atualizarValorBoleto(boleto.id, valor);
      onAtualizado({ ...boleto, valor: resultado.valor });
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Falha ao atualizar o valor.');
      setValorTexto(formatarValor(boleto.valor).replace('R$ ', ''));
    } finally {
      setEnviando(false);
    }
  }

  async function alterarQuem(quem: QuemBoleto) {
    if (quem === boleto.quem || enviando) return;
    setEnviando(true);
    try {
      const resultado = await atualizarQuemBoleto(boleto.id, quem);
      onAtualizado({ ...boleto, quem: resultado.quem });
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Falha ao atualizar quem paga.');
    } finally {
      setEnviando(false);
    }
  }

  async function alterarPagoPor(pagoPor: Titular) {
    if (pagoPor === boleto.pagoPor || enviando) return;
    setEnviando(true);
    try {
      const resultado = await atualizarPagoPorBoleto(boleto.id, pagoPor);
      onAtualizado({ ...boleto, pagoPor: resultado.pagoPor });
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Falha ao atualizar quem pagou.');
    } finally {
      setEnviando(false);
    }
  }

  async function salvarValorFixo() {
    const valor = valorFixoTexto.trim() ? lerValor(valorFixoTexto) : null;
    if (valor === boleto.valorFixo || enviando) return;
    setEnviando(true);
    try {
      const resultado = await atualizarValorFixoBoleto(boleto.id, valor);
      onAtualizado({ ...boleto, valorFixo: resultado.valorFixo });
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Falha ao atualizar o valor fixo.');
      setValorFixoTexto(boleto.valorFixo != null ? formatarValor(boleto.valorFixo).replace('R$ ', '') : '');
    } finally {
      setEnviando(false);
    }
  }

  async function alternarFixar() {
    if (enviando) return;
    setEnviando(true);
    try {
      const resultado = await fixarBoleto(boleto.id);
      onAtualizado({ ...boleto, quem: resultado.quem });
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Falha ao fixar o boleto.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <tr>
      <td>{boleto.nome}</td>
      <td className="amount">
        <input
          type="text"
          inputMode="decimal"
          className="config-input-valor"
          value={valorTexto}
          disabled={enviando || fixado}
          onChange={(e) => setValorTexto(e.target.value)}
          onBlur={salvarValor}
        />
      </td>
      <td>
        {fixado ? (
          ROTULO_QUEM_BOLETO[QuemBoleto.Fixo]
        ) : (
          <select value={boleto.quem} disabled={enviando} onChange={(e) => alterarQuem(e.target.value as QuemBoleto)}>
            {OPCOES_QUEM_BOLETO.map((opcao) => (
              <option key={opcao} value={opcao}>
                {ROTULO_QUEM_BOLETO[opcao]}
              </option>
            ))}
          </select>
        )}
      </td>
      <td>
        <select
          value={boleto.pagoPor}
          disabled={enviando}
          onChange={(e) => alterarPagoPor(e.target.value as Titular)}
        >
          <option value={Titular.Silvio}>Silvio</option>
          <option value={Titular.Claucia}>Claucia</option>
        </select>
      </td>
      <td className="amount">
        <input
          type="text"
          inputMode="decimal"
          placeholder="—"
          className="config-input-valor"
          value={valorFixoTexto}
          disabled={enviando}
          onChange={(e) => setValorFixoTexto(e.target.value)}
          onBlur={salvarValorFixo}
        />
      </td>
      <td>
        <button
          type="button"
          className={fixado ? 'btn-who active' : 'btn-who'}
          disabled={enviando}
          title={fixado ? 'Remover valor fixo desta categoria' : 'Fixar valor atual como padrão'}
          onClick={alternarFixar}
        >
          📌
        </button>
      </td>
    </tr>
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
