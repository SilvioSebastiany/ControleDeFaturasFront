import { Titular } from '../../types/fatura.ts';
import type { BlocoPagante } from '../../types/fatura.ts';
import { CartaoDaFatura } from './CartaoDaFatura.tsx';
import { Passo } from './Passo.tsx';

// Passo 1: as duas faturas, sempre Silvio primeiro (a API devolve a ordem do Divisor).
export function PassoFaturas({ blocos }: { blocos: BlocoPagante[] }) {
  const ordenados = [...blocos].sort((a, b) => (a.pagante === Titular.Silvio ? -1 : b.pagante === Titular.Silvio ? 1 : 0));

  return (
    <Passo
      numero={1}
      titulo="As duas faturas"
      subtitulo="Cada fatura é separada em origens. A soma das origens tem que dar o total da fatura."
    >
      <div className="faturas-par">
        {ordenados.map((bloco) => (
          <CartaoDaFatura key={bloco.pagante} bloco={bloco} />
        ))}
      </div>
    </Passo>
  );
}
