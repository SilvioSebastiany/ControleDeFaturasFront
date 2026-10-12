import { useState } from 'react';
import type { BlocoPagante } from '../../types/fatura.ts';
import { formatarValor } from '../../utils/dinheiro.ts';
import { descreverOrigem } from './texto.ts';

// Fatura do cartão de quem pagou: fechada por padrão, abre item a item com a origem.
export function FaturaDoCartao({ bloco }: { bloco: BlocoPagante }) {
  const [aberta, setAberta] = useState(false);

  return (
    <>
      <button
        type="button"
        className="prestacao-linha prestacao-fatura"
        aria-expanded={aberta}
        onClick={() => setAberta((a) => !a)}
      >
        <span>
          <span className="prestacao-seta" aria-hidden="true">
            {aberta ? '▼' : '▶'}
          </span>
          Fatura do cartão
        </span>
        <span className="prestacao-valor">{formatarValor(bloco.faturaTotal)}</span>
      </button>
      {aberta && (
        <ul className="prestacao-itens">
          {bloco.itensFatura.map((item, i) => (
            <li key={i} className={item.valor < 0 ? 'credito' : undefined}>
              <span>
                <span className="prestacao-item-descricao">{item.descricao}</span>
                <span className="prestacao-item-origem">{descreverOrigem(item, bloco.pagante)}</span>
              </span>
              <span className="prestacao-valor">{formatarValor(item.valor)}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
