// Formulário (modal) para cadastro e edição de imóveis.
import { useEffect, useState } from 'react';
import type { Imovel } from '../types';
import { IMOVEL_STATUS, ETAPAS_DESOCUPACAO, MODALIDADES } from '../types';
import { Modal } from './ui';
import { novoId, store } from '../utils/storage';
import { formatBRL } from '../utils/finance';
import { comprimirImagem } from '../utils/fotos';
import { toast } from '../utils/toast';

function nowISO() {
  return new Date().toISOString();
}

export function PropertyForm({
  aberto,
  onClose,
  imovelExistente,
}: {
  aberto: boolean;
  onClose: () => void;
  imovelExistente?: Imovel | null;
}) {
  const e = imovelExistente;
  const estadoInicial = (): Partial<Imovel> =>
    e
      ? { ...e, fotos: e.fotos && e.fotos.length ? e.fotos : (e.fotoUrl ? [e.fotoUrl] : []) }
      : { status: 'Arrematado', etapaDesocupacao: 'Não iniciada', imovelResidencial: true, socios: [] };

  const [form, setForm] = useState<Partial<Imovel>>(estadoInicial);

  // Re-sincroniza o formulário sempre que ele é aberto (evita salvar/mostrar
  // um snapshot desatualizado — bug em que o valor de venda "não gravava").
  useEffect(() => {
    if (aberto) setForm(estadoInicial());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, e?.id]);

  function set<K extends keyof Imovel>(k: K, v: Imovel[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function salvar() {
    if (!form.titulo || !form.titulo.trim()) return toast('Informe o título do imóvel.', 'erro');
    // Valores monetários não podem ser negativos.
    const negativos = [
      ['Valor de arrematação', form.valorArrematacao],
      ['Valor de avaliação', form.valorAvaliacao],
      ['Valor de venda', form.valorVenda],
    ].find(([, v]) => Number(v) < 0);
    if (negativos) return toast(`${negativos[0]} não pode ser negativo.`, 'erro');
    // Data de venda não pode ser anterior à arrematação.
    if (form.dataArrematacao && form.dataVenda && form.dataVenda < form.dataArrematacao) {
      return toast('A data de venda não pode ser anterior à data de arrematação.', 'erro');
    }
    const imovel: Imovel = {
      id: e?.id ?? novoId('imv'),
      titulo: form.titulo!.trim(),
      codigoCaixa: form.codigoCaixa || '',
      matricula: form.matricula || '',
      endereco: form.endereco || '',
      cidade: form.cidade || '',
      uf: form.uf || '',
      fotoUrl: (form.fotos && form.fotos[0]) || '',
      fotos: form.fotos || [],
      status: form.status || 'Arrematado',
      etapaDesocupacao: form.etapaDesocupacao || 'Não iniciada',
      modalidade: form.modalidade,
      comprador: form.comprador || '',
      valorArrematacao: Number(form.valorArrematacao) || 0,
      valorAvaliacao: Number(form.valorAvaliacao) || 0,
      valorVenda: Number(form.valorVenda) || 0,
      aliquotaIR: form.aliquotaIR != null ? Number(form.aliquotaIR) : 15,
      comissaoCorretorPct: form.comissaoCorretorPct != null ? Number(form.comissaoCorretorPct) : 5,
      dataArrematacao: form.dataArrematacao || '',
      dataVenda: form.dataVenda || '',
      createdAt: e?.createdAt ?? nowISO(),
      updatedAt: nowISO(),
      socios: form.socios || [],
      imovelResidencial: form.imovelResidencial ?? true,
      reinvestimentoResidencial: form.reinvestimentoResidencial ?? false,
      observacoes: form.observacoes || '',
    };
    await store.salvarImovel(imovel);
    onClose();
  }

  return (
    <Modal aberto={aberto} onClose={onClose} titulo={e ? 'Editar imóvel' : 'Novo imóvel'} largura="max-w-2xl">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="col-span-2">
          <label className="label">Título / Identificação *</label>
          <input className="input" value={form.titulo || ''} onChange={(ev) => set('titulo', ev.target.value)} placeholder="Ex.: Apartamento 302 — Ed. Solar" />
        </div>
        <div>
          <label className="label">Código Caixa</label>
          <input className="input mono" value={form.codigoCaixa || ''} onChange={(ev) => set('codigoCaixa', ev.target.value)} placeholder="8444555..." />
        </div>
        <div>
          <label className="label">Matrícula</label>
          <input className="input" value={form.matricula || ''} onChange={(ev) => set('matricula', ev.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="label">Modalidade de aquisição</label>
          <select className="input" value={form.modalidade || ''} onChange={(ev) => set('modalidade', (ev.target.value || undefined) as Imovel['modalidade'])}>
            <option value="">— selecione —</option>
            {MODALIDADES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">Endereço</label>
          <input className="input" value={form.endereco || ''} onChange={(ev) => set('endereco', ev.target.value)} />
        </div>
        <div>
          <label className="label">Cidade</label>
          <input className="input" value={form.cidade || ''} onChange={(ev) => set('cidade', ev.target.value)} />
        </div>
        <div>
          <label className="label">UF</label>
          <input className="input" maxLength={2} value={form.uf || ''} onChange={(ev) => set('uf', ev.target.value.toUpperCase())} />
        </div>
        <div className="col-span-2">
          <label className="label">Comprador (na revenda)</label>
          <input className="input" value={form.comprador || ''} onChange={(ev) => set('comprador', ev.target.value)} placeholder="Nome do comprador" />
        </div>
        {Number(form.valorAvaliacao) > 0 && (
          <div className="col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <b>Provisao sugerida (15% da avaliacao): {formatBRL(Number(form.valorAvaliacao) * 0.15)}</b> - estimativa para condominio em atraso e tributos do imovel arrematado. Lance como gasto ao confirmar os valores reais.
          </div>
        )}
        <div className="col-span-2">
          <label className="label">Fotos do imovel</label>
          <div className="flex flex-wrap gap-2">
            {(form.fotos || []).map((f, idx) => (
              <div key={idx} className="relative h-20 w-28 overflow-hidden rounded-lg border border-slate-200">
                <img src={f} className="h-full w-full object-cover" />
                {idx === 0 ? (
                  <span className="absolute left-1 top-1 rounded bg-caixa-orange px-1.5 py-0.5 text-[9px] font-bold text-white">PRINCIPAL</span>
                ) : (
                  <button type="button" title="Tornar principal" onClick={() => { const arr = [...(form.fotos || [])]; const [x] = arr.splice(idx, 1); arr.unshift(x); setForm((fm) => ({ ...fm, fotos: arr, fotoUrl: arr[0] })); }} className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white hover:bg-black/80">{"\u2605"}</button>
                )}
                <button type="button" title="Remover" onClick={() => { const arr = (form.fotos || []).filter((_, i2) => i2 !== idx); setForm((fm) => ({ ...fm, fotos: arr, fotoUrl: arr[0] || '' })); }} className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white hover:bg-red-600">{"\u2715"}</button>
              </div>
            ))}
            <label className="flex h-20 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 hover:border-caixa-blue hover:text-caixa-blue">
              <span className="text-xl">{"\ud83d\udcf7"}</span>
              <span className="text-[10px] font-semibold">Adicionar</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={async (ev) => { const files = Array.from(ev.target.files || []); if (!files.length) return; const novas: string[] = []; for (const f of files) { try { novas.push(await comprimirImagem(f)); } catch {} } setForm((fm) => { const arr = [...(fm.fotos || []), ...novas]; return { ...fm, fotos: arr, fotoUrl: arr[0] || '' }; }); ev.target.value = ''; }} />
            </label>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">A primeira foto e a principal. Use {"\u2605"} para tornar principal e {"\u2715"} para remover. Voce pode selecionar varias de uma vez.</p>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={(ev) => set('status', ev.target.value as Imovel['status'])}>
            {IMOVEL_STATUS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Etapa de desocupação</label>
          <select className="input" value={form.etapaDesocupacao} onChange={(ev) => set('etapaDesocupacao', ev.target.value as Imovel['etapaDesocupacao'])}>
            {ETAPAS_DESOCUPACAO.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Valor de arrematação (R$)</label>
          <input className="input mono" type="number" min="0" value={form.valorArrematacao ?? ''} onChange={(ev) => set('valorArrematacao', Number(ev.target.value))} />
        </div>
        <div>
          <label className="label">Valor de avaliação (R$)</label>
          <input className="input mono" type="number" min="0" value={form.valorAvaliacao ?? ''} onChange={(ev) => set('valorAvaliacao', Number(ev.target.value))} />
        </div>
        <div>
          <label className="label">Data de arrematação</label>
          <input className="input" type="date" value={form.dataArrematacao || ''} onChange={(ev) => set('dataArrematacao', ev.target.value)} />
        </div>
        <div>
          <label className="label">Data de venda</label>
          <input className="input" type="date" value={form.dataVenda || ''} onChange={(ev) => set('dataVenda', ev.target.value)} />
        </div>
        <div>
          <label className="label">Valor de venda (R$)</label>
          <input className="input mono" type="number" min="0" value={form.valorVenda ?? ''} onChange={(ev) => set('valorVenda', Number(ev.target.value))} />
        </div>
        <div>
          <label className="label">Alíquota de IR sobre o lucro (%)</label>
          <input className="input mono" type="number" min="0" value={form.aliquotaIR ?? 15} onChange={(ev) => set('aliquotaIR', Number(ev.target.value))} />
        </div>
        <div>
          <label className="label">Comissão do corretor na venda (%)</label>
          <input className="input mono" type="number" min="0" value={form.comissaoCorretorPct ?? 5} onChange={(ev) => set('comissaoCorretorPct', Number(ev.target.value))} />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.imovelResidencial ?? true} onChange={(ev) => set('imovelResidencial', ev.target.checked)} />
            Imóvel residencial
          </label>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button className="btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={salvar}>Salvar imóvel</button>
      </div>
    </Modal>
  );
}
