import { EtapaAcerto, MotivoSemEfeito, RegraAplicada, Titular } from '../../types/fatura.ts';

// Textos do painel de acerto num lugar só: os componentes não repetem rótulos.

export const ROTULO_TITULAR: Record<Titular, string> = {
  [Titular.Silvio]: 'Silvio',
  [Titular.Claucia]: 'Claucia',
};

export const PAGO_POR: Record<Titular, string> = {
  [Titular.Silvio]: 'pelo Silvio',
  [Titular.Claucia]: 'pela Claucia',
};

export const ROTULO_REGRA: Record<RegraAplicada, string> = {
  [RegraAplicada.MeioAMeio]: '50/50',
  [RegraAplicada.ValorFixo]: 'valor fixo',
  [RegraAplicada.PessoalDoOutro]: 'pessoal do outro',
  [RegraAplicada.AcordoFixo]: 'acordo fixo',
  [RegraAplicada.Pagamento]: 'pagamento',
};

export const ROTULO_ETAPA: Record<EtapaAcerto, string> = {
  [EtapaAcerto.AcertoDoMes]: 'Acerto do mês',
  [EtapaAcerto.AcordosFixos]: 'Acordos fixos',
  [EtapaAcerto.Pagamentos]: 'Pagamentos',
};

export const ROTULO_MOTIVO: Record<MotivoSemEfeito, string> = {
  [MotivoSemEfeito.PessoalDeQuemPagou]: 'gasto pessoal de quem pagou',
  [MotivoSemEfeito.ValorZero]: 'valor zero',
};
