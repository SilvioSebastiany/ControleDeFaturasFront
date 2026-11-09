// Os enums (Titular, QuemResponsavel, QuemBoleto) vêm de fatura.generated.ts,
// gerado a partir dos enums C# reais (scripts/gerar-enums-front.mjs, repo
// Controle-de-Faturas) — não editar a mão. A API serializa enum como string
// (JsonStringEnumConverter, ver Program.cs) — o corpo JSON e o segmento de
// rota {titular} (POST /faturas/{mes}/upload/{titular}) usam o mesmo valor
// (o próprio nome do enum, ex.: "Silvio"), então não há mais conversão
// separada entre os dois como havia quando o corpo era número.
export {
  Titular,
  QuemResponsavel,
  QuemBoleto,
  RegraAplicada,
  MotivoSemEfeito,
  EtapaAcerto,
  OrigemItemFatura,
  FonteItemConta,
  CategoriaGasto,
} from './fatura.generated.ts';
import type {
  Titular,
  QuemResponsavel,
  QuemBoleto,
  RegraAplicada,
  MotivoSemEfeito,
  EtapaAcerto,
  OrigemItemFatura,
  FonteItemConta,
  CategoriaGasto,
} from './fatura.generated.ts';

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
  categoria: CategoriaGasto;
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

// Espelha ItemAcertoResponse
export interface ItemAcerto {
  descricao: string;
  valor: number;
  quemDeve: Titular;
  valorEfeito: number;
  // Nulo em acordo fixo (nao tem pagador)
  pagoPor: Titular | null;
  regra: RegraAplicada;
}

// Espelha LancamentoSemEfeitoResponse
export interface LancamentoSemEfeito {
  descricao: string;
  valor: number;
  pagoPor: Titular;
  motivo: MotivoSemEfeito;
}

// Espelha SaldoAcertoResponse (saldo acumulado depois de uma etapa)
export interface SaldoAcerto {
  quemDeve: Titular | null;
  valor: number;
}

// Espelha EtapaAcertoResponse
export interface EtapaAcertoFinal {
  etapa: EtapaAcerto;
  itens: ItemAcerto[];
  saldoAcumulado: SaldoAcerto;
}

// Espelha AritmeticaAcertoResponse: subtotais calculados no dominio (o front nao recalcula)
export interface AritmeticaAcerto {
  subtotalClauciaDeve: number;
  subtotalSilvioDeve: number;
  // Diferenca absoluta entre os subtotais; quem deve e Acerto.quemDeve
  diferenca: number;
}

// Espelha AcertoResponse
export interface Acerto {
  quemDeve: Titular | null;
  valor: number;
  itens: ItemAcerto[];
  // Lancamentos que nao geraram divida (preenchido no acerto do mes; vazio no acerto final)
  lancamentosSemEfeito: LancamentoSemEfeito[];
  aritmetica: AritmeticaAcerto;
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

// Espelha CategorizarTransacaoCommandResult
export interface CategorizarTransacaoResultado {
  id: string;
  categoria: CategoriaGasto;
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

// Espelha PendenciaCartaoResponse: pendências de um cartão (só os que têm alguma)
export interface PendenciaCartao {
  titular: Titular;
  quantidade: number;
  total: number;
}

// Espelha AlertaTransacoesNaoDefinidasResponse
export interface AlertaTransacoesNaoDefinidas {
  quantidade: number;
  total: number;
  porCartao: PendenciaCartao[];
}

// Espelha ItemFaturaResponse: uma transação da fatura de quem pagou, com a origem que
// explica por que entra na conta
export interface ItemFatura {
  descricao: string;
  valor: number;
  origem: OrigemItemFatura;
}

// Espelha BoletoPagoResponse
export interface BoletoPago {
  descricao: string;
  valor: number;
}

// Espelha BlocoPaganteResponse: o que um titular pagou no mês (prestação de contas)
export interface BlocoPagante {
  pagante: Titular;
  itensFatura: ItemFatura[];
  faturaTotal: number;
  boletosPagos: BoletoPago[];
  totalDesembolsado: number;
  // "Deste total": compartilhado, pessoal de quem pagou e pessoal do outro; e a metade do
  // compartilhado que cabe a cada um
  compartilhado: number;
  // Só o compartilhado da fatura do cartão (sem boletos): as origens da fatura somam o total
  compartilhadoNoCartao: number;
  pessoalProprio: number;
  pessoalDoOutro: number;
  // Itens ainda sem classificação: entram no total da fatura, mas não no acerto
  semCategoria: number;
  metadeDoCompartilhado: number;
}

// Espelha ItemContaResponse: um item de uma linha da seção "Acerto", com a fonte de onde veio
export interface ItemConta {
  descricao: string;
  valor: number;
  fonte: FonteItemConta;
}

// Espelha LinhaContaResponse: uma linha expansível da seção "Acerto"
export interface LinhaConta {
  valor: number;
  itens: ItemConta[];
}

// Espelha DivisaoCompartilhadoResponse: tudo que é 50/50 no mês e quem deve por isso
export interface DivisaoCompartilhado {
  pagoPorSilvio: number;
  pagoPorClaucia: number;
  total: number;
  metadePorPessoa: number;
  saldo: SaldoAcerto;
}

// Espelha ProvaRealResponse: a conta alternativa (deveria arcar - pagou) do titular que deve
export interface ProvaReal {
  titular: Titular;
  deveriaArcar: number;
  pagou: number;
  divida: number;
  confere: boolean;
}

// Espelha AcertoConsolidadoResponse: os passos 2 a 4 do resumo (sem pagamentos)
export interface AcertoConsolidado {
  metadeDoQueClauciaPagou: LinhaConta; // o que o Silvio deve à Claucia
  metadeDoQueSilvioPagou: LinhaConta; // o que a Claucia deve ao Silvio
  saldoCompartilhado: number; // positivo: o Silvio deve; negativo: a Claucia deve
  divisao: DivisaoCompartilhado;
  silvioNoCartaoDela: LinhaConta;
  clauciaNoCartaoDele: LinhaConta;
  saldoPessoal: SaldoAcerto;
  subtotalDoMes: SaldoAcerto;
  acordosFixos: LinhaConta;
  total: SaldoAcerto;
  provaReal: ProvaReal;
}

// Espelha AcertoFinalMesResponse (GET /faturas/{mes}/acerto-final)
export interface AcertoFinalMes {
  acerto: Acerto;
  acertoFinal: Acerto;
  // Acerto do mes -> acordos fixos -> pagamentos; a ultima coincide com acertoFinal
  etapas: EtapaAcertoFinal[];
  transacoesNaoDefinidas: AlertaTransacoesNaoDefinidas;
  prestacaoDeContas: BlocoPagante[];
  acertoConsolidado: AcertoConsolidado;
}
