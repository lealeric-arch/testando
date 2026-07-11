// Modal de exportação com filtros (escopo, status, sócio, período) e contagem ao vivo.
import { useMemo, useState } from 'react';
import type { Gasto, Imovel, ImovelStatus } from '../types';
import { IMOVEL_STATUS } from '../types';
import { Modal } from './ui';
import {
  exportarPlanilhaPortfolio,
  filtrarImoveis,
  FILTROS_PADRAO,
  type FiltrosExport,
  type PeriodoFiltro,
} from '../utils/portfolioExport';
import { exportarPlanilhaExcel } from '../utils/excelExport';

export function ExportModal({
  aberto,
  onClose,
  imoveis,
  gastos,
  escopoInicial,
}: {
  aberto: boolean;
  onClose: () => void;
  imoveis: Imovel[];
  gastos: Gasto[];
  escopoInicial?: string; // id de imóvel para pré-selecionar
}) {
  const [f, setF] = useState<FiltrosExport>({ ...FILTROS_PADRAO, escopo: escopoInicial || 'todos' });

  const filtrados = useMemo(() => filtrarImoveis(imoveis, f), [imoveis, f]);
  const socios = useMemo(() => {
    const map = new Map<string, string>();
    imoveis.forEach((im) => (im.socios || []).forEach((s) => map.set(s.id, s.nome)));
    return Array.from(map.entries());
  }, [imoveis]);

  function set<K extends keyof FiltrosExport>(k: K, v: FiltrosExport[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  function exportar() {
    if (f.escopo !== 'todos' && filtrados.length === 1) {
      exportarPlanilhaExcel(filtrados[0], gastos);
    } else {
      exportarPlanilhaPortfolio(imoveis, gastos, f);
    }
    onClose();
  }

  return (
    <Modal aberto={aberto} onClose={onClose} titulo="Exportar planilha (.xls)" largura="max-w-xl">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Escopo</label>
          <select className="input" value={f.escopo} onChange={(e) => set('escopo', e.target.value)}>
            <option value="todos">Todos os imóveis</option>
            {imoveis.map((im) => (
              <option key={im.id} value={im.id}>{im.titulo}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={f.status} onChange={(e) => set('status', e.target.value as 'todos' | ImovelStatus)}>
            <option value="todos">Todos</option>
            {IMOVEL_STATUS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Sócio participante</label>
          <select className="input" value={f.socioId} onChange={(e) => set('socioId', e.target.value)}>
            <option value="todos">Todos</option>
            {socios.map(([id, nome]) => (
              <option key={id} value={id}>{nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Período</label>
          <select className="input" value={f.periodo} onChange={(e) => set('periodo', e.target.value as PeriodoFiltro)}>
            <option value="todo">Todo o período</option>
            <option value="30dias">Últimos 30 dias</option>
            <option value="esteAno">Este ano</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>
        {f.periodo === 'custom' && (
          <>
            <div>
              <label className="label">Data início</label>
              <input className="input" type="date" value={f.dataInicio || ''} onChange={(e) => set('dataInicio', e.target.value)} />
            </div>
            <div>
              <label className="label">Data fim</label>
              <input className="input" type="date" value={f.dataFim || ''} onChange={(e) => set('dataFim', e.target.value)} />
            </div>
          </>
        )}
      </div>

      <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        Resultado do filtro: <strong className="text-caixa-blue">{filtrados.length}</strong> imóvel(is).
        {f.escopo !== 'todos' && filtrados.length === 1
          ? ' Será exportado o demonstrativo completo do imóvel.'
          : ' Será exportada a planilha consolidada do portfólio.'}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button className="btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={exportar} disabled={filtrados.length === 0}>
          Exportar {filtrados.length} imóvel(is)
        </button>
      </div>
    </Modal>
  );
}
