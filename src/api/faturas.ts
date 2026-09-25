import { apiGet, apiPostFormData } from './http.ts';
import { TITULAR_NOME_ROTA } from '../types/fatura.ts';
import type { DetalheMes, ImportarFaturaResultado, Mes, Titular } from '../types/fatura.ts';

export function listarMeses(): Promise<Mes[]> {
  return apiGet<Mes[]>('/faturas');
}

export function obterDetalheMes(mes: string): Promise<DetalheMes> {
  return apiGet<DetalheMes>(`/faturas/${encodeURIComponent(mes)}`);
}

export function uploadFatura(
  mes: string,
  titular: Titular,
  arquivo: File,
): Promise<ImportarFaturaResultado> {
  const formData = new FormData();
  formData.append('arquivo', arquivo);

  return apiPostFormData<ImportarFaturaResultado>(
    `/faturas/${encodeURIComponent(mes)}/upload/${TITULAR_NOME_ROTA[titular]}`,
    formData,
  );
}
