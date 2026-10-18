import { formatarValorAbsoluto } from './texto.ts';

// Uma linha da conta "do caderno": sinal, rótulo e valor. A linha de total tem o traço em cima.
export function LinhaDaConta({
  rotulo,
  valor,
  sinal,
  total = false,
}: {
  rotulo: string;
  valor: number;
  sinal?: string;
  total?: boolean;
}) {
  return (
    <div className={`conta-linha${total ? ' total' : ''}`} data-testid="linha-conta">
      <span className="conta-rotulo">
        {sinal && (
          <span className="conta-sinal" aria-hidden="true">
            {sinal}
          </span>
        )}
        {rotulo}
      </span>
      <span className="conta-valor">{formatarValorAbsoluto(valor)}</span>
    </div>
  );
}
