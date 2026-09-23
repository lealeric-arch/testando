// ENDURO 2026 · CITY — wrapper Electron (app de PC nativo)
// Abre o jogo 3D (index3d.html) numa janela em tela cheia, roda offline.
const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");

// caminho do jogo: empacotado (dentro de resources/game) ou em desenvolvimento (pasta acima)
function gameFile() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "game", "index3d.html")
    : path.join(__dirname, "..", "index3d.html");
}

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    fullscreen: true,
    backgroundColor: "#05060f",
    autoHideMenuBar: true,
    title: "ENDURO 2026 · CITY",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false // mantém o loop do jogo em 60fps mesmo minimizado
    }
  });

  Menu.setApplicationMenu(null);
  win.loadFile(gameFile());

  // F11 alterna tela cheia; Esc sai da tela cheia
  win.webContents.on("before-input-event", (event, input) => {
    if (input.type !== "keyDown") return;
    if (input.key === "F11") { win.setFullScreen(!win.isFullScreen()); event.preventDefault(); }
    else if (input.key === "Escape" && win.isFullScreen()) { win.setFullScreen(false); event.preventDefault(); }
  });

  // links externos abrem no navegador padrão, não dentro do jogo
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: "deny" }; });
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
