// Toast simples (pub/sub) para mensagens no estilo da interface, sem alert() nativo.
export type ToastTipo = 'info' | 'sucesso' | 'erro';
export interface ToastMsg {
  id: number;
  texto: string;
  tipo: ToastTipo;
}

type Listener = (t: ToastMsg) => void;
const listeners = new Set<Listener>();
let contador = 1;

export function onToast(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function toast(texto: string, tipo: ToastTipo = 'info') {
  const msg: ToastMsg = { id: contador++, texto, tipo };
  listeners.forEach((l) => l(msg));
}
