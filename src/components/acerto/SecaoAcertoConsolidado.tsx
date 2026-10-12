import { Titular } from '../../types/fatura.ts';
import type { AcertoConsolidado, SaldoAcerto } from '../../types/fatura.ts';
import { formatarValor } from '../../utils/dinheiro.ts';
import { LinhaExpansivel } from './LinhaExpansivel.tsx';
import { ROTULO_TITULAR } from './rotulos.ts';
import { temValor } from './texto.ts';

function LinhaSubtotal({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="consolidado-linha subtotal" data-testid="linha-conta">
      <span className="consolidado-rotulo">{rotulo}</span>
      <span className="consolidado-valor">{formatarValor(valor)}</span>
    </div>
  );
}

function Subtotal({ saldo }: { saldo: SaldoAcerto }) {
  const rotulo = saldo.quemDeve === null ? 'Estão quites' : `${ROTULO_TITULAR[saldo.quemDeve]} deve`;
  return <LinhaSubtotal rotulo={rotulo} valor={saldo.valor} />;
}

// Seção "Acerto" do Divisor: os dois lados do compartilhado se compensam direto, depois o
// pessoal no cartão do outro e os acordos fixos. Sem pagamentos (eles ficam nos cartões de
// acerto). Tudo vem calculado da API; aqui só se formata.
export function SecaoAcertoConsolidado({ acerto }: { acerto: AcertoConsolidado }) {
  const temPessoalDoOutro = temValor(acerto.silvioNoCartaoDela.valor) || temValor(acerto.clauciaNoCartaoDele.valor);
  const temAcordos = acerto.acordosFixos.itens.length > 0;
  const total = acerto.total;
  const direcao = total.quemDeve === null ? 'quites' : total.quemDeve === Titular.Silvio ? 'silvio' : 'claucia';

  return (
    <section className="consolidado" aria-label="Acerto consolidado">
      <h3 className="consolidado-titulo">Acerto</h3>
      <p className="consolidado-subtitulo">Os dois lados se compensam direto.</p>
      <div className="consolidado-corpo">
        <LinhaExpansivel
          rotulo="Silvio deve à Claucia · metade do compartilhado pago por ela"
          linha={acerto.metadeDoQueClauciaPagou}
        />
        <LinhaExpansivel
          rotulo="Claucia deve ao Silvio · metade do compartilhado pago por ele"
          linha={acerto.metadeDoQueSilvioPagou}
          credito
        />
        <LinhaSubtotal rotulo="Saldo compartilhado" valor={Math.abs(acerto.saldoCompartilhado)} />
        <LinhaExpansivel
          rotulo="+ Silvio no cartão dela"
          linha={acerto.silvioNoCartaoDela}
          sufixoFonte=" · 100% Silvio"
        />
        <LinhaExpansivel
          rotulo="− Claucia no cartão dele"
          linha={acerto.clauciaNoCartaoDele}
          credito
          sufixoFonte=" · 100% Claucia"
        />
        {(temPessoalDoOutro || temAcordos) && <Subtotal saldo={acerto.subtotalDoMes} />}
        {temAcordos && (
          <>
            <LinhaExpansivel rotulo="+ acordos fixos" linha={acerto.acordosFixos} />
            <Subtotal saldo={total} />
          </>
        )}
        <div className={`consolidado-total ${direcao}`} data-testid="total-final">
          <span>{total.quemDeve === null ? 'Estão quites' : `${ROTULO_TITULAR[total.quemDeve]} paga`}</span>
          {total.quemDeve !== null && <span className="consolidado-valor">{formatarValor(total.valor)}</span>}
        </div>
      </div>
    </section>
  );
}
