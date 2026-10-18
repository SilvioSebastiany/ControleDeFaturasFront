import type { ReactNode } from 'react';

// Um passo numerado da conta do mês: título, de onde vem o valor e o corpo.
export function Passo({
  numero,
  titulo,
  subtitulo,
  vemDe,
  children,
}: {
  // Número do passo, ou "✓" numa conferência que não é um passo da conta.
  numero: number | '✓';
  titulo: string;
  subtitulo: string;
  vemDe?: string;
  children: ReactNode;
}) {
  return (
    <section className="passo" aria-label={typeof numero === 'number' ? `Passo ${numero}: ${titulo}` : titulo}>
      <header className="passo-cabecalho">
        <span className="passo-numero" aria-hidden="true">
          {numero}
        </span>
        <div>
          <h3 className="passo-titulo">{titulo}</h3>
          <p className="passo-subtitulo">{subtitulo}</p>
        </div>
      </header>
      {vemDe && <p className="passo-vem">{vemDe}</p>}
      {children}
    </section>
  );
}
