import { Titular } from '../../types/fatura.ts';
import type { BlocoPagante } from '../../types/fatura.ts';
import { formatarValor } from '../../utils/dinheiro.ts';
import { DesteTotal } from './DesteTotal.tsx';
import { DivisaoDoCompartilhado } from './DivisaoDoCompartilhado.tsx';
import { FaturaDoCartao } from './FaturaDoCartao.tsx';
import { ROTULO_TITULAR } from './rotulos.ts';

// Bloco de quem pagou: fatura do cartão, boletos pagos e Total desembolsado.
export function BlocoDoPagante({ bloco }: { bloco: BlocoPagante }) {
  const rotulo = `${ROTULO_TITULAR[bloco.pagante]} pagou`;
  const vazio = bloco.itensFatura.length === 0 && bloco.boletosPagos.length === 0;

  return (
    <section
      className={`prestacao-bloco ${bloco.pagante === Titular.Silvio ? 'silvio' : 'claucia'}`}
      aria-label={rotulo}
    >
      <h4 className="prestacao-bloco-titulo">{rotulo}</h4>
      {vazio ? (
        <p className="prestacao-vazio">Nenhum gasto lançado ainda.</p>
      ) : (
        <div className="prestacao-corpo">
          {bloco.itensFatura.length > 0 && <FaturaDoCartao bloco={bloco} />}
          {bloco.boletosPagos.map((b, i) => (
            <div key={i} className="prestacao-linha">
              <span>{b.descricao}</span>
              <span className="prestacao-valor">{formatarValor(b.valor)}</span>
            </div>
          ))}
          <div className="prestacao-linha prestacao-total">
            <span>Total desembolsado</span>
            <span className="prestacao-valor">{formatarValor(bloco.totalDesembolsado)}</span>
          </div>
          <DesteTotal bloco={bloco} />
          <DivisaoDoCompartilhado metade={bloco.metadeDoCompartilhado} />
        </div>
      )}
    </section>
  );
}
