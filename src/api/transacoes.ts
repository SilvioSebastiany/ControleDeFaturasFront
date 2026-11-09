import { apiPut } from './http.ts';
import type {
  CategoriaGasto,
  CategorizarTransacaoResultado,
  ClassificarTransacaoResultado,
  QuemResponsavel,
} from '../types/fatura.ts';

// PUT /transacoes/{id}/classificacao — Id vem da rota (TransacoesController
// sobrescreve command.Id antes de despachar), então o corpo só precisa de
// Quem (número — sem JsonStringEnumConverter no backend).
export function classificarTransacaoManualmente(
  id: string,
  quem: QuemResponsavel,
): Promise<ClassificarTransacaoResultado> {
  return apiPut<ClassificarTransacaoResultado>(`/transacoes/${id}/classificacao`, { quem });
}

// PUT /transacoes/{id}/categoria — a categoria de gasto é independente do "Quem" acima.
export function categorizarTransacao(
  id: string,
  categoria: CategoriaGasto,
): Promise<CategorizarTransacaoResultado> {
  return apiPut<CategorizarTransacaoResultado>(`/transacoes/${id}/categoria`, { categoria });
}
