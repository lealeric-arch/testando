// Tela de Ajustes: backup/restauração de dados + configurações de notificação.
import { useRef, useState } from 'react';
import type { Imovel } from '../types';
import { store } from '../utils/storage';
import { baixarArquivo, nomeArquivo } from '../utils/download';
import { NotificationSettings } from './NotificationSettings';

export function AjustesView({ imoveis }: { imoveis: Imovel[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [modo, setModo] = useState<'substituir' | 'mesclar'>('mesclar');
  const [msg, setMsg] = useState<string | null>(null);

  function exportar() {
    const data = new Date().toISOString().slice(0, 10);
    baixarArquivo(nomeArquivo(`backup-entre-colunas-${data}`, 'json'), store.exportarEstado(), 'application/json');
    setMsg('Backup exportado. Guarde o arquivo em local seguro (ou envie para o outro aparelho).');
  }

  async function aoEscolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (modo === 'substituir' && !confirm('Substituir TODOS os dados atuais pelos do backup? Esta ação não pode ser desfeita.')) return;
    try {
      const texto = await file.text();
      const r = await store.importarEstado(texto, modo);
      setMsg(`Backup importado (${modo}): ${r.imoveis} imóvel(is) e ${r.gastos} gasto(s).`);
    } catch (err) {
      setMsg('Não foi possível importar: arquivo inválido.');
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-800">Ajustes</h2>
        <p className="text-sm text-slate-500">Backup de dados e notificações.</p>
      </div>

      {/* Backup / restauração */}
      <div className="card p-6">
        <p className="font-semibold text-slate-800">💾 Backup de dados</p>
        <p className="mt-1 text-sm text-slate-500">
          Seus dados ficam apenas neste aparelho. Exporte um arquivo para guardar cópia de segurança
          ou levar os cadastros para outro dispositivo (PC ↔ celular).
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button className="btn-primary" onClick={exportar}>⬇ Exportar backup (.json)</button>

          <div className="flex items-center gap-2">
            <select className="input !w-auto !py-2" value={modo} onChange={(e) => setModo(e.target.value as 'substituir' | 'mesclar')}>
              <option value="mesclar">Mesclar (adiciona/atualiza)</option>
              <option value="substituir">Substituir tudo</option>
            </select>
            <button className="btn-ghost" onClick={() => inputRef.current?.click()}>⬆ Importar backup</button>
          </div>
          <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={aoEscolherArquivo} />
        </div>

        {msg && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{msg}</p>}
        <p className="mt-3 text-xs text-slate-400">
          <strong>Mesclar</strong>: combina o backup com o que já existe (por id). <strong>Substituir</strong>: apaga tudo e usa só o backup.
        </p>
      </div>

      <NotificationSettings imoveis={imoveis} embutido />
    </div>
  );
}
