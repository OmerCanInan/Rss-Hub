// src/services/mlKitService.js
// ML Kit çeviri modelini uygulama açılışında sessizce indirir.
// Model indirildikten sonra arka planda haberleri çevirir ve cache'e yazar.

import { getCachedTranslation, setCachedTranslation, pruneTranslationCache } from './translationCacheService';

// Global model durumu — uygulama genelinde erişilebilir
export const mlKitStatus = {
  state: 'idle',       // 'idle' | 'downloading' | 'ready' | 'error'
  message: '',
  listeners: new Set(),

  set(newState, newMessage = '') {
    this.state = newState;
    this.message = newMessage;
    this.listeners.forEach(fn => fn({ state: newState, message: newMessage }));
  },

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
};

let modelReady = false;
let downloadPromise = null;

/**
 * ML Kit en-tr modelini indirir (eğer henüz indirilmemişse).
 */
export const ensureMLKitModelReady = async () => {
  if (modelReady) return true;
  if (downloadPromise) return downloadPromise;

  downloadPromise = (async () => {
    try {
      if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
        mlKitStatus.set('error', 'Sadece mobilde çalışır');
        return false;
      }

      const { Translation, Language } = await import('@capacitor-mlkit/translation');

      mlKitStatus.set('downloading', 'Çeviri modeli indiriliyor...');

      // Model zaten var mı kontrol et (try-catch ile — bazı sürümlerde bu metod yok)
      try {
        const { models } = await Translation.getDownloadedModels();
        const hasEnglish = models.some(m => m.language === Language.English || m.language === 'en');
        const hasTurkish = models.some(m => m.language === Language.Turkish || m.language === 'tr');

        if (hasEnglish && hasTurkish) {
          modelReady = true;
          mlKitStatus.set('ready', 'Çeviri motoru hazır ✓');
          return true;
        }
      } catch {
        // getDownloadedModels desteklenmiyorsa direkt indirmeye geç
        console.warn('[MLKit] getDownloadedModels desteklenmiyor, model indiriliyor...');
      }

      // Modelleri indir
      mlKitStatus.set('downloading', 'İngilizce dil paketi indiriliyor...');
      try {
        await Translation.downloadModel({ language: Language.English });
      } catch (e) {
        // İndirme başarısız olursa dur — hata yutma
        console.error('[MLKit] İngilizce model indirme BAŞARISIZ:', e);
        mlKitStatus.set('error', `İngilizce model indirilemedi: ${e?.message || e}`);
        return false;
      }

      mlKitStatus.set('downloading', 'Türkçe dil paketi indiriliyor...');
      try {
        await Translation.downloadModel({ language: Language.Turkish });
      } catch (e) {
        console.error('[MLKit] Türkçe model indirme BAŞARISIZ:', e);
        mlKitStatus.set('error', `Türkçe model indirilemedi: ${e?.message || e}`);
        return false;
      }


      // Test çevirisi yap — model gerçekten çalışıyor mu?
      mlKitStatus.set('downloading', 'Model test ediliyor...');
      const testResult = await Translation.translate({
        text: 'Hello',
        sourceLanguage: Language.English,
        targetLanguage: Language.Turkish,
      });

      if (testResult?.text) {
        modelReady = true;
        mlKitStatus.set('ready', `Çeviri motoru hazır ✓ (Test: "${testResult.text}")`);
        return true;
      } else {
        mlKitStatus.set('error', 'Model yüklendi ama test başarısız');
        return false;
      }

    } catch (err) {
      console.warn('[MLKit] Model indirme başarısız:', err);
      mlKitStatus.set('error', `İndirme hatası: ${err?.message || err}`);
      return false;
    }
  })();

  return downloadPromise;
};

/**
 * Haberleri arka planda sessizce çevirir ve cache'e yazar.
 */
export const backgroundTranslateNews = async (newsItems) => {
  if (!newsItems || newsItems.length === 0) return;
  const isNative = window.Capacitor && window.Capacitor.isNativePlatform();
  if (!isNative) return;

  pruneTranslationCache();

  const ready = await ensureMLKitModelReady();
  if (!ready) return;

  console.log(`[MLKit] ${newsItems.length} haber arka planda çevriliyor...`);

  try {
    const { Translation, Language } = await import('@capacitor-mlkit/translation');
    const turkishPattern = /[çÇğĞışİöÖşŞüÜ]|(\b(ve|bir|bu|ile|için|de|da|den|dan)\b)/i;

    for (const item of newsItems) {
      if (!window.__mlKitBgRunning) break;
      const title = item.title?.trim();
      if (!title || turkishPattern.test(title)) continue;
      const cached = await getCachedTranslation(title);
      if (cached) continue;

      try {
        const result = await Translation.translate({
          text: title,
          sourceLanguage: Language.English,
          targetLanguage: Language.Turkish,
        });
        if (result?.text && result.text !== title) {
          await setCachedTranslation(title, result.text);
        }
        await new Promise(r => setTimeout(r, 50));
      } catch { /* bu haberi atla */ }
    }
  } catch (err) {
    console.warn('[MLKit] Arka plan çevirisi başarısız:', err);
  }
};
