const { contextBridge, ipcRenderer } = require('electron');

// API segura exposta ao renderer (sem acesso direto ao Node).
contextBridge.exposeInMainWorld('api', {
  load: () => ipcRenderer.invoke('db:load'),
  save: (data) => ipcRenderer.invoke('db:save', data),
  exportBackup: (data) => ipcRenderer.invoke('backup:export', data),
  importBackup: () => ipcRenderer.invoke('backup:import'),
  exportCsv: (payload) => ipcRenderer.invoke('csv:export', payload),
});
