// Compartilhamento de UM imóvel com o sócio — sem servidor/backend.
//
// A "questão do token": este app é 100% local (dados no próprio aparelho, sem nuvem).
// Não existe um servidor para emitir um token e sincronizar. A alternativa prática,
// que funciona sem backend, é gerar um LINK AUTOCONTIDO (o próprio link é o "token"):
// os dados do imóvel são codificados dentro da URL, no fragmento (#), que nunca é
// enviado a nenhum servidor. O sócio abre o link na versão web e vê uma
// visualização SOMENTE LEITURA — um retrato (snapshot) do momento em que foi gerado.

import type { Gasto, Imovel } from '../types';

// URL pública da versão web (usada quando o link é gerado no app desktop — file://).
const URL_WEB_PUBLICA = 'https://lealeric-arch.github.io/testando/';

export const PREFIXO_HASH = 'compartilhado=';
const VERSAO_PAYLOAD = 1;

export interface PayloadCompartilhado {
  v: number;
  ts: string; // quando o link foi gerado (ISO)
  imovel: Imovel;
  gastos: Gasto[]; // apenas os gastos deste imóvel
}

// ---- Base64 seguro para Unicode e para URL ----
function paraBase64Url(texto: string): string {
  const b64 = btoa(unescape(encodeURIComponent(texto)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function deBase64Url(b64url: string): string {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  return decodeURIComponent(escape(atob(b64 + pad)));
}

// Base para o link. No desktop (file://) aponta para a versão web pública,
// para que o link seja abrível pelo sócio em qualquer aparelho.
function baseDoLink(): string {
  try {
    const loc = window.location;
    if (loc.protocol === 'file:') return URL_WEB_PUBLICA;
    return loc.origin + loc.pathname + loc.search;
  } catch {
    return URL_WEB_PUBLICA;
  }
}

// Gera o link de compartilhamento (somente leitura) para um imóvel + seus gastos.
export function gerarLinkCompartilhamento(imovel: Imovel, gastos: Gasto[]): string {
  const gastosDoImovel = gastos.filter((g) => g.imovelId === imovel.id);
  const payload: PayloadCompartilhado = {
    v: VERSAO_PAYLOAD,
    ts: new Date().toISOString(),
    imovel,
    gastos: gastosDoImovel,
  };
  const codificado = paraBase64Url(JSON.stringify(payload));
  return `${baseDoLink()}#${PREFIXO_HASH}${codificado}`;
}

// Lê um payload compartilhado a partir do hash atual da URL (se houver).
export function lerCompartilhamentoDaURL(): PayloadCompartilhado | null {
  try {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash.startsWith(PREFIXO_HASH)) return null;
    const codificado = hash.slice(PREFIXO_HASH.length);
    if (!codificado) return null;
    const json = deBase64Url(codificado);
    const payload = JSON.parse(json) as PayloadCompartilhado;
    if (!payload || !payload.imovel || !payload.imovel.id) return null;
    return payload;
  } catch {
    return null;
  }
}

// Copia texto para a área de transferência com fallback para navegadores antigos.
export async function copiarParaAreaTransferencia(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    /* tenta o fallback abaixo */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
