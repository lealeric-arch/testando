// Fórmulas de receitas, despesas dedutíveis e custos consolidados.
import type { Gasto, Imovel } from '../types';
import { CATEGORIAS_DEDUTIVEIS_GCAP } from '../types';

export function round2(n: number): number {
  const v = Number(n) || 0;
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

export function formatBRL(n: number | undefined | null): string {
  return (Number(n) || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function formatPct(n: number | undefined | null, casas = 1): string {
  return `${(Number(n) || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: casas,
  })}%`;
}

export interface ResumoFinanceiro {
  valorArrematacao: number;
  totalGastos: number;
  gastosDedutiveis: number;
  custoTotal: number; // arrematação + gastos
  receita: number; // valor de venda (0 se não vendido)
  lucroBruto: number; // receita - custoTotal
  roi: number; // % sobre o custo total
  vendido: boolean;
}

export function gastoEhDedutivel(gasto: Gasto): boolean {
  if (typeof gasto.dedutivelGCAP === 'boolean') return gasto.dedutivelGCAP;
  return CATEGORIAS_DEDUTIVEIS_GCAP.includes(gasto.categoria);
}

export function resumoFinanceiro(imovel: Imovel, gastos: Gasto[]): ResumoFinanceiro {
  const doImovel = gastos.filter((g) => g.imovelId === imovel.id);
  const totalGastos = doImovel.reduce((s, g) => s + (Number(g.valor) || 0), 0);
  const gastosDedutiveis = doImovel
    .filter(gastoEhDedutivel)
    .reduce((s, g) => s + (Number(g.valor) || 0), 0);

  const valorArrematacao = Number(imovel.valorArrematacao) || 0;
  const custoTotal = valorArrematacao + totalGastos;
  const vendido = imovel.status === 'Vendido' && (Number(imovel.valorVenda) || 0) > 0;
  const receita = vendido ? Number(imovel.valorVenda) || 0 : 0;
  const lucroBruto = vendido ? receita - custoTotal : 0;
  const roi = vendido && custoTotal > 0 ? (lucroBruto / custoTotal) * 100 : 0;

  return {
    valorArrematacao: round2(valorArrematacao),
    totalGastos: round2(totalGastos),
    gastosDedutiveis: round2(gastosDedutiveis),
    custoTotal: round2(custoTotal),
    receita: round2(receita),
    lucroBruto: round2(lucroBruto),
    roi: round2(roi),
    vendido,
  };
}

export interface ResumoPortfolio {
  totalImoveis: number;
  emEstoque: number;
  vendidos: number;
  capitalInvestido: number; // arrematação + gastos de todos
  valorEstimadoCarteira: number; // avaliação dos não vendidos
  receitaRealizada: number;
  lucroRealizado: number;
  roiMedio: number;
}

export function resumoPortfolio(imoveis: Imovel[], gastos: Gasto[]): ResumoPortfolio {
  let capitalInvestido = 0;
  let valorEstimadoCarteira = 0;
  let receitaRealizada = 0;
  let lucroRealizado = 0;
  let vendidos = 0;
  let emEstoque = 0;
  const rois: number[] = [];

  for (const im of imoveis) {
    const r = resumoFinanceiro(im, gastos);
    capitalInvestido += r.custoTotal;
    if (r.vendido) {
      vendidos++;
      receitaRealizada += r.receita;
      lucroRealizado += r.lucroBruto;
      rois.push(r.roi);
    } else {
      valorEstimadoCarteira += Number(im.valorAvaliacao) || im.valorArrematacao || 0;
    }
    if (im.status === 'Estoque') emEstoque++;
  }

  const roiMedio = rois.length ? rois.reduce((a, b) => a + b, 0) / rois.length : 0;

  return {
    totalImoveis: imoveis.length,
    emEstoque,
    vendidos,
    capitalInvestido: round2(capitalInvestido),
    valorEstimadoCarteira: round2(valorEstimadoCarteira),
    receitaRealizada: round2(receitaRealizada),
    lucroRealizado: round2(lucroRealizado),
    roiMedio: round2(roiMedio),
  };
}

// Rateio de resultado entre sócios conforme percentual de participação.
export function rateioSocios(imovel: Imovel, lucro: number) {
  return (imovel.socios || []).map((s) => ({
    ...s,
    resultado: round2((lucro * (Number(s.percentual) || 0)) / 100),
  }));
}
