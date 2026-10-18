import { useState } from 'react';
import type { Acerto, AcertoConsolidado } from '../../types/fatura.ts';
import { AritmeticaDoAcerto } from './AritmeticaDoAcerto.tsx';
import { LinhaDaConta } from './LinhaDaConta.tsx';
import { ListaDeItens } from './ListaDeItens.tsx';
import { Passo } from './Passo.tsx';
import { ROTULO_TITULAR } from './rotulos.ts';
import { sinalEntre } from './texto.ts';

// Passo 4: compartilhado (passo 2) + pessoal cruzado (passo 3) = acerto do mês. Embaixo ficam a
// aritmética por titular e a regra aplicada a cada lançamento.
export function PassoAcertoDoMes({ acerto, consolidado }: { acerto: Acerto; consolidado: AcertoConsolidado }) {
  const [aberta, setAberta] = useState(false);
  const compartilhado = consolidado.divisao.saldo;
  const pessoal = consolidado.saldoPessoal;
  const subtotal = consolidado.subtotalDoMes;

  return (
    <Passo
      numero={4}
      titulo="Acerto do mês"
      subtitulo="Compartilhado mais pessoal cruzado."
      vemDe="Vem dos passos 2 e 3."
    >
      <div className="conta">
        <LinhaDaConta
          rotulo={compartilhado.quemDeve === null ? 'Quites no compartilhado' : `${ROTULO_TITULAR[compartilhado.quemDeve]} deve do compartilhado`}
          valor={compartilhado.valor}
        />
        <LinhaDaConta
          rotulo={pessoal.quemDeve === null ? 'Quites no pessoal' : `${ROTULO_TITULAR[pessoal.quemDeve]} deve do pessoal`}
          valor={pessoal.valor}
          sinal={sinalEntre(compartilhado, pessoal)}
        />
        <LinhaDaConta
          rotulo={subtotal.quemDeve === null ? 'Estão quites no mês' : `${ROTULO_TITULAR[subtotal.quemDeve]} deve no mês`}
          valor={subtotal.valor}
          sinal="="
          total
        />
      </div>
      <AritmeticaDoAcerto acerto={acerto} testId="aritmetica-acerto-mes" />
      {acerto.itens.length > 0 && (
        <>
          <button type="button" className="passo-toggle" aria-expanded={aberta} onClick={() => setAberta((a) => !a)}>
            {aberta ? 'Esconder' : 'Ver'} a regra aplicada a cada lançamento
          </button>
          {aberta && <ListaDeItens itens={acerto.itens} />}
        </>
      )}
    </Passo>
  );
}
