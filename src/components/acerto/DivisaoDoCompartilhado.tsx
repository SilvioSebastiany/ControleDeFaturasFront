import { formatarValor } from '../../utils/dinheiro.ts';

// Metade do compartilhado que cabe a cada um (50% para cada).
export function DivisaoDoCompartilhado({ metade }: { metade: number }) {
  return (
    <>
      <p className="prestacao-nota">compartilhado · 50% para cada um</p>
      <div className="prestacao-divisao" role="group" aria-label="Divisão do compartilhado">
        <div className="silvio">
          <span className="prestacao-quem">Silvio</span>
          <span className="prestacao-valor">{formatarValor(metade)}</span>
        </div>
        <div className="claucia">
          <span className="prestacao-quem">Claucia</span>
          <span className="prestacao-valor">{formatarValor(metade)}</span>
        </div>
      </div>
    </>
  );
}
