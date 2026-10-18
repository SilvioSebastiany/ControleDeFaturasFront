import { useState } from 'react';
import type { LancamentoSemEfeito } from '../../types/fatura.ts';
import { LinhaDeItem } from './LinhaDeItem.tsx';
import { descreverSemEfeito } from './texto.ts';

// Seção discreta, separada da lista principal: lançamentos que não geraram dívida.
// Vem recolhida; o botão mostra quantos são e abre a lista.
export function SecaoSemEfeito({ lancamentos }: { lancamentos: LancamentoSemEfeito[] }) {
  const [aberta, setAberta] = useState(false);
  if (lancamentos.length === 0) return null;

  const quantidade = `${lancamentos.length} lançamento${lancamentos.length > 1 ? 's' : ''}`;

  return (
    <section className="sem-efeito" aria-label="Lançamentos sem efeito">
      <h4 className="sem-efeito-titulo">Lançamentos sem efeito</h4>
      <button type="button" className="passo-toggle" aria-expanded={aberta} onClick={() => setAberta((a) => !a)}>
        {aberta ? 'Esconder' : 'Ver'} {quantidade} que não mudam o acerto
      </button>
      {aberta && (
        <ul className="sem-efeito-lista">
          {lancamentos.map((l, i) => (
            <LinhaDeItem key={i} descricao={l.descricao} texto={descreverSemEfeito(l)} />
          ))}
        </ul>
      )}
    </section>
  );
}
