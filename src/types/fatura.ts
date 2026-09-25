// Espelha os enums do backend (ControleDeFaturas.Domain.Enums). A API NÃO tem
// JsonStringEnumConverter configurado (decisão do usuário: não mexer no
// backend por causa do front) — enums trafegam como número, na ordem
// declarada nos enums C#. A ordem aqui precisa ficar em sincronia manual com
// o backend; se o enum lá mudar de ordem, isto quebra silenciosamente.

// ETitular (src/domain/Enums/ETitular.cs). Usado tanto em corpo JSON (número)
// quanto em segmento de rota (POST /faturas/{mes}/upload/{titular}) — o model
// binder padrão do ASP.NET Core para parâmetro de rota aceita o NOME do enum
// (case-insensitive), diferente do body, que só entende número sem
// JsonStringEnumConverter. TITULAR_NOME_ROTA cobre esse segundo caso.
export const Titular = {
  Silvio: 0,
  Claucia: 1,
} as const;
export type Titular = (typeof Titular)[keyof typeof Titular];

export const TITULAR_NOME_ROTA: Record<Titular, string> = {
  [Titular.Silvio]: 'Silvio',
  [Titular.Claucia]: 'Claucia',
};

// EQuemResponsavel (src/domain/Enums/EQuemResponsavel.cs)
export const QuemResponsavel = {
  Silvio: 0,
  Claucia: 1,
  Compartilhado: 2,
  NaoDefinido: 3,
} as const;
export type QuemResponsavel = (typeof QuemResponsavel)[keyof typeof QuemResponsavel];

// EQuemBoleto (src/domain/Enums/EQuemBoleto.cs)
export const QuemBoleto = {
  Silvio: 0,
  Claucia: 1,
  Compartilhado: 2,
  Fixo: 3,
} as const;
export type QuemBoleto = (typeof QuemBoleto)[keyof typeof QuemBoleto];

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
