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

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Gündemim',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,    // Security: Disabled
      contextIsolation: true,    // Security: Enabled
      webSecurity: true,         // Security: Enabled (Shield on)
      sandbox: true,             // Security: Enabled
      preload: path.join(__dirname, 'src', 'preload.js') // Link the bridge
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

// IPC: RSS Fetching (Audit: Move RSS fetching to Main)
ipcMain.handle('fetch-rss', async (event, url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 saniye sert limit

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
    if (error.name === 'AbortError') {
      console.error(`RSS Fetch TIMEOUT (${url}) - 12s sınırı aşıldı.`);
    } else {
      console.error(`RSS Fetch Error (${url}):`, error.message);
    }
    throw error;
  }
});

app.userAgentFallback = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

// Audit: Fix duplicate listener accumulation issue by registering early
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

    // Fix: Using a consistent session-level check if needed, but avoiding duplicate accumulation
    contents.session.webRequest.onCompleted({ urls: ['*://*/*'] }, (details) => {
      if (
        details.resourceType === 'mainFrame' && 
        (details.statusCode === 403 || details.statusCode === 401) &&
        (Date.now() - contents.spawnTime < LOAD_GRACE_PERIOD_MS) &&
        details.url === contents.getURL()
      ) {
        handleRedirect(contents, details.url, 'Erişim Engellendi', 'Site güvenliği reddetti.');
      }
    });
  }
});

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
