import { useState } from 'react';
import { Titular } from '../../types/fatura.ts';
import type { BlocoPagante } from '../../types/fatura.ts';
import { formatarValor } from '../../utils/dinheiro.ts';
import { LinhaDaConta } from './LinhaDaConta.tsx';
import { DO_TITULAR } from './rotulos.ts';
import { descreverOrigem, formatarValorAbsoluto, temValor } from './texto.ts';

// Fatura de um cartão: o total quebrado por origem (as origens somam o total), os boletos que
// o titular pagou fora da fatura e os itens, recolhidos. Os valores vêm da API.
export function CartaoDaFatura({ bloco }: { bloco: BlocoPagante }) {
  const [aberta, setAberta] = useState(false);
  const nome = DO_TITULAR[bloco.pagante];
  const origens = bloco.compartilhadoNoCartao + bloco.pessoalProprio + bloco.pessoalDoOutro + bloco.semCategoria;
  const somaBate = !temValor(origens - bloco.faturaTotal);

  return (
    <section className="fatura-cartao" aria-label={`Fatura ${nome}`}>
      <h4 className="fatura-cartao-titulo">
        <span>Fatura {nome}</span>
        <span className="conta-valor">{formatarValorAbsoluto(bloco.faturaTotal)}</span>
      </h4>

      {bloco.itensFatura.length === 0 ? (
        <p className="passo-nota">Nenhum gasto lançado ainda.</p>
      ) : (
        <>
          <div className="conta">
            <LinhaDaConta rotulo="Compartilhado" valor={bloco.compartilhadoNoCartao} />
            <LinhaDaConta
              rotulo={bloco.pagante === Titular.Silvio ? 'Pessoal dele' : 'Pessoal dela'}
              valor={bloco.pessoalProprio}
              sinal="+"
            />
            <LinhaDaConta rotulo="Pessoal do outro" valor={bloco.pessoalDoOutro} sinal="+" />
            {temValor(bloco.semCategoria) && (
              <LinhaDaConta rotulo="Sem categoria" valor={bloco.semCategoria} sinal="+" />
            )}
            <LinhaDaConta rotulo="Total da fatura" valor={bloco.faturaTotal} sinal="=" total />
          </div>

          {temValor(bloco.semCategoria) ? (
            <p className="fatura-confere atencao">
              ⚠ Inclui {formatarValorAbsoluto(bloco.semCategoria)} ainda sem categoria, que não entra no acerto.
            </p>
          ) : somaBate ? (
            <p className="fatura-confere">✓ As origens somam o total da fatura.</p>
          ) : (
            <p className="fatura-confere atencao">⚠ As origens não somam o total da fatura.</p>
          )}

          <button
            type="button"
            className="passo-toggle"
            aria-expanded={aberta}
            onClick={() => setAberta((a) => !a)}
          >
            {aberta ? 'Esconder' : 'Ver'} os {bloco.itensFatura.length} itens da fatura
          </button>
          {aberta && (
            <ul className="passo-itens">
              {bloco.itensFatura.map((item, i) => (
                <li key={i} className={item.valor < 0 ? 'credito' : undefined}>
                  <span>
                    <span className="passo-item-descricao">{item.descricao}</span>
                    <span className="passo-item-origem">
                      {descreverOrigem(item, bloco.pagante)}
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

      {bloco.boletosPagos.length > 0 && (
        <div className="conta">
          <p className="passo-rotulo-secao">Pago fora da fatura</p>
          {bloco.boletosPagos.map((b, i) => (
            <LinhaDaConta key={i} rotulo={b.descricao} valor={b.valor} />
          ))}
        </div>
      )}
    </section>
  );
}
