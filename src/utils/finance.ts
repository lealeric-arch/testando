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
export const COMISSAO_CORRETOR_PADRAO = 5; // % de comissão do corretor na venda

export interface ResultadoImovel {
  arrematacao: number;
  custosAquisicao: number;
  totalInvestido: number;
  valorVenda: number;
  custosVenda: number;
  comissaoCorretorPct: number;
  comissaoCorretor: number;
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

  // Comissão do corretor incide sobre o valor de venda (padrão 5%).
  const comissaoCorretorPct =
    imovel.comissaoCorretorPct != null ? Number(imovel.comissaoCorretorPct) : COMISSAO_CORRETOR_PADRAO;
  const comissaoCorretor = vendido ? round2(valorVenda * (comissaoCorretorPct / 100)) : 0;

  const saldoLiquidoVenda = vendido ? valorVenda - custosVenda - comissaoCorretor : 0;
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
    comissaoCorretorPct,
    comissaoCorretor: round2(comissaoCorretor),
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

// Rateio de resultado entre sócios conforme participação no lucro (fallback: percentual).
export function rateioSocios(imovel: Imovel, lucro: number) {
  return (imovel.socios || []).map((s) => {
    const pct = s.participacaoLucro != null ? Number(s.participacaoLucro) : Number(s.percentual) || 0;
    return { ...s, percentual: pct, resultado: round2((lucro * pct) / 100) };
  });
}

// ---- Calculadora de Viabilidade Pré-Lance ----
export interface ViabilidadeOpts {
  usarFinanciamento: boolean;
  entradaPct: number; // % de entrada no financiamento Caixa
  taxaAvaliacaoCef: number; // taxa de avaliação/emissão CEF (R$)
}

export interface ViabilidadeResultado {
  lucroDesejado: number;
  lanceMaximo: number;
  custoTotalEstimado: number; // à vista: lance + reforma + outros
  // Alavancagem (financiamento Caixa)
  valorEntrada: number;
  valorFinanciado: number;
  capitalNecessario: number; // entrada + reforma + outros + taxa avaliação
  roiSimples: number; // lucro / custo à vista
  roiAlavancado: number; // lucro / capital necessário
  percentualDoMercado: number; // lance / valor de mercado
}

export function calcularLanceMaximo(
  sim: { valorMercado: number; margemDesejadaPct: number; custoReformaEst: number; outrosCustosEst: number },
  opts?: ViabilidadeOpts,
): ViabilidadeResultado {
  const valorMercado = Number(sim.valorMercado) || 0;
  const reforma = Number(sim.custoReformaEst) || 0;
  const outros = Number(sim.outrosCustosEst) || 0;
  const margem = Number(sim.margemDesejadaPct) || 0;

  const lucroDesejado = round2(valorMercado * (margem / 100));
  const lanceMaximo = round2(Math.max(0, valorMercado - lucroDesejado - reforma - outros));
  const custoTotalEstimado = round2(lanceMaximo + reforma + outros);
  const roiSimples = custoTotalEstimado > 0 ? round2((lucroDesejado / custoTotalEstimado) * 100) : 0;
  const percentualDoMercado = valorMercado > 0 ? round2((lanceMaximo / valorMercado) * 100) : 0;

  const entradaPct = opts?.usarFinanciamento ? Number(opts.entradaPct) || 0 : 100;
  const taxaAval = opts?.usarFinanciamento ? Number(opts.taxaAvaliacaoCef) || 0 : 0;
  const valorEntrada = round2(lanceMaximo * (entradaPct / 100));
  const valorFinanciado = round2(lanceMaximo - valorEntrada);
  const capitalNecessario = round2(valorEntrada + reforma + outros + taxaAval);
  const roiAlavancado = capitalNecessario > 0 ? round2((lucroDesejado / capitalNecessario) * 100) : 0;

  return {
    lucroDesejado,
    lanceMaximo,
    custoTotalEstimado,
    valorEntrada,
    valorFinanciado,
    capitalNecessario,
    roiSimples,
    roiAlavancado,
    percentualDoMercado,
  };
}

// ---- Partilha / Prestação de contas por participante ----
export interface ParticipantePartilha {
  id: string; // 'Voce' ou id do sócio
  nome: string;
  papel: string;
  participacaoImovel: number;
  participacaoLucro: number;
  reembolsoGastos: number; // gastos que este participante pagou
  retornoCapital: number; // parcela da arrematação proporcional
  lucro: number; // lucro líquido proporcional
  totalReceber: number;
}

export function calcularPartilhaSocios(imovel: Imovel, gastos: Gasto[]): ParticipantePartilha[] {
  const r = resultadoImovel(imovel, gastos);
  const doImovel = gastos.filter((g) => g.imovelId === imovel.id);
  const socios = imovel.socios || [];

  const partImovelSocios = socios.reduce(
    (s, x) => s + (x.participacaoImovel != null ? Number(x.participacaoImovel) : Number(x.percentual) || 0),
    0,
  );
  const partLucroSocios = socios.reduce(
    (s, x) => s + (x.participacaoLucro != null ? Number(x.participacaoLucro) : Number(x.percentual) || 0),
    0,
  );

  const reembolsoDe = (chave: string) =>
    round2(
      doImovel
        .filter((g) => (g.pagoPor || 'Voce') === chave)
        .reduce((s, g) => s + (Number(g.valor) || 0), 0),
    );

  const monta = (
    id: string,
    nome: string,
    papel: string,
    partImovel: number,
    partLucro: number,
  ): ParticipantePartilha => {
    const reembolsoGastos = reembolsoDe(id);
    const retornoCapital = round2(r.arrematacao * (partImovel / 100));
    const lucro = round2(r.lucroLiquido * (partLucro / 100));
    return {
      id,
      nome,
      papel,
      participacaoImovel: round2(partImovel),
      participacaoLucro: round2(partLucro),
      reembolsoGastos,
      retornoCapital,
      lucro,
      totalReceber: round2(reembolsoGastos + retornoCapital + lucro),
    };
  };

  const voce = monta(
    'Voce',
    'Você',
    'Investidor',
    Math.max(0, 100 - partImovelSocios),
    Math.max(0, 100 - partLucroSocios),
  );
  const listaSocios = socios.map((s) =>
    monta(
      s.id,
      s.nome,
      s.papel || 'Investidor',
      s.participacaoImovel != null ? Number(s.participacaoImovel) : Number(s.percentual) || 0,
      s.participacaoLucro != null ? Number(s.participacaoLucro) : Number(s.percentual) || 0,
    ),
  );

  return [voce, ...listaSocios];
}

// Consolida a partilha de todos os imóveis vendidos por participante (agrupado por nome).
export interface PartilhaConsolidada {
  nome: string;
  reembolso: number;
  retornoCapital: number;
  lucro: number;
  total: number;
}

export function partilhaConsolidada(imoveis: Imovel[], gastos: Gasto[]): PartilhaConsolidada[] {
  const mapa = new Map<string, PartilhaConsolidada>();
  for (const im of imoveis) {
    if (!(im.status === 'Vendido' && (Number(im.valorVenda) || 0) > 0)) continue;
    for (const p of calcularPartilhaSocios(im, gastos)) {
      const cur = mapa.get(p.nome) || { nome: p.nome, reembolso: 0, retornoCapital: 0, lucro: 0, total: 0 };
      cur.reembolso = round2(cur.reembolso + p.reembolsoGastos);
      cur.retornoCapital = round2(cur.retornoCapital + p.retornoCapital);
      cur.lucro = round2(cur.lucro + p.lucro);
      cur.total = round2(cur.total + p.totalReceber);
      mapa.set(p.nome, cur);
    }
  }
  return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
}
