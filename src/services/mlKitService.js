// src/services/mlKitService.js
// ML Kit çeviri motoru — WiFi patch uygulandıktan sonra mobil veride de çalışır.

import { getCachedTranslation, setCachedTranslation, pruneTranslationCache } from './translationCacheService';

export const mlKitStatus = {
  state: 'idle',
  message: '',
  listeners: new Set(),

  set(newState, newMessage = '') {
    this.state    = newState;
    this.message  = newMessage;
    this.listeners.forEach(fn => fn({ state: newState, message: newMessage }));
  },

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
};

let modelReady   = false;
let downloadPromise = null;

const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} zaman aşımı (${ms}ms)`)), ms)
    )
  ]);

export const ensureMLKitModelReady = async (allowDownload = true) => {
  if (modelReady)      return true;
  if (downloadPromise) return downloadPromise;

  const performTask = async () => {
    try {
      if (!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())) {
        mlKitStatus.set('error', 'Sadece Android/iOS uygulamasında çalışır');
        return false;
      }

      const { Translation } = await import('@capacitor-mlkit/translation');

      // ADIM 1: Modeller zaten indirilmiş mi kontrol et
      mlKitStatus.set('downloading', 'Çeviri motoru kontrol ediliyor...');
      try {
        const { languages } = await Translation.getDownloadedModels();
        const hasEn = languages.includes('en');
        const hasTr = languages.includes('tr');

        if (hasEn && hasTr) {
          modelReady = true;
          mlKitStatus.set('ready', `Hazır ✓`);
          return true;
        }
      } catch (err) {
        console.warn('[MLKit] getDownloadedModels hatası:', err);
      }

      if (!allowDownload) return false;

      // ADIM 2: İngilizce model indir
      mlKitStatus.set('downloading', 'İngilizce dil paketi indiriliyor (~15 MB)...');
      try {
        await withTimeout(Translation.downloadModel({ language: 'en' }), 60000, 'en-indir');
      } catch (e) {
        console.error('[MLKit] İngilizce model indirilemedi:', e?.message);
        mlKitStatus.set('error', `İngilizce model indirilemedi: ${e?.message}`);
        return false;
      }

      // ADIM 3: Türkçe model indir
      mlKitStatus.set('downloading', 'Türkçe dil paketi indiriliyor (~15 MB)...');
      try {
        await withTimeout(Translation.downloadModel({ language: 'tr' }), 60000, 'tr-indir');
      } catch (e) {
        console.error('[MLKit] Türkçe model indirilemedi:', e?.message);
        mlKitStatus.set('error', `Türkçe model indirilemedi: ${e?.message}`);
        return false;
      }

      // ADIM 4: Doğrulama çevirisi
      mlKitStatus.set('downloading', 'Model doğrulanıyor...');
      try {
        const result = await withTimeout(
          Translation.translate({ text: 'Good morning', sourceLanguage: 'en', targetLanguage: 'tr' }),
          10000, 'doğrulama'
        );
        if (result?.text && result.text !== 'Good morning') {
          modelReady = true;
          mlKitStatus.set('ready', `Hazır ✓  ("Good morning" → "${result.text}")`);
          return true;
        }
        mlKitStatus.set('error', 'Model yüklendi ama çeviri üretmiyor');
        return false;
      } catch (e) {
        mlKitStatus.set('error', `Doğrulama başarısız: ${e?.message}`);
        return false;
      }

    } catch (err) {
      console.error('[MLKit] Kritik hata:', err);
      mlKitStatus.set('error', `Hata: ${err?.message || err}`);
      return false;
    }
  };

  if (allowDownload) {
    downloadPromise = performTask();
    const result = await downloadPromise;
    downloadPromise = null;
    return result;
  } else {
    return await performTask();
  }
};

export const backgroundTranslateNews = async (newsItems) => {
  if (!newsItems?.length)                           return;
  if (!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())) return;

  pruneTranslationCache();

  // Arka planda ASLA zorla indirme başlatma. Sadece inmişse kullan.
  const ready = await ensureMLKitModelReady(false);
  if (!ready) return;

  const { Translation } = await import('@capacitor-mlkit/translation');
  const turkishPattern = /[çÇğĞışİöÖşŞüÜ]|(\b(ve|bir|bu|ile|için|de|da|den|dan)\b)/i;

  for (const item of newsItems) {
    if (!window.__mlKitBgRunning) break;
    const title = item.title?.trim();
    if (!title || turkishPattern.test(title)) continue;
    if (await getCachedTranslation(title))   continue;

    try {
      const result = await withTimeout(
        Translation.translate({ text: title, sourceLanguage: 'en', targetLanguage: 'tr' }),
        8000, 'arka-plan'
      );
      if (result?.text && result.text !== title) {
        await setCachedTranslation(title, result.text);
      }
      await new Promise(r => setTimeout(r, 50));
    } catch { /* bu haberi atla */ }
  }
};
