// src/services/translationService.js
// LibreTranslate tabanlı çeviri servisi — açık kaynak, KVKK uyumlu, ücretsiz.
// Gayriresmi Google Translate API'sinden (translate.googleapis.com) göç edildi.
// Hizmet veren public instance'lar: libretranslate.com, translate.argosopentech.com

const LIBRE_ENDPOINTS = [
  'https://libretranslate.de/translate',
  'https://de.libretranslate.com/translate',
  'https://translate.terraprint.co/translate'
];

/**
 * CapacitorHttp Helper: Native katman üzerinden CORS-safe istek atar.
 */
const fetchWithCapacitor = async (endpoint, text) => {
  try {
    const { CapacitorHttp } = window.Capacitor.Plugins;
    const response = await CapacitorHttp.post({
      url: endpoint,
      headers: { 'Content-Type': 'application/json' },
      data: { q: text, source: 'auto', target: 'tr', format: 'text' },
      connectTimeout: 12000,
      readTimeout: 12000,
    });
    if (response.status === 200 && response.data?.translatedText) {
      return response.data.translatedText;
    }
  } catch (err) {
    console.warn(`[CapacitorHttp] Failed for ${endpoint}:`, err);
  }
  return null;
};

/**
 * Verilen metni LibreTranslate kullanarak Türkçe'ye çevirir.
 * Tüm public instance'lar denenilir, ilk başarılı cevap döner.
 * @param {string} text - Çevrilecek orijinal metin
 * @returns {Promise<string>} Çevrilmiş metin (hata durumunda orijinal metin)
 */
export const translateTextToTurkish = async (text) => {
  if (!text || text.trim() === '') return text;

  // --- PLATFORM BRANCHING (V14) ---
  // Desktop (Electron): Use CORS-safe IPC Bridge
  if (window.electronAPI && typeof window.electronAPI.translateText === 'function') {
    try {
      const translatedData = await window.electronAPI.translateText(text, 'tr');
      if (translatedData) return translatedData;
    } catch (err) {
      console.warn('[DesktopTranslate] IPC Bridge failed, falling back to local fallback if possible:', err);
    }
  }

  // Mobile: Try CapacitorHttp first (Bypasses CORS restrictions)
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorHttp) {
    for (const endpoint of LIBRE_ENDPOINTS) {
      const result = await fetchWithCapacitor(endpoint, text);
      if (result) return result;
    }
  }

  // Web / PWA Fallback: Use standard fetch()
  for (const endpoint of LIBRE_ENDPOINTS) {
    // 1. Yol: JSON İsteği
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12sn limit

      const resJSON = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: 'auto', target: 'tr', format: 'text' }),
        signal: controller.signal, 
      });
      clearTimeout(timeoutId);
      if (resJSON.ok) {
          try {
            const trResult = await resJSON.json();
            if (trResult && trResult.translatedText) {
              return trResult.translatedText;
            }
          } catch (e) {
            // Sessiz geç - bozuk JSON veya HTML yanıtı
          }
      }
    } catch (e) { /* Fallback'e geç */ }

    // 2. Yol: Form Data (URLSearchParams.toString() - En uyumlu yöntem)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const params = new URLSearchParams();
      params.append('q', text);
      params.append('source', 'auto');
      params.append('target', 'tr');
      params.append('format', 'text');

      const resForm = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(), // String'e zorla (Eski Android uyumu için)
        signal: controller.signal, 
      });
      clearTimeout(timeoutId);
      if (resForm.ok) {
        try {
          const data = await resForm.json();
          if (data?.translatedText) return data.translatedText;
        } catch (e) {
          // Sessiz geç
        }
      }
    } catch (e) { /* Bir sonraki sunucuya geç */ }
  }

  return text;
};
