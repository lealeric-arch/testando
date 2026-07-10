// Lógica financeira do leilão — módulo puro (sem dependências), testável isoladamente.
// Todas as funções operam sobre objetos simples e retornam valores arredondados a 2 casas.

function round2(n) {
  const v = Number(n) || 0;
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// Um lote é considerado vendido quando tem status 'vendido' e um valor de arremate > 0.
function loteVendido(lote) {
  return lote && lote.status === 'vendido' && num(lote.valorArremate) > 0;
}

// Financeiro de um único lote arrematado.
// - martelo:            preço do martelo (valor do arremate)
// - comissaoComprador:  ágio pago pelo comprador sobre o martelo
// - totalComprador:     total que o comprador paga (martelo + comissão)
// - comissaoVendedor:   comissão descontada do vendedor/consignante
// - repasseVendedor:    valor líquido repassado ao vendedor
// - receitaLeiloeiro:   receita total do leiloeiro (comissão comprador + vendedor)
function financeiroLote(lote, leilao) {
  const martelo = num(lote.valorArremate);
  const pctComprador = num(leilao && leilao.comissaoCompradorPct);
  const pctVendedor = num(leilao && leilao.comissaoVendedorPct);

  const comissaoComprador = round2(martelo * (pctComprador / 100));
  const comissaoVendedor = round2(martelo * (pctVendedor / 100));

  return {
    martelo: round2(martelo),
    comissaoComprador,
    totalComprador: round2(martelo + comissaoComprador),
    comissaoVendedor,
    repasseVendedor: round2(martelo - comissaoVendedor),
    receitaLeiloeiro: round2(comissaoComprador + comissaoVendedor),
  };
}

// Resumo financeiro de um leilão inteiro, agregando os lotes vendidos.
function resumoLeilao(leilao, lotes) {
  const vendidos = (lotes || []).filter(loteVendido);
  const total = {
    lotesTotal: (lotes || []).length,
    lotesVendidos: vendidos.length,
    martelo: 0,
    comissaoComprador: 0,
    comissaoVendedor: 0,
    totalComprador: 0,
    repasseVendedor: 0,
    receitaLeiloeiro: 0,
  };

  for (const lote of vendidos) {
    const f = financeiroLote(lote, leilao);
    total.martelo += f.martelo;
    total.comissaoComprador += f.comissaoComprador;
    total.comissaoVendedor += f.comissaoVendedor;
    total.totalComprador += f.totalComprador;
    total.repasseVendedor += f.repasseVendedor;
    total.receitaLeiloeiro += f.receitaLeiloeiro;
  }

  // Arredonda os agregados no fim para consistência de exibição.
  for (const k of ['martelo', 'comissaoComprador', 'comissaoVendedor', 'totalComprador', 'repasseVendedor', 'receitaLeiloeiro']) {
    total[k] = round2(total[k]);
  }

  const taxaVenda = total.lotesTotal > 0 ? round2((total.lotesVendidos / total.lotesTotal) * 100) : 0;
  return { ...total, taxaVenda };
}

// Extrato por arrematante (comprador) dentro de um leilão: quanto cada um deve pagar.
function contasCompradores(leilao, lotes, clientes) {
  const mapa = new Map();
  const nomeCliente = (id) => {
    const c = (clientes || []).find((x) => x.id === id);
    return c ? c.nome : 'Sem identificação';
  };

  for (const lote of (lotes || []).filter(loteVendido)) {
    const id = lote.arrematanteId || '__sem__';
    const f = financeiroLote(lote, leilao);
    if (!mapa.has(id)) {
      mapa.set(id, { clienteId: id, nome: nomeCliente(id), lotes: 0, martelo: 0, comissao: 0, total: 0 });
    }
    const acc = mapa.get(id);
    acc.lotes += 1;
    acc.martelo = round2(acc.martelo + f.martelo);
    acc.comissao = round2(acc.comissao + f.comissaoComprador);
    acc.total = round2(acc.total + f.totalComprador);
  }
  return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
}

// Maior lance registrado para um lote (a partir da lista de lances).
function maiorLance(loteId, lances) {
  let melhor = null;
  for (const l of (lances || [])) {
    if (l.loteId !== loteId) continue;
    if (!melhor || num(l.valor) > num(melhor.valor)) melhor = l;
  }
  return melhor;
}

const api = {
  round2,
  loteVendido,
  financeiroLote,
  resumoLeilao,
  contasCompradores,
  maiorLance,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}
if (typeof window !== 'undefined') {
  window.Calc = api;
}
