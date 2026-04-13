const { app, BrowserWindow } = require('electron');
const path = require('path');

// Vite'nin varsayılan portu 5173'tür. 
// Geliştirmede portu izleriz, derlendiğinde statik dosyaları okuruz.
const isDev = process.env.IS_DEV === 'true';

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    autoHideMenuBar: true, // Üstteki rahatsız edici menüyü gizler, temiz görünüm için.
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false, // CORS korumasını tamamen kapatır, herhangi bir adresten veri çekilmesine izin verir.
    },
  });

  if (isDev) {
    // Geliştirme safhasındaysa localhost'taki Vite sunucusuna bağlan
    win.loadURL('http://localhost:5173');
    // win.webContents.openDevTools(); // Debug için açılabilir
  } else {
    // Uygulama derlendikten sonra .exe dosyası içinde "dist/index.html" dosyasını arayacak.
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

// Sitelerin güvenlik duvarlarını aşmak (Tass vb. siteler Electron'u engelleyebilir)
// Uygulamayı tamamen gerçek bir Google Chrome tarayıcısı gibi gösteririz.
app.userAgentFallback = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

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
