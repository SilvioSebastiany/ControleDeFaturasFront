import type { APIRequestContext } from '@playwright/test';
import { StandardFonts, PDFDocument } from 'pdf-lib';
import type { AcordoFixo, DetalheMes, Transacao } from '../src/types/fatura.ts';

// Seed do mês de teste usando só endpoints que já existem na API (sem endpoint
// ou script de seed dedicado): upload de PDF, classificação manual e acordo
// fixo. Chama a API direto (API_URL), sem passar pelo Vite.
export const API_URL = process.env.API_URL ?? 'http://localhost:5126';

const DESCRICAO_ACORDO = 'Acordo E2E';

// PDF no layout de fatura Nubank que o extrator reconhece: cada transação é uma
// linha (mesmo Y) com data, descrição e valor em colunas (mesmo layout do PDF
// gerado em UploadFaturaEndpointTests da API).
async function criarPdfFatura(linhas: { dia: string; descricao: string[]; valor: string }[]) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const texto = (t: string, x: number, y: number) => page.drawText(t, { x, y, size: 12, font });

  texto('TRANSACOES', 25, 750);
  linhas.forEach(({ dia, descricao, valor }, i) => {
    const y = 700 - i * 20;
    texto(dia, 25, y);
    texto('FEV', 43, y);
    let x = 90;
    for (const palavra of descricao) {
      texto(palavra, x, y);
      x += font.widthOfTextAtSize(palavra, 12) + 8;
    }
    texto('R$', 400, y);
    texto(valor, 420, y);
  });

  return Buffer.from(await pdf.save());
}

export async function limparMesDeTeste(request: APIRequestContext, mes: string) {
  await request.delete(`${API_URL}/faturas/${mes}`); // 404 se não existir: ok
  const resposta = await request.get(`${API_URL}/acordos-fixos`);
  if (!resposta.ok()) throw new Error(`Listar acordos fixos falhou: ${resposta.status()}`);
  const acordos = (await resposta.json()) as AcordoFixo[];
  for (const acordo of acordos.filter((a) => a.descricao === DESCRICAO_ACORDO)) {
    await request.delete(`${API_URL}/acordos-fixos/${acordo.id}`);
  }
}

export async function semearMesDeTeste(request: APIRequestContext, mes: string) {
  const pdf = await criarPdfFatura([
    { dia: '01', descricao: ['Mercado', 'Teste'], valor: '100,00' },
    { dia: '02', descricao: ['Farmacia', 'Teste'], valor: '40,00' },
    { dia: '03', descricao: ['Presente', 'Teste'], valor: '30,00' },
    { dia: '04', descricao: ['Assinatura', 'Pessoal'], valor: '25,00' },
  ]);

  const upload = await request.post(`${API_URL}/faturas/${mes}/upload/Silvio`, {
    multipart: { arquivo: { name: 'fatura.pdf', mimeType: 'application/pdf', buffer: pdf } },
  });
  if (!upload.ok()) throw new Error(`Upload falhou: ${upload.status()} ${await upload.text()}`);

  const detalheResposta = await request.get(`${API_URL}/faturas/${mes}`);
  if (!detalheResposta.ok()) throw new Error(`Detalhe do mês falhou: ${detalheResposta.status()}`);
  const detalhe = (await detalheResposta.json()) as DetalheMes;
  const achar = (trecho: string): Transacao => {
    const transacao = detalhe.transacoes.find((t) => t.descricao.includes(trecho));
    if (!transacao) throw new Error(`Transação "${trecho}" não encontrada no mês semeado`);
    return transacao;
  };
  const mercado = achar('Mercado');
  const presente = achar('Presente');
  // Gasto pessoal de quem pagou (Silvio pagou, e é do Silvio): não gera dívida.
  const assinatura = achar('Assinatura');
  for (const [transacao, quem] of [[mercado, 'Compartilhado'], [presente, 'Claucia'], [assinatura, 'Silvio']] as const) {
    const classificacao = await request.put(`${API_URL}/transacoes/${transacao.id}/classificacao`, {
      data: { quem },
    });
    if (!classificacao.ok()) throw new Error(`Classificação falhou: ${classificacao.status()}`);
  }

  const acordo = await request.post(`${API_URL}/acordos-fixos`, {
    data: { descricao: DESCRICAO_ACORDO, devedor: 'Silvio', valor: 20 },
  });
  if (!acordo.ok()) throw new Error(`Acordo fixo falhou: ${acordo.status()}`);
}
