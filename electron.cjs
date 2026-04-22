const { app, BrowserWindow, shell, ipcMain, net } = require('electron');
let autoUpdater;
try {
  autoUpdater = require('electron-updater').autoUpdater;
} catch (e) {
  // Module not found, silent fallback
}
const path = require('path');

// --- CONSTANTS ---
const LOAD_GRACE_PERIOD_MS = 3000;
const REDIRECT_DELAY_MS = 100;

const isDev = !app.isPackaged;

/**
 * Common redirect handler
 */
const handleRedirect = (contents, url, title, message) => {
  const ignoredDomains = [
    'googlesyndication.com', 'doubleclick.net', 'googleadservices.com', 
    'safeframe.googlesyndication.com', 'ads-twitter.com', 'chartbeat.net',
    'nav-client.bbc.com', 'static.bbc.co.uk'
  ];
  
  if (ignoredDomains.some(domain => url.includes(domain))) return;

  contents.send('show-pc-notification', {
    title: title,
    message: 'Güvenliğiniz için bu haber varsayılan tarayıcıda açılıyor.',
    detail: 'Haber sitesi kısıtlamaları nedeniyle Chrome üzerinde devam ediliyor.',
    type: 'warning'
  });

  shell.openExternal(url);
  // Ana pencereyi kapatma mantığı hatalıydı (Bug #11), kaldırıldı.
};

// Hata Yakalayıcı (Terminalde crash detaylarını görmek için)
process.on('uncaughtException', (error) => {
  console.error('[Electron Main] Uncaught Exception:', error);
});

function createWindow() {
  const isDev = process.env.IS_DEV === 'true' || !app.isPackaged;
  const iconPath = path.join(__dirname, 'resources', 'icon.png');
  
  // İkon dosya kontrolü
  const fs = require('fs');
  const finalIcon = fs.existsSync(iconPath) ? iconPath : undefined;

  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Gündemim',
    icon: finalIcon,
    autoHideMenuBar: true,
    show: false, // Hazır olana kadar gizli tut (Siyah/Beyaz ekranı önler)
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes('accounts.google.com') || url.includes('console.groq.com')) {
       shell.openExternal(url);
       return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  if (isDev) {
    console.log('[Electron] Loading dev server: http://localhost:5173');
    win.loadURL('http://localhost:5173').catch(() => {
      console.log('[Electron] Retrying loadURL in 1s...');
      setTimeout(() => win.loadURL('http://localhost:5173'), 1000);
    });
    
    win.webContents.on('did-finish-load', () => {
      win.webContents.openDevTools({ mode: 'right' });
    });
    
    win.webContents.session.clearCache().catch(() => {});
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html')).catch(err => {
      console.error('[Electron] Failed to load production file:', err);
    });
  }

  win.once('ready-to-show', () => {
    win.show();
  });
}

// Security: API Key Encryption
const { safeStorage } = require('electron');
const fs = require('fs');

ipcMain.handle('save-api-key', async (event, key) => {
  if (!safeStorage.isEncryptionAvailable()) throw new Error('Encryption not supported');
  const encrypted = safeStorage.encryptString(key);
  const keyPath = path.join(app.getPath('userData'), 'apisecret.bin');
  fs.writeFileSync(keyPath, encrypted);
  return true;
});

ipcMain.handle('get-api-key', async () => {
  const keyPath = path.join(app.getPath('userData'), 'apisecret.bin');
  if (!fs.existsSync(keyPath)) return null;
  if (!safeStorage.isEncryptionAvailable()) throw new Error('Decryption not supported');
  const buffer = fs.readFileSync(keyPath);
  return safeStorage.decryptString(buffer);
});

// IPC: RSS Fetching
ipcMain.handle('fetch-rss', async (event, url, timeoutMs = 20000) => {
  const cleanUrl = url.trim();
  const attemptFetch = async (targetUrl) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(targetUrl, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        }
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`${response.status}`);
      return await response.text();
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  try {
    return await attemptFetch(cleanUrl);
  } catch (error) {
    if (cleanUrl.startsWith('http://')) {
      const httpsUrl = cleanUrl.replace('http://', 'https://');
      try {
        return await attemptFetch(httpsUrl);
      } catch (retryError) {
        throw new Error(`Failed: ${retryError.message}`);
      }
    }
    throw error;
  }
});

// IPC: Translation with multiple fallbacks and silent error handling
ipcMain.handle('translate-text', async (event, text, targetLang = 'tr') => {
  // Option 1: Google Translate (Informal API)
  try {
    const trUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(trUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data[0])) {
        let translatedText = '';
        data[0].forEach(t => { if (t[0]) translatedText += t[0]; });
        if (translatedText) return translatedText;
      }
    }
  } catch (err) { /* Silent fallback */ }

  // Option 2: LibreTranslate Cluster
  const LIBRE_ENDPOINTS = [
    'https://libretranslate.de/translate',
    'https://de.libretranslate.com/translate',
    'https://translate.terraprint.co/translate'
  ];

  for (const endpoint of LIBRE_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: 'auto', target: 'tr', format: 'text' })
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          if (data?.translatedText) return data.translatedText;
        }
      }
    } catch (err) { /* Silent skip next */ }
  }
  
  return text;
});

app.userAgentFallback = "Gundemim/1.1 (RSS Reader; +https://github.com/OmerCanInan/Gundemim)";

app.on('web-contents-created', (event, contents) => {
  if (contents.getType() === 'window') {
    contents.spawnTime = Date.now();
    
    contents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      // Geliştirme sunucusu (localhost) hatalarını görmezden gel, yönlendirme yapma
      if (validatedURL && (validatedURL.includes('localhost') || validatedURL.includes('127.0.0.1'))) return;

      // Only redirect if it fails immediately during load
      if (Date.now() - contents.spawnTime > LOAD_GRACE_PERIOD_MS) return;
      if (validatedURL && validatedURL.startsWith('http')) {
        handleRedirect(contents, validatedURL, 'Bağlantı Sorunu', 'Sayfa uygulama dışına yönlendirildi.');
      }
    });

    // SPAM PREVENTION: Disabled the 403/401 automatic redirect to avoid constant popups
  }
});

app.whenReady().then(() => {
  createWindow();

  // Yalnızca paketlenmiş (production) sürümde güncellemeleri kontrol et
  if (!isDev && autoUpdater) {
    console.log('[Electron] Checking for updates...');
    autoUpdater.checkForUpdatesAndNotify().catch(err => {
      console.warn('[Electron] Update check failed:', err);
    });
  }

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
