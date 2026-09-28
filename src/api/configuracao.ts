import { apiDelete, apiGet, apiPost } from './http.ts';
import type {
  AcordoFixo,
  CategoriaBoleto,
  QuemResponsavel,
  RegraClassificacao,
  Titular,
} from '../types/fatura.ts';

// Regras de classificação (T9)

export function listarRegras(): Promise<RegraClassificacao[]> {
  return apiGet<RegraClassificacao[]>('/regras-classificacao');
}

export function criarRegra(palavraChave: string, quem: QuemResponsavel): Promise<unknown> {
  return apiPost('/regras-classificacao', { palavraChave, quem });
}

export function removerRegra(id: string): Promise<void> {
  return apiDelete(`/regras-classificacao/${id}`);
}

// Categorias de boleto (T10) — globais, sincronizadas com os boletos de cada
// mês ao abrir o mês (GET /faturas/{mes}).

export function listarCategoriasBoleto(): Promise<CategoriaBoleto[]> {
  return apiGet<CategoriaBoleto[]>('/categorias-boleto');
}

export function criarCategoriaBoleto(nome: string): Promise<unknown> {
  return apiPost('/categorias-boleto', { nome });
}

export function removerCategoriaBoleto(id: string): Promise<void> {
  return apiDelete(`/categorias-boleto/${id}`);
}

// Acordos fixos (T10) — globais, entram no acerto final de todos os meses.

export function listarAcordosFixos(): Promise<AcordoFixo[]> {
  return apiGet<AcordoFixo[]>('/acordos-fixos');
}

export function criarAcordoFixo(descricao: string, devedor: Titular, valor: number): Promise<unknown> {
  return apiPost('/acordos-fixos', { descricao, devedor, valor });
}

export function removerAcordoFixo(id: string): Promise<void> {
  return apiDelete(`/acordos-fixos/${id}`);
}
