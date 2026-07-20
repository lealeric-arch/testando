// Processo principal do Electron: cria a janela, carrega o app e persiste dados em arquivo.
const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function arquivoDados() {
  return path.join(app.getPath('userData'), 'entre-colunas-dados.json');
}

// ---- Persistência em arquivo (robusta, ao contrário do localStorage em file://) ----
ipcMain.handle('store:load', () => {
  try {
    const p = arquivoDados();
    if (!fs.existsSync(p)) return { imoveis: [], gastos: [], documentos: [] };
    const dados = JSON.parse(fs.readFileSync(p, 'utf8'));
    return {
      imoveis: Array.isArray(dados.imoveis) ? dados.imoveis : [],
      gastos: Array.isArray(dados.gastos) ? dados.gastos : [],
      documentos: Array.isArray(dados.documentos) ? dados.documentos : [],
    };
  } catch {
    return { imoveis: [], gastos: [], documentos: [] };
  }
});

ipcMain.handle('store:save', (_evt, dados) => {
  try {
    const p = arquivoDados();
    const tmp = p + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(dados ?? { imoveis: [], gastos: [], documentos: [] }, null, 2), 'utf8');
    fs.renameSync(tmp, p); // gravação atômica
    return { ok: true };
  } catch (err) {
    return { ok: false, erro: String(err) };
  }
});

// ---- Diálogo nativo de salvar arquivo (retorna cancelado corretamente) ----
ipcMain.handle('file:save', async (_evt, opts) => {
  const win = BrowserWindow.getFocusedWindow();
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    defaultPath: (opts && opts.nome) || 'arquivo.txt',
  });
  if (canceled || !filePath) return { ok: false };
  try {
    fs.writeFileSync(filePath, (opts && opts.conteudo) || '', 'utf8');
    return { ok: true, caminho: filePath };
  } catch (err) {
    return { ok: false, erro: String(err) };
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: 'Entre Colunas Leilões',
    backgroundColor: '#f4f6f9',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setMenuBarVisibility(false);

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    win.loadURL(devUrl);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
