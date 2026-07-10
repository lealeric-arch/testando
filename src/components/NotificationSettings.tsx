// Painel de controle de permissões de notificação nativa do navegador.
import { useEffect, useState } from 'react';
import type { Imovel } from '../types';
import {
  notificacoesSuportadas,
  rodandoEmIframe,
  permissaoAtual,
  pedirPermissao,
  notificar,
} from '../utils/notifications';
import { gerarAlertas } from '../utils/alerts';

export function NotificationSettings({ imoveis }: { imoveis: Imovel[] }) {
  const [permissao, setPermissao] = useState<NotificationPermission | 'unsupported'>('default');
  const emIframe = rodandoEmIframe();
  const suportado = notificacoesSuportadas();
  const alertas = gerarAlertas(imoveis);

  useEffect(() => {
    setPermissao(permissaoAtual());
  }, []);

  async function autorizar() {
    const p = await pedirPermissao();
    setPermissao(p);
    if (p === 'granted') {
      notificar({ titulo: 'Notificações ativadas', corpo: 'Você receberá alertas dos seus imóveis. ✅' });
    }
  }

  const statusInfo = {
    granted: { cor: 'text-emerald-700 bg-emerald-100', label: 'Autorizadas' },
    denied: { cor: 'text-red-700 bg-red-100', label: 'Bloqueadas' },
    default: { cor: 'text-amber-700 bg-amber-100', label: 'Aguardando autorização' },
    unsupported: { cor: 'text-slate-600 bg-slate-100', label: 'Não suportado' },
  }[permissao];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-800">Notificações</h2>
        <p className="text-sm text-slate-500">Alertas nativos no seu sistema operacional ou celular.</p>
      </div>

      {emIframe && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          ⚠️ A aplicação está rodando dentro de um <strong>iframe</strong>. Alguns navegadores restringem
          notificações nesse contexto. Para melhor experiência, abra o app em uma aba dedicada.
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-800">Status da permissão</p>
            <p className="text-sm text-slate-500">API nativa de notificações do navegador.</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.cor}`}>{statusInfo.label}</span>
        </div>

        {!suportado ? (
          <p className="mt-4 text-sm text-slate-500">Seu navegador não oferece suporte à Notification API.</p>
        ) : permissao === 'granted' ? (
          <div className="mt-4 flex gap-3">
            <button
              className="btn-ghost"
              onClick={() => notificar({ titulo: 'Notificação de teste', corpo: 'Tudo funcionando! 🔔' })}
            >
              Enviar teste
            </button>
          </div>
        ) : permissao === 'denied' ? (
          <p className="mt-4 text-sm text-slate-500">
            As notificações foram bloqueadas. Reative nas configurações do navegador (ícone de cadeado na barra de
            endereço).
          </p>
        ) : (
          <button className="btn-primary mt-4" onClick={autorizar}>
            🔔 Autorizar notificações
          </button>
        )}
      </div>

      <div className="card p-6">
        <p className="mb-3 font-semibold text-slate-800">O que dispara uma notificação?</p>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>• Atualização de status de um imóvel.</li>
          <li>• Avanço de etapa judicial de desocupação.</li>
          <li>• Alerta de estoque prolongado (mais de 30 dias) — enviado uma única vez por ativo.</li>
          <li>• Alerta de Liminar / Mandado crítico — enviado uma única vez por ativo.</li>
        </ul>
        <p className="mt-4 text-xs text-slate-400">
          {alertas.length > 0
            ? `Há ${alertas.length} alerta(s) crítico(s) ativo(s) no momento.`
            : 'Nenhum alerta crítico ativo no momento.'}
        </p>
      </div>
    </div>
  );
}
