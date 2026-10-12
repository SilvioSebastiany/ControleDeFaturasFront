// Uma linha "descrição ... frase", igual para itens, etapas e lançamentos sem efeito.
export function LinhaDeItem({ descricao, texto }: { descricao: string; texto: string }) {
  return (
    <li>
      <span className="acerto-item-descricao">{descricao}</span>
      <span className="acerto-item-valor">{texto}</span>
    </li>
  );
}
