// Gerenciador de estado global, sincronização de dados e roteamento por abas.
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import type { Aba, Documento, Gasto, Imovel } from './types';
import { store } from './utils/storage';
import { semearSeVazio } from './utils/seed';
import { gerarAlertas } from './utils/alerts';
import { notificar, permissaoAtual } from './utils/notifications';
import { Dashboard } from './components/Dashboard';
import { PropertyList } from './components/PropertyList';
import { PropertyDetail } from './components/PropertyDetail';
import { CalculadoraViabilidade } from './components/CalculadoraViabilidade';
import { AjustesView } from './components/AjustesView';
import { Toaster } from './components/Toaster';

export default function App() {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [aba, setAba] = useState<Aba>('dashboard');
  const [imovelSelecionado, setImovelSelecionado] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);

  // Inicializa a base local.
  useEffect(() => {
    let unsub = () => {};
    (async () => {
      await store.init();
      await semearSeVazio();
      unsub = store.subscribe(({ imoveis, gastos, documentos }) => {
        setImoveis(imoveis);
        setGastos(gastos);
        setDocumentos(documentos);
      });
      setPronto(true);
    })();
    return () => unsub();
  }, []);

  // Notificações de alertas críticos persistentes (uma vez por ativo).
  useEffect(() => {
    if (!pronto || permissaoAtual() !== 'granted') return;
    for (const a of gerarAlertas(imoveis)) {
      notificar({
        titulo: a.titulo,
        corpo: a.descricao,
        chaveUnica: `alerta:${a.id}`,
        tag: a.id,
      });
    }
  }, [imoveis, pronto]);

  const imovelAtual = useMemo(
    () => imoveis.find((i) => i.id === imovelSelecionado) || null,
    [imoveis, imovelSelecionado],
  );

  function abrirImovel(id: string) {
    setImovelSelecionado(id);
    setAba('detalhe');
  }

  const abas: { id: Aba; label: string; icone: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icone: '📊' },
    { id: 'portfolio', label: 'Portfólio', icone: '🏢' },
    { id: 'viabilidade', label: 'Viabilidade', icone: '🧭' },
    { id: 'notificacoes', label: 'Ajustes', icone: '⚙️' },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b-2 border-caixa-orange/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-caixa-blue">
              <span className="font-display text-sm font-bold text-white">EC</span>
            </div>
            <div className="leading-tight">
              <h1 className="font-display text-sm font-bold text-caixa-blue sm:text-base">Entre Colunas Leilões</h1>
              <p className="hidden text-[11px] text-slate-500 sm:block">Gestão de imóveis arrematados · Caixa</p>
            </div>
          </div>

          <nav className="order-3 -mx-1 flex w-full items-center gap-1 overflow-x-auto px-1 sm:order-none sm:w-auto sm:overflow-visible">
            {abas.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  setAba(a.id);
                  if (a.id !== 'detalhe') setImovelSelecionado(null);
                }}
                className={`relative shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                  aba === a.id || (a.id === 'portfolio' && aba === 'detalhe')
                    ? 'text-caixa-blue'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="mr-1">{a.icone}</span>
                {a.label}
                {(aba === a.id || (a.id === 'portfolio' && aba === 'detalhe')) && (
                  <motion.div
                    layoutId="aba-ativa"
                    className="absolute inset-x-2 -bottom-[9px] h-0.5 rounded bg-caixa-orange"
                  />
                )}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-2 text-xs sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-slate-500">Dados salvos neste aparelho</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Render direto (sem AnimatePresence de rota) para nunca ficar em branco.
            As animações de entrada acontecem dentro de cada componente. */}
        <motion.div
          key={aba + (imovelSelecionado ?? '')}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          {(aba === 'dashboard' || (aba === 'detalhe' && !imovelAtual)) && (
            <Dashboard imoveis={imoveis} gastos={gastos} onAbrirImovel={abrirImovel} onIrPortfolio={() => setAba('portfolio')} />
          )}
          {aba === 'portfolio' && (
            <PropertyList imoveis={imoveis} gastos={gastos} onAbrirImovel={abrirImovel} />
          )}
          {aba === 'detalhe' && imovelAtual && (
            <PropertyDetail
              imovel={imovelAtual}
              gastos={gastos}
              documentos={documentos}
              onVoltar={() => {
                setAba('portfolio');
                setImovelSelecionado(null);
              }}
            />
          )}
          {aba === 'viabilidade' && <CalculadoraViabilidade onAbrirImovel={abrirImovel} />}
          {aba === 'notificacoes' && <AjustesView imoveis={imoveis} />}
        </motion.div>
      </main>

      <footer className="mt-8 border-t border-slate-200 bg-white/60 py-6">
        <div className="mx-auto max-w-7xl px-6 text-center text-xs text-slate-400">
          <p>
            A <strong>Entre Colunas Leilões</strong> atua de forma independente e não possui vínculo, patrocínio ou
            representação da Caixa Econômica Federal. As simulações são estimativas de planejamento, sem valor fiscal.
          </p>
          <p className="mt-1">© 2026 Entre Colunas Leilões. Licenciado para Eric Leal.</p>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}
