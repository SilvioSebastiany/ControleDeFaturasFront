import { useState } from 'react';
import { Titular } from '../../types/fatura.ts';
import type { AcertoConsolidado } from '../../types/fatura.ts';
import { formatarValor } from '../../utils/dinheiro.ts';
import { LinhaDaConta } from './LinhaDaConta.tsx';
import { Passo } from './Passo.tsx';
import { ROTULO_TITULAR } from './rotulos.ts';
import { descreverFonte, formatarValorAbsoluto } from './texto.ts';

// Passo 2: tudo que é do casal é somado e dividido por dois. Estorno reduz o total.
export function PassoDivisao({ acerto }: { acerto: AcertoConsolidado }) {
  const [aberta, setAberta] = useState(false);
  const { divisao } = acerto;
  const devedor = divisao.saldo.quemDeve;
  const compras = [...acerto.metadeDoQueSilvioPagou.itens, ...acerto.metadeDoQueClauciaPagou.itens];

  return (
    <Passo
      numero={2}
      titulo="Divisão do compartilhado"
      subtitulo="Tudo que é do casal é somado e dividido por dois. Estorno reduz o total."
      vemDe="Vem do passo 1: as linhas compartilhado de cada fatura, mais o que foi pago fora da fatura."
    >
      <div className="conta">
        <LinhaDaConta rotulo="Compartilhado pago pelo Silvio" valor={divisao.pagoPorSilvio} />
        <LinhaDaConta rotulo="Compartilhado pago pela Claucia" valor={divisao.pagoPorClaucia} sinal="+" />
        <LinhaDaConta rotulo="Total compartilhado" valor={divisao.total} sinal="=" total />
        <LinhaDaConta rotulo="Metade de cada um (÷ 2)" valor={divisao.metadePorPessoa} />
        {devedor !== null && (
          <>
            <LinhaDaConta
              rotulo={`${ROTULO_TITULAR[devedor]} pagou`}
              valor={devedor === Titular.Silvio ? divisao.pagoPorSilvio : divisao.pagoPorClaucia}
              sinal="−"
            />
            <LinhaDaConta
              rotulo={`${ROTULO_TITULAR[devedor]} deve do compartilhado`}
              valor={divisao.saldo.valor}
              sinal="="
              total
            />
          </>
        )}
      </div>
      <p className="passo-destaque">
        {devedor === null
          ? 'Os dois pagaram a mesma parte do compartilhado: nenhum deve ao outro por ele.'
          : `Cada um deveria arcar com ${formatarValorAbsoluto(divisao.metadePorPessoa)}. ${ROTULO_TITULAR[devedor]} pagou menos que isso e deve ${formatarValorAbsoluto(divisao.saldo.valor)}.`}
      </p>
      {compras.length > 0 && (
        <>
          <button type="button" className="passo-toggle" aria-expanded={aberta} onClick={() => setAberta((a) => !a)}>
            {aberta ? 'Esconder' : 'Ver'} as compras compartilhadas, uma a uma
          </button>
          {aberta && (
            <ul className="passo-itens">
              {compras.map((item, i) => (
                <li key={i} className={item.valor < 0 ? 'credito' : undefined}>
                  <span>
                    <span className="passo-item-descricao">{item.descricao}</span>
                    <span className="passo-item-origem">
                      {descreverFonte(item)}
                      {item.valor < 0 ? ' · estorno reduz o total' : ''}
                    </span>
                  </span>
                  <span className="conta-valor">{formatarValor(item.valor)}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Passo>
  );
}
