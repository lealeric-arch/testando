// Camada de persistência híbrida: Firestore em tempo real quando disponível,
// com fallback transparente para o localStorage do navegador (modo offline).
import type { Gasto, Imovel } from '../types';
import { firebaseHabilitado, initFirebase, autenticarAnonimo } from '../firebase';

const LS_IMOVEIS = 'ec_imoveis';
const LS_GASTOS = 'ec_gastos';

export type ModoPersistencia = 'firestore' | 'local';

export interface EstadoDados {
  imoveis: Imovel[];
  gastos: Gasto[];
}

type Listener = (estado: EstadoDados) => void;

// Firestore é carregado dinamicamente para não pesar o bundle no modo offline.
type FirestoreApi = typeof import('firebase/firestore');

class DataStore {
  private imoveis: Imovel[] = [];
  private gastos: Gasto[] = [];
  private listeners = new Set<Listener>();
  private modo: ModoPersistencia = 'local';
  private fs: FirestoreApi | null = null;
  private db: import('firebase/firestore').Firestore | null = null;

  get modoAtual(): ModoPersistencia {
    return this.modo;
  }

  async init(): Promise<void> {
    // Carrega estado local imediatamente para render instantâneo.
    this.imoveis = readLS<Imovel[]>(LS_IMOVEIS, []);
    this.gastos = readLS<Gasto[]>(LS_GASTOS, []);
    this.emit();

    if (!firebaseHabilitado) {
      this.modo = 'local';
      return;
    }

    try {
      const fb = initFirebase();
      if (!fb) return;
      await autenticarAnonimo();
      this.fs = await import('firebase/firestore');
      this.db = fb.db;
      this.modo = 'firestore';
      this.assinarFirestore('imoveis');
      this.assinarFirestore('gastos');
    } catch {
      // Falha de conexão → mantém localStorage.
      this.modo = 'local';
    }
  }

  private assinarFirestore(col: 'imoveis' | 'gastos') {
    if (!this.fs || !this.db) return;
    const { collection, onSnapshot } = this.fs;
    onSnapshot(collection(this.db, col), (snap) => {
      const docs = snap.docs.map((d) => d.data());
      if (col === 'imoveis') this.imoveis = docs as Imovel[];
      else this.gastos = docs as Gasto[];
      this.persistirLocal();
      this.emit();
    });
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

  private persistirLocal() {
    writeLS(LS_IMOVEIS, this.imoveis);
    writeLS(LS_GASTOS, this.gastos);
  }

  // ---- Mutações de imóveis ----
  async salvarImovel(imovel: Imovel): Promise<void> {
    const idx = this.imoveis.findIndex((i) => i.id === imovel.id);
    if (idx >= 0) this.imoveis[idx] = imovel;
    else this.imoveis = [...this.imoveis, imovel];
    this.persistirLocal();
    this.emit();
    if (this.modo === 'firestore' && this.fs && this.db) {
      const { doc, setDoc } = this.fs;
      await setDoc(doc(this.db, 'imoveis', imovel.id), imovel);
    }
  }

  // Exclusão em cascata: remove o imóvel e todos os gastos vinculados.
  async excluirImovel(imovelId: string): Promise<void> {
    const gastosVinculados = this.gastos.filter((g) => g.imovelId === imovelId);
    this.imoveis = this.imoveis.filter((i) => i.id !== imovelId);
    this.gastos = this.gastos.filter((g) => g.imovelId !== imovelId);
    this.persistirLocal();
    this.emit();
    if (this.modo === 'firestore' && this.fs && this.db) {
      const { doc, deleteDoc } = this.fs;
      await deleteDoc(doc(this.db, 'imoveis', imovelId));
      await Promise.all(gastosVinculados.map((g) => deleteDoc(doc(this.db!, 'gastos', g.id))));
    }
  }

  // ---- Mutações de gastos ----
  async salvarGasto(gasto: Gasto): Promise<void> {
    const idx = this.gastos.findIndex((g) => g.id === gasto.id);
    if (idx >= 0) this.gastos[idx] = gasto;
    else this.gastos = [...this.gastos, gasto];
    this.persistirLocal();
    this.emit();
    if (this.modo === 'firestore' && this.fs && this.db) {
      const { doc, setDoc } = this.fs;
      await setDoc(doc(this.db, 'gastos', gasto.id), gasto);
    }
  }

  async excluirGasto(gastoId: string): Promise<void> {
    this.gastos = this.gastos.filter((g) => g.id !== gastoId);
    this.persistirLocal();
    this.emit();
    if (this.modo === 'firestore' && this.fs && this.db) {
      const { doc, deleteDoc } = this.fs;
      await deleteDoc(doc(this.db, 'gastos', gastoId));
    }
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
