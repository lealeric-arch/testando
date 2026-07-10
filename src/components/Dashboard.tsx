// Dashboard de performance financeira, KPIs e painel de alertas operacionais críticos.
import { motion } from 'motion/react';
import { useState } from 'react';
import type { Gasto, Imovel } from '../types';
import { formatBRL, formatPct, resumoPortfolio } from '../utils/finance';
import { gerarAlertas } from '../utils/alerts';
import { ExportModal } from './ExportModal';

function KPI({
  label,
  valor,
  cor = 'text-slate-800',
  sub,
}: {
  label: string;
  valor: string;
  cor?: string;
  sub?: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 font-display text-2xl font-bold ${cor}`}>{valor}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export function Dashboard({
  imoveis,
  gastos,
  onAbrirImovel,
  onIrPortfolio,
}: {
  imoveis: Imovel[];
  gastos: Gasto[];
  onAbrirImovel: (id: string) => void;
  onIrPortfolio: () => void;
}) {
  const r = resumoPortfolio(imoveis, gastos);
  const alertas = gerarAlertas(imoveis);
  const [exportAberto, setExportAberto] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-sm text-slate-500">Performance da carteira de imóveis arrematados.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => setExportAberto(true)}>⬇ Exportar</button>
          <button className="btn-primary" onClick={onIrPortfolio}>
            Ver portfólio →
          </button>
        </div>
      </div>
      <ExportModal aberto={exportAberto} onClose={() => setExportAberto(false)} imoveis={imoveis} gastos={gastos} />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Capital investido" valor={formatBRL(r.capitalInvestido)} cor="text-caixa-blue" sub={`${r.totalImoveis} imóveis`} />
        <KPI label="Lucro realizado" valor={formatBRL(r.lucroRealizado)} cor="text-emerald-600" sub={`${r.vendidos} vendidos`} />
        <KPI label="ROI médio" valor={formatPct(r.roiMedio)} cor={r.roiMedio >= 0 ? 'text-emerald-600' : 'text-red-600'} />
        <KPI label="Carteira em estoque" valor={formatBRL(r.valorEstimadoCarteira)} cor="text-caixa-orange-dark" sub={`${r.emEstoque} em estoque`} />
      </div>

      {/* Painel de alertas operacionais críticos */}
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-lg">🚨</span>
          <h3 className="font-display text-lg font-semibold text-slate-800">Alertas operacionais críticos</h3>
          {alertas.length > 0 && (
            <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
              {alertas.length}
            </span>
          )}
        </div>

        {alertas.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
            ✅ Nenhum alerta crítico no momento.
          </div>
        ) : (
          <div className="space-y-3">
            {alertas.map((a, i) => (
              <motion.button
                key={a.id}
                onClick={() => onAbrirImovel(a.imovelId)}
                className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition hover:shadow-sm ${
                  a.severidade === 'alta'
                    ? 'border-red-200 bg-red-50'
                    : 'border-amber-200 bg-amber-50'
                }`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <span className="text-xl">{a.tipo === 'liminar' ? '⚖️' : '📦'}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800">{a.titulo}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        a.severidade === 'alta' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                      }`}
                    >
                      {a.severidade === 'alta' ? 'Alta' : 'Média'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600">{a.descricao}</p>
                </div>
                <span className="text-slate-400">→</span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
