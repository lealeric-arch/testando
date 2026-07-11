// Aba de Sociedade: participação no imóvel × no lucro, papel e rateio do resultado.
import { useState } from 'react';
import type { Imovel, PapelSocio, Socio } from '../types';
import { PAPEIS_SOCIO } from '../types';
import type { ResumoFinanceiro } from '../utils/finance';
import { formatBRL, formatPct, rateioSocios } from '../utils/finance';
import { novoId, store } from '../utils/storage';
import { ConfirmPopover } from './ui';

export function SociosTab({ imovel, resumo }: { imovel: Imovel; resumo: ResumoFinanceiro }) {
  const [nome, setNome] = useState('');
  const [pctImovel, setPctImovel] = useState('');
  const [pctLucro, setPctLucro] = useState('');
  const [papel, setPapel] = useState<PapelSocio>('Investidor');
  const [aporte, setAporte] = useState('');

  const MAX_SOCIOS = 5;
  const socios = imovel.socios || [];
  const partImovel = (s: Socio) => (s.participacaoImovel != null ? Number(s.participacaoImovel) : Number(s.percentual) || 0);
  const partLucro = (s: Socio) => (s.participacaoLucro != null ? Number(s.participacaoLucro) : Number(s.percentual) || 0);
  const somaImovel = socios.reduce((s, x) => s + partImovel(x), 0);
  const somaLucro = socios.reduce((s, x) => s + partLucro(x), 0);
  const rateio = rateioSocios(imovel, resumo.vendido ? resumo.lucroBruto : 0);
  const limiteAtingido = socios.length >= MAX_SOCIOS;

  async function adicionar() {
    if (limiteAtingido) return alert(`Máximo de ${MAX_SOCIOS} sócios por arrematação.`);
    if (!nome.trim() || !(Number(pctImovel) > 0 || Number(pctLucro) > 0)) return alert('Informe nome e participação.');
    const pi = Number(pctImovel) || 0;
    const pl = Number(pctLucro) || pi;
    const novo: Socio = {
      id: novoId('soc'),
      nome: nome.trim(),
      percentual: pl,
      participacaoImovel: pi,
      participacaoLucro: pl,
      papel,
      aporte: Number(aporte) || 0,
    };
    await store.salvarImovel({ ...imovel, socios: [...socios, novo], updatedAt: new Date().toISOString() });
    setNome(''); setPctImovel(''); setPctLucro(''); setAporte(''); setPapel('Investidor');
  }

  async function remover(id: string) {
    await store.salvarImovel({ ...imovel, socios: socios.filter((s) => s.id !== id), updatedAt: new Date().toISOString() });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-display font-semibold text-slate-800">Quadro societário</h4>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
            {socios.length}/{MAX_SOCIOS} sócios
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${somaImovel <= 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            Imóvel: {formatPct(somaImovel)} · Você {formatPct(Math.max(0, 100 - somaImovel))}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${somaLucro <= 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            Lucro: {formatPct(somaLucro)} · Você {formatPct(Math.max(0, 100 - somaLucro))}
          </span>
        </div>
      </div>

      {socios.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
          Nenhum sócio cadastrado. O investidor é 100% individual.
        </div>
      ) : (
        <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
              <th className="py-2">Sócio</th>
              <th className="py-2">Papel</th>
              <th className="py-2 text-right">% Imóvel</th>
              <th className="py-2 text-right">% Lucro</th>
              <th className="py-2 text-right">Aporte</th>
              <th className="py-2 text-right">Resultado</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {socios.map((s) => {
              const res = rateio.find((x) => x.id === s.id);
              return (
                <tr key={s.id} className="border-b border-slate-50">
                  <td className="py-2.5 font-medium text-slate-700">{s.nome}</td>
                  <td className="py-2.5 text-slate-500">{s.papel || 'Investidor'}</td>
                  <td className="mono py-2.5 text-right">{formatPct(partImovel(s))}</td>
                  <td className="mono py-2.5 text-right">{formatPct(partLucro(s))}</td>
                  <td className="mono py-2.5 text-right text-slate-500">{formatBRL(s.aporte || 0)}</td>
                  <td className={`mono py-2.5 text-right font-semibold ${(res?.resultado || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {resumo.vendido ? formatBRL(res?.resultado || 0) : '—'}
                  </td>
                  <td className="py-2.5 text-right">
                    <ConfirmPopover mensagem={`Remover ${s.nome}?`} onConfirm={() => remover(s.id)}>
                      {(abrir) => (
                        <button onClick={abrir} className="text-slate-400 hover:text-red-600">🗑️</button>
                      )}
                    </ConfirmPopover>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}

      {/* Adicionar sócio */}
      {limiteAtingido ? (
        <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
          Limite de {MAX_SOCIOS} sócios por arrematação atingido.
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-6">
          <div className="sm:col-span-2">
            <label className="label">Nome do sócio</label>
            <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <label className="label">Papel</label>
            <select className="input" value={papel} onChange={(e) => setPapel(e.target.value as PapelSocio)}>
              {PAPEIS_SOCIO.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">% Imóvel</label>
            <input className="input mono" type="number" value={pctImovel} onChange={(e) => setPctImovel(e.target.value)} />
          </div>
          <div>
            <label className="label">% Lucro</label>
            <input className="input mono" type="number" value={pctLucro} onChange={(e) => setPctLucro(e.target.value)} placeholder="= % imóvel" />
          </div>
          <div>
            <label className="label">Aporte (R$)</label>
            <input className="input mono" type="number" value={aporte} onChange={(e) => setAporte(e.target.value)} />
          </div>
          <div className="sm:col-span-6 flex justify-end">
            <button className="btn-primary" onClick={adicionar}>+ Adicionar sócio</button>
          </div>
        </div>
      )}

      {!resumo.vendido && (
        <p className="mt-3 text-xs text-slate-400">O rateio de resultado é calculado após a venda do imóvel.</p>
      )}
    </div>
  );
}
