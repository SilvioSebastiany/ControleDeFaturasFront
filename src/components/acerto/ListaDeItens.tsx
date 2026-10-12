import type { ItemAcerto } from '../../types/fatura.ts';
import { LinhaDeItem } from './LinhaDeItem.tsx';
import { descreverItem } from './texto.ts';

export function ListaDeItens({ itens }: { itens: ItemAcerto[] }) {
  return (
    <ul className="acerto-itens">
      {itens.map((item, i) => (
        <LinhaDeItem key={i} descricao={item.descricao} texto={descreverItem(item)} />
      ))}
    </ul>
  );
}
