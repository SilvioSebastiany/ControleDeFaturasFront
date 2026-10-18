import type { AcertoFinalMes } from '../../types/fatura.ts';
import { EtapaAcerto } from '../../types/fatura.ts';
import { AritmeticaDoAcerto } from './AritmeticaDoAcerto.tsx';
import { EtapaDoAcerto } from './EtapaDoAcerto.tsx';
import { Passo } from './Passo.tsx';
import { descreverSaldo } from './texto.ts';

// Passo 5: o que se repete todo mês (acordos fixos) e o que já foi transferido (pagamentos).
// Parte do acerto do mês e termina no resultado, que é o do topo.
export function PassoAcordosEPagamentos({ acertoFinalMes }: { acertoFinalMes: AcertoFinalMes }) {
  const { etapas, acertoFinal } = acertoFinalMes;
  const doMes = etapas.find((e) => e.etapa === EtapaAcerto.AcertoDoMes);
  const seguintes = etapas.filter((e) => e.etapa !== EtapaAcerto.AcertoDoMes);

  return (
    <Passo
      numero={5}
      titulo="Acordos fixos e pagamentos"
      subtitulo="O que se repete todo mês e o que já foi transferido."
      vemDe="Vem do passo 4."
    >
      {doMes && <p className="acerto-etapa-saldo">Ponto de partida (passo 4): {descreverSaldo(doMes.saldoAcumulado)}</p>}
      <div className="acerto-etapas">
        {seguintes.map((etapa, i) => (
          <EtapaDoAcerto
            key={etapa.etapa}
            etapa={etapa}
            anterior={i === 0 ? (doMes?.saldoAcumulado ?? null) : seguintes[i - 1].saldoAcumulado}
          />
        ))}
      </div>
      <AritmeticaDoAcerto acerto={acertoFinal} testId="aritmetica-acerto-final" />
    </Passo>
  );
}
