// Formulário (modal) para cadastro e edição de imóveis.
import { useState } from 'react';
import type { Imovel } from '../types';
import { IMOVEL_STATUS, ETAPAS_DESOCUPACAO, MODALIDADES } from '../types';
import { Modal } from './ui';
import { novoId, store } from '../utils/storage';

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
  const [form, setForm] = useState<Partial<Imovel>>(
    e ?? {
      status: 'Arrematado',
      etapaDesocupacao: 'Não iniciada',
      imovelResidencial: true,
      socios: [],
    },
  );

  function set<K extends keyof Imovel>(k: K, v: Imovel[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function salvar() {
    if (!form.titulo || !form.titulo.trim()) return alert('Informe o título do imóvel.');
    const imovel: Imovel = {
      id: e?.id ?? novoId('imv'),
      titulo: form.titulo!.trim(),
      codigoCaixa: form.codigoCaixa || '',
      matricula: form.matricula || '',
      endereco: form.endereco || '',
      cidade: form.cidade || '',
      uf: form.uf || '',
      fotoUrl: form.fotoUrl || '',
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
      <div className="grid grid-cols-2 gap-4">
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
        <div className="col-span-2">
          <label className="label">URL da foto</label>
          <input className="input" value={form.fotoUrl || ''} onChange={(ev) => set('fotoUrl', ev.target.value)} placeholder="https://..." />
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
          <input className="input mono" type="number" value={form.valorArrematacao ?? ''} onChange={(ev) => set('valorArrematacao', Number(ev.target.value))} />
        </div>
        <div>
          <label className="label">Valor de avaliação (R$)</label>
          <input className="input mono" type="number" value={form.valorAvaliacao ?? ''} onChange={(ev) => set('valorAvaliacao', Number(ev.target.value))} />
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
          <input className="input mono" type="number" value={form.valorVenda ?? ''} onChange={(ev) => set('valorVenda', Number(ev.target.value))} />
        </div>
        <div>
          <label className="label">Alíquota de IR sobre o lucro (%)</label>
          <input className="input mono" type="number" value={form.aliquotaIR ?? 15} onChange={(ev) => set('aliquotaIR', Number(ev.target.value))} />
        </div>
        <div>
          <label className="label">Comissão do corretor na venda (%)</label>
          <input className="input mono" type="number" value={form.comissaoCorretorPct ?? 5} onChange={(ev) => set('comissaoCorretorPct', Number(ev.target.value))} />
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
