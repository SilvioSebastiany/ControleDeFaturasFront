// Os enums (Titular, QuemResponsavel, QuemBoleto) vêm de fatura.generated.ts,
// gerado a partir dos enums C# reais (scripts/gerar-enums-front.mjs, repo
// Controle-de-Faturas) — não editar a mão. A API não tem
// JsonStringEnumConverter configurado (decisão do usuário: não mexer no
// backend por causa do front), então enums trafegam como número no corpo
// JSON, na ordem declarada nos enums C#. Ver o cabeçalho de
// fatura.generated.ts para os detalhes.
export { Titular, QuemResponsavel, QuemBoleto } from './fatura.generated.ts';
import { Titular, Titular_NOME } from './fatura.generated.ts';
import type { QuemResponsavel, QuemBoleto } from './fatura.generated.ts';

// Usado no segmento de rota (POST /faturas/{mes}/upload/{titular}) — o model
// binder padrão do ASP.NET Core para parâmetro de rota aceita o NOME do enum
// (case-insensitive), diferente do body, que só entende número sem
// JsonStringEnumConverter. Mesmo valor de Titular_NOME (gerado), com um nome
// que deixa esse uso específico claro no call site.
export const TITULAR_NOME_ROTA: Record<Titular, string> = Titular_NOME;

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
