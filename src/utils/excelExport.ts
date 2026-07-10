// Exportação de planilha (.xls que o Excel abre) de um imóvel, com identidade Caixa.
import type { Gasto, Imovel } from '../types';
import { baixarArquivo, nomeArquivo } from './download';
import {
  calcularPartilhaSocios,
  faseDoGasto,
  formatBRL,
  formatPct,
  resultadoImovel,
} from './finance';

const AZUL = '#005CA9';
const LARANJA = '#F37021';

function esc(s: unknown): string {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function linha(label: string, valor: string, forte = false) {
  return `<tr><td style="padding:4px 8px;${forte ? 'font-weight:bold;' : ''}">${esc(label)}</td>
    <td style="padding:4px 8px;text-align:right;${forte ? 'font-weight:bold;' : ''}">${esc(valor)}</td></tr>`;
}

// Gera o HTML/XML que o Excel interpreta como planilha.
export function montarPlanilhaImovel(imovel: Imovel, gastos: Gasto[]): string {
  const r = resultadoImovel(imovel, gastos);
  const doImovel = gastos.filter((g) => g.imovelId === imovel.id);
  const partilha = calcularPartilhaSocios(imovel, gastos);

  const th = `style="background:${AZUL};color:#fff;padding:6px 8px;text-align:left;"`;
  const cap = `style="background:${LARANJA};color:#fff;padding:6px 8px;font-weight:bold;"`;

  const despesasRows = doImovel
    .map(
      (g) => `<tr>
        <td style="padding:4px 8px;">${esc(g.data)}</td>
        <td style="padding:4px 8px;">${esc(faseDoGasto(g.categoria) === 'venda' ? 'Venda' : 'Aquisição')}</td>
        <td style="padding:4px 8px;">${esc(g.categoria)}</td>
        <td style="padding:4px 8px;">${esc(g.descricao)}</td>
        <td style="padding:4px 8px;">${esc(g.pagoPor === undefined || g.pagoPor === 'Voce' ? 'Você' : (imovel.socios.find((s) => s.id === g.pagoPor)?.nome || '—'))}</td>
        <td style="padding:4px 8px;text-align:right;">${esc(formatBRL(g.valor))}</td>
      </tr>`,
    )
    .join('');

  const partilhaRows = partilha
    .map(
      (p) => `<tr>
        <td style="padding:4px 8px;">${esc(p.nome)}</td>
        <td style="padding:4px 8px;">${esc(p.papel)}</td>
        <td style="padding:4px 8px;text-align:right;">${esc(formatPct(p.participacaoImovel))}</td>
        <td style="padding:4px 8px;text-align:right;">${esc(formatPct(p.participacaoLucro))}</td>
        <td style="padding:4px 8px;text-align:right;">${esc(formatBRL(p.reembolsoGastos))}</td>
        <td style="padding:4px 8px;text-align:right;">${esc(formatBRL(p.retornoCapital))}</td>
        <td style="padding:4px 8px;text-align:right;">${esc(formatBRL(p.lucro))}</td>
        <td style="padding:4px 8px;text-align:right;font-weight:bold;">${esc(formatBRL(p.totalReceber))}</td>
      </tr>`,
    )
    .join('');

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
  <head><meta charset="utf-8" /></head>
  <body style="font-family:Arial,sans-serif;font-size:12px;">
    <h2 style="color:${AZUL};margin:0;">Entre Colunas Leilões — Demonstrativo do Ativo</h2>
    <p style="color:${LARANJA};font-weight:bold;margin:2px 0 12px;">${esc(imovel.titulo)}</p>

    <table cellspacing="0"><tbody>
      ${linha('Endereço', `${imovel.endereco || '—'}${imovel.cidade ? ` — ${imovel.cidade}/${imovel.uf || ''}` : ''}`)}
      ${linha('Código Caixa', imovel.codigoCaixa || '—')}
      ${linha('Modalidade', imovel.modalidade || '—')}
      ${linha('Status', imovel.status)}
      ${linha('Comprador', imovel.comprador || '—')}
    </tbody></table>

    <p ${cap}>Demonstrativo financeiro</p>
    <table cellspacing="0"><tbody>
      ${linha('Arrematação', formatBRL(r.arrematacao))}
      ${linha('Custos de aquisição', formatBRL(r.custosAquisicao))}
      ${linha('TOTAL INVESTIDO', formatBRL(r.totalInvestido), true)}
      ${linha('Valor de venda', formatBRL(r.valorVenda))}
      ${linha('Custos de venda', formatBRL(r.custosVenda))}
      ${linha(`Comissão do corretor (${formatPct(r.comissaoCorretorPct)})`, formatBRL(r.comissaoCorretor))}
      ${linha('Saldo líquido da venda', formatBRL(r.saldoLiquidoVenda), true)}
      ${linha('Lucro bruto', formatBRL(r.lucroBruto))}
      ${linha(`Imposto IR (${formatPct(r.aliquotaIR)})`, formatBRL(r.impostoIR))}
      ${linha('LUCRO LÍQUIDO', formatBRL(r.lucroLiquido), true)}
      ${linha('ROI', formatPct(r.roi), true)}
    </tbody></table>

    <p ${cap}>Despesas</p>
    <table cellspacing="0">
      <thead><tr><th ${th}>Data</th><th ${th}>Fase</th><th ${th}>Categoria</th><th ${th}>Descrição</th><th ${th}>Pago por</th><th ${th}>Valor</th></tr></thead>
      <tbody>${despesasRows || '<tr><td colspan="6" style="padding:8px;">Sem despesas</td></tr>'}</tbody>
    </table>

    <p ${cap}>Prestação de contas por sócio</p>
    <table cellspacing="0">
      <thead><tr><th ${th}>Participante</th><th ${th}>Papel</th><th ${th}>% Imóvel</th><th ${th}>% Lucro</th><th ${th}>Reembolso</th><th ${th}>Retorno capital</th><th ${th}>Lucro</th><th ${th}>Total a receber</th></tr></thead>
      <tbody>${partilhaRows}</tbody>
    </table>

    <p style="color:#888;margin-top:16px;">Emitido em ${new Date().toLocaleString('pt-BR')} · Documento gerencial, sem valor fiscal.</p>
  </body></html>`;
}

export function exportarPlanilhaExcel(imovel: Imovel, gastos: Gasto[]) {
  const html = montarPlanilhaImovel(imovel, gastos);
  baixarArquivo(nomeArquivo(`ativo-${imovel.titulo}`, 'xls'), html, 'application/vnd.ms-excel');
}
