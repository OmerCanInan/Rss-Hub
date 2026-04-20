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
  // Her sunucu için hem JSON hem de Form Data (URLSearchParams) yöntemlerini deniyoruz.
  for (const endpoint of LIBRE_ENDPOINTS) {
    // 1. Yol: JSON İsteği
    try {
      const resJSON = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: 'auto', target: 'tr', format: 'text' }),
        signal: AbortSignal.timeout(6000), 
      });
      if (resJSON.ok) {
        const data = await resJSON.json();
        if (data?.translatedText) return data.translatedText;
      }
    } catch (e) { /* JSON Başarısız, Form Data'yı dene */ }

    // 2. Yol: Form Data (Bazı sunucular sadece bunu kabul eder)
    try {
      const params = new URLSearchParams();
      params.append('q', text);
      params.append('source', 'auto');
      params.append('target', 'tr');
      params.append('format', 'text');

      const resForm = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
        signal: AbortSignal.timeout(6000), 
      });
      if (resForm.ok) {
        const data = await resForm.json();
        if (data?.translatedText) return data.translatedText;
      }
    } catch (e) { /* Bir sonraki sunucuya geç */ }
  }

  console.warn('Translation: All methods (JSON & Form) failed for all endpoints.');
  return text;
};
