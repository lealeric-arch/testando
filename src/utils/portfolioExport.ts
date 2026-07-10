// Exportação consolidada do portfólio (.xls) com filtros de escopo/status/sócio/período.
import type { Gasto, Imovel, ImovelStatus } from '../types';
import { baixarArquivo, nomeArquivo } from './download';
import { formatBRL, formatPct, resultadoImovel } from './finance';

const AZUL = '#005CA9';
const LARANJA = '#F37021';

export type PeriodoFiltro = 'todo' | '30dias' | 'esteAno' | 'custom';

export interface FiltrosExport {
  escopo: 'todos' | string; // 'todos' ou id de um imóvel
  status: 'todos' | ImovelStatus;
  socioId: 'todos' | string; // 'todos' ou id de um sócio (participante)
  periodo: PeriodoFiltro;
  dataInicio?: string; // ISO (para 'custom')
  dataFim?: string;
}

export const FILTROS_PADRAO: FiltrosExport = {
  escopo: 'todos',
  status: 'todos',
  socioId: 'todos',
  periodo: 'todo',
};

function esc(s: unknown): string {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function dentroDoPeriodo(imovel: Imovel, f: FiltrosExport): boolean {
  if (f.periodo === 'todo') return true;
  const ref = (imovel.dataArrematacao || imovel.createdAt || '').slice(0, 10);
  if (!ref) return true;
  const d = new Date(ref + 'T00:00:00');
  if (isNaN(d.getTime())) return true;
  const hoje = new Date();
  if (f.periodo === '30dias') {
    const limite = new Date(hoje);
    limite.setDate(limite.getDate() - 30);
    return d >= limite;
  }
  if (f.periodo === 'esteAno') return d.getFullYear() === hoje.getFullYear();
  if (f.periodo === 'custom') {
    if (f.dataInicio && ref < f.dataInicio) return false;
    if (f.dataFim && ref > f.dataFim) return false;
    return true;
  }
  return true;
}

// Aplica os filtros e devolve os imóveis resultantes (usado também na contagem ao vivo).
export function filtrarImoveis(imoveis: Imovel[], f: FiltrosExport): Imovel[] {
  return imoveis.filter((im) => {
    if (f.escopo !== 'todos' && im.id !== f.escopo) return false;
    if (f.status !== 'todos' && im.status !== f.status) return false;
    if (f.socioId !== 'todos' && !(im.socios || []).some((s) => s.id === f.socioId)) return false;
    if (!dentroDoPeriodo(im, f)) return false;
    return true;
  });
}

export function exportarPlanilhaPortfolio(imoveis: Imovel[], gastos: Gasto[], f: FiltrosExport = FILTROS_PADRAO) {
  const lista = filtrarImoveis(imoveis, f);
  const th = `style="background:${AZUL};color:#fff;padding:6px 8px;text-align:left;"`;

  let tArremat = 0, tCustos = 0, tInvestido = 0, tVenda = 0, tComissao = 0, tLucro = 0;

  const rows = lista
    .map((im) => {
      const r = resultadoImovel(im, gastos);
      tArremat += r.arrematacao;
      tCustos += r.custosAquisicao + r.custosVenda;
      tInvestido += r.totalInvestido;
      tVenda += r.valorVenda;
      tComissao += r.comissaoCorretor;
      tLucro += r.lucroLiquido;
      return `<tr>
        <td style="padding:4px 8px;">${esc(im.titulo)}</td>
        <td style="padding:4px 8px;">${esc(im.status)}</td>
        <td style="padding:4px 8px;text-align:right;">${esc(formatBRL(r.arrematacao))}</td>
        <td style="padding:4px 8px;text-align:right;">${esc(formatBRL(r.custosAquisicao + r.custosVenda))}</td>
        <td style="padding:4px 8px;text-align:right;">${esc(formatBRL(r.totalInvestido))}</td>
        <td style="padding:4px 8px;text-align:right;">${esc(formatBRL(r.valorVenda))}</td>
        <td style="padding:4px 8px;text-align:right;">${esc(formatBRL(r.comissaoCorretor))}</td>
        <td style="padding:4px 8px;text-align:right;">${esc(formatBRL(r.impostoIR))}</td>
        <td style="padding:4px 8px;text-align:right;font-weight:bold;">${esc(formatBRL(r.lucroLiquido))}</td>
        <td style="padding:4px 8px;text-align:right;">${esc(formatPct(r.roi))}</td>
      </tr>`;
    })
    .join('');

  const totalRow = `<tr style="background:#f0f0f0;font-weight:bold;">
    <td style="padding:6px 8px;">TOTAL (${lista.length})</td><td></td>
    <td style="padding:6px 8px;text-align:right;">${esc(formatBRL(tArremat))}</td>
    <td style="padding:6px 8px;text-align:right;">${esc(formatBRL(tCustos))}</td>
    <td style="padding:6px 8px;text-align:right;">${esc(formatBRL(tInvestido))}</td>
    <td style="padding:6px 8px;text-align:right;">${esc(formatBRL(tVenda))}</td>
    <td style="padding:6px 8px;text-align:right;">${esc(formatBRL(tComissao))}</td>
    <td></td>
    <td style="padding:6px 8px;text-align:right;">${esc(formatBRL(tLucro))}</td>
    <td></td>
  </tr>`;

  const periodoTxt = {
    todo: 'Todo o período',
    '30dias': 'Últimos 30 dias',
    esteAno: 'Este ano',
    custom: `${f.dataInicio || '...'} a ${f.dataFim || '...'}`,
  }[f.periodo];

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head><meta charset="utf-8" /></head>
    <body style="font-family:Arial,sans-serif;font-size:12px;">
      <h2 style="color:${AZUL};margin:0;">Entre Colunas Leilões — Portfólio</h2>
      <p style="color:${LARANJA};margin:2px 0 4px;">Escopo: ${f.escopo === 'todos' ? 'Todos os imóveis' : 'Imóvel específico'} ·
        Status: ${f.status === 'todos' ? 'Todos' : esc(f.status)} · Período: ${esc(periodoTxt)}</p>
      <p style="color:#888;margin:0 0 12px;">${lista.length} imóvel(is) · emitido em ${new Date().toLocaleString('pt-BR')}</p>
      <table cellspacing="0">
        <thead><tr>
          <th ${th}>Imóvel</th><th ${th}>Status</th><th ${th}>Arrematação</th><th ${th}>Despesas</th>
          <th ${th}>Total investido</th><th ${th}>Venda</th><th ${th}>Comissão</th><th ${th}>IR</th>
          <th ${th}>Lucro líquido</th><th ${th}>ROI</th>
        </tr></thead>
        <tbody>${rows}${totalRow}</tbody>
      </table>
    </body></html>`;

  baixarArquivo(nomeArquivo('portfolio-entre-colunas', 'xls'), html, 'application/vnd.ms-excel');
}
