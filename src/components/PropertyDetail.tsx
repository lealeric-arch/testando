// Detalhamento do ativo com 4 abas financeiras: Gastos, Sociedade, Desocupação e Calculadora GCAP.
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import type { EtapaDesocupacao, Gasto, Imovel, ImovelStatus } from '../types';
import { ETAPAS_DESOCUPACAO, IMOVEL_STATUS } from '../types';
import { formatBRL, formatPct, resultadoImovel, resumoFinanceiro } from '../utils/finance';
import { store } from '../utils/storage';
import { notificar, permissaoAtual } from '../utils/notifications';
import { obterFotoImovel } from '../utils/images';
import { exportarPlanilhaExcel } from '../utils/excelExport';
import { ConfirmPopover, StatusBadge, EtapaBadge, Thumb } from './ui';
import { PropertyForm } from './PropertyForm';
import { GastosTab } from './GastosTab';
import { ResultadoTab } from './ResultadoTab';
import { SociosTab } from './SociosTab';
import { GcapTab } from './GcapTab';
import { ReportView } from './ReportView';

type SubAba = 'gastos' | 'resultado' | 'sociedade' | 'desocupacao' | 'gcap';

export function PropertyDetail({
  imovel,
  gastos,
  onVoltar,
}: {
  imovel: Imovel;
  gastos: Gasto[];
  onVoltar: () => void;
}) {
  const [sub, setSub] = useState<SubAba>('gastos');
  const [fotoAtiva, setFotoAtiva] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const galeria = imovel.fotos && imovel.fotos.length ? imovel.fotos : (imovel.fotoUrl ? [imovel.fotoUrl] : []);
  const [editando, setEditando] = useState(false);
  const [relatorioAberto, setRelatorioAberto] = useState(false);

  const gastosDoImovel = useMemo(() => gastos.filter((g) => g.imovelId === imovel.id), [gastos, imovel.id]);
  const resumo = resumoFinanceiro(imovel, gastos);
  const resultado = resultadoImovel(imovel, gastos);

  async function atualizarStatus(status: ImovelStatus) {
    await store.salvarImovel({ ...imovel, status, updatedAt: new Date().toISOString() });
    if (permissaoAtual() === 'granted') {
      notificar({ titulo: 'Status atualizado', corpo: `${imovel.titulo} → ${status}`, tag: `status:${imovel.id}` });
    }
  }

  async function atualizarEtapa(etapa: EtapaDesocupacao) {
    await store.salvarImovel({ ...imovel, etapaDesocupacao: etapa, updatedAt: new Date().toISOString() });
    if (permissaoAtual() === 'granted') {
      notificar({ titulo: 'Nova etapa de desocupação', corpo: `${imovel.titulo}: ${etapa}`, tag: `etapa:${imovel.id}` });
    }
  }

  const subAbas: { id: SubAba; label: string; icone: string }[] = [
    { id: 'gastos', label: 'Gastos', icone: '💸' },
    { id: 'resultado', label: 'Resultado', icone: '📈' },
    { id: 'sociedade', label: 'Sociedade', icone: '🤝' },
    { id: 'desocupacao', label: 'Desocupação', icone: '⚖️' },
    { id: 'gcap', label: 'Calculadora GCAP', icone: '🧮' },
  ];

  return (
    <div className="space-y-6">
      <button onClick={onVoltar} className="text-sm text-slate-500 hover:text-caixa-blue">
        ← Voltar ao portfólio
      </button>

      {/* Cabeçalho do imóvel */}
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-4 p-6 sm:flex-row">
          <div className="w-full shrink-0 sm:w-64">
            <div className="h-40 w-full cursor-zoom-in overflow-hidden rounded-lg bg-slate-100" onClick={() => galeria.length && setLightbox(true)} title="Ampliar">
              <Thumb src={fotoAtiva || obterFotoImovel(imovel.id + (imovel.endereco || ''), imovel.fotoUrl)} alt={imovel.titulo} className="h-full w-full object-cover" />
            </div>
            {galeria.length > 1 && (
              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
                {galeria.map((f, i2) => (
                  <img key={i2} src={f} onClick={() => setFotoAtiva(f)} className={"h-12 w-16 shrink-0 cursor-pointer rounded border-2 object-cover " + ((fotoAtiva || galeria[0]) === f ? "border-caixa-orange" : "border-transparent opacity-80 hover:opacity-100")} />
                ))}
              </div>
            )}
            {lightbox && galeria.length > 0 && (
              <div className="fixed inset-0 z-[80] flex cursor-zoom-out items-center justify-center bg-black/85 p-6" onClick={() => setLightbox(false)}>
                <img src={fotoAtiva || galeria[0]} className="max-h-full max-w-full rounded-lg object-contain" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-800">{imovel.titulo}{(imovel.endereco || imovel.cidade) && (<a href={"https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent([imovel.endereco, imovel.cidade, imovel.uf].filter(Boolean).join(", "))} target="_blank" rel="noreferrer" title="Abrir no Google Maps" className="ml-2 inline-block align-middle text-base">{"\ud83d\udccd"}</a>)}</h2>
                <p className="text-sm text-slate-500">
                  {imovel.endereco}
                  {imovel.cidade ? ` — ${imovel.cidade}/${imovel.uf}` : ''}
                </p>
                {imovel.codigoCaixa && (
                  <p className="mono mt-1 text-xs text-slate-400">
                    Cód. Caixa: {imovel.codigoCaixa} {imovel.matricula ? `· Matrícula ${imovel.matricula}` : ''}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn-ghost" onClick={() => exportarPlanilhaExcel(imovel, gastosDoImovel)}>⬇ Excel</button>
                <button className="btn-ghost" onClick={() => setRelatorioAberto(true)}>🖨️ Relatório</button>
                <button className="btn-ghost" onClick={() => setEditando(true)}>Editar</button>
                <ConfirmPopover
                  mensagem={`Excluir "${imovel.titulo}" e todos os gastos vinculados?`}
                  onConfirm={async () => {
                    await store.excluirImovel(imovel.id);
                    onVoltar();
                  }}
                >
                  {(abrir) => (
                    <button onClick={abrir} className="btn-ghost !text-red-600">
                      🗑️ Excluir
                    </button>
                  )}
                </ConfirmPopover>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div>
                <label className="label">Status</label>
                <select className="input !py-1 text-sm" value={imovel.status} onChange={(e) => atualizarStatus(e.target.value as ImovelStatus)}>
                  {IMOVEL_STATUS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="pt-5">
                <StatusBadge status={imovel.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Faixa de KPIs do imóvel (modelo da planilha) */}
        <div className="grid grid-cols-2 divide-slate-100 border-t border-slate-100 sm:grid-cols-4 sm:divide-x">
          <MiniKpi label="Total investido" valor={formatBRL(resultado.totalInvestido)} cor="text-caixa-blue" />
          <MiniKpi label="Valor de venda" valor={formatBRL(resultado.valorVenda)} cor="text-caixa-orange-dark" />
          <MiniKpi
            label="Lucro líquido"
            valor={resultado.vendido ? formatBRL(resultado.lucroLiquido) : '—'}
            cor={resultado.lucroLiquido >= 0 ? 'text-emerald-600' : 'text-red-600'}
          />
          <MiniKpi
            label="ROI"
            valor={resultado.vendido ? formatPct(resultado.roi) : '—'}
            cor={resultado.roi >= 0 ? 'text-emerald-600' : 'text-slate-600'}
          />
        </div>
      </div>

      {/* Sub-abas financeiras */}
      <div className="card">
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3">
          {subAbas.map((s) => (
            <button
              key={s.id}
              onClick={() => setSub(s.id)}
              className={`relative shrink-0 px-4 py-3 text-sm font-medium transition ${
                sub === s.id ? 'text-caixa-blue' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="mr-1">{s.icone}</span>
              {s.label}
              {sub === s.id && (
                <motion.div layoutId="subaba-ativa" className="absolute inset-x-3 bottom-0 h-0.5 rounded bg-caixa-orange" />
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={sub}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {sub === 'gastos' && <GastosTab imovel={imovel} gastos={gastosDoImovel} />}
              {sub === 'resultado' && <ResultadoTab imovel={imovel} gastos={gastosDoImovel} />}
              {sub === 'sociedade' && <SociosTab imovel={imovel} resumo={resumo} />}
              {sub === 'desocupacao' && (
                <DesocupacaoTab imovel={imovel} onEtapa={atualizarEtapa} />
              )}
              {sub === 'gcap' && <GcapTab imovel={imovel} gastos={gastosDoImovel} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <PropertyForm aberto={editando} onClose={() => setEditando(false)} imovelExistente={imovel} />
      <ReportView aberto={relatorioAberto} onClose={() => setRelatorioAberto(false)} imovel={imovel} gastos={gastosDoImovel} />
    </div>
  );
}

function MiniKpi({ label, valor, cor = 'text-slate-800' }: { label: string; valor: string; cor?: string }) {
  return (
    <div className="p-4">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mono mt-1 font-display text-lg font-bold ${cor}`}>{valor}</p>
    </div>
  );
}

// ---- Aba Desocupação ----
function DesocupacaoTab({ imovel, onEtapa }: { imovel: Imovel; onEtapa: (e: EtapaDesocupacao) => void }) {
  const idxAtual = ETAPAS_DESOCUPACAO.indexOf(imovel.etapaDesocupacao);
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm text-slate-500">Etapa atual:</span>
        <EtapaBadge etapa={imovel.etapaDesocupacao} />
      </div>

      {imovel.etapaDesocupacao === 'Liminar / Mandado' && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          ⚖️ <strong>Atenção crítica:</strong> imóvel em fase de Liminar / Mandado. Acompanhe de perto o cumprimento judicial.
        </div>
      )}

      <ol className="relative space-y-4 border-l-2 border-slate-100 pl-6">
        {ETAPAS_DESOCUPACAO.map((etapa, i) => {
          const concluida = i < idxAtual;
          const atual = i === idxAtual;
          return (
            <li key={etapa} className="relative">
              <span
                className={`absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  atual ? 'bg-caixa-orange text-white' : concluida ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                }`}
              >
                {concluida ? '✓' : i + 1}
              </span>
              <button
                onClick={() => onEtapa(etapa)}
                className={`text-left text-sm transition ${
                  atual ? 'font-semibold text-slate-800' : 'text-slate-500 hover:text-caixa-blue'
                }`}
              >
                {etapa}
              </button>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-xs text-slate-400">Clique em uma etapa para atualizar. Uma notificação é disparada a cada avanço.</p>
    </div>
  );
}
