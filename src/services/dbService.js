// src/services/dbService.js
// Uygulamamızda veritabanı olarak şimdilik LocalStorage kullanıyoruz.
// Clean Architecture prensiplerine uymak için veritabanı işlemlerini bu serviste soyutladık.

const DB_KEY = 'rss_links_db';
const NEWS_CACHE_KEY = 'rss_news_cache';
const CACHE_RETENTION_DAYS = 3; // Yasal limit: 3 günden eski haberleri otomatik siler.

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
      'fanatik.com.tr/rss': 'fanatik.com.tr/rss/anasayfa.xml',
      'sporx.com/rss/': 'sporx.com/rss/haberler.xml'
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
 * Belirli bir klasörün adını günceller.
 */
export const updateFolderName = (oldName, newName) => {
  const links = getRssLinks();
  const updated = links.map(link => {
    if (link.folder === oldName) {
      return { ...link, folder: newName.trim() };
    }
    return link;
  });
  localStorage.setItem(DB_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('rss_db_updated'));
};

/**
 * Belirli bir klasörü ve içindeki tüm linkleri siler.
 */
export const deleteFolder = (folderName) => {
  let links = getRssLinks();
  links = links.filter(link => link.folder !== folderName);
  localStorage.setItem(DB_KEY, JSON.stringify(links));
  window.dispatchEvent(new Event('rss_db_updated'));
};

// ==========================================
// HABER BÖNBELLEĞİ (NEWS CACHING) & ÇEVRİMDIŞI
// ==========================================

export const getNewsCache = () => {
  try {
    const data = localStorage.getItem(NEWS_CACHE_KEY);
    let cached = data ? JSON.parse(data) : [];
    // Tarih string'lerini anında JS Date objelerine dönüştür
    cached = cached.map(item => {
      item.date = new Date(item.date);
      return item;
    });
    return cached;
  } catch (error) {
    console.error('Haber önbelleği okunamadı:', error);
    return [];
  }
};

/**
 * Yeni çekilen canlı feed'leri alır, eskileri ve tekrarları atarak LocalStorage'a kaydeder.
 * Bu fonksiyon "Otomatik Temizlik (Garbage Collection)" içerir.
 */
export const saveNewsItems = (newItems) => {
  let cached = getNewsCache();

  // 1. ÇÖP TOPLAYICI (Garbage Collection): 3 Günden eski cache'leri hukuken ve depolama için at.
  const cutoffTime = new Date().getTime() - (CACHE_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  cached = cached.filter(item => {
    const itemTime = item.date.getTime();
    return itemTime > cutoffTime;
  });

  // 2. Mükemmel Tekilleştirme Cihazı (Hızlı arama için Set/Map kullanımı)
  const cacheMap = new Map();
  cached.forEach(i => {
    const rawLink = i.link && i.link !== '#' ? i.link.split('?')[0] : '';
    cacheMap.set(i.title.trim().toLowerCase() + "||" + rawLink, true);
  });

  // 3. Yeni gelenler arasından sadece "daha önce eklenmemiş" olanları filtrele
  const itemsToAdd = newItems.filter(item => {
    let time = item.date.getTime();
    if (isNaN(time)) time = new Date().getTime(); // Bozuk tarih koruması

    // Çok eski bir haberi hiç veritabanına sokma
    if (time <= cutoffTime) return false;

    const rawLink = item.link && item.link !== '#' ? item.link.split('?')[0] : '';
    const uniqueKey = item.title.trim().toLowerCase() + "||" + rawLink;

    if (cacheMap.has(uniqueKey)) return false;

    cacheMap.set(uniqueKey, true);
    return true;
  });

  // 4. Yeni taze haberleri en üste (başa) ekle
  cached = [...itemsToAdd, ...cached];

  // 5. Kaydet (Audit: LocalStorage Limit Koruması - 5MB - V12.2)
  try {
    localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(cached));
  } catch (e) {
    // Hafıza dolunca (5MB sınırı) en eski haberleri buda (Pruning)
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      console.warn("LocalStorage Dolu! Akıllı temizlik (Pruning) yapılıyor...");
      // Listenin en başındakiler (yeni) kalsın, sonundakileri (%30) at.
      const pruned = cached.slice(0, Math.floor(cached.length * 0.7));
      try {
        localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(pruned));
        cached = pruned;
      } catch (innerErr) {
        // Hala doluvsa daha agresif temizle (Sadece 200 haber kalsın)
        const ultraPruned = cached.slice(0, 200);
        localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(ultraPruned));
        cached = ultraPruned;
      }
    }
  }

  return cached; // Tekrar UI'a güncel (veya budanmış) halini ver
};

export const clearNewsCache = () => {
  localStorage.removeItem(NEWS_CACHE_KEY);
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

// ==========================================
// HABER AKIŞI GÖRÜNÜM AYARLARI (Persistent State)
// ==========================================
export const getViewSettings = () => {
  try {
    const data = localStorage.getItem('rss_view_settings');
    return data ? JSON.parse(data) : { selectedFolder: '', searchQuery: '', sortBy: 'date' };
  } catch {
    return { selectedFolder: '', searchQuery: '', sortBy: 'date' };
  }
};

export const saveViewSettings = (settings) => {
  localStorage.setItem('rss_view_settings', JSON.stringify(settings));
};

