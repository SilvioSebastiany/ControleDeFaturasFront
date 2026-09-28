import { apiPost, apiPut } from './http.ts';
import type { Titular, QuemBoleto } from '../types/fatura.ts';

// Edição de boletos do mês (T18) — porta de updateBoletoAmount/Who/PagoPor/
// ValorFixo e pinBoletoCategory (js/boletos.js). Cada campo é um PUT
// dedicado, espelhando o Command próprio do backend (BoletosController).

export interface AtualizarValorBoletoResultado {
  id: string;
  valor: number;
}

export interface AtualizarQuemBoletoResultado {
  id: string;
  quem: QuemBoleto;
}

export interface AtualizarPagoPorBoletoResultado {
  id: string;
  pagoPor: Titular;
}

export interface AtualizarValorFixoBoletoResultado {
  id: string;
  valorFixo: number | null;
}

export interface FixarBoletoResultado {
  id: string;
  quem: QuemBoleto;
  fixado: boolean;
}

export function atualizarValorBoleto(id: string, valor: number): Promise<AtualizarValorBoletoResultado> {
  return apiPut(`/boletos/${id}/valor`, { valor });
}

export function atualizarQuemBoleto(id: string, quem: QuemBoleto): Promise<AtualizarQuemBoletoResultado> {
  return apiPut(`/boletos/${id}/quem`, { quem });
}

export function atualizarPagoPorBoleto(id: string, pagoPor: Titular): Promise<AtualizarPagoPorBoletoResultado> {
  return apiPut(`/boletos/${id}/pago-por`, { pagoPor });
}

export function atualizarValorFixoBoleto(
  id: string,
  valorFixo: number | null,
): Promise<AtualizarValorFixoBoletoResultado> {
  return apiPut(`/boletos/${id}/valor-fixo`, { valorFixo });
}

export function fixarBoleto(id: string): Promise<FixarBoletoResultado> {
  return apiPost(`/boletos/${id}/fixar`, undefined);
}
