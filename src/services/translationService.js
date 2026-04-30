// src/services/translationService.js
// Çeviri zinciri: Cache → Electron IPC → ML Kit
//
// Kullanıcı isteği doğrultusunda sadece ML Kit desteklenmektedir. 
// İnternet tabanlı (MyMemory vb.) fallback'ler devre dışı bırakılmıştır.

import { getCachedTranslation, setCachedTranslation } from './translationCacheService';
import { ensureMLKitModelReady } from './mlKitService';

/**
 * ML Kit ile çeviri (Native only) — 8 saniyelik timeout
 */
const translateWithMLKit = async (text) => {
  try {
    if (!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())) return null;

    // KESİN KONTROL: Eğer model yüklü değilse ASLA translate çağırma, yoksa native SDK zorla indirir!
    const isReady = await ensureMLKitModelReady(false);
    if (!isReady) return null;
    const { Translation } = await import('@capacitor-mlkit/translation');

    const result = await Promise.race([
      Translation.translate({ text, sourceLanguage: 'en', targetLanguage: 'tr' }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('ML Kit timeout')), 8000))
    ]);
    return result?.text || null;
  } catch (err) {
    console.warn('[MLKit] Çeviri başarısız:', err?.message);
    return null;
  }
};



/**
 * Ana çeviri fonksiyonu
 * Sıra: Cache → Electron IPC → ML Kit
 */
export const translateTextToTurkish = async (text) => {
  if (!text || text.trim() === '') return text;

  // 1. Cache — Anında döner
  const cached = await getCachedTranslation(text);
  if (cached) return cached;

  let result = null;

  // 2. Electron IPC (masaüstü)
  if (window.electronAPI && typeof window.electronAPI.translateText === 'function') {
    try {
      const t = await window.electronAPI.translateText(text, 'tr');
      if (t) result = t;
    } catch (err) {
      console.warn('[DesktopTranslate] IPC başarısız:', err);
    }
  }

  // 3. Mobile Native: ML Kit
  if (!result && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
    result = await translateWithMLKit(text);
  }

  // Başarılıysa cache'e kaydet
  if (result && result !== text) {
    await setCachedTranslation(text, result);
    return result;
  }

  return text; // Hepsi başarısız → orijinal metin
};
