import { CategoriaGasto_VALORES } from '../types/fatura.generated.ts';
import type { CategoriaGasto, Titular, Transacao } from '../types/fatura.ts';

export const ROTULOS_CATEGORIA: Record<CategoriaGasto, string> = {
  NaoCategorizado: 'Não categorizado',
  Rancho: 'Rancho',
  Mercado: 'Mercado',
  Farmacia: 'Farmácia',
  AlimentacaoFora: 'Alimentação fora',
  Combustivel: 'Combustível',
  Estacionamento: 'Estacionamento',
  Assinaturas: 'Assinaturas',
  Seguro: 'Seguro',
  Saude: 'Saúde',
  Parcelas: 'Parcelas',
  Outros: 'Outros',
};

export const CATEGORIAS = CategoriaGasto_VALORES;

export interface LinhaRanking {
  categoria: CategoriaGasto;
  total: number;
  quantidade: number;
  // Fração do total do filtro (0 a 1); nulo quando o total do filtro é zero.
  percentual: number | null;
}

export function filtrarPorTitular(transacoes: Transacao[], titular: Titular | 'todos'): Transacao[] {
  return titular === 'todos' ? transacoes : transacoes.filter((t) => t.titular === titular);
}

export function filtrarPorCategoria(
  transacoes: Transacao[],
  categoria: CategoriaGasto | 'todas',
): Transacao[] {
  return categoria === 'todas' ? transacoes : transacoes.filter((t) => t.categoria === categoria);
}

export function somar(transacoes: Transacao[]): number {
  return transacoes.reduce((soma, t) => soma + t.valor, 0);
}

// Ranking das categorias com ao menos um gasto, do maior total para o menor
// (empate por rótulo). Créditos e estornos entram na soma e reduzem a categoria.
export function calcularRanking(transacoes: Transacao[]): LinhaRanking[] {
  const total = somar(transacoes);
  const porCategoria = new Map<CategoriaGasto, { total: number; quantidade: number }>();

  for (const t of transacoes) {
    const atual = porCategoria.get(t.categoria) ?? { total: 0, quantidade: 0 };
    atual.total += t.valor;
    atual.quantidade += 1;
    porCategoria.set(t.categoria, atual);
  }

  return [...porCategoria.entries()]
    .map(([categoria, { total: totalCategoria, quantidade }]) => ({
      categoria,
      total: totalCategoria,
      quantidade,
      percentual: total === 0 ? null : totalCategoria / total,
    }))
    .sort(
      (a, b) =>
        b.total - a.total ||
        ROTULOS_CATEGORIA[a.categoria].localeCompare(ROTULOS_CATEGORIA[b.categoria], 'pt-BR'),
    );
}
