import { useState } from 'react';
import type { Acerto, EtapaAcertoFinal } from '../../types/fatura.ts';
import { AritmeticaDoAcerto } from './AritmeticaDoAcerto.tsx';
import { EtapaDoAcerto } from './EtapaDoAcerto.tsx';
import { ListaDeItens } from './ListaDeItens.tsx';
import { ROTULO_TITULAR } from './rotulos.ts';
import { formatarValorAbsoluto } from './texto.ts';

// Cartão de acerto expansível — clicar mostra os itens (transações, boletos,
// acordos, pagamentos) que compõem o valor, igual ao accordion "Prestação de
// Contas" do legado (js/totals.js#buildResumoView).
export function CartaoAcerto({
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
            {ROTULO_TITULAR[acerto.quemDeve!]} deve {formatarValorAbsoluto(acerto.valor)}
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

      {aberto && !temEtapas && temItens && <ListaDeItens itens={acerto.itens} />}

      <AritmeticaDoAcerto acerto={acerto} testId={idAritmetica} />
    </div>
  );
}
