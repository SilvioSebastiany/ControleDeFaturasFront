import type { AcertoConsolidado } from '../../types/fatura.ts';
import { LinhaDaConta } from './LinhaDaConta.tsx';
import { LinhaExpansivel } from './LinhaExpansivel.tsx';
import { Passo } from './Passo.tsx';
import { ROTULO_TITULAR } from './rotulos.ts';
import { temValor } from './texto.ts';

// Passo 3: quem pagou algo pessoal do outro tem a receber o valor inteiro. Pessoal no próprio
// cartão não gera dívida.
export function PassoPessoalCruzado({ acerto }: { acerto: AcertoConsolidado }) {
  const temCruzado = temValor(acerto.silvioNoCartaoDela.valor) || temValor(acerto.clauciaNoCartaoDele.valor);
  const saldo = acerto.saldoPessoal;

  return (
    <Passo
      numero={3}
      titulo="Gastos pessoais no cartão do outro"
      subtitulo="Quem pagou algo pessoal do outro tem a receber o valor inteiro. Pessoal no próprio cartão não entra."
      vemDe="Vem do passo 1: as linhas pessoal do outro de cada fatura."
    >
      {temCruzado ? (
        <div className="consolidado-corpo">
          <LinhaExpansivel
            rotulo="Silvio deve · gastos dele no cartão da Claucia"
            linha={acerto.silvioNoCartaoDela}
            sufixoFonte=" · 100% Silvio"
          />
          <LinhaExpansivel
            rotulo="Claucia deve · gastos dela no cartão do Silvio"
            linha={acerto.clauciaNoCartaoDele}
            sufixoFonte=" · 100% Claucia"
            credito
          />
          <LinhaDaConta
            rotulo={saldo.quemDeve === null ? 'Estão quites no pessoal' : `${ROTULO_TITULAR[saldo.quemDeve]} deve do pessoal`}
            valor={saldo.valor}
            sinal="="
            total
          />
        </div>
      ) : (
        <p className="passo-nota">Nenhum gasto pessoal foi pago no cartão do outro neste mês.</p>
      )}
    </Passo>
  );
}
