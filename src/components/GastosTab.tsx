// Aba de Gastos com edição inline no próprio card e recálculo instantâneo.
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import type { Gasto, GastoCategoria, Imovel } from '../types';
import { GASTO_CATEGORIAS } from '../types';
import { formatBRL, gastoEhDedutivel } from '../utils/finance';
import { novoId, store } from '../utils/storage';
import { ConfirmPopover } from './ui';

function GastoEditor({
  gasto,
  imovelId,
  onFechar,
}: {
  gasto?: Gasto;
  imovelId: string;
  onFechar: () => void;
}) {
  const [f, setF] = useState<Partial<Gasto>>(
    gasto ?? { categoria: 'Reforma', data: new Date().toISOString().slice(0, 10), valor: 0 },
  );

  async function salvar() {
    if (!f.descricao || !f.descricao.trim()) return alert('Informe a descrição.');
    if (!(Number(f.valor) > 0)) return alert('Informe um valor válido.');
    const novo: Gasto = {
      id: gasto?.id ?? novoId('gst'),
      imovelId,
      categoria: (f.categoria as GastoCategoria) || 'Outros',
      descricao: f.descricao!.trim(),
      valor: Number(f.valor) || 0,
      data: f.data || new Date().toISOString().slice(0, 10),
      responsavel: f.responsavel || '',
      dedutivelGCAP: f.dedutivelGCAP,
    };
    await store.salvarGasto(novo);
    onFechar();
  }

  return (
    <div className="grid grid-cols-2 gap-3 rounded-lg border border-caixa-blue/30 bg-caixa-blue/5 p-4">
      <div className="col-span-2">
        <label className="label">Descrição</label>
        <input className="input" value={f.descricao || ''} onChange={(e) => setF({ ...f, descricao: e.target.value })} autoFocus />
      </div>
      <div>
        <label className="label">Categoria</label>
        <select className="input" value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value as GastoCategoria })}>
          {GASTO_CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Valor (R$)</label>
        <input className="input mono" type="number" value={f.valor ?? ''} onChange={(e) => setF({ ...f, valor: Number(e.target.value) })} />
      </div>
      <div>
        <label className="label">Data</label>
        <input className="input" type="date" value={f.data || ''} onChange={(e) => setF({ ...f, data: e.target.value })} />
      </div>
      <div>
        <label className="label">Responsável pelo pagamento</label>
        <input className="input" value={f.responsavel || ''} onChange={(e) => setF({ ...f, responsavel: e.target.value })} />
      </div>
      <div className="col-span-2 flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={f.dedutivelGCAP ?? gastoEhDedutivel(f as Gasto)}
            onChange={(e) => setF({ ...f, dedutivelGCAP: e.target.checked })}
          />
          Dedutível no Ganho de Capital (GCAP)
        </label>
        <div className="flex gap-2">
          <button className="btn-ghost !py-1.5 !text-xs" onClick={onFechar}>Cancelar</button>
          <button className="btn-primary !py-1.5 !text-xs" onClick={salvar}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

export function GastosTab({ imovel, gastos }: { imovel: Imovel; gastos: Gasto[] }) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [novo, setNovo] = useState(false);

  const ordenados = [...gastos].sort((a, b) => (b.data || '').localeCompare(a.data || ''));
  const total = gastos.reduce((s, g) => s + (Number(g.valor) || 0), 0);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{gastos.length} lançamento(s)</p>
          <p className="mono font-display text-xl font-bold text-caixa-orange-dark">{formatBRL(total)}</p>
        </div>
        <button className="btn-orange" onClick={() => { setNovo(true); setEditandoId(null); }}>
          + Novo gasto
        </button>
      </div>

      <AnimatePresence>
        {novo && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4">
            <GastoEditor imovelId={imovel.id} onFechar={() => setNovo(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {ordenados.length === 0 && !novo ? (
        <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
          Nenhum gasto registrado.
        </div>
      ) : (
        <div className="space-y-2">
          {ordenados.map((g) => (
            <div key={g.id} className="rounded-lg border border-slate-200 p-3">
              {editandoId === g.id ? (
                <GastoEditor gasto={g} imovelId={imovel.id} onFechar={() => setEditandoId(null)} />
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{g.categoria}</span>
                      {gastoEhDedutivel(g) && (
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700" title="Dedutível no GCAP">
                          GCAP
                        </span>
                      )}
                      <p className="truncate text-sm font-medium text-slate-800">{g.descricao}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {g.data ? new Date(g.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                      {g.responsavel ? ` · ${g.responsavel}` : ''}
                    </p>
                  </div>
                  <span className="mono shrink-0 font-semibold text-slate-700">{formatBRL(g.valor)}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => { setEditandoId(g.id); setNovo(false); }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-caixa-blue"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <ConfirmPopover mensagem="Excluir este gasto?" onConfirm={() => store.excluirGasto(g.id)}>
                      {(abrir) => (
                        <button onClick={abrir} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="Excluir">
                          🗑️
                        </button>
                      )}
                    </ConfirmPopover>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
