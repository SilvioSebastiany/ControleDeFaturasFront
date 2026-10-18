import type { ProvaReal } from '../../types/fatura.ts';
import { LinhaDaConta } from './LinhaDaConta.tsx';
import { Passo } from './Passo.tsx';
import { ROTULO_TITULAR } from './rotulos.ts';

// Mesma conta do passo 4 por outro caminho: quanto o titular deveria arcar menos o que ele
// pagou. Fechada quando bate; aberta, com aviso, quando as duas contas divergem.
export function ProvaRealDoAcerto({ prova }: { prova: ProvaReal }) {
  const nome = ROTULO_TITULAR[prova.titular];

  return (
    <Passo
      numero="✓"
      titulo="Prova real"
      subtitulo="O mesmo resultado do passo 4 por outro caminho, para ninguém precisar confiar só na primeira conta."
    >
      <details open={!prova.confere} className="prova-real">
        <summary>Ver a conta alternativa</summary>
        <div className="conta">
          <LinhaDaConta rotulo={`${nome} deveria arcar (metade do compartilhado + gastos dele)`} valor={prova.deveriaArcar} />
          <LinhaDaConta rotulo={`${nome} pagou nos lançamentos que entram na conta`} valor={prova.pagou} sinal="−" />
          <LinhaDaConta rotulo={`${nome} deve no mês`} valor={prova.divida} sinal="=" total />
        </div>
      </details>
      {prova.confere ? (
        <p className="fatura-confere">✓ Bate com o passo 4.</p>
      ) : (
        <p className="fatura-confere atencao">⚠ Não bate com o passo 4. Há algo na conta que precisa ser conferido.</p>
      )}
    </Passo>
  );
}
