import { describe, it, expect } from 'vitest';
import { calcularGCAP, impostoProgressivo } from '../src/utils/gcap';

describe('impostoProgressivo (Lei 13.259/2016)', () => {
  it('aplica 15% até 5 mi', () => {
    const f = impostoProgressivo(1_000_000);
    expect(f).toHaveLength(1);
    expect(f[0].aliquota).toBe(15);
    expect(f[0].imposto).toBe(150_000);
  });

  it('progride para a faixa de 17,5% acima de 5 mi', () => {
    const f = impostoProgressivo(6_000_000);
    const total = f.reduce((s, x) => s + x.imposto, 0);
    // 5 mi * 15% + 1 mi * 17,5% = 750.000 + 175.000
    expect(total).toBe(925_000);
  });
});

describe('calcularGCAP', () => {
  it('deduz despesas e aplica 15% sem redução (sem datas)', () => {
    const r = calcularGCAP({
      valorVenda: 1_000_000,
      custoAquisicao: 400_000,
      despesasDedutiveis: 100_000,
    });
    expect(r.custoCorrigido).toBe(500_000);
    expect(r.ganhoBruto).toBe(500_000);
    expect(r.fr1).toBe(1);
    expect(r.fr2).toBe(1);
    expect(r.ganhoTributavel).toBe(500_000);
    expect(r.impostoTotal).toBe(75_000);
    expect(r.aliquotaEfetiva).toBe(15);
    expect(r.liquidoAposImposto).toBe(425_000);
  });

  it('isenta quando há reinvestimento residencial', () => {
    const r = calcularGCAP({
      valorVenda: 1_000_000,
      custoAquisicao: 400_000,
      despesasDedutiveis: 0,
      isencaoReinvestimento: true,
      imovelResidencial: true,
    });
    expect(r.isento).toBe(true);
    expect(r.impostoTotal).toBe(0);
  });

  it('não gera ganho quando a venda é menor que o custo', () => {
    const r = calcularGCAP({ valorVenda: 300_000, custoAquisicao: 400_000, despesasDedutiveis: 0 });
    expect(r.ganhoBruto).toBe(0);
    expect(r.impostoTotal).toBe(0);
  });

  it('aplica fator de redução da Lei do Bem ao longo do tempo de posse', () => {
    const r = calcularGCAP({
      valorVenda: 1_000_000,
      custoAquisicao: 500_000,
      despesasDedutiveis: 0,
      dataAquisicao: '2015-01-01',
      dataVenda: '2025-01-01',
    });
    // FR2 < 1 reduz o ganho tributável frente ao bruto
    expect(r.fr2).toBeLessThan(1);
    expect(r.ganhoReduzido).toBeLessThan(r.ganhoBruto);
    expect(r.ganhoTributavel).toBe(r.ganhoReduzido);
  });
});
