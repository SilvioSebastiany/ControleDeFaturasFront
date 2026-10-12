import type { Acerto } from '../../types/fatura.ts';
import { ROTULO_TITULAR } from './rotulos.ts';
import { formatarValorAbsoluto } from './texto.ts';

// "Claucia deve R$ 320,00 − Silvio deve R$ 120,00 = Claucia deve R$ 200,00". Os
// subtotais e a diferença vêm prontos da API; aqui só se formata.
export function AritmeticaDoAcerto({ acerto, testId }: { acerto: Acerto; testId: string }) {
  const { subtotalClauciaDeve, subtotalSilvioDeve, diferenca } = acerto.aritmetica;
  const resultado =
    acerto.quemDeve === null
      ? 'Estão quites'
      : `${ROTULO_TITULAR[acerto.quemDeve]} deve ${formatarValorAbsoluto(diferenca)}`;

  return (
    <div className="acerto-aritmetica" data-testid={testId}>
      <p className="acerto-aritmetica-conta">
        Claucia deve {formatarValorAbsoluto(subtotalClauciaDeve)} − Silvio deve{' '}
        {formatarValorAbsoluto(subtotalSilvioDeve)} = {resultado}
      </p>
      <p className="acerto-aritmetica-nota">O arredondamento é feito uma vez, no fim.</p>
    </div>
  );
}
