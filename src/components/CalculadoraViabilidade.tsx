// Calculadora de Viabilidade Pré-Lance: lance máximo, alavancagem Caixa,
// checklist de due diligence e recomendação automática.
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import type { Gasto, Imovel } from '../types';
import { calcularLanceMaximo, formatBRL, formatPct, type ViabilidadeOpts } from '../utils/finance';
import { novoId, store } from '../utils/storage';

type EstadoItem = 'OK' | 'PENDENTE' | 'RISCO';

interface ItemDD {
  chave: string;
  label: string;
  ajuda: string;
  estado: EstadoItem;
}

const CHECKLIST_INICIAL: ItemDD[] = [
  { chave: 'processos', label: 'Processos judiciais do imóvel', ajuda: 'Verifique ações de imissão, embargos e litígios na matrícula.', estado: 'PENDENTE' },
  { chave: 'condominio', label: 'Débitos de condomínio', ajuda: 'Cotas em atraso podem ser assumidas pelo arrematante.', estado: 'PENDENTE' },
  { chave: 'ocupacao', label: 'Situação de ocupação', ajuda: 'Imóvel ocupado exige desocupação (custo e prazo).', estado: 'PENDENTE' },
  { chave: 'matricula', label: 'Matrícula e ônus', ajuda: 'Cheque penhoras, hipotecas e averbações pendentes.', estado: 'PENDENTE' },
  { chave: 'financiamento', label: 'Financiamento previsto no edital', ajuda: 'Confirme se o edital permite financiamento Caixa.', estado: 'PENDENTE' },
];

const CORES_ESTADO: Record<EstadoItem, string> = {
  OK: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  PENDENTE: 'bg-amber-100 text-amber-700 border-amber-200',
  RISCO: 'bg-red-100 text-red-700 border-red-200',
};

