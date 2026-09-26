// GERADO AUTOMATICAMENTE por scripts/gerar-enums-front.mjs (repo Controle-de-Faturas).
// Não edite à mão — rode o script de novo depois de mudar um enum em
// src/domain/Enums/*.cs. A ordem numérica aqui precisa bater com o enum C#
// real porque a API não serializa enum como string (decisão do usuário).
// Ver types/fatura.ts para os tipos de Response que usam estes enums.

export const Titular = {
  Silvio: 0,
  Claucia: 1,
} as const;
export type Titular = (typeof Titular)[keyof typeof Titular];

export const Titular_NOME: Record<Titular, string> = {
  [Titular.Silvio]: 'Silvio',
  [Titular.Claucia]: 'Claucia',
};

export const QuemResponsavel = {
  Silvio: 0,
  Claucia: 1,
  Compartilhado: 2,
  NaoDefinido: 3,
} as const;
export type QuemResponsavel = (typeof QuemResponsavel)[keyof typeof QuemResponsavel];

export const QuemResponsavel_NOME: Record<QuemResponsavel, string> = {
  [QuemResponsavel.Silvio]: 'Silvio',
  [QuemResponsavel.Claucia]: 'Claucia',
  [QuemResponsavel.Compartilhado]: 'Compartilhado',
  [QuemResponsavel.NaoDefinido]: 'NaoDefinido',
};

export const QuemBoleto = {
  Silvio: 0,
  Claucia: 1,
  Compartilhado: 2,
  Fixo: 3,
} as const;
export type QuemBoleto = (typeof QuemBoleto)[keyof typeof QuemBoleto];

export const QuemBoleto_NOME: Record<QuemBoleto, string> = {
  [QuemBoleto.Silvio]: 'Silvio',
  [QuemBoleto.Claucia]: 'Claucia',
  [QuemBoleto.Compartilhado]: 'Compartilhado',
  [QuemBoleto.Fixo]: 'Fixo',
};
