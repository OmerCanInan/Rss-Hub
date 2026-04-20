// src/services/translationService.js
// LibreTranslate tabanlı çeviri servisi — açık kaynak, KVKK uyumlu, ücretsiz.
// Gayriresmi Google Translate API'sinden (translate.googleapis.com) göç edildi.
// Hizmet veren public instance'lar: libretranslate.com, translate.argosopentech.com

const LIBRE_ENDPOINTS = [
  'https://libretranslate.com/translate',
  'https://translate.argosopentech.com/translate',
  'https://translate.fedilab.app/translate',
];

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

  // Mobile / Web: Use LibreTranslate (Play Store Compliant)
  const body = JSON.stringify({
    q: text,
    source: 'auto',
    target: 'tr',
    format: 'text',
    api_key: '', 
  });

  for (const endpoint of LIBRE_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(8000), 
      });

      if (!response.ok) continue;

      const data = await response.json();
      if (data?.translatedText) {
        return data.translatedText;
      }
    } catch {
      continue;
    }
  }

  console.warn('Translation: All methods failed, returning original text.');
  return text;
};
