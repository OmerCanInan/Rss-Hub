const { contextBridge, ipcRenderer } = require('electron');

// Renderer (React) tarafına sunulan güvenli köprü
contextBridge.exposeInMainWorld('electronAPI', {
  // RSS Verilerini çekmek için (CORS-Safe)
  fetchRss: (url) => ipcRenderer.invoke('fetch-rss', url),
  
  // Şifreli Veri Saklama (Audit: Groq API Key Güvenliği için)
  saveApiKey: (key) => ipcRenderer.invoke('save-api-key', key),
  getApiKey: () => ipcRenderer.invoke('get-api-key'),

  // PC Bildirimlerini dinlemek için (Listener sızıntısı önlendi)
  onPcNotification: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('show-pc-notification', subscription);
    
    // Temizlik fonksiyonu (React useEffect içinde kullanılabilir)
    return () => {
      ipcRenderer.removeListener('show-pc-notification', subscription);
    };
  }
});
