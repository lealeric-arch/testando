// Persistência local (usuário único, sem nuvem/compartilhamento).
// Todos os dados ficam no localStorage do próprio computador.
import type { Gasto, Imovel } from '../types';

const LS_IMOVEIS = 'ec_imoveis';
const LS_GASTOS = 'ec_gastos';

export interface EstadoDados {
  imoveis: Imovel[];
  gastos: Gasto[];
}

type Listener = (estado: EstadoDados) => void;

class DataStore {
  private imoveis: Imovel[] = [];
  private gastos: Gasto[] = [];
  private listeners = new Set<Listener>();

  async init(): Promise<void> {
    this.imoveis = readLS<Imovel[]>(LS_IMOVEIS, []);
    this.gastos = readLS<Gasto[]>(LS_GASTOS, []);
    this.emit();
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.snapshot());
    return () => this.listeners.delete(fn);
  }

  snapshot(): EstadoDados {
    return { imoveis: this.imoveis, gastos: this.gastos };
  }

  private emit() {
    const snap = this.snapshot();
    this.listeners.forEach((l) => l(snap));
  }

  private persistir() {
    writeLS(LS_IMOVEIS, this.imoveis);
    writeLS(LS_GASTOS, this.gastos);
  }

  // ---- Mutações de imóveis ----
  async salvarImovel(imovel: Imovel): Promise<void> {
    const idx = this.imoveis.findIndex((i) => i.id === imovel.id);
    if (idx >= 0) this.imoveis = this.imoveis.map((i) => (i.id === imovel.id ? imovel : i));
    else this.imoveis = [...this.imoveis, imovel];
    this.persistir();
    this.emit();
  }

  // Exclusão em cascata: remove o imóvel e todos os gastos vinculados.
  async excluirImovel(imovelId: string): Promise<void> {
    this.imoveis = this.imoveis.filter((i) => i.id !== imovelId);
    this.gastos = this.gastos.filter((g) => g.imovelId !== imovelId);
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
