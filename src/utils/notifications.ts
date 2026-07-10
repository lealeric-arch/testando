// Motor de notificações usando a API nativa do navegador (Notification API),
// com filtro de duplicidade por chaves persistidas no localStorage.

const DEDUPE_KEY = 'ec_notif_sent_keys';

export function notificacoesSuportadas(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// Detecta execução dentro de um iframe (onde a permissão pode ser bloqueada).
export function rodandoEmIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function permissaoAtual(): NotificationPermission | 'unsupported' {
  if (!notificacoesSuportadas()) return 'unsupported';
  return Notification.permission;
}

export async function pedirPermissao(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificacoesSuportadas()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    // Alguns navegadores em iframe lançam exceção.
    return Notification.permission;
  }
}

function chavesEnviadas(): Set<string> {
  try {
    const raw = localStorage.getItem(DEDUPE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function salvarChaves(set: Set<string>) {
  try {
    localStorage.setItem(DEDUPE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* ignora */
  }
}

export interface NotificarOpts {
  titulo: string;
  corpo?: string;
  // Quando informado, garante que a notificação só seja enviada uma vez.
  chaveUnica?: string;
  tag?: string;
}

// Dispara uma notificação nativa. Retorna true se realmente foi enviada.
export function notificar(opts: NotificarOpts): boolean {
  if (!notificacoesSuportadas() || Notification.permission !== 'granted') return false;

  if (opts.chaveUnica) {
    const enviadas = chavesEnviadas();
    if (enviadas.has(opts.chaveUnica)) return false;
    enviadas.add(opts.chaveUnica);
    salvarChaves(enviadas);
  }

  try {
    new Notification(opts.titulo, {
      body: opts.corpo,
      tag: opts.tag,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
    });
    return true;
  } catch {
    return false;
  }
}

// Remove uma chave de dedupe (ex.: quando o alerta deixa de valer e pode reaparecer no futuro).
export function limparChave(chave: string) {
  const enviadas = chavesEnviadas();
  if (enviadas.delete(chave)) salvarChaves(enviadas);
}
