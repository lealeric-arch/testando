// Fórmulas de receitas, despesas dedutíveis e custos consolidados.
import type { FaseGasto, Gasto, GastoCategoria, Imovel } from '../types';
import { CATEGORIAS_DEDUTIVEIS_GCAP, GASTOS_VENDA } from '../types';

export const IR_PADRAO = 15; // alíquota de IR sobre o lucro (premissa padrão)

// Classifica um gasto como custo de aquisição ou de venda.
export function faseDoGasto(categoria: GastoCategoria): FaseGasto {
  return GASTOS_VENDA.includes(categoria) ? 'venda' : 'aquisicao';
}

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

// Resultado no modelo da planilha "Controle de Leilões":
//   TOTAL INVESTIDO = arrematação + custos de aquisição
//   SALDO LÍQUIDO DA VENDA = valor de venda − custos de venda
//   LUCRO BRUTO = saldo líquido − total investido
//   IMPOSTO IR = alíquota × lucro bruto (quando positivo)
//   LUCRO LÍQUIDO = lucro bruto − IR ;  ROI = lucro líquido / total investido
export interface ResultadoImovel {
  arrematacao: number;
  custosAquisicao: number;
  totalInvestido: number;
  valorVenda: number;
  custosVenda: number;
  saldoLiquidoVenda: number;
  lucroBruto: number;
  aliquotaIR: number;
  impostoIR: number;
  lucroLiquido: number;
  roi: number;
  vendido: boolean;
}

export function resultadoImovel(imovel: Imovel, gastos: Gasto[]): ResultadoImovel {
  const doImovel = gastos.filter((g) => g.imovelId === imovel.id);
  const custosAquisicao = doImovel
    .filter((g) => faseDoGasto(g.categoria) === 'aquisicao')
    .reduce((s, g) => s + (Number(g.valor) || 0), 0);
  const custosVenda = doImovel
    .filter((g) => faseDoGasto(g.categoria) === 'venda')
    .reduce((s, g) => s + (Number(g.valor) || 0), 0);

  const arrematacao = Number(imovel.valorArrematacao) || 0;
  const totalInvestido = arrematacao + custosAquisicao;

  const vendido = imovel.status === 'Vendido' && (Number(imovel.valorVenda) || 0) > 0;
  const valorVenda = vendido ? Number(imovel.valorVenda) || 0 : 0;
  const saldoLiquidoVenda = vendido ? valorVenda - custosVenda : 0;
  const lucroBruto = vendido ? saldoLiquidoVenda - totalInvestido : 0;

  const aliquotaIR = imovel.aliquotaIR != null ? Number(imovel.aliquotaIR) : IR_PADRAO;
  const impostoIR = vendido ? round2(Math.max(0, lucroBruto) * (aliquotaIR / 100)) : 0;
  const lucroLiquido = vendido ? lucroBruto - impostoIR : 0;
  const roi = vendido && totalInvestido > 0 ? (lucroLiquido / totalInvestido) * 100 : 0;

  return {
    arrematacao: round2(arrematacao),
    custosAquisicao: round2(custosAquisicao),
    totalInvestido: round2(totalInvestido),
    valorVenda: round2(valorVenda),
    custosVenda: round2(custosVenda),
    saldoLiquidoVenda: round2(saldoLiquidoVenda),
    lucroBruto: round2(lucroBruto),
    aliquotaIR,
    impostoIR: round2(impostoIR),
    lucroLiquido: round2(lucroLiquido),
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
    const r = resultadoImovel(im, gastos);
    capitalInvestido += r.totalInvestido;
    if (r.vendido) {
      vendidos++;
      receitaRealizada += r.valorVenda;
      lucroRealizado += r.lucroLiquido; // lucro líquido (após IR), como na planilha
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
