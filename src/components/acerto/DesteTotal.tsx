import type { BlocoPagante } from '../../types/fatura.ts';
import { Titular } from '../../types/fatura.ts';
import { formatarValor } from '../../utils/dinheiro.ts';
import { ROTULO_TITULAR } from './rotulos.ts';
import { outroTitular } from './texto.ts';

// "Deste total": de que é feito o que o titular pagou. Os valores vêm calculados da API.
export function DesteTotal({ bloco }: { bloco: BlocoPagante }) {
  const proprio = bloco.pagante === Titular.Silvio ? 'Pessoal dele' : 'Pessoal dela';
  const doOutro = `Pessoal de ${ROTULO_TITULAR[outroTitular(bloco.pagante)]}`;

  return (
    <div className="prestacao-deste-total" role="group" aria-label="Deste total">
      <p className="prestacao-rotulo-secao">Deste total</p>
      <div className="prestacao-linha">
        <span>Compartilhado</span>
        <span className="prestacao-valor">{formatarValor(bloco.compartilhado)}</span>
      </div>
      <div className="prestacao-linha">
        <span>{proprio}</span>
        <span className="prestacao-valor">{formatarValor(bloco.pessoalProprio)}</span>
      </div>
      <div className="prestacao-linha">
        <span>{doOutro}</span>
        <span className="prestacao-valor">{formatarValor(bloco.pessoalDoOutro)}</span>
      </div>
    </div>
  );
}
