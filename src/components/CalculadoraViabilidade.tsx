// Calculadora de Viabilidade Pré-Lance: lance máximo, alavancagem Caixa,
// checklist de due diligence e recomendação automática.
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import type { Gasto, Imovel } from '../types';
import { calcularLanceMaximo, formatBRL, formatPct, type ViabilidadeOpts } from '../utils/finance';
import { novoId, store } from '../utils/storage';
import { toast } from '../utils/toast';

export function CalculadoraViabilidade({ onAbrirImovel }: { onAbrirImovel: (id: string) => void }) {
  const [titulo, setTitulo] = useState('');
  const [endereco, setEndereco] = useState('');
  const [metragem, setMetragem] = useState(0);
  const [valorLance, setValorLance] = useState(0);
  const [valorAvaliacaoEdital, setValorAvaliacaoEdital] = useState(0);
  const [valorMercado, setValorMercado] = useState(0);
  const [margem, setMargem] = useState(25);
  const [reforma, setReforma] = useState(0);
  const [outros, setOutros] = useState(0);

  const [usarFin, setUsarFin] = useState(false);
  const [entradaPct, setEntradaPct] = useState(30);
  const [taxaAval, setTaxaAval] = useState(3000);


  const opts: ViabilidadeOpts = { usarFinanciamento: usarFin, entradaPct, taxaAvaliacaoCef: taxaAval };
  const r = useMemo(
    () => calcularLanceMaximo({ valorMercado, margemDesejadaPct: margem, custoReformaEst: reforma, outrosCustosEst: outros }, opts),
    [valorMercado, margem, reforma, outros, usarFin, entradaPct, taxaAval],
  );

  const inviavel = valorMercado <= 0 || r.lanceMaximo <= 0;
  const recomendacao = useMemo(() => {
    if (valorMercado <= 0) return null;
    if (r.lanceMaximo <= 0) return { nivel: 'Inviável', cor: 'bg-red-50 border-red-200 text-red-800', icone: '⛔', txt: 'A margem desejada não cabe no valor de mercado. Reduza custos ou a margem.' };
    if (r.percentualDoMercado > 75) return { nivel: 'Atenção', cor: 'bg-amber-50 border-amber-200 text-amber-800', icone: '🟡', txt: `O lance máximo representa ${formatPct(r.percentualDoMercado)} do valor de mercado — margem apertada.` };
    return { nivel: 'Excelente janela', cor: 'bg-emerald-50 border-emerald-200 text-emerald-800', icone: '🟢', txt: 'Boa oportunidade: lance com folga sobre o valor de mercado.' };
  }, [valorMercado, r]);

  
  async function criarImovel() {
    if (!titulo.trim()) return toast('Informe um título para criar o imóvel.', 'erro');
    if (valorMercado < 0 || reforma < 0 || outros < 0) return toast('Os valores não podem ser negativos.', 'erro');
    if (r.lanceMaximo <= 0) return toast('Lance máximo inviável — ajuste a simulação.', 'erro');
    const now = new Date().toISOString();
    const id = novoId('imv');
    const imovel: Imovel = {
      id,
      titulo: titulo.trim(),
      endereco,
      status: 'Arrematado',
      etapaDesocupacao: 'Ocupado Ex proprietário',
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
        <input className="input mono" type="number" min="0" value={valor || ''} onChange={(e) => set(Math.max(0, Number(e.target.value)))} />
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
            <input className="input" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, numero - bairro, cidade" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Metragem (m2)</label>
              <input className="input" type="number" min={0} value={metragem || ''} onChange={(e) => setMetragem(Number(e.target.value) || 0)} placeholder="Ex.: 78" />
            </div>
            {campo('Valor do lance (R$)', valorLance, setValorLance)}
            {campo('Valor de avaliacao (R$)', valorAvaliacaoEdital, setValorAvaliacaoEdital)}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {campo('Entrada (%)', entradaPct, setEntradaPct, '%')}
              {campo('Taxa de avaliação CEF', taxaAval, setTaxaAval)}
            </div>
          )}
        </div>

        {/* Resultado */}
        <div className="space-y-4">
          <div className="card p-6">
            <p className="text-xs uppercase tracking-wide text-slate-400">Lance máximo recomendado</p>
            <p className="mono font-display text-3xl font-bold text-caixa-blue">{inviavel ? '—' : formatBRL(r.lanceMaximo)}</p>
            <p className="mt-1 text-xs text-slate-400">{inviavel ? 'Cenário inviável' : `${formatPct(r.percentualDoMercado)} do valor de mercado`}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
              <div><p className="text-[11px] text-slate-400">Lucro desejado</p><p className="mono font-semibold text-emerald-600">{inviavel ? '—' : formatBRL(r.lucroDesejado)}</p></div>
              <div><p className="text-[11px] text-slate-400">Custo total (à vista)</p><p className="mono font-semibold text-slate-700">{inviavel ? '—' : formatBRL(r.custoTotalEstimado)}</p></div>
              <div><p className="text-[11px] text-slate-400">ROI à vista</p><p className="mono font-semibold text-slate-700">{inviavel ? '—' : formatPct(r.roiSimples)}</p></div>
              {usarFin && <div><p className="text-[11px] text-slate-400">ROI alavancado</p><p className="mono font-semibold text-caixa-orange-dark">{inviavel ? '—' : formatPct(r.roiAlavancado)}</p></div>}
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

      {valorLance > 0 && (
        <div className="card p-6">
          <h3 className="mb-4 font-display font-semibold text-slate-800">Analise do lance</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div><p className="text-[11px] uppercase text-slate-400">Custos estimados (25%)</p><p className="mono text-lg font-bold text-caixa-orange">{formatBRL(valorLance * 0.25)}</p></div>
            <div><p className="text-[11px] uppercase text-slate-400">Investimento total</p><p className="mono text-lg font-bold text-caixa-blue">{formatBRL(valorLance * 1.25)}</p></div>
            <div><p className="text-[11px] uppercase text-slate-400">Desagio vs avaliacao</p><p className="mono text-lg font-bold text-slate-700">{valorAvaliacaoEdital > 0 ? formatPct(100 - (valorLance / valorAvaliacaoEdital) * 100) : '—'}</p></div>
            <div><p className="text-[11px] uppercase text-slate-400">Lucro potencial</p><p className={"mono text-lg font-bold " + (valorMercado - valorLance * 1.25 >= 0 ? 'text-emerald-600' : 'text-red-600')}>{valorMercado > 0 ? formatBRL(valorMercado - valorLance * 1.25) : '—'}</p></div>
          </div>
          <p className="mt-3 text-xs text-slate-400">Custos estimados = 25% do valor de arrematacao (condominio em atraso, tributos, ITBI, cartorio e desocupacao). Lucro potencial = valor de mercado - (lance + 25%).</p>
        </div>
      )}

      {/* Anuncios semelhantes (comparaveis de mercado) */}
      {endereco.trim() && (
        <div className="card p-6">
          <h3 className="mb-1 font-display font-semibold text-slate-800">Anuncios semelhantes na regiao</h3>
          <p className="mb-4 text-xs text-slate-400">10 buscas prontas com os dados deste imovel. Cada cartao abre os anuncios reais e atualizados da fonte no navegador.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {(() => {
              const end = endereco.trim();
              const regiao = end.replace(/[0-9]/g, " ").replace(/\s+/g, " ").trim();
              const m2 = metragem > 0 ? " " + metragem + " m2" : "";
              const faixa = valorMercado > 0 ? " ate R$ " + Math.round((valorMercado * 1.2) / 1000) + " mil" : "";
              const fontes: { n: string; u: (q: string) => string }[] = [
                { n: "ZAP Imoveis", u: (q) => "https://www.google.com/search?q=" + encodeURIComponent("site:zapimoveis.com.br venda " + q) },
                { n: "OLX", u: (q) => "https://www.olx.com.br/imoveis/venda?q=" + encodeURIComponent(q) },
                { n: "VivaReal", u: (q) => "https://www.google.com/search?q=" + encodeURIComponent("site:vivareal.com.br venda " + q) },
                { n: "Imovelweb", u: (q) => "https://www.google.com/search?q=" + encodeURIComponent("site:imovelweb.com.br venda " + q) },
                { n: "Chaves na Mao", u: (q) => "https://www.google.com/search?q=" + encodeURIComponent("site:chavesnamao.com.br venda " + q) },
              ];
              const variacoes = [{ rot: "Endereco exato", q: end + m2 + faixa }, { rot: "Regiao", q: regiao + m2 + faixa }];
              return fontes.flatMap((f) => variacoes.map((v) => (
                <a key={f.n + v.rot} href={f.u(v.q)} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 px-3 py-2 text-center text-xs font-semibold text-caixa-blue transition hover:border-caixa-blue hover:bg-slate-50">
                  {f.n}
                  <span className="block text-[10px] font-normal text-slate-400">{v.rot}</span>
                </a>
              )));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
