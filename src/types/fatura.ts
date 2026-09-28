// Os enums (Titular, QuemResponsavel, QuemBoleto) vêm de fatura.generated.ts,
// gerado a partir dos enums C# reais (scripts/gerar-enums-front.mjs, repo
// Controle-de-Faturas) — não editar a mão. A API serializa enum como string
// (JsonStringEnumConverter, ver Program.cs) — o corpo JSON e o segmento de
// rota {titular} (POST /faturas/{mes}/upload/{titular}) usam o mesmo valor
// (o próprio nome do enum, ex.: "Silvio"), então não há mais conversão
// separada entre os dois como havia quando o corpo era número.
export { Titular, QuemResponsavel, QuemBoleto } from './fatura.generated.ts';
import type { Titular, QuemResponsavel, QuemBoleto } from './fatura.generated.ts';

// Espelha TransacaoResponse (src/api/Responses/TransacaoResponse.cs)
export interface Transacao {
  id: string;
  titular: Titular;
  data: string;
  descricao: string;
  valor: number;
  quem: QuemResponsavel;
  automatica: boolean;
  classificacaoManual: boolean;
}

// Espelha BoletoResponse
export interface Boleto {
  id: string;
  nome: string;
  valor: number;
  quem: QuemBoleto;
  pagoPor: Titular;
  valorFixo: number | null;
}

// Espelha AcertoResponse
export interface Acerto {
  quemDeve: Titular | null;
  valor: number;
}

// Espelha MesResponse (GET /faturas)
export interface Mes {
  id: string;
  chave: string;
}

// Espelha DetalheMesResponse (GET /faturas/{mes})
export interface DetalheMes {
  id: string;
  chave: string;
  transacoes: Transacao[];
  boletos: Boleto[];
  acerto: Acerto;
}

// Espelha ImportarFaturaCommandResult (POST /faturas/{mes}/upload/{titular})
export interface ImportarFaturaResultado {
  mesId: string;
  mes: string;
  quantidadeTransacoesImportadas: number;
}

// Espelha ClassificarTransacaoManualmenteCommandResult
export interface ClassificarTransacaoResultado {
  id: string;
  quem: QuemResponsavel;
  classificacaoManual: boolean;
}

// Espelha RegraClassificacaoResponse (GET /regras-classificacao, já ordenado
// por prioridade: menor Ordem primeiro)
export interface RegraClassificacao {
  id: string;
  palavraChave: string;
  quem: QuemResponsavel;
  ordem: number;
}

// Espelha CategoriaBoletoResponse (GET /categorias-boleto)
export interface CategoriaBoleto {
  id: string;
  nome: string;
  quem: QuemBoleto | null;
  pagoPor: Titular | null;
  valorFixo: number | null;
  valor: number | null;
}

// Espelha AcordoFixoResponse (GET /acordos-fixos)
export interface AcordoFixo {
  id: string;
  descricao: string;
  devedor: Titular;
  valor: number;
}

// Espelha AlertaTransacoesNaoDefinidasResponse
export interface AlertaTransacoesNaoDefinidas {
  quantidade: number;
  total: number;
}

// Espelha AcertoFinalMesResponse (GET /faturas/{mes}/acerto-final)
export interface AcertoFinalMes {
  acerto: Acerto;
  acertoFinal: Acerto;
  transacoesNaoDefinidas: AlertaTransacoesNaoDefinidas;
}
