import { useRef, useState } from 'react';
import { uploadFatura } from '../api/faturas.ts';
import { ApiError } from '../api/http.ts';
import { Titular } from '../types/fatura.ts';
import type { Titular as TitularType } from '../types/fatura.ts';

interface UploadFaturaProps {
  mes: string;
  onImportado: () => void;
}

// Um botão de upload por titular (substitui o par de cards silvio/claucia do
// legado, js/renderer.js) — o parsing do PDF agora é feito no backend (T7),
// então o front só envia o arquivo.
export function UploadFatura({ mes, onImportado }: UploadFaturaProps) {
  return (
    <section className="upload-fatura">
      <UploadPorTitular titular={Titular.Silvio} rotulo="Silvio" mes={mes} onImportado={onImportado} />
      <UploadPorTitular titular={Titular.Claucia} rotulo="Claucia" mes={mes} onImportado={onImportado} />
    </section>
  );
}

function UploadPorTitular({
  titular,
  rotulo,
  mes,
  onImportado,
}: {
  titular: TitularType;
  rotulo: string;
  mes: string;
  onImportado: () => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleArquivoSelecionado(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!arquivo) return;

    setEnviando(true);
    setErro(null);
    setMensagem(null);
    try {
      const resultado = await uploadFatura(mes, titular, arquivo);
      setMensagem(`${resultado.quantidadeTransacoesImportadas} lançamento(s) importado(s).`);
      onImportado();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Falha ao enviar o PDF.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="upload-titular">
      <h3>{rotulo}</h3>
      <button type="button" disabled={enviando} onClick={() => inputRef.current?.click()}>
        {enviando ? 'Enviando...' : 'Enviar fatura (PDF)'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        hidden
        onChange={handleArquivoSelecionado}
      />
      {mensagem && <p className="upload-sucesso">{mensagem}</p>}
      {erro && <p className="upload-erro">{erro}</p>}
    </div>
  );
}
