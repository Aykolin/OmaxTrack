import { app, BrowserWindow, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Configurar o Atualizador
autoUpdater.autoDownload = false; // Pergunta antes de baixar
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'dist/icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Necessário para evitar erros de require em alguns casos
    },
    autoHideMenuBar: true,
  });

  mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));

  // 2. Verificar atualizações assim que a janela aparecer
  mainWindow.once('ready-to-show', () => {
    if (app.isPackaged) {
      autoUpdater.checkForUpdatesAndNotify();
    }
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

// --- EVENTOS DE ATUALIZAÇÃO ---

autoUpdater.on('update-available', () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Atualização Disponível',
    message: 'Uma nova versão do OmaxTrack está disponível. Deseja baixar e instalar agora?',
    buttons: ['Sim', 'Depois']
  }).then((result) => {
    if (result.response === 0) { // Clicou em Sim
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Pronto para Instalar',
    message: 'A atualização foi baixada. O aplicativo será reiniciado para atualizar.',
    buttons: ['Reiniciar Agora']
  }).then(() => {
    autoUpdater.quitAndInstall();
  });
});

autoUpdater.on('error', (err) => {
  console.error('Erro no Auto-Updater:', err);
});