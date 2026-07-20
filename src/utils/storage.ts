// Persistência local (usuário único, sem nuvem/compartilhamento).
// Todos os dados ficam no localStorage do próprio computador.
import type { Documento, Gasto, Imovel } from '../types';
import { baixarArquivo } from './download';

const LS_IMOVEIS = 'ec_imoveis';
const LS_GASTOS = 'ec_gastos';
const LS_DOCUMENTOS = 'ec_documentos';

export interface EstadoDados {
  imoveis: Imovel[];
  gastos: Gasto[];
  documentos: Documento[];
}

type Listener = (estado: EstadoDados) => void;

// Ponte de persistência do Electron (arquivo em disco). Ausente na web.
interface DesktopBridge {
  carregar: () => Promise<EstadoDados>;
  salvar: (dados: EstadoDados) => Promise<{ ok: boolean }>;
  salvarArquivo: (opts: { nome: string; conteudo: string }) => Promise<{ ok: boolean; caminho?: string }>;
}
function desktop(): DesktopBridge | null {
  return (typeof window !== 'undefined' && (window as unknown as { ecDesktop?: DesktopBridge }).ecDesktop) || null;
}
export function isDesktop(): boolean {
  return desktop() != null;
}

class DataStore {
  private imoveis: Imovel[] = [];
  private gastos: Gasto[] = [];
  private documentos: Documento[] = [];
  private listeners = new Set<Listener>();

  async init(): Promise<void> {
    const d = desktop();
    if (d) {
      // Electron: persistência real em arquivo (localStorage em file:// não é confiável).
      try {
        const dados = await d.carregar();
        this.imoveis = Array.isArray(dados?.imoveis) ? dados.imoveis : [];
        this.gastos = Array.isArray(dados?.gastos) ? dados.gastos : [];
        this.documentos = Array.isArray(dados?.documentos) ? dados.documentos : [];
      } catch {
        this.imoveis = [];
        this.gastos = [];
        this.documentos = [];
      }
    } else {
      this.imoveis = readLS<Imovel[]>(LS_IMOVEIS, []);
      this.gastos = readLS<Gasto[]>(LS_GASTOS, []);
      this.documentos = readLS<Documento[]>(LS_DOCUMENTOS, []);
    }
    this.emit();
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.snapshot());
    return () => this.listeners.delete(fn);
  }

  snapshot(): EstadoDados {
    return { imoveis: this.imoveis, gastos: this.gastos, documentos: this.documentos };
  }

  private emit() {
    const snap = this.snapshot();
    this.listeners.forEach((l) => l(snap));
  }

  private persistir() {
    const d = desktop();
    if (d) {
      // Grava no arquivo (fire-and-forget); erros não bloqueiam a UI.
      d.salvar(this.snapshot()).catch(() => {});
    } else {
      writeLS(LS_IMOVEIS, this.imoveis);
      writeLS(LS_GASTOS, this.gastos);
      writeLS(LS_DOCUMENTOS, this.documentos);
    }
  }

  // Salva um arquivo pelo diálogo nativo (Electron) ou download (web).
  // Retorna false quando o usuário cancela no desktop.
  async salvarArquivoTexto(nome: string, conteudo: string): Promise<boolean> {
    const d = desktop();
    if (d) {
      const r = await d.salvarArquivo({ nome, conteudo });
      return !!r.ok;
    }
    // Web: download via blob (não há como detectar cancelamento).
    baixarArquivo(nome, conteudo, 'application/octet-stream');
    return true;
  }

  // ---- Mutações de imóveis ----
  async salvarImovel(imovel: Imovel): Promise<void> {
    const idx = this.imoveis.findIndex((i) => i.id === imovel.id);
    if (idx >= 0) this.imoveis = this.imoveis.map((i) => (i.id === imovel.id ? imovel : i));
    else this.imoveis = [...this.imoveis, imovel];
    this.persistir();
    this.emit();
  }

  // Exclusão em cascata: remove o imóvel, seus gastos e documentos vinculados.
  async excluirImovel(imovelId: string): Promise<void> {
    this.imoveis = this.imoveis.filter((i) => i.id !== imovelId);
    this.gastos = this.gastos.filter((g) => g.imovelId !== imovelId);
    this.documentos = this.documentos.filter((doc) => doc.imovelId !== imovelId);
    this.persistir();
    this.emit();
  }

  // ---- Mutações de gastos ----
  async salvarGasto(gasto: Gasto): Promise<void> {
    const idx = this.gastos.findIndex((g) => g.id === gasto.id);
    if (idx >= 0) this.gastos = this.gastos.map((g) => (g.id === gasto.id ? gasto : g));
    else this.gastos = [...this.gastos, gasto];
    this.persistir();
    this.emit();
  }

  async excluirGasto(gastoId: string): Promise<void> {
    this.gastos = this.gastos.filter((g) => g.id !== gastoId);
    this.persistir();
    this.emit();
  }

  // ---- Mutações de documentos ----
  async salvarDocumento(doc: Documento): Promise<void> {
    const idx = this.documentos.findIndex((d) => d.id === doc.id);
    if (idx >= 0) this.documentos = this.documentos.map((d) => (d.id === doc.id ? doc : d));
    else this.documentos = [...this.documentos, doc];
    this.persistir();
    this.emit();
  }

  async excluirDocumento(docId: string): Promise<void> {
    this.documentos = this.documentos.filter((d) => d.id !== docId);
    this.persistir();
    this.emit();
  }

  // ---- Backup / restauração ----
  exportarEstado(): string {
    return JSON.stringify(
      { app: 'entre-colunas-leiloes', versao: 1, exportadoEm: new Date().toISOString(), ...this.snapshot() },
      null,
      2,
    );
  }

  // Importa um backup. modo 'substituir' troca tudo; 'mesclar' faz upsert por id.
  async importarEstado(json: string, modo: 'substituir' | 'mesclar'): Promise<{ imoveis: number; gastos: number }> {
    const dados = JSON.parse(json);
    const imoveis: Imovel[] = Array.isArray(dados.imoveis) ? dados.imoveis : [];
    const gastos: Gasto[] = Array.isArray(dados.gastos) ? dados.gastos : [];
    const documentos: Documento[] = Array.isArray(dados.documentos) ? dados.documentos : [];
    if (!imoveis.length && !gastos.length) throw new Error('Arquivo sem imóveis nem gastos.');

    if (modo === 'substituir') {
      this.imoveis = imoveis;
      this.gastos = gastos;
      this.documentos = documentos;
    } else {
      const mapaI = new Map(this.imoveis.map((i) => [i.id, i]));
      imoveis.forEach((i) => mapaI.set(i.id, i));
      const mapaG = new Map(this.gastos.map((g) => [g.id, g]));
      gastos.forEach((g) => mapaG.set(g.id, g));
      const mapaD = new Map(this.documentos.map((d) => [d.id, d]));
      documentos.forEach((d) => mapaD.set(d.id, d));
      this.imoveis = Array.from(mapaI.values());
      this.gastos = Array.from(mapaG.values());
      this.documentos = Array.from(mapaD.values());
    }
    this.persistir();
    this.emit();
    return { imoveis: imoveis.length, gastos: gastos.length };
  }
}

function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* cota excedida ou indisponível */
  }
}

export const store = new DataStore();

export function novoId(prefixo = 'id'): string {
  return `${prefixo}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}
