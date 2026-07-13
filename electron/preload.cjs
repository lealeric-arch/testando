// Ponte segura para persistência em arquivo (o renderer não acessa o disco direto).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ecDesktop', {
  carregar: () => ipcRenderer.invoke('store:load'),
  salvar: (dados) => ipcRenderer.invoke('store:save', dados),
  // Diálogo nativo de salvar arquivo; retorna { ok, caminho } ou { ok: false } se cancelado.
  salvarArquivo: (opts) => ipcRenderer.invoke('file:save', opts),
});
