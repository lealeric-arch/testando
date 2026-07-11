// Aba Resultado — replica o modelo da planilha "Controle de Leilões":
// aquisição → total investido → venda → saldo líquido → resultado (IR) → divisão entre sócios.
import type { Gasto, Imovel } from '../types';
import { faseDoGasto } from '../utils/finance';
import { formatBRL, formatPct, rateioSocios, resultadoImovel } from '../utils/finance';

function Linha({
  label,
  valor,
  forte = false,
  cor = 'text-slate-700',
  recuo = false,
  destaque = false,
}: {
  label: string;
  valor: string;
  forte?: boolean;
  cor?: string;
  recuo?: boolean;
  destaque?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-2 text-sm ${
        destaque ? 'rounded-lg bg-slate-100' : 'border-b border-slate-50'
      }`}
    >
      <span className={`${recuo ? 'pl-4 text-slate-500' : 'font-medium text-slate-700'}`}>{label}</span>
      <span className={`mono ${forte ? 'font-bold' : ''} ${cor}`}>{valor}</span>
    </div>
  );
}

function Secao({ titulo }: { titulo: string }) {
  return (
    <div className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-caixa-blue">{titulo}</div>
  );
}

export function ResultadoTab({ imovel, gastos }: { imovel: Imovel; gastos: Gasto[] }) {
  const r = resultadoImovel(imovel, gastos);
  const doImovel = gastos.filter((g) => g.imovelId === imovel.id);

  // Agrupa custos de aquisição por categoria (linhas da planilha).
  const aquisicaoPorCat = new Map<string, number>();
  const vendaPorCat = new Map<string, number>();
  for (const g of doImovel) {
    const alvo = faseDoGasto(g.categoria) === 'venda' ? vendaPorCat : aquisicaoPorCat;
    alvo.set(g.categoria, (alvo.get(g.categoria) || 0) + (Number(g.valor) || 0));
  }

  const rateio = rateioSocios(imovel, r.lucroLiquido);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Coluna esquerda: aquisição e venda */}
      <div className="rounded-xl border border-slate-200">
        <Secao titulo="Aquisição (custos de compra)" />
        <Linha label="Arrematação" valor={formatBRL(r.arrematacao)} recuo />
        {Array.from(aquisicaoPorCat.entries()).map(([cat, val]) => (
          <Linha key={cat} label={cat} valor={formatBRL(val)} recuo />
        ))}
        <Linha label="TOTAL INVESTIDO" valor={formatBRL(r.totalInvestido)} forte cor="text-caixa-blue" destaque />

        <Secao titulo="Venda" />
        <Linha label="Valor de venda" valor={formatBRL(r.valorVenda)} recuo cor="text-emerald-600" />
        {Array.from(vendaPorCat.entries()).map(([cat, val]) => (
          <Linha key={cat} label={cat} valor={`- ${formatBRL(val)}`} recuo />
        ))}
        <Linha label="Custos de venda" valor={formatBRL(r.custosVenda)} recuo />
        <Linha label="Saldo líquido da venda" valor={formatBRL(r.saldoLiquidoVenda)} forte destaque />
      </div>

      {/* Coluna direita: resultado e divisão */}
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200">
          <Secao titulo="Resultado" />
          <Linha label="Lucro bruto" valor={formatBRL(r.lucroBruto)} recuo cor={r.lucroBruto >= 0 ? 'text-emerald-600' : 'text-red-600'} />
          <Linha label={`Imposto IR (${formatPct(r.aliquotaIR)})`} valor={`- ${formatBRL(r.impostoIR)}`} recuo cor="text-red-600" />
          <Linha label="LUCRO LÍQUIDO" valor={formatBRL(r.lucroLiquido)} forte cor="text-emerald-700" destaque />
          <Linha label="ROI (lucro / investido)" valor={formatPct(r.roi)} recuo cor={r.roi >= 0 ? 'text-emerald-600' : 'text-red-600'} />
        </div>

        {!r.vendido && (
          <p className="px-1 text-xs text-slate-400">
            O resultado (venda, IR e ROI) é calculado quando o imóvel é marcado como <strong>Vendido</strong> com valor de venda informado.
          </p>
        )}

        {rateio.length > 0 && (
          <div className="rounded-xl border border-slate-200">
            <Secao titulo="Divisão entre sócios" />
            {rateio.map((s) => (
              <Linha
                key={s.id}
                label={`${s.nome} (${formatPct(s.percentual)})`}
                valor={r.vendido ? formatBRL(s.resultado) : '—'}
                recuo
                cor={s.resultado >= 0 ? 'text-emerald-600' : 'text-red-600'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
