// src/services/translationService.js
// LibreTranslate tabanlı çeviri servisi — açık kaynak, KVKK uyumlu, ücretsiz.
// Gayriresmi Google Translate API'sinden (translate.googleapis.com) göç edildi.
// Hizmet veren public instance'lar: libretranslate.com, translate.argosopentech.com

import { Translation, Language } from '@capacitor-mlkit/translation';

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
 * ML Kit Translation: On-device translation for mobile.
 * Default: English -> Turkish
 */
const translateWithMLKit = async (text) => {
  try {
    if (!window.Capacitor || !window.Capacitor.isNativePlatform()) return null;

    // Not: Model indirilmemişse otomatik indirilir (30MB civarı).
    // Gelecekte Language ID eklenirse sourceLanguage dinamik yapılabilir.
    const result = await Translation.translate({
      text,
      sourceLanguage: Language.English,
      targetLanguage: Language.Turkish,
    });
    return result.text;
  } catch (err) {
    console.warn('[MLKit] Translation failed or not available:', err);
    return null;
  }
};

/**
 * Verilen metni Türkçe'ye çevirir.
 * Sırasıyla: Desktop IPC -> Mobile ML Kit -> Mobile CapacitorHttp -> Web Fetch
 * @param {string} text - Çevrilecek orijinal metin
 * @returns {Promise<string>} Çevrilmiş metin (hata durumunda orijinal metin)
 */
export const translateTextToTurkish = async (text) => {
  if (!text || text.trim() === '') return text;

  // 1. Desktop (Electron): Use CORS-safe IPC Bridge
  if (window.electronAPI && typeof window.electronAPI.translateText === 'function') {
    try {
      const translatedData = await window.electronAPI.translateText(text, 'tr');
      if (translatedData) return translatedData;
    } catch (err) {
      console.warn('[DesktopTranslate] IPC Bridge failed:', err);
    }
  }

  // 2. Mobile Native: ML Kit (Fast, Offline-capable)
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    const mlkitResult = await translateWithMLKit(text);
    if (mlkitResult) return mlkitResult;
  }

  // 3. Mobile/Web Fallback: LibreTranslate (via CapacitorHttp or Fetch)
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorHttp) {
    for (const endpoint of LIBRE_ENDPOINTS) {
      const result = await fetchWithCapacitor(endpoint, text);
      if (result) return result;
    }
  }

  // 4. Web / PWA Fallback: Use standard fetch()
  for (const endpoint of LIBRE_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const resJSON = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: 'auto', target: 'tr', format: 'text' }),
        signal: controller.signal, 
      });
      clearTimeout(timeoutId);
      if (resJSON.ok) {
          const trResult = await resJSON.json();
          if (trResult?.translatedText) return trResult.translatedText;
      }
    } catch (e) { /* Devam et */ }

    try {
      const params = new URLSearchParams({ q: text, source: 'auto', target: 'tr', format: 'text' });
      const resForm = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      if (resForm.ok) {
        const data = await resForm.json();
        if (data?.translatedText) return data.translatedText;
      }
    } catch (e) { /* Sonraki sunucuya geç */ }
  }

  return text;
};