export function CalculadoraViabilidade({ onAbrirImovel }: { onAbrirImovel: (id: string) => void }) {
  const [titulo, setTitulo] = useState('');
  const [endereco, setEndereco] = useState('');
  const [valorMercado, setValorMercado] = useState(0);
  const [margem, setMargem] = useState(25);
  const [reforma, setReforma] = useState(0);
  const [outros, setOutros] = useState(0);

  const [usarFin, setUsarFin] = useState(false);
  const [entradaPct, setEntradaPct] = useState(30);
  const [taxaAval, setTaxaAval] = useState(3000);

  const [checklist, setChecklist] = useState<ItemDD[]>(CHECKLIST_INICIAL);

  const opts: ViabilidadeOpts = { usarFinanciamento: usarFin, entradaPct, taxaAvaliacaoCef: taxaAval };
  const r = useMemo(
    () => calcularLanceMaximo({ valorMercado, margemDesejadaPct: margem, custoReformaEst: reforma, outrosCustosEst: outros }, opts),
    [valorMercado, margem, reforma, outros, usarFin, entradaPct, taxaAval],
  );

  const temRisco = checklist.some((c) => c.estado === 'RISCO');
  const recomendacao = useMemo(() => {
    if (valorMercado <= 0) return null;
    if (r.lanceMaximo <= 0) return { nivel: 'Inviável', cor: 'bg-red-50 border-red-200 text-red-800', icone: '⛔', txt: 'A margem desejada não cabe no valor de mercado. Reduza custos ou a margem.' };
    if (temRisco) return { nivel: 'Alto risco', cor: 'bg-red-50 border-red-200 text-red-800', icone: '⚠️', txt: 'Há itens marcados como RISCO na due diligence. Reavalie antes de dar o lance.' };
    if (r.percentualDoMercado > 75) return { nivel: 'Atenção', cor: 'bg-amber-50 border-amber-200 text-amber-800', icone: '🟡', txt: `O lance máximo representa ${formatPct(r.percentualDoMercado)} do valor de mercado — margem apertada.` };
    return { nivel: 'Excelente janela', cor: 'bg-emerald-50 border-emerald-200 text-emerald-800', icone: '🟢', txt: 'Boa oportunidade: lance com folga sobre o valor de mercado.' };
  }, [valorMercado, r, temRisco]);

  function ciclarEstado(chave: string) {
    setChecklist((cl) =>
      cl.map((c) => {
        if (c.chave !== chave) return c;
        const prox: EstadoItem = c.estado === 'PENDENTE' ? 'OK' : c.estado === 'OK' ? 'RISCO' : 'PENDENTE';
        return { ...c, estado: prox };
      }),
    );
  }

  async function criarImovel() {
    if (!titulo.trim()) return alert('Informe um título para criar o imóvel.');
    if (r.lanceMaximo <= 0) return alert('Lance máximo inviável — ajuste a simulação.');
    const now = new Date().toISOString();
    const id = novoId('imv');
    const imovel: Imovel = {
      id,
      titulo: titulo.trim(),
      endereco,
      status: 'Arrematado',
      etapaDesocupacao: 'Não iniciada',
      valorArrematacao: r.lanceMaximo,
      valorAvaliacao: valorMercado,
      aliquotaIR: 15,
      comissaoCorretorPct: 5,
      createdAt: now,
      updatedAt: now,
      socios: [],
      imovelResidencial: true,
    };
    await store.salvarImovel(imovel);
    // Lança os custos estimados como despesas iniciais.
    const gastos: Gasto[] = [];
    if (reforma > 0) gastos.push({ id: novoId('gst'), imovelId: id, categoria: 'Reforma', descricao: 'Reforma estimada (simulação)', valor: reforma, data: now.slice(0, 10), pagoPor: 'Voce' });
    if (outros > 0) gastos.push({ id: novoId('gst'), imovelId: id, categoria: 'Outros', descricao: 'Outros custos estimados (ITBI/registro)', valor: outros, data: now.slice(0, 10), pagoPor: 'Voce' });
    for (const g of gastos) await store.salvarGasto(g);
    onAbrirImovel(id);
  }

  const campo = (label: string, valor: number, set: (n: number) => void, sufixo = 'R$') => (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">{sufixo}</span>
        <input className="input mono" type="number" value={valor || ''} onChange={(e) => set(Number(e.target.value))} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-800">Viabilidade Pré-Lance</h2>
        <p className="text-sm text-slate-500">Calcule o lance máximo para garantir sua margem antes de arrematar.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Entradas */}
        <div className="card space-y-4 p-6">
          <h3 className="font-display font-semibold text-slate-800">Parâmetros</h3>
          <div>
            <label className="label">Título / identificação</label>
            <input className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Apto 302 — Tijuca" />
          </div>
          <div>
            <label className="label">Endereço</label>
            <input className="input" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {campo('Valor de mercado', valorMercado, setValorMercado)}
            {campo('Margem desejada (%)', margem, setMargem, '%')}
            {campo('Custo de reforma', reforma, setReforma)}
            {campo('Outros custos (ITBI/registro)', outros, setOutros)}
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
            <input type="checkbox" checked={usarFin} onChange={(e) => setUsarFin(e.target.checked)} />
            Simular financiamento Caixa (alavancagem)
          </label>
          {usarFin && (
            <div className="grid grid-cols-2 gap-4">
              {campo('Entrada (%)', entradaPct, setEntradaPct, '%')}
              {campo('Taxa de avaliação CEF', taxaAval, setTaxaAval)}
            </div>
          )}
        </div>

        {/* Resultado */}
        <div className="space-y-4">
          <div className="card p-6">
            <p className="text-xs uppercase tracking-wide text-slate-400">Lance máximo recomendado</p>
            <p className="mono font-display text-3xl font-bold text-caixa-blue">{formatBRL(r.lanceMaximo)}</p>
            <p className="mt-1 text-xs text-slate-400">{formatPct(r.percentualDoMercado)} do valor de mercado</p>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
              <div><p className="text-[11px] text-slate-400">Lucro desejado</p><p className="mono font-semibold text-emerald-600">{formatBRL(r.lucroDesejado)}</p></div>
              <div><p className="text-[11px] text-slate-400">Custo total (à vista)</p><p className="mono font-semibold text-slate-700">{formatBRL(r.custoTotalEstimado)}</p></div>
              <div><p className="text-[11px] text-slate-400">ROI à vista</p><p className="mono font-semibold text-slate-700">{formatPct(r.roiSimples)}</p></div>
              {usarFin && <div><p className="text-[11px] text-slate-400">ROI alavancado</p><p className="mono font-semibold text-caixa-orange-dark">{formatPct(r.roiAlavancado)}</p></div>}
            </div>
            {usarFin && (
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-xs">
                <div><p className="text-slate-400">Entrada</p><p className="mono font-semibold">{formatBRL(r.valorEntrada)}</p></div>
                <div><p className="text-slate-400">Financiado</p><p className="mono font-semibold">{formatBRL(r.valorFinanciado)}</p></div>
                <div><p className="text-slate-400">Capital necessário</p><p className="mono font-semibold">{formatBRL(r.capitalNecessario)}</p></div>
              </div>
            )}
          </div>

          {recomendacao && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl border p-4 ${recomendacao.cor}`}>
              <p className="font-semibold">{recomendacao.icone} {recomendacao.nivel}</p>
              <p className="mt-1 text-sm">{recomendacao.txt}</p>
            </motion.div>
          )}

          <button className="btn-primary w-full justify-center" onClick={criarImovel}>
            + Criar imóvel a partir desta simulação
          </button>
        </div>
      </div>

      {/* Checklist due diligence */}
      <div className="card p-6">
        <h3 className="mb-1 font-display font-semibold text-slate-800">Due diligence do edital</h3>
        <p className="mb-4 text-xs text-slate-400">Clique em cada item para alternar: Pendente → OK → Risco.</p>
        <div className="space-y-2">
          {checklist.map((c) => (
            <button
              key={c.chave}
              onClick={() => ciclarEstado(c.chave)}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50"
              title={c.ajuda}
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{c.label}</p>
                <p className="text-xs text-slate-400">{c.ajuda}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${CORES_ESTADO[c.estado]}`}>{c.estado}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
