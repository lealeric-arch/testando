// Visualização SOMENTE LEITURA de um imóvel compartilhado com o sócio.
// Renderizada quando a URL contém #compartilhado=... — não usa o store local
// nem permite edição. É um retrato (snapshot) do momento em que o link foi gerado.
import type { PayloadCompartilhado } from '../utils/share';
import { faseDoGasto, formatBRL, formatPct, resultadoImovel, calcularPartilhaSocios } from '../utils/finance';
import { StatusBadge } from './ui';

export function SharedPropertyView({ payload }: { payload: PayloadCompartilhado }) {
  const { imovel, gastos, ts } = payload;
  const resultado = resultadoImovel(imovel, gastos);
  const partilha = calcularPartilhaSocios(imovel, gastos);
  const geradoEm = (() => {
    try {
      return new Date(ts).toLocaleString('pt-BR');
    } catch {
      return ts;
    }
  })();

  const custosAquisicao = gastos.filter((g) => faseDoGasto(g.categoria) === 'aquisicao');
  const custosVenda = gastos.filter((g) => faseDoGasto(g.categoria) === 'venda');

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b-2 border-caixa-orange/70 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-caixa-blue">
              <span className="font-display text-sm font-bold text-white">EC</span>
            </div>
            <div className="leading-tight">
              <h1 className="font-display text-base font-bold text-caixa-blue">Entre Colunas Leilões</h1>
              <p className="text-[11px] text-slate-500">Imóvel compartilhado · somente leitura</p>
            </div>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            🔒 Visualização compartilhada
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Você está vendo um <strong>retrato</strong> deste imóvel, gerado em {geradoEm}. Os valores não
          são atualizados automaticamente — peça um novo link para ver dados mais recentes.
        </div>

        {/* Cabeçalho do imóvel */}
        <div className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-800">{imovel.titulo}</h2>
              <p className="text-sm text-slate-500">
                {imovel.endereco}
                {imovel.cidade ? ` — ${imovel.cidade}/${imovel.uf}` : ''}
              </p>
              {imovel.codigoCaixa && (
                <p className="mono mt-1 text-xs text-slate-400">
                  Cód. Caixa: {imovel.codigoCaixa} {imovel.matricula ? `· Matrícula ${imovel.matricula}` : ''}
                </p>
              )}
            </div>
            <StatusBadge status={imovel.status} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-slate-100 sm:grid-cols-4">
            <Kpi label="Total investido" valor={formatBRL(resultado.totalInvestido)} cor="text-caixa-blue" />
            <Kpi label="Valor de venda" valor={formatBRL(resultado.valorVenda)} cor="text-caixa-orange-dark" />
            <Kpi
              label="Lucro líquido"
              valor={resultado.vendido ? formatBRL(resultado.lucroLiquido) : '—'}
              cor={resultado.lucroLiquido >= 0 ? 'text-emerald-600' : 'text-red-600'}
            />
            <Kpi
              label="ROI"
              valor={resultado.vendido ? formatPct(resultado.roi) : '—'}
              cor={resultado.roi >= 0 ? 'text-emerald-600' : 'text-slate-600'}
            />
          </div>
        </div>

        {/* Partilha entre participantes */}
        <div className="card p-6">
          <h3 className="mb-4 font-display font-semibold text-slate-800">Partilha entre participantes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                  <th className="py-2">Participante</th>
                  <th className="py-2 text-right">% Imóvel</th>
                  <th className="py-2 text-right">% Lucro</th>
                  <th className="py-2 text-right">Reembolso</th>
                  <th className="py-2 text-right">Retorno capital</th>
                  <th className="py-2 text-right">Lucro</th>
                  <th className="py-2 text-right">Total a receber</th>
                </tr>
              </thead>
              <tbody>
                {partilha.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50">
                    <td className="py-2.5 font-medium text-slate-700">
                      {p.nome} <span className="text-xs text-slate-400">· {p.papel}</span>
                    </td>
                    <td className="mono py-2.5 text-right">{formatPct(p.participacaoImovel)}</td>
                    <td className="mono py-2.5 text-right">{formatPct(p.participacaoLucro)}</td>
                    <td className="mono py-2.5 text-right text-slate-500">{formatBRL(p.reembolsoGastos)}</td>
                    <td className="mono py-2.5 text-right text-slate-500">{formatBRL(p.retornoCapital)}</td>
                    <td className={`mono py-2.5 text-right ${p.lucro >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {resultado.vendido ? formatBRL(p.lucro) : '—'}
                    </td>
                    <td className="mono py-2.5 text-right font-semibold text-slate-800">{formatBRL(p.totalReceber)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!resultado.vendido && (
            <p className="mt-3 text-xs text-slate-400">
              O lucro é distribuído após a venda. Antes disso, são mostrados apenas reembolsos e retorno de capital.
            </p>
          )}
        </div>

        {/* Gastos */}
        <div className="card p-6">
          <h3 className="mb-4 font-display font-semibold text-slate-800">
            Gastos lançados ({gastos.length})
          </h3>
          {gastos.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhum gasto lançado.</p>
          ) : (
            <div className="space-y-4">
              <ListaGastos titulo="Custos de aquisição" itens={custosAquisicao} />
              <ListaGastos titulo="Custos de venda" itens={custosVenda} />
            </div>
          )}
        </div>

        <p className="pb-6 text-center text-xs text-slate-400">
          Entre Colunas Leilões · Este link contém apenas os dados deste imóvel e não dá acesso ao restante da carteira.
        </p>
      </main>
    </div>
  );
}

function Kpi({ label, valor, cor }: { label: string; valor: string; cor: string }) {
  return (
    <div className="bg-white p-4">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mono mt-1 font-display text-lg font-bold ${cor}`}>{valor}</p>
    </div>
  );
}

function ListaGastos({ titulo, itens }: { titulo: string; itens: PayloadCompartilhado['gastos'] }) {
  if (itens.length === 0) return null;
  const total = itens.reduce((s, g) => s + (Number(g.valor) || 0), 0);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
        <span>{titulo}</span>
        <span className="mono">{formatBRL(total)}</span>
      </div>
      <ul className="divide-y divide-slate-50">
        {itens.map((g) => (
          <li key={g.id} className="flex items-center justify-between py-2 text-sm">
            <span className="text-slate-600">
              {g.categoria}
              {g.descricao ? <span className="text-slate-400"> · {g.descricao}</span> : null}
            </span>
            <span className="mono text-slate-700">{formatBRL(g.valor)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
