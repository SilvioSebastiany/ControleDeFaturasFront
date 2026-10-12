import { EtapaAcerto } from '../../types/fatura.ts';
import type { EtapaAcertoFinal, SaldoAcerto } from '../../types/fatura.ts';
import { ListaDeItens } from './ListaDeItens.tsx';
import { ROTULO_ETAPA, ROTULO_TITULAR } from './rotulos.ts';
import { descreverSaldo } from './texto.ts';

// Etapa do acerto final: itens que ela acrescenta e saldo acumulado depois dela.
// Na etapa de Pagamentos, se o saldo muda de devedor (pagamento maior que a divida), explica a inversao.
export function EtapaDoAcerto({
  etapa,
  anterior,
}: {
  etapa: EtapaAcertoFinal;
  anterior: SaldoAcerto | null;
}) {
  const { saldoAcumulado } = etapa;
  const inverteu =
    etapa.etapa === EtapaAcerto.Pagamentos &&
    anterior?.quemDeve != null &&
    saldoAcumulado.quemDeve !== null &&
    anterior.quemDeve !== saldoAcumulado.quemDeve;

  return (
    <section className="acerto-etapa" aria-label={ROTULO_ETAPA[etapa.etapa]}>
      <h4 className="acerto-etapa-titulo">{ROTULO_ETAPA[etapa.etapa]}</h4>
      {etapa.itens.length > 0 && <ListaDeItens itens={etapa.itens} />}
      <p className="acerto-etapa-saldo">Saldo acumulado: {descreverSaldo(saldoAcumulado)}</p>
      {inverteu && (
        <p className="acerto-etapa-inversao">
          Pagamento maior que a dívida: agora {ROTULO_TITULAR[saldoAcumulado.quemDeve!]} deve.
        </p>
      )}
    </section>
  );
}
