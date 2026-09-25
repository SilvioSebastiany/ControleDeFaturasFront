import { apiPut } from './http.ts';
import type { ClassificarTransacaoResultado, QuemResponsavel } from '../types/fatura.ts';

// PUT /transacoes/{id}/classificacao — Id vem da rota (TransacoesController
// sobrescreve command.Id antes de despachar), então o corpo só precisa de
// Quem (número — sem JsonStringEnumConverter no backend).
export function classificarTransacaoManualmente(
  id: string,
  quem: QuemResponsavel,
): Promise<ClassificarTransacaoResultado> {
  return apiPut<ClassificarTransacaoResultado>(`/transacoes/${id}/classificacao`, { quem });
}
