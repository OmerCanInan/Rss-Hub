// src/services/dbService.js
// Uygulamamızda veritabanı olarak şimdilik LocalStorage kullanıyoruz.
// Clean Architecture prensiplerine uymak için veritabanı işlemlerini bu serviste soyutladık.

let _migrationDone = false;

const DB_KEY = 'rss_links_db';
const NEWS_CACHE_KEY = 'rss_news_cache';
const CACHE_RETENTION_DAYS = 7; // Yasal limit: 7 günden eski haberleri otomatik siler.

/**
 * Benzersiz ID üretici (Modern tarayıcı yoksa fallback kullanır)
 */
export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: Saniye + Rastgele karakterler
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * Veritabanından tüm RSS linklerini getirir.
 * @returns {Array<{id: string, url: string, addedAt: string, folder: string}>} RSS link objeleri
 */
export const getRssLinks = () => {
  try {
    const data = localStorage.getItem(DB_KEY);
    let links = data ? JSON.parse(data) : [];
    
    // --- OTOMATİK ONARIM VE TEMİZLİK (Self-Healing Fix) ---
    // Ölmek üzere olan veya değişen RSS linklerini güncelliyoruz
    let hasMigration = false;
    const migrations = {
      'trthaber.com/sondakika_ilan.rss': 'trthaber.com/sondakika_articles.rss',
      'trthaber.com/manset_ilan.rss': 'trthaber.com/manset_articles.rss',
      'milliyet.com.tr/rss/rsshesapla.xml?anakategoriid=1': 'milliyet.com.tr/rss/rssNew/gundemRss.xml',
      'fotomac.com.tr/rss/tum': 'fotomac.com.tr/rss/anasayfa.xml',
      'fanatik.com.tr/rss/anasayfa.xml': 'fanatik.com.tr/rss',
      'sporx.com/rss/haberler.xml': 'sporx.com/rss',
      'sozcu.com.tr/rss': 'sozcu.com.tr/feeds-rss-category-gundem',
      't24.com.tr/rss': 't24.com.tr/feed',
      'paranaliz.com/feed/': 'paranaliz.com/feed',
      'bigpara.hurriyet.com.tr/rss/sondakika.xml': 'bigpara.hurriyet.com.tr/rss/'
    };

    links = links.map(link => {
      // Önce varsa bozulan linkleri (tekrar eden kelimeleri) temizle
      if (link.url.includes('haberler.xmlhaberler.xml') || link.url.includes('anasayfa.xml/anasayfa.xml')) {
         link.url = link.url.replace(/(haberler\.xml)+/g, 'haberler.xml');
         link.url = link.url.replace(/(\/anasayfa\.xml)+/g, '/anasayfa.xml');
         hasMigration = true;
      }

      // Güvenli değişim: Sadece eski linkle BİTİYORSA değiştir (Recursion Fix)
      for (const [oldUrl, newUrl] of Object.entries(migrations)) {
        if (link.url.endsWith(oldUrl)) {
          link.url = link.url.replace(oldUrl, newUrl);
          hasMigration = true;
        }
      }
      return link;
    });

    if (hasMigration) {
      localStorage.setItem(DB_KEY, JSON.stringify(links));
    }

    return links;
  } catch (error) {
    console.error('Veritabanından okunurken hata oluştu:', error);
    return [];
  }
};

/**
 * Veritabanına yeni bir RSS linki ekler. Aynı URL varsa eklemez.
 * @param {string} url - RSS bağlantısı
 * @param {string} folder - (Opsiyonel) Klasör / Etiket adı
 * @returns {Object} Eklenen RSS link objesi veya var olan
 */
export const addRssLink = (url, folder = '') => {
  const links = getRssLinks();
  const safeFolder = folder.trim();
  const existing = links.find(link => link.url === url && link.folder === safeFolder);
  
  if (existing) return false;

  const newLink = {
    id: generateUUID(),
    url,
    folder: safeFolder, // Klasör / Etiket desteği eklendi
    addedAt: new Date().toISOString()
  };

  links.push(newLink);
  localStorage.setItem(DB_KEY, JSON.stringify(links));
  window.dispatchEvent(new Event('rss_db_updated')); // Global sinyal ver
  return newLink;
};

/**
 * ID'si verilen RSS linkini veritabanından siler.
 */
export const deleteRssLink = (id) => {
  let links = getRssLinks();
  links = links.filter(link => link.id !== id);
  localStorage.setItem(DB_KEY, JSON.stringify(links));
  window.dispatchEvent(new Event('rss_db_updated')); // Global sinyal ver
};

/**
 * Belirli bir klasör ismini toplu olarak günceller.
 * @param {string} oldName - Mevcut klasör adı
 * @param {string} newName - Yeni klasör adı
 */
export const updateFolderName = (oldName, newName) => {
  let links = getRssLinks();
  const safeOld = oldName === 'Genel' ? '' : oldName.trim();
  const safeNew = newName === 'Genel' ? '' : newName.trim();

  links = links.map(link => {
    if ((link.folder || '') === safeOld) {
      return { ...link, folder: safeNew };
    }
    return link;
  });

  localStorage.setItem(DB_KEY, JSON.stringify(links));
  window.dispatchEvent(new Event('rss_db_updated')); // Global sinyal ver
};

/**
 * Belirli bir klasörü ve içindeki tüm linkleri siler.
 * @param {string} folderName - Silinecek klasör adı
 */
