// Grid de imóveis cadastrados com fotos, badges de status e exclusão rápida.
import { motion } from 'motion/react';
import { useState } from 'react';
import type { Gasto, Imovel } from '../types';
import { formatBRL, resumoFinanceiro } from '../utils/finance';
import { store } from '../utils/storage';
import { obterFotoImovel } from '../utils/images';
import { ConfirmPopover, StatusBadge, EtapaBadge, Thumb } from './ui';
import { PropertyForm } from './PropertyForm';
import { ExportModal } from './ExportModal';

function PropertyCard({
  imovel,
  gastos,
  onAbrir,
  index,
}: {
  imovel: Imovel;
  gastos: Gasto[];
  onAbrir: () => void;
  index: number;
}) {
  const r = resumoFinanceiro(imovel, gastos);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="card group cursor-pointer overflow-hidden transition hover:shadow-md"
      onClick={onAbrir}
    >
      <div className="relative h-40 bg-slate-100">
        <Thumb src={obterFotoImovel(imovel.id + (imovel.endereco || ''), imovel.fotoUrl)} alt={imovel.titulo} className="h-full w-full object-cover" />
        <div className="absolute left-3 top-3">
          <StatusBadge status={imovel.status} />
        </div>
        <div className="absolute right-3 top-3" onClick={(e) => e.stopPropagation()}>
          <ConfirmPopover
            mensagem={`Excluir "${imovel.titulo}" e todos os gastos vinculados?`}
            onConfirm={() => store.excluirImovel(imovel.id)}
          >
            {(abrir) => (
              <button
                onClick={abrir}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-red-600 shadow-sm hover:bg-white"
                title="Excluir imóvel"
              >
                🗑️
              </button>
            )}
          </ConfirmPopover>
        </div>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-1 font-display font-semibold text-slate-800">{imovel.titulo}</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          {imovel.cidade ? `${imovel.cidade}/${imovel.uf}` : 'Sem localização'}
          {imovel.codigoCaixa && <span className="mono ml-2 text-slate-400">#{imovel.codigoCaixa}</span>}
        </p>

        <div className="mt-3">
          <EtapaBadge etapa={imovel.etapaDesocupacao} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-sm">
          <div>
            <p className="text-[11px] text-slate-400">Arrematação</p>
            <p className="mono font-semibold text-slate-700">{formatBRL(r.valorArrematacao)}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Custo total</p>
            <p className="mono font-semibold text-caixa-blue">{formatBRL(r.custoTotal)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function PropertyList({
  imoveis,
  gastos,
  onAbrirImovel,
}: {
  imoveis: Imovel[];
  gastos: Gasto[];
  onAbrirImovel: (id: string) => void;
}) {
  const [busca, setBusca] = useState('');
  const [formAberto, setFormAberto] = useState(false);
  const [exportAberto, setExportAberto] = useState(false);

  const filtrados = imoveis.filter((i) => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return `${i.titulo} ${i.cidade} ${i.codigoCaixa} ${i.matricula}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800">Portfólio</h2>
          <p className="text-sm text-slate-500">
            {busca
              ? `${filtrados.length} de ${imoveis.length} imóvel(is)`
              : `${imoveis.length} imóvel(is) na carteira.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            className="input max-w-xs"
            placeholder="Buscar por título, cidade, código..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <button className="btn-ghost" onClick={() => setExportAberto(true)}>⬇ Exportar</button>
          <button className="btn-primary" onClick={() => setFormAberto(true)}>
            + Novo imóvel
          </button>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          {imoveis.length === 0 ? 'Nenhum imóvel cadastrado. Comece adicionando um ativo.' : 'Nenhum imóvel encontrado.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((im, i) => (
            <PropertyCard key={im.id} imovel={im} gastos={gastos} index={i} onAbrir={() => onAbrirImovel(im.id)} />
          ))}
        </div>
      )}

      <PropertyForm aberto={formAberto} onClose={() => setFormAberto(false)} />
      <ExportModal aberto={exportAberto} onClose={() => setExportAberto(false)} imoveis={imoveis} gastos={gastos} />
    </div>
  );
}
