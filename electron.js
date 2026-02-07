import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'dist/icon.ico'), // Usa o ícone convertido
    webPreferences: {
      nodeIntegration: true,
    },
    autoHideMenuBar: true, // Esconde a barra de menu padrão (File, Edit...)
  });

  // Em produção, carrega o index.html da pasta dist
  // Em desenvolvimento, poderia carregar localhost, mas para gerar o exe vamos focar no build
  win.loadFile(path.join(__dirname, 'dist/index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});