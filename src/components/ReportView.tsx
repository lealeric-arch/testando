// Relatório imprimível "Prestação de Contas — Extrato de Ativo" (window.print).
import { AnimatePresence, motion } from 'motion/react';
import type { Gasto, Imovel } from '../types';
import { calcularPartilhaSocios, faseDoGasto, formatBRL, formatPct, resultadoImovel } from '../utils/finance';

export function ReportView({
  aberto,
  onClose,
  imovel,
  gastos,
}: {
  aberto: boolean;
  onClose: () => void;
  imovel: Imovel | null;
  gastos: Gasto[];
}) {
  if (!imovel) return null;
  const r = resultadoImovel(imovel, gastos);
  const doImovel = gastos.filter((g) => g.imovelId === imovel.id);
  const partilha = calcularPartilhaSocios(imovel, gastos);

  const Linha = ({ label, valor, forte }: { label: string; valor: string; forte?: boolean }) => (
    <div className={`flex justify-between border-b border-slate-100 py-1.5 ${forte ? 'font-bold' : ''}`}>
      <span className="text-slate-600">{label}</span>
      <span className="mono text-slate-800">{valor}</span>
    </div>
  );

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <div className="mx-auto max-w-3xl">
            <div className="no-print mb-3 flex justify-end gap-2">
              <button className="btn-ghost bg-white" onClick={onClose}>Fechar</button>
              <button className="btn-primary" onClick={() => window.print()}>🖨️ Imprimir / PDF</button>
            </div>

            <div className="report-print rounded-xl bg-white p-8 shadow-xl">
              {/* Cabeçalho */}
              <div className="mb-6 flex items-center justify-between border-b-2 border-caixa-orange pb-4">
                <div>
                  <h1 className="font-display text-xl font-bold text-caixa-blue">Prestação de Contas</h1>
                  <p className="text-sm text-slate-500">Extrato de Ativo — Entre Colunas Leilões</p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>Emitido em</p>
                  <p className="font-semibold text-slate-600">{new Date().toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="font-display text-lg font-semibold text-slate-800">{imovel.titulo}</h2>
                <p className="text-sm text-slate-500">
                  {imovel.endereco}{imovel.cidade ? ` — ${imovel.cidade}/${imovel.uf || ''}` : ''}
                  {imovel.codigoCaixa ? ` · Cód. ${imovel.codigoCaixa}` : ''}
                </p>
              </div>

              {/* Custos & benfeitorias */}
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-caixa-blue">Custos & benfeitorias</h3>
              <div className="mb-6 text-sm">
                <Linha label="Arrematação" valor={formatBRL(r.arrematacao)} />
                {doImovel.filter((g) => faseDoGasto(g.categoria) === 'aquisicao').map((g) => (
                  <Linha key={g.id} label={`${g.categoria} — ${g.descricao}`} valor={formatBRL(g.valor)} />
                ))}
                <Linha label="Total investido" valor={formatBRL(r.totalInvestido)} forte />
              </div>

              {/* Fechamento financeiro */}
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-caixa-blue">Fechamento financeiro</h3>
              <div className="mb-6 text-sm">
                <Linha label="Receita de venda" valor={formatBRL(r.valorVenda)} />
                <Linha label="Custos de venda" valor={`- ${formatBRL(r.custosVenda)}`} />
                <Linha label={`Comissão do corretor (${formatPct(r.comissaoCorretorPct)})`} valor={`- ${formatBRL(r.comissaoCorretor)}`} />
                <Linha label="Saldo líquido da venda" valor={formatBRL(r.saldoLiquidoVenda)} forte />
                <Linha label="Lucro bruto" valor={formatBRL(r.lucroBruto)} />
                <Linha label={`Imposto de renda (${formatPct(r.aliquotaIR)})`} valor={`- ${formatBRL(r.impostoIR)}`} />
                <Linha label="Lucro líquido" valor={formatBRL(r.lucroLiquido)} forte />
                <Linha label="ROI" valor={formatPct(r.roi)} />
              </div>

              {/* Partilha */}
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-caixa-blue">Partilha de caixa & retornos</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-400">
                    <th className="py-1">Participante</th>
                    <th className="py-1 text-right">Reembolso</th>
                    <th className="py-1 text-right">Retorno capital</th>
                    <th className="py-1 text-right">Lucro</th>
                    <th className="py-1 text-right">Total a receber</th>
                  </tr>
                </thead>
                <tbody>
                  {partilha.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50">
                      <td className="py-1.5">{p.nome} <span className="text-xs text-slate-400">({p.papel})</span></td>
                      <td className="mono py-1.5 text-right">{formatBRL(p.reembolsoGastos)}</td>
                      <td className="mono py-1.5 text-right">{formatBRL(p.retornoCapital)}</td>
                      <td className="mono py-1.5 text-right">{formatBRL(p.lucro)}</td>
                      <td className="mono py-1.5 text-right font-bold text-caixa-blue">{formatBRL(p.totalReceber)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="mt-8 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                Documento gerencial de prestação de contas, sem valor fiscal. Entre Colunas Leilões atua de forma
                independente e não possui vínculo com a Caixa Econômica Federal.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