export const deleteFolder = (folderName) => {
  let links = getRssLinks();
  const safeFolder = folderName === 'Genel' ? '' : folderName.trim();

  links = links.filter(link => (link.folder || '') !== safeFolder);

  localStorage.setItem(DB_KEY, JSON.stringify(links));
  window.dispatchEvent(new Event('rss_db_updated')); // Global sinyal ver
};

// ==========================================
// HABER BÖNBELLEĞİ (NEWS CACHING) & ÇEVRİMDIŞI (IndexedDB)
// ==========================================

const IDB_NAME = 'GundemimDB';
const IDB_VERSION = 1;
const STORE_NAME = 'news_cache';

const getDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const migrateLocalStorageToIndexedDB = async () => {
  if (_migrationDone) return;
  _migrationDone = true;

  try {
    const data = localStorage.getItem(NEWS_CACHE_KEY);
    if (!data) return;
    const cached = JSON.parse(data);
    if (!Array.isArray(cached) || cached.length === 0) return;

    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // Clear old store first
    store.clear();

    for (const item of cached) {
      if (typeof item.date === 'string') {
        item.date = new Date(item.date);
      }
      store.put(item);
    }

    return new Promise((resolve) => {
      tx.oncomplete = () => {
        localStorage.removeItem(NEWS_CACHE_KEY);
        console.log("Migrated localStorage to IndexedDB successfully.");
        resolve();
      };
    });
  } catch (err) {
    console.error("Migration failed:", err);
  }
};

export const getNewsCache = async () => {
  await migrateLocalStorageToIndexedDB();
  
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        let cached = request.result || [];
        
        cached = cached.map(item => {
          if (typeof item.date === 'string') {
            item.date = new Date(item.date);
          }
          
          // GELECEK TARİH KORUMASI (Cache'de kalmış hatalı veriler için self-healing)
          const now = new Date();
          if (item.date > now) {
            item.date = now;
          }
          
          // AUTO-FIX: Relative linkleri onar
          if (item.link && item.link.startsWith('/') && !item.link.startsWith('//') && item.sourceUrl) {
            try {
              const rootUrl = new URL(item.sourceUrl);
              item.link = `${rootUrl.protocol}//${rootUrl.hostname}${item.link}`;
            } catch (e) {}
          }
          return item;
        });

        // Tarihe göre sırala
        cached.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        resolve(cached);
      };
      request.onerror = () => reject(request.error);
    } catch (e) {
      console.error('Haber önbelleği IndexedDB den okunamadı:', e);
      resolve([]);
    }
  });
};

/**
 * Yeni çekilen canlı feed'leri alır ve filtreleyip IndexedDB'ye bulk olarak kaydeder.
 */
export const saveNewsItems = async (newItems) => {
  const cutoffTime = Date.now() - (CACHE_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  
  const freshItems = newItems.filter(item => {
    const t = item.date?.getTime?.() || Date.now();
    return t > cutoffTime;
  });
  
  if (freshItems.length === 0) return [];

  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  for (const item of freshItems) {
    store.put(item);
  }
  
  return new Promise(resolve => {
    tx.oncomplete = () => resolve(freshItems);
    tx.onerror = () => resolve([]);
  });
};

// ==========================================
// KELİME FİLTRELERİ (Kara Liste & Altın Kelime)
// ==========================================
export const getFilters = () => {
  try {
    const data = localStorage.getItem('rss_word_filters');
    return data ? JSON.parse(data) : { blacklist: '', whitelist: '' };
  } catch (error) {
    return { blacklist: '', whitelist: '' };
  }
};

export const saveFilters = (filters) => {
  localStorage.setItem('rss_word_filters', JSON.stringify(filters));
  window.dispatchEvent(new Event('rss_filters_updated')); // Dinamik Güncelleme
};

// ==========================================
// YAPAY ZEKA (AI) AYARLARI (GROQ)
// ==========================================
export const getGroqApiKey = async () => {
  // Audit: Encryption support for API Keys
  if (window.electronAPI && typeof window.electronAPI.getApiKey === 'function') {
    try {
      const secureKey = await window.electronAPI.getApiKey();
      if (secureKey) return secureKey;
    } catch (err) {
      console.error("Secure key retrieval failed:", err);
    }
  }
  return localStorage.getItem('rss_groq_api_key') || '';
};

export const saveGroqApiKey = async (key) => {
  const cleanKey = key?.trim() || '';
  
  // Audit: Encrypt key in Electron environment
  if (window.electronAPI && typeof window.electronAPI.saveApiKey === 'function') {
    try {
      await window.electronAPI.saveApiKey(cleanKey);
      // Clean up localStorage if it existed
      localStorage.removeItem('rss_groq_api_key');
      return;
    } catch (err) {
      console.error("Secure key save failed:", err);
    }
  }

  if (cleanKey) {
    localStorage.setItem('rss_groq_api_key', cleanKey);
  } else {
    localStorage.removeItem('rss_groq_api_key');
  }
};

// ==========================================
// GÖRÜNÜM & SEKME AYARLARI
// ==========================================
export const getAppSettings = () => {
  try {
    const data = localStorage.getItem('rss_app_settings');
    return data ? JSON.parse(data) : { fontTheme: 'mix', layoutStrategy: 'grid', colorTheme: 'dark', playbackRate: 1.0 };
  } catch {
    return { fontTheme: 'mix', layoutStrategy: 'grid', colorTheme: 'dark', playbackRate: 1.0 };
  }
};

export const saveAppSettings = (settings) => {
  localStorage.setItem('rss_app_settings', JSON.stringify(settings));
};

