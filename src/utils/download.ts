// Dispara o download de um conteúdo textual como arquivo local.
export function baixarArquivo(nome: string, conteudo: string, mime: string) {
  const blob = new Blob(['﻿' + conteudo], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function nomeArquivo(base: string, ext: string): string {
  const limpo = base.replace(/[^\w\-]+/g, '-').replace(/-+/g, '-').toLowerCase();
  return `${limpo || 'export'}.${ext}`;
}
