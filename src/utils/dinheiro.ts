export function formatarValor(valor: number): string {
  const absoluto = Math.abs(valor).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (valor < 0 ? '− ' : '') + 'R$ ' + absoluto;
}

// Porta de parseMoney (js/app.js do legado): com vírgula, ela é o decimal e os
// pontos são milhar; sem vírgula, "1.234" (ponto + 3 dígitos no fim) ou mais de
// um ponto também é milhar.
export function lerValor(texto: string): number {
  let s = String(texto || '').replace(/[^\d.,-]/g, '').trim();
  if (!s) return 0;
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    const pontos = s.split('.').length - 1;
    if (pontos > 1 || /\.\d{3}$/.test(s)) s = s.replace(/\./g, '');
  }
  return parseFloat(s) || 0;
}
