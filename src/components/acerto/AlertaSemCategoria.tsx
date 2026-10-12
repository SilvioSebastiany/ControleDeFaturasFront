import type { Titular } from '../../types/fatura.ts';
import type { AlertaTransacoesNaoDefinidas } from '../../types/fatura.ts';
import { ROTULO_TITULAR } from './rotulos.ts';
import { formatarValorAbsoluto } from './texto.ts';

// Alerta no topo do Resumo: quantos lançamentos faltam classificar e quanto somam,
// com um atalho para a aba de cada cartão que tem pendência.
export function AlertaSemCategoria({
  alerta,
  onIrParaCartao,
}: {
  alerta: AlertaTransacoesNaoDefinidas;
  onIrParaCartao?: (titular: Titular) => void;
}) {
  if (alerta.quantidade === 0) return null;
  return (
    <div className="pendencia-resumo" role="status">
      <p className="pendencia-texto">
        <strong>
          {alerta.quantidade} lançamento{alerta.quantidade > 1 ? 's' : ''} sem categoria
        </strong>
        {formatarValorAbsoluto(alerta.total)} aguardando classificação
      </p>
      <div className="pendencia-atalhos">
        {alerta.porCartao.map((p) => (
          <button
            key={p.titular}
            type="button"
            className="pendencia-btn"
            onClick={() => onIrParaCartao?.(p.titular)}
          >
            Cartão {ROTULO_TITULAR[p.titular]} →
          </button>
        ))}
      </div>
    </div>
  );
}
