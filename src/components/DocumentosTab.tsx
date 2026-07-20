// Aba de Documentos do imóvel: upload, categoria, visualização, download e exclusão.
// Os arquivos são guardados localmente (data URL base64) junto dos dados do app.
import { useRef, useState } from 'react';
import type { Documento, DocumentoCategoria, Imovel } from '../types';
import { DOC_CATEGORIAS } from '../types';
import { novoId, store } from '../utils/storage';
import { toast } from '../utils/toast';
import { ConfirmPopover, Modal } from './ui';

const LIMITE_BYTES = 25 * 1024 * 1024; // 25 MB por arquivo

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function iconePorTipo(tipo: string): string {
  if (tipo.startsWith('image/')) return '🖼️';
  if (tipo === 'application/pdf') return '📕';
  if (tipo.includes('word') || tipo.includes('document')) return '📄';
  if (tipo.includes('sheet') || tipo.includes('excel') || tipo.includes('csv')) return '📊';
  return '📎';
}

function lerComoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function baixar(doc: Documento) {
  const a = document.createElement('a');
  a.href = doc.dataUrl;
  a.download = doc.nome;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function DocumentosTab({ imovel, documentos }: { imovel: Imovel; documentos: Documento[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [categoria, setCategoria] = useState<DocumentoCategoria>('Matrícula');
  const [preview, setPreview] = useState<Documento | null>(null);
  const [enviando, setEnviando] = useState(false);

  const doImovel = documentos.filter((d) => d.imovelId === imovel.id);

  async function aoEscolher(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setEnviando(true);
    try {
      for (const file of files) {
        if (file.size > LIMITE_BYTES) {
          toast(`"${file.name}" é grande demais (máx. 25 MB).`, 'erro');
          continue;
        }
        const dataUrl = await lerComoDataUrl(file);
        const doc: Documento = {
          id: novoId('doc'),
          imovelId: imovel.id,
          nome: file.name,
          tipo: file.type || 'application/octet-stream',
          tamanho: file.size,
          categoria,
          dataUrl,
          createdAt: new Date().toISOString(),
        };
        await store.salvarDocumento(doc);
      }
      toast('Documento(s) anexado(s).', 'sucesso');
    } catch {
      toast('Não foi possível ler o arquivo.', 'erro');
    } finally {
      setEnviando(false);
    }
  }

  const podeVisualizar = (d: Documento) => d.tipo.startsWith('image/') || d.tipo === 'application/pdf';

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{doImovel.length} documento(s) anexado(s)</p>
          <p className="text-xs text-slate-400">Matrícula, edital, ITBI, escritura, contrato, fotos…</p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label className="label">Categoria</label>
            <select className="input !w-auto !py-2" value={categoria} onChange={(e) => setCategoria(e.target.value as DocumentoCategoria)}>
              {DOC_CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary" disabled={enviando} onClick={() => inputRef.current?.click()}>
            {enviando ? 'Enviando…' : '⬆ Anexar arquivo'}
          </button>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={aoEscolher} />
        </div>
      </div>

      {doImovel.length === 0 ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-200 py-12 text-slate-400 transition hover:border-caixa-blue hover:text-caixa-blue"
        >
          <span className="text-3xl">📎</span>
          <span className="text-sm">Clique para anexar documentos do imóvel</span>
        </button>
      ) : (
        <div className="space-y-2">
          {doImovel
            .slice()
            .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
            .map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="text-2xl">{iconePorTipo(d.tipo)}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">{d.categoria}</span>
                      <p className="truncate text-sm font-medium text-slate-800">{d.nome}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatBytes(d.tamanho)} · {d.createdAt ? new Date(d.createdAt).toLocaleDateString('pt-BR') : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {podeVisualizar(d) && (
                    <button onClick={() => setPreview(d)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-caixa-blue" title="Visualizar">
                      👁️
                    </button>
                  )}
                  <button onClick={() => baixar(d)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-caixa-blue" title="Baixar">
                    ⬇️
                  </button>
                  <ConfirmPopover mensagem={`Excluir "${d.nome}"?`} onConfirm={() => store.excluirDocumento(d.id)}>
                    {(abrir) => (
                      <button onClick={abrir} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="Excluir">
                        🗑️
                      </button>
                    )}
                  </ConfirmPopover>
                </div>
              </div>
            ))}
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400">
        Os arquivos ficam salvos neste aparelho, junto dos dados do imóvel, e entram no backup (Ajustes → Backup).
      </p>

      {/* Pré-visualização */}
      <Modal aberto={!!preview} onClose={() => setPreview(null)} titulo={preview?.nome || ''} largura="max-w-3xl">
        {preview && preview.tipo.startsWith('image/') && (
          <img src={preview.dataUrl} alt={preview.nome} className="mx-auto max-h-[70vh] rounded" />
        )}
        {preview && preview.tipo === 'application/pdf' && (
          <iframe title={preview.nome} src={preview.dataUrl} className="h-[70vh] w-full rounded border border-slate-200" />
        )}
        <div className="mt-4 flex justify-end">
          <button className="btn-ghost" onClick={() => preview && baixar(preview)}>⬇ Baixar</button>
        </div>
      </Modal>
    </div>
  );
}
