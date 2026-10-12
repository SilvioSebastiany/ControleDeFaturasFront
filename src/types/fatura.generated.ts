// GERADO AUTOMATICAMENTE por scripts/gerar-enums-front.mjs (repo Controle-de-Faturas).
// Não edite à mão — rode o script de novo depois de mudar um enum em
// src/domain/Enums/*.cs. A API serializa enum como string
// (JsonStringEnumConverter, Program.cs) — os valores aqui precisam bater
// com os nomes dos membros do enum C# real. Ver types/fatura.ts para os
// tipos de Response que usam estes enums.

// Titular: os valores válidos que a API pode enviar/aceitar neste enum.
export type Titular = 'Silvio' | 'Claucia';

// Para usar como valor (ex.: Titular.Silvio) em vez de string crua — mesmo
// resultado, só evita erro de digitação no call site.
export const Titular = {
  Silvio: 'Silvio',
  Claucia: 'Claucia',
} as const satisfies Record<string, Titular>;

export const Titular_VALORES: readonly Titular[] = ['Silvio', 'Claucia'];

// QuemResponsavel: os valores válidos que a API pode enviar/aceitar neste enum.
export type QuemResponsavel = 'Silvio' | 'Claucia' | 'Compartilhado' | 'NaoDefinido';

// Para usar como valor (ex.: Titular.Silvio) em vez de string crua — mesmo
// resultado, só evita erro de digitação no call site.
export const QuemResponsavel = {
  Silvio: 'Silvio',
  Claucia: 'Claucia',
  Compartilhado: 'Compartilhado',
  NaoDefinido: 'NaoDefinido',
} as const satisfies Record<string, QuemResponsavel>;

export const QuemResponsavel_VALORES: readonly QuemResponsavel[] = ['Silvio', 'Claucia', 'Compartilhado', 'NaoDefinido'];

// QuemBoleto: os valores válidos que a API pode enviar/aceitar neste enum.
export type QuemBoleto = 'Silvio' | 'Claucia' | 'Compartilhado' | 'Fixo';

// Para usar como valor (ex.: Titular.Silvio) em vez de string crua — mesmo
// resultado, só evita erro de digitação no call site.
export const QuemBoleto = {
  Silvio: 'Silvio',
  Claucia: 'Claucia',
  Compartilhado: 'Compartilhado',
  Fixo: 'Fixo',
} as const satisfies Record<string, QuemBoleto>;

export const QuemBoleto_VALORES: readonly QuemBoleto[] = ['Silvio', 'Claucia', 'Compartilhado', 'Fixo'];

// RegraAplicada: os valores válidos que a API pode enviar/aceitar neste enum.
export type RegraAplicada = 'MeioAMeio' | 'ValorFixo' | 'PessoalDoOutro' | 'AcordoFixo' | 'Pagamento';

// Para usar como valor (ex.: Titular.Silvio) em vez de string crua — mesmo
// resultado, só evita erro de digitação no call site.
export const RegraAplicada = {
  MeioAMeio: 'MeioAMeio',
  ValorFixo: 'ValorFixo',
  PessoalDoOutro: 'PessoalDoOutro',
  AcordoFixo: 'AcordoFixo',
  Pagamento: 'Pagamento',
} as const satisfies Record<string, RegraAplicada>;

export const RegraAplicada_VALORES: readonly RegraAplicada[] = ['MeioAMeio', 'ValorFixo', 'PessoalDoOutro', 'AcordoFixo', 'Pagamento'];

// MotivoSemEfeito: os valores válidos que a API pode enviar/aceitar neste enum.
export type MotivoSemEfeito = 'PessoalDeQuemPagou' | 'ValorZero';

// Para usar como valor (ex.: Titular.Silvio) em vez de string crua — mesmo
// resultado, só evita erro de digitação no call site.
export const MotivoSemEfeito = {
  PessoalDeQuemPagou: 'PessoalDeQuemPagou',
  ValorZero: 'ValorZero',
} as const satisfies Record<string, MotivoSemEfeito>;

export const MotivoSemEfeito_VALORES: readonly MotivoSemEfeito[] = ['PessoalDeQuemPagou', 'ValorZero'];

// EtapaAcerto: os valores válidos que a API pode enviar/aceitar neste enum.
export type EtapaAcerto = 'AcertoDoMes' | 'AcordosFixos' | 'Pagamentos';

// Para usar como valor (ex.: Titular.Silvio) em vez de string crua — mesmo
// resultado, só evita erro de digitação no call site.
export const EtapaAcerto = {
  AcertoDoMes: 'AcertoDoMes',
  AcordosFixos: 'AcordosFixos',
  Pagamentos: 'Pagamentos',
} as const satisfies Record<string, EtapaAcerto>;

export const EtapaAcerto_VALORES: readonly EtapaAcerto[] = ['AcertoDoMes', 'AcordosFixos', 'Pagamentos'];
