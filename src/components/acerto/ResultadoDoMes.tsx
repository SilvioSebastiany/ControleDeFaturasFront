import { EtapaAcerto, Titular } from '../../types/fatura.ts';
import type { AcertoFinalMes } from '../../types/fatura.ts';
import { ROTULO_ETAPA, ROTULO_TITULAR } from './rotulos.ts';
import { descreverSaldo, formatarValorAbsoluto, outroTitular } from './texto.ts';

// "Silvio paga R$ 615,65 para a Claucia", ou "Estão quites".
function descreverResultado(final: AcertoFinalMes['acertoFinal']): string {
  if (final.quemDeve === null) return 'Estão quites';
  const recebe = outroTitular(final.quemDeve);
  const artigo = recebe === Titular.Claucia ? 'a' : 'o';
  return `${ROTULO_TITULAR[final.quemDeve]} paga ${formatarValorAbsoluto(final.valor)} para ${artigo} ${ROTULO_TITULAR[recebe]}`;
}

function descreverSelo(acerto: AcertoFinalMes): { texto: string; atencao: boolean } {
  const pendentes = acerto.transacoesNaoDefinidas.quantidade;
  if (pendentes > 0) {
    return {
      texto:
        pendentes === 1
          ? 'Resultado parcial: 1 lançamento sem categoria não entra na conta'
          : `Resultado parcial: ${pendentes} lançamentos sem categoria não entram na conta`,
      atencao: true,
    };
  }
  if (!acerto.acertoConsolidado.provaReal.confere) {
    return { texto: 'As duas contas não batem: veja a prova real abaixo', atencao: true };
  }
  return { texto: 'Conta conferida por dois caminhos', atencao: false };
}

// Resultado no topo do Resumo: o valor final, um selo de conferência e o caminho em três
// linhas (acerto do mês, com acordos fixos, com pagamentos). Os saldos vêm prontos da API.
export function ResultadoDoMes({ acerto }: { acerto: AcertoFinalMes }) {
  const { texto, atencao } = descreverSelo(acerto);

  return (
    <section className="resultado" aria-label="Resultado do mês">
      <span className={`resultado-selo${atencao ? ' atencao' : ''}`}>
        {atencao ? '⚠ ' : '✓ '}
        {texto}
      </span>
      <p className="resultado-frase" data-testid="resultado-frase">
        {descreverResultado(acerto.acertoFinal)}
      </p>
      <ul className="resultado-caminho">
        {acerto.etapas.map((e) => (
          <li key={e.etapa}>
            <span>
              {e.etapa === EtapaAcerto.AcertoDoMes ? ROTULO_ETAPA[e.etapa] : `Com ${ROTULO_ETAPA[e.etapa].toLowerCase()}`}
            </span>
            <span>{descreverSaldo(e.saldoAcumulado)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
