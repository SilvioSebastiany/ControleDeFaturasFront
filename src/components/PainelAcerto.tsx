import type { Titular } from '../types/fatura.ts';
import type { AcertoFinalMes } from '../types/fatura.ts';
import { AlertaSemCategoria } from './acerto/AlertaSemCategoria.tsx';
import { CartaoAcerto } from './acerto/CartaoAcerto.tsx';
import { SecaoSemEfeito } from './acerto/SecaoSemEfeito.tsx';

// Painel de acerto do mês (substitui parte de js/totals.js#renderTotals) —
// mostra o alerta de lançamentos sem categoria, o acerto normal, o acerto final
// (com acordos fixos e pagamentos, T13) e os lançamentos sem efeito. As partes
// vivem em components/acerto/; aqui só se compõe a tela.
export function PainelAcerto({
  acertoFinalMes,
  onIrParaCartao,
}: {
  acertoFinalMes: AcertoFinalMes;
  onIrParaCartao?: (titular: Titular) => void;
}) {
  const { acerto, acertoFinal, etapas, transacoesNaoDefinidas } = acertoFinalMes;

  return (
    <section className="painel-acerto">
      <AlertaSemCategoria alerta={transacoesNaoDefinidas} onIrParaCartao={onIrParaCartao} />
      <CartaoAcerto titulo="Acerto do mês" acerto={acerto} idAritmetica="aritmetica-acerto-mes" />
      <CartaoAcerto
        titulo="Acerto final (com acordos e pagamentos)"
        destaque
        acerto={acertoFinal}
        etapas={etapas}
        abertoPorPadrao
        idAritmetica="aritmetica-acerto-final"
      />
      <SecaoSemEfeito lancamentos={acerto.lancamentosSemEfeito} />
    </section>
  );
}
