// Aba de Sociedade: participação dos sócios e rateio do resultado.
import { useState } from 'react';
import type { Imovel, Socio } from '../types';
import type { ResumoFinanceiro } from '../utils/finance';
import { formatBRL, formatPct, rateioSocios } from '../utils/finance';
import { novoId, store } from '../utils/storage';
import { ConfirmPopover } from './ui';

export function SociosTab({ imovel, resumo }: { imovel: Imovel; resumo: ResumoFinanceiro }) {
  const [nome, setNome] = useState('');
  const [pct, setPct] = useState('');
  const [aporte, setAporte] = useState('');

  const socios = imovel.socios || [];
  const somaPct = socios.reduce((s, x) => s + (Number(x.percentual) || 0), 0);
  const rateio = rateioSocios(imovel, resumo.vendido ? resumo.lucroBruto : 0);

  async function adicionar() {
    if (!nome.trim() || !(Number(pct) > 0)) return alert('Informe nome e percentual.');
    const novo: Socio = {
      id: novoId('soc'),
      nome: nome.trim(),
      percentual: Number(pct) || 0,
      aporte: Number(aporte) || 0,
    };
    await store.salvarImovel({ ...imovel, socios: [...socios, novo], updatedAt: new Date().toISOString() });
    setNome(''); setPct(''); setAporte('');
  }

  async function remover(id: string) {
    await store.salvarImovel({ ...imovel, socios: socios.filter((s) => s.id !== id), updatedAt: new Date().toISOString() });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h4 className="font-display font-semibold text-slate-800">Quadro societário</h4>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${somaPct === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          Participação total: {formatPct(somaPct)}
        </span>
      </div>

      {socios.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
          Nenhum sócio cadastrado. O investidor é 100% individual.
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
              <th className="py-2">Sócio</th>
              <th className="py-2 text-right">Participação</th>
              <th className="py-2 text-right">Aporte</th>
              <th className="py-2 text-right">Resultado</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rateio.map((s) => (
              <tr key={s.id} className="border-b border-slate-50">
                <td className="py-2.5 font-medium text-slate-700">{s.nome}</td>
                <td className="mono py-2.5 text-right">{formatPct(s.percentual)}</td>
                <td className="mono py-2.5 text-right text-slate-500">{formatBRL(s.aporte || 0)}</td>
                <td className={`mono py-2.5 text-right font-semibold ${s.resultado >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {resumo.vendido ? formatBRL(s.resultado) : '—'}
                </td>
                <td className="py-2.5 text-right">
                  <ConfirmPopover mensagem={`Remover ${s.nome}?`} onConfirm={() => remover(s.id)}>
                    {(abrir) => (
                      <button onClick={abrir} className="text-slate-400 hover:text-red-600">🗑️</button>
                    )}
                  </ConfirmPopover>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Adicionar sócio */}
      <div className="mt-5 grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="label">Nome do sócio</label>
          <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div>
          <label className="label">Participação (%)</label>
          <input className="input mono" type="number" value={pct} onChange={(e) => setPct(e.target.value)} />
        </div>
        <div>
          <label className="label">Aporte (R$)</label>
          <input className="input mono" type="number" value={aporte} onChange={(e) => setAporte(e.target.value)} />
        </div>
        <div className="sm:col-span-4 flex justify-end">
          <button className="btn-primary" onClick={adicionar}>+ Adicionar sócio</button>
        </div>
      </div>

      {!resumo.vendido && (
        <p className="mt-3 text-xs text-slate-400">O rateio de resultado é calculado após a venda do imóvel.</p>
      )}
    </div>
  );
}
