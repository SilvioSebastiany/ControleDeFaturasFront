const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function rotuloMes(chave: string): string {
  const [ano, mes] = chave.split('-');
  const indice = Number(mes) - 1;
  if (!ano || Number.isNaN(indice) || !NOMES_MESES[indice]) return chave;
  return `${NOMES_MESES[indice]} ${ano}`;
}

interface PillsMesesProps {
  meses: string[];
  mesAtivo: string;
  onSelecionar: (mes: string) => void;
  onRemover: (mes: string) => void;
}

// Navegação por mês (porta de renderMonthPills, js/renderer.js) — lista
// decrescente das chaves de mês já existentes; o mês corrente escolhido no
// seletor aparece mesmo sem dados ainda (criado implicitamente no upload).
export function PillsMeses({ meses, mesAtivo, onSelecionar, onRemover }: PillsMesesProps) {
  const chaves = new Set(meses);
  chaves.add(mesAtivo);
  const ordenadas = [...chaves].sort().reverse();

  return (
    <div className="pills-meses">
      {ordenadas.map((chave) => (
        <span key={chave} className={`month-pill${chave === mesAtivo ? ' active' : ''}`}>
          <button type="button" className="pill-label" onClick={() => onSelecionar(chave)}>
            {rotuloMes(chave)}
          </button>
          {meses.includes(chave) && (
            <button
              type="button"
              className="pill-del"
              title="Remover mês"
              onClick={() => onRemover(chave)}
            >
              ×
            </button>
          )}
        </span>
      ))}
    </div>
  );
}
