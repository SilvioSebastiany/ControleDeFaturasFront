import type { LancamentoSemEfeito } from '../../types/fatura.ts';
import { LinhaDeItem } from './LinhaDeItem.tsx';
import { descreverSemEfeito } from './texto.ts';

// Seção discreta, separada da lista principal: lançamentos que não geraram dívida.
export function SecaoSemEfeito({ lancamentos }: { lancamentos: LancamentoSemEfeito[] }) {
  if (lancamentos.length === 0) return null;
  return (
    <section className="sem-efeito" aria-label="Lançamentos sem efeito">
      <h4 className="sem-efeito-titulo">Lançamentos sem efeito</h4>
      <ul className="sem-efeito-lista">
        {lancamentos.map((l, i) => (
          <LinhaDeItem key={i} descricao={l.descricao} texto={descreverSemEfeito(l)} />
        ))}
      </ul>
    </section>
  );
}
