import { describe, it, expect } from 'vitest';
import type { Gasto, Imovel } from '../src/types';
import {
  calcularLanceMaximo,
  calcularPartilhaSocios,
  faseDoGasto,
  partilhaConsolidada,
  resultadoImovel,
  resumoPortfolio,
} from '../src/utils/finance';

function imovel(over: Partial<Imovel> = {}): Imovel {
  return {
    id: 'im1',
    titulo: 'Teste',
    status: 'Arrematado',
    etapaDesocupacao: 'Não iniciada',
    valorArrematacao: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    socios: [],
    ...over,
  };
}

function gasto(over: Partial<Gasto>): Gasto {
  return { id: 'g' + Math.random(), imovelId: 'im1', categoria: 'Outros', descricao: '', valor: 0, data: '2026-01-01', ...over };
}

describe('faseDoGasto', () => {
  it('classifica aquisição e venda', () => {
    expect(faseDoGasto('ITBI')).toBe('aquisicao');
    expect(faseDoGasto('Reforma')).toBe('aquisicao');
    expect(faseDoGasto('Custos de venda')).toBe('venda');
    expect(faseDoGasto('Comissão de venda')).toBe('venda');
  });
});

describe('resultadoImovel', () => {
  it('calcula investido, comissão, IR, lucro líquido e ROI', () => {
    const im = imovel({
      valorArrematacao: 100000,
      status: 'Vendido',
      valorVenda: 200000,
      comissaoCorretorPct: 5,
      aliquotaIR: 15,
    });
    const gastos = [
      gasto({ categoria: 'Reforma', valor: 10000 }),
      gasto({ categoria: 'Custos de venda', valor: 4000 }),
    ];
    const r = resultadoImovel(im, gastos);
    expect(r.custosAquisicao).toBe(10000);
    expect(r.custosVenda).toBe(4000);
    expect(r.totalInvestido).toBe(110000);
    expect(r.comissaoCorretor).toBe(10000); // 5% de 200000
    expect(r.saldoLiquidoVenda).toBe(186000); // 200000 - 4000 - 10000
    expect(r.lucroBruto).toBe(76000); // 186000 - 110000
    expect(r.impostoIR).toBe(11400); // 15%
    expect(r.lucroLiquido).toBe(64600);
    expect(r.roi).toBe(58.73); // 64600 / 110000
  });

  it('não computa venda quando o imóvel não está vendido', () => {
    const r = resultadoImovel(imovel({ valorArrematacao: 100000, valorVenda: 200000 }), []);
    expect(r.vendido).toBe(false);
    expect(r.valorVenda).toBe(0);
    expect(r.lucroLiquido).toBe(0);
    expect(r.roi).toBe(0);
  });
});

describe('resumoPortfolio', () => {
  it('soma lucro líquido (após IR) dos vendidos', () => {
    const vendido = imovel({ id: 'a', valorArrematacao: 100000, status: 'Vendido', valorVenda: 200000, comissaoCorretorPct: 0, aliquotaIR: 0 });
    const estoque = imovel({ id: 'b', status: 'Estoque', valorArrematacao: 50000, valorAvaliacao: 90000 });
    const r = resumoPortfolio([vendido, estoque], []);
    expect(r.totalImoveis).toBe(2);
    expect(r.vendidos).toBe(1);
    expect(r.emEstoque).toBe(1);
    // sem comissão nem IR: lucro = 200000 - 100000 = 100000
    expect(r.lucroRealizado).toBe(100000);
  });
});

describe('calcularLanceMaximo', () => {
  it('calcula lance máximo, custo e ROI (à vista e alavancado)', () => {
    const r = calcularLanceMaximo(
      { valorMercado: 300000, margemDesejadaPct: 20, custoReformaEst: 25000, outrosCustosEst: 5000 },
      { usarFinanciamento: true, entradaPct: 30, taxaAvaliacaoCef: 3000 },
    );
    expect(r.lucroDesejado).toBe(60000);
    expect(r.lanceMaximo).toBe(210000);
    expect(r.custoTotalEstimado).toBe(240000);
    expect(r.roiSimples).toBe(25);
    expect(r.percentualDoMercado).toBe(70);
    expect(r.valorEntrada).toBe(63000);
    expect(r.valorFinanciado).toBe(147000);
    expect(r.capitalNecessario).toBe(96000);
    expect(r.roiAlavancado).toBe(62.5);
  });

  it('retorna lance 0 quando inviável', () => {
    const r = calcularLanceMaximo({ valorMercado: 100000, margemDesejadaPct: 100, custoReformaEst: 10000, outrosCustosEst: 0 });
    expect(r.lanceMaximo).toBe(0);
  });
});

describe('partilhaConsolidada', () => {
  it('agrupa o retorno por participante somando os imóveis vendidos', () => {
    const base = { comissaoCorretorPct: 0, aliquotaIR: 0, status: 'Vendido' as const };
    const a = imovel({ id: 'a', valorArrematacao: 100000, valorVenda: 150000, ...base,
      socios: [{ id: 's1', nome: 'Ana', percentual: 50, participacaoImovel: 50, participacaoLucro: 50 }] });
    const b = imovel({ id: 'b', valorArrematacao: 200000, valorVenda: 260000, ...base,
      socios: [{ id: 's2', nome: 'Ana', percentual: 50, participacaoImovel: 50, participacaoLucro: 50 }] });
    const cons = partilhaConsolidada([a, b], []);
    const ana = cons.find((p) => p.nome === 'Ana')!;
    // a: lucro 50000 → Ana 50% = 25000 + capital 50% de 100000 = 50000 → 75000
    // b: lucro 60000 → Ana 50% = 30000 + capital 50% de 200000 = 100000 → 130000
    expect(ana.total).toBe(205000);
    const voce = cons.find((p) => p.nome === 'Você')!;
    expect(voce.total).toBe(205000);
  });
});

describe('calcularPartilhaSocios', () => {
  it('rateia capital e lucro entre Você e sócio', () => {
    const im = imovel({
      valorArrematacao: 100000,
      status: 'Vendido',
      valorVenda: 200000,
      comissaoCorretorPct: 5,
      aliquotaIR: 15,
      socios: [{ id: 's1', nome: 'Ana', percentual: 30, participacaoImovel: 40, participacaoLucro: 30 }],
    });
    const partilha = calcularPartilhaSocios(im, []);
    const voce = partilha.find((p) => p.id === 'Voce')!;
    const ana = partilha.find((p) => p.id === 's1')!;
    // lucroLiquido = (200000 - 10000 comissão) - 100000 = 90000; IR 15% = 13500; líquido 76500
    expect(voce.retornoCapital).toBe(60000); // 60% de 100000
    expect(voce.lucro).toBe(53550); // 70% de 76500
    expect(voce.totalReceber).toBe(113550);
    expect(ana.retornoCapital).toBe(40000);
    expect(ana.lucro).toBe(22950);
    expect(ana.totalReceber).toBe(62950);
  });
});
