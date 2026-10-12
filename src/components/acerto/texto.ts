import { FonteItemConta, OrigemItemFatura, Titular } from '../../types/fatura.ts';
import type {
  ItemAcerto,
  ItemConta,
  ItemFatura,
  LancamentoSemEfeito,
  SaldoAcerto,
} from '../../types/fatura.ts';
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

export function outroTitular(titular: Titular): Titular {
  return titular === Titular.Silvio ? Titular.Claucia : Titular.Silvio;
}

// "pessoal dele/dela" é o gasto de quem pagou; "pessoal de X" é o do outro, que saiu no
// cartão de quem pagou (e gera dívida).
export function descreverOrigem(item: ItemFatura, pagante: Titular): string {
  switch (item.origem) {
    case OrigemItemFatura.Compartilhado:
      return 'compartilhado';
    case OrigemItemFatura.PessoalProprio:
      return pagante === Titular.Silvio ? 'pessoal dele' : 'pessoal dela';
    case OrigemItemFatura.PessoalDoOutro:
      return `pessoal de ${ROTULO_TITULAR[outroTitular(pagante)]}`;
    case OrigemItemFatura.SemCategoria:
      return 'sem categoria';
  }
}

// Valor zero (ou de meio centavo) não aparece: mesma zona morta do motor de acerto.
export function temValor(valor: number): boolean {
  return Math.abs(valor) >= 0.005;
}

// De onde veio um item da seção "Acerto": "cartão Claucia", "débito conta silvio · em Outros Gastos"...
export function descreverFonte(item: ItemConta): string {
  switch (item.fonte) {
    case FonteItemConta.CartaoSilvio:
      return 'cartão Silvio';
    case FonteItemConta.CartaoClaucia:
      return 'cartão Claucia';
    case FonteItemConta.BoletoPagoPorSilvio:
      return 'débito conta silvio · em Outros Gastos';
    case FonteItemConta.BoletoPagoPorClaucia:
      return 'débito conta claucia · em Outros Gastos';
    case FonteItemConta.AcordoFixo:
      return 'acordo mensal fixo';
  }
}

export function descreverSaldo(saldo: SaldoAcerto): string {
  return saldo.quemDeve === null
    ? 'Estão quites'
    : `${ROTULO_TITULAR[saldo.quemDeve]} deve ${formatarValorAbsoluto(saldo.valor)}`;
}
