// Calculadora Progressiva de Ganho de Capital (GCAP) integrada ao imóvel.
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import type { Gasto, Imovel } from '../types';
import { formatBRL, formatPct, gastoEhDedutivel } from '../utils/finance';
import { calcularGCAP } from '../utils/gcap';
import { store } from '../utils/storage';

function Linha({ label, valor, forte = false, cor = 'text-slate-700' }: { label: string; valor: string; forte?: boolean; cor?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-50 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`mono ${forte ? 'font-bold' : 'font-medium'} ${cor}`}>{valor}</span>
    </div>
  );
}

export function GcapTab({ imovel, gastos }: { imovel: Imovel; gastos: Gasto[] }) {
  // Valor de venda editável (usa o do imóvel como padrão).
  const [valorVenda, setValorVenda] = useState<number>(imovel.valorVenda || imovel.valorAvaliacao || 0);
  const [reinvest, setReinvest] = useState<boolean>(imovel.reinvestimentoResidencial ?? false);

  const despesasDedutiveis = useMemo(
    () => gastos.filter(gastoEhDedutivel).reduce((s, g) => s + (Number(g.valor) || 0), 0),
    [gastos],
  );

  const dataVenda = imovel.dataVenda || new Date().toISOString().slice(0, 10);

  const gcap = useMemo(
    () =>
      calcularGCAP({
        valorVenda,
        custoAquisicao: imovel.valorArrematacao || 0,
        despesasDedutiveis,
        dataAquisicao: imovel.dataArrematacao,
        dataVenda,
        isencaoReinvestimento: reinvest,
        imovelResidencial: imovel.imovelResidencial ?? true,
      }),
    [valorVenda, despesasDedutiveis, imovel, dataVenda, reinvest],
  );

  const maxBase = Math.max(1, ...gcap.faixas.map((f) => f.base));

  async function salvarReinvest(v: boolean) {
    setReinvest(v);
    await store.salvarImovel({ ...imovel, reinvestimentoResidencial: v, updatedAt: new Date().toISOString() });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Coluna de parâmetros */}
      <div className="space-y-4">
        <h4 className="font-display font-semibold text-slate-800">Parâmetros do cálculo</h4>

        <div>
          <label className="label">Valor de venda estimado (R$)</label>
          <input className="input mono" type="number" value={valorVenda || ''} onChange={(e) => setValorVenda(Number(e.target.value))} />
        </div>

        <div className="rounded-lg bg-slate-50 p-4 text-sm">
          <Linha label="Custo de aquisição (arrematação)" valor={formatBRL(imovel.valorArrematacao || 0)} />
          <Linha label="Despesas dedutíveis (ITBI, registro, reforma...)" valor={formatBRL(despesasDedutiveis)} cor="text-caixa-orange-dark" />
          <Linha label="Custo corrigido" valor={formatBRL(gcap.custoCorrigido)} forte cor="text-caixa-blue" />
          <Linha label="Meses de posse" valor={`${gcap.mesesPosse} meses`} />
        </div>

        <div className="rounded-lg border border-slate-200 p-4">
          <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Fatores Lei do Bem (Lei 11.196/2005)</p>
          <Linha label="FR1 (aquisição até dez/2005)" valor={gcap.fr1.toFixed(4)} />
          <Linha label="FR2 (dez/2005 até a venda)" valor={gcap.fr2.toFixed(4)} />
          <Linha label="Fator de redução total" valor={gcap.fatorReducaoTotal.toFixed(4)} forte cor="text-emerald-600" />
        </div>

        <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
          <input type="checkbox" checked={reinvest} onChange={(e) => salvarReinvest(e.target.checked)} />
          Isenção por reinvestimento residencial em até 180 dias (art. 39)
        </label>
      </div>

      {/* Coluna de resultado */}
      <div className="space-y-4">
        <h4 className="font-display font-semibold text-slate-800">Resultado tributário</h4>

        <div className="rounded-lg bg-slate-50 p-4">
          <Linha label="Ganho de capital bruto" valor={formatBRL(gcap.ganhoBruto)} forte />
          <Linha label="Ganho após Lei do Bem" valor={formatBRL(gcap.ganhoReduzido)} cor="text-emerald-600" />
          <Linha label="Base tributável" valor={formatBRL(gcap.ganhoTributavel)} forte cor="text-caixa-blue" />
        </div>

        {gcap.isento ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            ✅ {gcap.motivoIsencao}
          </div>
        ) : (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
              Alíquotas progressivas — Lei 13.259/2016
            </p>
            {gcap.faixas.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
                Sem ganho tributável.
              </p>
            ) : (
              <div className="space-y-2">
                {gcap.faixas.map((f, i) => (
                  <div key={f.faixa}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-slate-500">{f.faixa} · <span className="font-semibold text-slate-700">{formatPct(f.aliquota)}</span></span>
                      <span className="mono text-slate-600">{formatBRL(f.imposto)}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <motion.div
                        className="h-full rounded-full bg-caixa-blue"
                        initial={{ width: 0 }}
                        animate={{ width: `${(f.base / maxBase) * 100}%` }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="rounded-lg bg-caixa-blue p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-white/70">Imposto sobre ganho de capital</p>
              <p className="mono font-display text-2xl font-bold">{formatBRL(gcap.impostoTotal)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/70">Alíquota efetiva</p>
              <p className="mono text-lg font-semibold">{formatPct(gcap.aliquotaEfetiva)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-emerald-800">Líquido após imposto</p>
            <p className="mono font-display text-xl font-bold text-emerald-700">{formatBRL(gcap.liquidoAposImposto)}</p>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          Estimativa para planejamento. Confirme sempre com a legislação vigente e um contador.
        </p>
      </div>
    </div>
  );
}
