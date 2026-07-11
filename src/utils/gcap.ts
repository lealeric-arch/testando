// Calculadora de Ganho de Capital (GCAP) para imóveis.
// Implementa:
//  - Dedução de despesas elegíveis (ITBI, registro, reforma/benfeitorias).
//  - Fatores de redução da "Lei do Bem" (Lei 11.196/2005, art. 40) — FR1 e FR2, mensais.
//  - Isenção por reinvestimento residencial em até 180 dias (art. 39).
//  - Alíquotas progressivas da Lei 13.259/2016 (art. 21 da Lei 8.981/95).

export interface FaixaImposto {
  faixa: string;
  aliquota: number; // %
  base: number; // parcela do ganho nesta faixa
  imposto: number;
}

export interface GCAPInput {
  valorVenda: number;
  custoAquisicao: number; // valor de arrematação
  despesasDedutiveis: number; // ITBI, registro, benfeitorias...
  dataAquisicao?: string; // ISO
  dataVenda?: string; // ISO
  isencaoReinvestimento?: boolean; // reinvestiu em residencial em até 180 dias
  imovelResidencial?: boolean;
}

export interface GCAPResult {
  custoCorrigido: number; // aquisição + despesas dedutíveis
  ganhoBruto: number;
  mesesPosse: number;
  fr1: number;
  fr2: number;
  fatorReducaoTotal: number; // fr1 * fr2
  ganhoReduzido: number; // ganho após fatores da Lei do Bem
  isento: boolean;
  motivoIsencao?: string;
  ganhoTributavel: number;
  faixas: FaixaImposto[];
  impostoTotal: number;
  aliquotaEfetiva: number; // sobre o ganho bruto
  liquidoAposImposto: number; // valorVenda - custoAquisicao - despesas - imposto
}

// Faixas da Lei 13.259/2016
const FAIXAS = [
  { limite: 5_000_000, aliquota: 15 },
  { limite: 10_000_000, aliquota: 17.5 },
  { limite: 30_000_000, aliquota: 20 },
  { limite: Infinity, aliquota: 22.5 },
];

function round2(n: number): number {
  return Math.round(((Number(n) || 0) + Number.EPSILON) * 100) / 100;
}

function round4(n: number): number {
  return Math.round(((Number(n) || 0) + Number.EPSILON) * 10000) / 10000;
}

// Meses inteiros decorridos entre duas datas ISO.
export function mesesEntre(inicioISO?: string, fimISO?: string): number {
  if (!inicioISO || !fimISO) return 0;
  const a = new Date(inicioISO.length === 10 ? inicioISO + 'T00:00:00' : inicioISO);
  const b = new Date(fimISO.length === 10 ? fimISO + 'T00:00:00' : fimISO);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
  let meses = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (b.getDate() < a.getDate()) meses -= 1;
  return Math.max(0, meses);
}

// Diferença em dias entre duas datas ISO.
export function diasEntre(inicioISO?: string, fimISO?: string): number {
  if (!inicioISO || !fimISO) return 0;
  const a = new Date(inicioISO.length === 10 ? inicioISO + 'T00:00:00' : inicioISO);
  const b = new Date(fimISO.length === 10 ? fimISO + 'T00:00:00' : fimISO);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// Fatores de redução da Lei do Bem, calculados mês a mês.
// FR1 = 1/1,0035^m1 : meses entre a aquisição (ou jan/1996) e dez/2005.
// FR2 = 1/1,0060^m2 : meses entre dez/2005 (ou a aquisição, se posterior) e a venda.
function fatoresLeiDoBem(dataAquisicao?: string, dataVenda?: string): { fr1: number; fr2: number } {
  if (!dataAquisicao || !dataVenda) return { fr1: 1, fr2: 1 };
  const corteFR1 = '2005-12-01'; // fim do período do FR1
  const inicioFR2 = '2005-12-01';

  // m1 só existe se a aquisição for anterior a dez/2005.
  const m1 = mesesEntre(dataAquisicao, corteFR1);
  const baseFR2 = dataAquisicao > inicioFR2 ? dataAquisicao : inicioFR2;
  const m2 = mesesEntre(baseFR2, dataVenda);

  const fr1 = m1 > 0 ? 1 / Math.pow(1.0035, m1) : 1;
  const fr2 = m2 > 0 ? 1 / Math.pow(1.006, m2) : 1;
  return { fr1: round4(fr1), fr2: round4(fr2) };
}

// Imposto progressivo da Lei 13.259/2016 sobre uma base de ganho.
export function impostoProgressivo(ganho: number): FaixaImposto[] {
  const faixas: FaixaImposto[] = [];
  let anterior = 0;
  const nomes = [
    'Até R$ 5 mi',
    'R$ 5 mi a R$ 10 mi',
    'R$ 10 mi a R$ 30 mi',
    'Acima de R$ 30 mi',
  ];
  for (let i = 0; i < FAIXAS.length; i++) {
    const { limite, aliquota } = FAIXAS[i];
    if (ganho <= anterior) break;
    const teto = Math.min(ganho, limite);
    const base = teto - anterior;
    if (base > 0) {
      faixas.push({
        faixa: nomes[i],
        aliquota,
        base: round2(base),
        imposto: round2(base * (aliquota / 100)),
      });
    }
    anterior = limite;
  }
  return faixas;
}

export function calcularGCAP(input: GCAPInput): GCAPResult {
  const valorVenda = Number(input.valorVenda) || 0;
  const custoAquisicao = Number(input.custoAquisicao) || 0;
  const despesas = Number(input.despesasDedutiveis) || 0;

  const custoCorrigido = round2(custoAquisicao + despesas);
  const ganhoBruto = round2(Math.max(0, valorVenda - custoCorrigido));
  const mesesPosse = mesesEntre(input.dataAquisicao, input.dataVenda);

  const { fr1, fr2 } = fatoresLeiDoBem(input.dataAquisicao, input.dataVenda);
  const fatorReducaoTotal = round4(fr1 * fr2);
  const ganhoReduzido = round2(ganhoBruto * fatorReducaoTotal);

  // Isenção por reinvestimento residencial (art. 39 da Lei 11.196/2005).
  let isento = false;
  let motivoIsencao: string | undefined;
  if (input.isencaoReinvestimento && input.imovelResidencial) {
    isento = true;
    motivoIsencao = 'Isento — reinvestimento em imóvel residencial em até 180 dias (art. 39, Lei 11.196/2005).';
  }

  const ganhoTributavel = isento ? 0 : ganhoReduzido;
  const faixas = ganhoTributavel > 0 ? impostoProgressivo(ganhoTributavel) : [];
  const impostoTotal = round2(faixas.reduce((s, f) => s + f.imposto, 0));
  const aliquotaEfetiva = ganhoBruto > 0 ? round2((impostoTotal / ganhoBruto) * 100) : 0;
  const liquidoAposImposto = round2(valorVenda - custoCorrigido - impostoTotal);

  return {
    custoCorrigido,
    ganhoBruto,
    mesesPosse,
    fr1,
    fr2,
    fatorReducaoTotal,
    ganhoReduzido,
    isento,
    motivoIsencao,
    ganhoTributavel,
    faixas,
    impostoTotal,
    aliquotaEfetiva,
    liquidoAposImposto,
  };
}
