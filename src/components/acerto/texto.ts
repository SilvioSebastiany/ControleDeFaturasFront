import type { ItemAcerto, LancamentoSemEfeito, SaldoAcerto } from '../../types/fatura.ts';
import { PAGO_POR, ROTULO_MOTIVO, ROTULO_REGRA, ROTULO_TITULAR } from './rotulos.ts';

// Valor sem sinal: a direção ("X deve", "estorno de", "a menos") vai no texto.
// Diferente do formatarValor de utils/dinheiro.ts, que prefixa "−" nos negativos.
export function formatarValorAbsoluto(valor: number): string {
  return 'R$ ' + Math.abs(valor).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// "R$ 100,00 pago pela Claucia, 50/50 → Silvio deve R$ 50,00". Estorno (valor
// negativo) inverte o efeito: "... → Claucia deve R$ 25,00 a menos".
export function descreverItem(item: ItemAcerto): string {
  const estorno = item.valor < 0;
  const original = (estorno ? 'estorno de ' : '') + formatarValorAbsoluto(item.valor);
  const pagoPor = item.pagoPor ? ` pago ${PAGO_POR[item.pagoPor]}` : '';
  const efeito =
    `${ROTULO_TITULAR[item.quemDeve]} deve ${formatarValorAbsoluto(item.valorEfeito)}` +
    (item.valorEfeito < 0 ? ' a menos' : '');
  return `${original}${pagoPor}, ${ROTULO_REGRA[item.regra]} → ${efeito}`;
}

// "R$ 54,28 pago pelo Silvio, gasto pessoal de quem pagou"
export function descreverSemEfeito(l: LancamentoSemEfeito): string {
  return `${formatarValorAbsoluto(l.valor)} pago ${PAGO_POR[l.pagoPor]}, ${ROTULO_MOTIVO[l.motivo]}`;
}

export function descreverSaldo(saldo: SaldoAcerto): string {
  return saldo.quemDeve === null
    ? 'Estão quites'
    : `${ROTULO_TITULAR[saldo.quemDeve]} deve ${formatarValorAbsoluto(saldo.valor)}`;
}
