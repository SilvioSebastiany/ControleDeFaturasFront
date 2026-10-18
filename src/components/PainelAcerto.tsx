import type { AcertoFinalMes, Titular } from '../types/fatura.ts';
import { AlertaSemCategoria } from './acerto/AlertaSemCategoria.tsx';
import { PassoAcertoDoMes } from './acerto/PassoAcertoDoMes.tsx';
import { PassoAcordosEPagamentos } from './acerto/PassoAcordosEPagamentos.tsx';
import { PassoDivisao } from './acerto/PassoDivisao.tsx';
import { PassoFaturas } from './acerto/PassoFaturas.tsx';
import { PassoPessoalCruzado } from './acerto/PassoPessoalCruzado.tsx';
import { ProvaRealDoAcerto } from './acerto/ProvaRealDoAcerto.tsx';
import { ResultadoDoMes } from './acerto/ResultadoDoMes.tsx';
import { SecaoSemEfeito } from './acerto/SecaoSemEfeito.tsx';

// Resumo do mês como uma conta só: o resultado no topo e, abaixo, os passos que levam a ele
// (faturas, divisão do compartilhado, pessoal cruzado, acerto do mês, acordos e pagamentos),
// a prova real e os lançamentos que não mudam o acerto. As partes vivem em components/acerto/;
// aqui só se compõe a tela. Todos os valores vêm da API.
export function PainelAcerto({
  acertoFinalMes,
  onIrParaCartao,
}: {
  acertoFinalMes: AcertoFinalMes;
  onIrParaCartao?: (titular: Titular) => void;
}) {
  const { acerto, transacoesNaoDefinidas, prestacaoDeContas, acertoConsolidado } = acertoFinalMes;
  const semLancamentos = prestacaoDeContas.every((b) => b.itensFatura.length === 0 && b.boletosPagos.length === 0);

  return (
    <section className="painel-acerto">
      <AlertaSemCategoria alerta={transacoesNaoDefinidas} onIrParaCartao={onIrParaCartao} />
      {semLancamentos ? (
        <p className="config-vazio">Nenhum lançamento neste mês. Importe a fatura de cada cartão para ver a conta.</p>
      ) : (
        <>
          <ResultadoDoMes acerto={acertoFinalMes} />
          <PassoFaturas blocos={prestacaoDeContas} />
          <PassoDivisao acerto={acertoConsolidado} />
          <PassoPessoalCruzado acerto={acertoConsolidado} />
          <PassoAcertoDoMes acerto={acerto} consolidado={acertoConsolidado} />
          <PassoAcordosEPagamentos acertoFinalMes={acertoFinalMes} />
          <ProvaRealDoAcerto prova={acertoConsolidado.provaReal} />
          <SecaoSemEfeito lancamentos={acerto.lancamentosSemEfeito} />
        </>
      )}
    </section>
  );
}
