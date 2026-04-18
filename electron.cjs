const { app, BrowserWindow, shell, ipcMain, net } = require('electron');
const path = require('path');

// --- CONSTANTS (Audit: Replace magic numbers) ---
const LOAD_GRACE_PERIOD_MS = 3000;
const HTTP_ERROR_CHECK_PERIOD_MS = 3500;
const REDIRECT_DELAY_MS = 100;

// Security: No longer disabling web-security globally.
// We will fetch RSS in the Main process which is not bound by CORS.

const isDev = !app.isPackaged;

/**
 * Common redirect handler (Audit: Extracted to named function)
 */
const handleRedirect = (contents, url, title, message) => {
  const ignoredDomains = [
    'googlesyndication.com', 'doubleclick.net', 'googleadservices.com', 
    'safeframe.googlesyndication.com', 'ads-twitter.com', 'chartbeat.net',
    'nav-client.bbc.com', 'static.bbc.co.uk'
  ];
  
  if (ignoredDomains.some(domain => url.includes(domain))) return;

  console.warn(`${title}: ${url}`);
  
  // Notify Renderer
  contents.send('show-pc-notification', {
    title: title,
    message: 'Güvenliğiniz için bu haber varsayılan tarayıcıda açılıyor.',
    detail: 'Haber sitesi kısıtlamaları nedeniyle Chrome üzerinde devam ediliyor.',
    type: 'warning'
  });

  shell.openExternal(url);
  const win = BrowserWindow.fromWebContents(contents);
  if (win) {
    setTimeout(() => win.close(), REDIRECT_DELAY_MS);
  }
};

const GLOBAL_TIMEOUT_MS = 10000;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Gündemim',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js') // Root preload path
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
    win.webContents.session.clearCache().then(() => {
      win.loadURL('http://localhost:5173');
      win.webContents.openDevTools({ mode: 'right' });
    });
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

// Security: API Key Encryption (Audit: safeStorage implementation)
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

// IPC: RSS Fetching (Audit: Move RSS fetching to Main)
ipcMain.handle('fetch-rss', async (event, url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GLOBAL_TIMEOUT_MS);

  try {
    const response = await net.fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': app.userAgentFallback,
        'Cache-Control': 'no-cache'
      }
    });
    
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.text();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
});

app.userAgentFallback = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

// Audit: Centralized session management (Avoid duplicate listeners)
app.on('web-contents-created', (event, contents) => {
  if (contents.getType() === 'window') {
    contents.spawnTime = Date.now();
    
    contents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      if (Date.now() - contents.spawnTime > LOAD_GRACE_PERIOD_MS) return;
      if (validatedURL && validatedURL.startsWith('http')) {
        handleRedirect(contents, validatedURL, 'Bağlantı Sorunu', 'Bu site şu an uygulama içinde açılamıyor.');
      }
    });

    contents.on('did-navigate', (event, url, httpResponseCode) => {
      if (Date.now() - contents.spawnTime > HTTP_ERROR_CHECK_PERIOD_MS) return;
      if (httpResponseCode === 403 || httpResponseCode === 401) {
        handleRedirect(contents, url, 'Erişim Engellendi', 'Bu site uygulama içinden erişimi reddetti.');
      }
    });
  }
});

app.whenReady().then(() => {
  // Global Session Settings: Avoid memory leaks by registering ONCE at app level
  const { session } = require('electron');
  session.defaultSession.webRequest.onCompleted({ urls: ['*://*/*'] }, (details) => {
    const webContents = details.webContents;
    if (!webContents) return;

    if (
      details.resourceType === 'mainFrame' && 
      (details.statusCode === 403 || details.statusCode === 401) &&
      (Date.now() - (webContents.spawnTime || 0) < LOAD_GRACE_PERIOD_MS) &&
      details.url === webContents.getURL()
    ) {
      handleRedirect(webContents, details.url, 'Erişim Engellendi', 'Site güvenliği reddetti.');
    }
  });

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
