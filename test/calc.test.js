// Testes da lógica financeira (node test/calc.test.js). Sem dependências externas.
const assert = require('assert');
const Calc = require('../src/calc');

let passed = 0;
function test(nome, fn) {
  fn();
  passed++;
  console.log('  ok -', nome);
}

const leilao = { comissaoCompradorPct: 5, comissaoVendedorPct: 10 };

test('financeiroLote calcula comissões e totais', () => {
  const f = Calc.financeiroLote({ valorArremate: 1000 }, leilao);
  assert.strictEqual(f.martelo, 1000);
  assert.strictEqual(f.comissaoComprador, 50);
  assert.strictEqual(f.totalComprador, 1050);
  assert.strictEqual(f.comissaoVendedor, 100);
  assert.strictEqual(f.repasseVendedor, 900);
  assert.strictEqual(f.receitaLeiloeiro, 150);
});

test('financeiroLote arredonda a 2 casas', () => {
  const f = Calc.financeiroLote({ valorArremate: 333.33 }, { comissaoCompradorPct: 5 });
  assert.strictEqual(f.comissaoComprador, 16.67);
});

test('loteVendido reconhece apenas vendidos com valor', () => {
  assert.strictEqual(Calc.loteVendido({ status: 'vendido', valorArremate: 10 }), true);
  assert.strictEqual(Calc.loteVendido({ status: 'vendido', valorArremate: 0 }), false);
  assert.strictEqual(Calc.loteVendido({ status: 'aberto', valorArremate: 10 }), false);
});

test('resumoLeilao agrega apenas lotes vendidos', () => {
  const lotes = [
    { status: 'vendido', valorArremate: 1000 },
    { status: 'vendido', valorArremate: 2000 },
    { status: 'aberto', valorArremate: 0 },
    { status: 'nao_vendido', valorArremate: 0 },
  ];
  const r = Calc.resumoLeilao(leilao, lotes);
  assert.strictEqual(r.lotesTotal, 4);
  assert.strictEqual(r.lotesVendidos, 2);
  assert.strictEqual(r.martelo, 3000);
  assert.strictEqual(r.comissaoComprador, 150);
  assert.strictEqual(r.comissaoVendedor, 300);
  assert.strictEqual(r.receitaLeiloeiro, 450);
  assert.strictEqual(r.taxaVenda, 50);
});

test('contasCompradores agrupa por arrematante', () => {
  const clientes = [{ id: 'c1', nome: 'Ana' }, { id: 'c2', nome: 'Bruno' }];
  const lotes = [
    { status: 'vendido', valorArremate: 1000, arrematanteId: 'c1' },
    { status: 'vendido', valorArremate: 500, arrematanteId: 'c1' },
    { status: 'vendido', valorArremate: 2000, arrematanteId: 'c2' },
  ];
  const contas = Calc.contasCompradores(leilao, lotes, clientes);
  assert.strictEqual(contas.length, 2);
  assert.strictEqual(contas[0].nome, 'Bruno'); // ordenado por total desc
  assert.strictEqual(contas[0].total, 2100);
  const ana = contas.find((c) => c.nome === 'Ana');
  assert.strictEqual(ana.lotes, 2);
  assert.strictEqual(ana.martelo, 1500);
  assert.strictEqual(ana.total, 1575);
});

test('maiorLance retorna o maior valor do lote', () => {
  const lances = [
    { loteId: 'L1', valor: 100 },
    { loteId: 'L1', valor: 300 },
    { loteId: 'L2', valor: 999 },
  ];
  assert.strictEqual(Calc.maiorLance('L1', lances).valor, 300);
  assert.strictEqual(Calc.maiorLance('L3', lances), null);
});

console.log(`\n${passed} testes passaram.`);
