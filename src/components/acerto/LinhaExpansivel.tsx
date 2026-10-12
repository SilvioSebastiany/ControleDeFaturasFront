import { useState } from 'react';
import type { LinhaConta } from '../../types/fatura.ts';
import { formatarValor } from '../../utils/dinheiro.ts';
import { descreverFonte, temValor } from './texto.ts';

// Linha da seção "Acerto": rótulo e valor, e ao abrir os itens com a fonte. Valor zero não aparece.
export function LinhaExpansivel({
  rotulo,
  linha,
  credito = false,
  sufixoFonte = '',
}: {
  rotulo: string;
  linha: LinhaConta;
  credito?: boolean;
  sufixoFonte?: string;
}) {
  const [aberta, setAberta] = useState(false);
  if (!temValor(linha.valor)) return null;

  return (
    <>
      <button
        type="button"
        className={`consolidado-linha expansivel${aberta ? ' aberta' : ''}${credito ? ' credito' : ''}`}
        data-testid="linha-conta"
        aria-expanded={aberta}
        onClick={() => setAberta((a) => !a)}
      >
        <span className="consolidado-rotulo">{rotulo}</span>
        <span className="consolidado-valor">{formatarValor(Math.abs(linha.valor))}</span>
      </button>
      {aberta && (
        <ul className="consolidado-itens">
          {linha.itens.map((item, i) => (
            <li key={i} className={item.valor < 0 ? 'credito' : undefined}>
              <span>
                <span className="consolidado-item-descricao">{item.descricao}</span>
                <span className="consolidado-item-fonte">
                  {descreverFonte(item)}
                  {sufixoFonte}
                </span>
              </span>
              <span className="consolidado-valor">{formatarValor(item.valor)}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
