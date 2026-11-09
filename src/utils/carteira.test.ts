import { describe, expect, it } from 'vitest';
import {
  calcularRanking,
  filtrarPorCategoria,
  filtrarPorTitular,
  somar,
} from './carteira.ts';
import { CategoriaGasto, QuemResponsavel, Titular } from '../types/fatura.ts';
import type { Transacao } from '../types/fatura.ts';

let sequencia = 0;
function gasto(titular: Titular, valor: number, categoria: CategoriaGasto): Transacao {
  sequencia += 1;
  return {
    id: `t${sequencia}`,
    titular,
    data: '01 OUT',
    descricao: `Gasto ${sequencia}`,
    valor,
    quem: QuemResponsavel.NaoDefinido,
    automatica: false,
    classificacaoManual: false,
    categoria,
  };
}

const transacoes: Transacao[] = [
  gasto(Titular.Silvio, 300, CategoriaGasto.Mercado),
  gasto(Titular.Claucia, 200, CategoriaGasto.Mercado),
  gasto(Titular.Silvio, 100, CategoriaGasto.Combustivel),
  gasto(Titular.Claucia, 400, CategoriaGasto.NaoCategorizado),
];

describe('calcularRanking', () => {
  it('ordena do maior total para o menor e soma os dois titulares (C01, C13)', () => {
    const ranking = calcularRanking(transacoes);

    expect(ranking.map((l) => l.categoria)).toEqual([
      CategoriaGasto.Mercado,
      CategoriaGasto.NaoCategorizado,
      CategoriaGasto.Combustivel,
    ]);
    expect(ranking[0]).toMatchObject({ total: 500, quantidade: 2 });
    expect(ranking[0].percentual).toBeCloseTo(0.5);
  });

  it('desempata por rótulo em pt-BR (C13)', () => {
    const ranking = calcularRanking([
      gasto(Titular.Silvio, 100, CategoriaGasto.Saude),
      gasto(Titular.Silvio, 100, CategoriaGasto.Farmacia),
      gasto(Titular.Silvio, 100, CategoriaGasto.Combustivel),
    ]);

    expect(ranking.map((l) => l.categoria)).toEqual([
      CategoriaGasto.Combustivel,
      CategoriaGasto.Farmacia,
      CategoriaGasto.Saude,
    ]);
  });

  it('a soma das categorias é igual à soma de todas as transações (C14)', () => {
    const ranking = calcularRanking(transacoes);

    expect(ranking.reduce((s, l) => s + l.total, 0)).toBe(somar(transacoes));
    expect(ranking.reduce((s, l) => s + l.quantidade, 0)).toBe(transacoes.length);
  });

  it('crédito e estorno reduzem a categoria (C15)', () => {
    const ranking = calcularRanking([
      gasto(Titular.Silvio, 320.45, CategoriaGasto.Mercado),
      gasto(Titular.Silvio, -50, CategoriaGasto.Mercado),
    ]);

    expect(ranking).toHaveLength(1);
    expect(ranking[0].total).toBeCloseTo(270.45);
  });

  it('total do filtro zerado deixa o percentual nulo, sem dividir por zero', () => {
    const ranking = calcularRanking([
      gasto(Titular.Silvio, 50, CategoriaGasto.Mercado),
      gasto(Titular.Silvio, -50, CategoriaGasto.Outros),
    ]);

    expect(ranking.every((l) => l.percentual === null)).toBe(true);
  });

  it('lista vazia devolve ranking vazio', () => {
    expect(calcularRanking([])).toEqual([]);
  });
});

describe('filtros', () => {
  it('por titular: o ranking reflete só aquele titular (C02, C24)', () => {
    const doSilvio = filtrarPorTitular(transacoes, Titular.Silvio);

    expect(doSilvio).toHaveLength(2);
    expect(calcularRanking(doSilvio).map((l) => l.categoria)).toEqual([
      CategoriaGasto.Mercado,
      CategoriaGasto.Combustivel,
    ]);
    expect(filtrarPorTitular(transacoes, 'todos')).toHaveLength(4);
  });

  it('por categoria, incluindo não categorizado (C25)', () => {
    expect(filtrarPorCategoria(transacoes, CategoriaGasto.Mercado)).toHaveLength(2);
    expect(filtrarPorCategoria(transacoes, CategoriaGasto.NaoCategorizado)).toHaveLength(1);
    expect(filtrarPorCategoria(transacoes, 'todas')).toHaveLength(4);
  });
});
