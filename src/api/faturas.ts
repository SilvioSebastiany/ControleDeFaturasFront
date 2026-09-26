import { apiDelete, apiGet, apiPostFormData } from './http.ts';
import type { AcertoFinalMes, DetalheMes, ImportarFaturaResultado, Mes, Titular } from '../types/fatura.ts';

export function listarMeses(): Promise<Mes[]> {
  return apiGet<Mes[]>('/faturas');
}

export function obterDetalheMes(mes: string): Promise<DetalheMes> {
  return apiGet<DetalheMes>(`/faturas/${encodeURIComponent(mes)}`);
}

export function obterAcertoFinal(mes: string): Promise<AcertoFinalMes> {
  return apiGet<AcertoFinalMes>(`/faturas/${encodeURIComponent(mes)}/acerto-final`);
}

export function removerMes(mes: string): Promise<void> {
  return apiDelete(`/faturas/${encodeURIComponent(mes)}`);
}

export function uploadFatura(
  mes: string,
  titular: Titular,
  arquivo: File,
): Promise<ImportarFaturaResultado> {
  const formData = new FormData();
  formData.append('arquivo', arquivo);

  // Titular já é o próprio nome do enum (ex.: "Silvio") — a API serializa
  // enum como string tanto no corpo JSON quanto no model binder de rota.
  return apiPostFormData<ImportarFaturaResultado>(
    `/faturas/${encodeURIComponent(mes)}/upload/${titular}`,
    formData,
  );
}
