import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { getAppSettings } from '../services/dbService';
import { translateTextToTurkish } from '../services/translationService';
// TextToSpeech importu sadece native platformlarda dinamik olarak yapılacak.

const RadioContext = createContext();

export const useRadio = () => useContext(RadioContext);

export const RadioProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQueue, setCurrentQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [voiceGender, setVoiceGender] = useState('female');
  const [playbackRate, setPlaybackRate] = useState(() => getAppSettings().playbackRate || 1.0);

  const [availableVoices, setAvailableVoices] = useState([]);

  const isPlayingRef = useRef(false);
  const googleTtsRef = useRef(null);
  const voiceGenderRef = useRef('female');
  const playbackRateRef = useRef(1.0);

  // Sesleri yükle ve dinle (Özellikle mobilde geç yüklenir)
  useEffect(() => {
    const loadVoices = async () => {
      // NATIVE PLATFORM CHECK
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
          const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
          if (TextToSpeech) {
            const { voices } = await TextToSpeech.getSupportedVoices();
            setAvailableVoices(voices);
            return;
          }
        } catch (e) {
          console.warn("Native voices fetch failed:", e);
        }
      }

      // WEB / PC FALLBACK
      if (window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setAvailableVoices(voices);
        }
      }
    };

    loadVoices();
    if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    const timer = setInterval(() => {
      if (availableVoices.length === 0) loadVoices();
    }, 2000);

    return () => clearInterval(timer);
  }, [availableVoices.length]);

  useEffect(() => {
    voiceGenderRef.current = voiceGender;
  }, [voiceGender]);

  useEffect(() => {
    playbackRateRef.current = playbackRate;
  }, [playbackRate]);

  // Ayarlar güncellendiğinde hızı senkronize et
  useEffect(() => {
    const handleSettingsUpdate = () => {
      const settings = getAppSettings();
      if (settings.playbackRate) {
        setPlaybackRate(settings.playbackRate);
        if (googleTtsRef.current) {
          googleTtsRef.current.playbackRate = settings.playbackRate;
        }
      }
    };
    window.addEventListener('rss_settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('rss_settings_updated', handleSettingsUpdate);
  }, []);

  const sanitizeForAudio = (text) => {
    if (!text) return '';
    return text
      // AI Özeti Markdown Temizliği
      .replace(/\[Haber ↗\]\(.*?\)/g, '') // Linkleri kaldır
      .replace(/\{\{.*?\}\}/g, '')        // {{Kaynak}} etiketlerini kaldır
      .replace(/\*\*/g, '')               // Kalın yazıları kaldır
      .replace(/###/g, '')                // Başlık işaretlerini kaldır

      // Kelime Değişimleri
      .replace(/\bAI\b/g, 'Yapay Zeka')
      .replace(/\bGPT\b/g, 'Ci-pi-ti')
      .replace(/\bPC\b/g, 'Pi-si')
      .replace(/\bVRAM\b/gi, 'Vi-rem')
      .replace(/\bRAM\b/gi, 'Rem')
      .replace(/\bCPU\b/gi, 'Si-pi-yu')
      .replace(/\bGPU\b/gi, 'Ci-pi-yu')
      .replace(/\bUSB\b/gi, 'u-se-be')
      .replace(/\bUI\b/g, 'U-ay')
      .replace(/\bUX\b/g, 'U-iks')
      .replace(/\bStartup\b/gi, 'Start-ap')
      .replace(/\bUpdate\b/gi, 'Apdeyt')
      .replace(/\bSoftware\b/gi, 'Softver')
      .replace(/\bHardware\b/gi, 'Hardver')
      .replace(/\bCloud\b/gi, 'Klaud')
      .replace(/\bOnline\b/gi, 'Onlayn')
      .replace(/\bOffline\b/gi, 'Oflayn')
      .replace(/\bStreaming\b/gi, 'Stríming')
      .replace(/\bBlockchain\b/gi, 'Blokçeyn')
      .replace(/\bBitcoin\b/gi, 'Bit-koyn')
      .replace(/\bMerasim\b/gi, 'Me-rasim')
      .replace(/\bCrypto\b/gi, 'Kripto')
      .replace(/\bNvidia\b/gi, 'Envidiya')
      .replace(/\bAMD\b/g, 'A-me-de')
      .replace(/\bRyzen\b/gi, 'Rayzın')
      .replace(/\bApple\b/gi, 'Epıl')
      .replace(/\bGoogle\b/gi, 'Gugıl')
      .replace(/\bMicrosoft\b/gi, 'Maykrosoft')
      .replace(/\bSony\b/gi, 'Soni')
      .replace(/\bIntel\b/gi, 'İntel')
      .replace(/\bPlayStation\b/gi, 'Pıley-steyşın')
      .replace(/\bBBC\b/gi, 'Bi-Bi-Si')
      .replace(/\bCNN\b/gi, 'Si-En-En')
      .replace(/\bNetflix\b/gi, 'Netfliks')
      .replace(/\bYouTube\b/gi, 'Yutüb')
      .replace(/\bTwitter\b/gi, 'Tvítır')
      .replace(/\bFacebook\b/gi, 'Feysbuk')
      .replace(/\bInstagram\b/gi, 'İnstagram')
      .replace(/\bWhatsApp\b/gi, 'Vatsap')
      .replace(/\bTelegram\b/gi, 'Telegram')
      .replace(/\bSpaceX\b/gi, 'Speys-iks')
      .replace(/\bTesla\b/gi, 'Tesla')
      .replace(/\bNASA\b/gi, 'Nasa')
      .replace(/\bOpenAI\b/gi, 'Open-ey-ay')
      .replace(/\bChatGPT\b/gi, 'Çet-ci-pi-ti')
      .replace(/\biPhone\b/gi, 'Ayfon')
      .replace(/\biPad\b/gi, 'Aypet')
      .replace(/\bMacBook\b/gi, 'Mek-buk')
      .replace(/\bAndroid\b/gi, 'Andiroit')
      .replace(/\biOS\b/gi, 'Ay-o-es')
      .replace(/\bWindows\b/gi, 'Vindovs')
      .replace(/\bBreaking\b/gi, 'Breyking')
      .replace(/\bNews\b/gi, 'Nyüz')
      .replace(/\bReport\b/gi, 'Ripor')
      .replace(/\bExclusive\b/gi, 'Eksklüziv')
      .replace(/\bTrailer\b/gi, 'Treylır')
      .replace(/\bMovie\b/gi, 'Müvi')
      .replace(/\bGame\b/gi, 'Geym')
      .replace(/\bGaming\b/gi, 'Geyming')
      .replace(/\bLeague\b/gi, 'Lig')
      .replace(/\bChampions\b/gi, 'Çempiyons')
      .replace(/\bWorld\b/gi, 'Vörld')
      .replace(/\bCup\b/gi, 'Kap')
      .replace(/\bX\b/g, 'İks')
      .replace(/\bThe Verge\b/gi, 'Dı Vörj')
      .replace(/\bTechCrunch\b/gi, 'Tek-kranç')
      .replace(/\bWired\b/gi, 'Vayırd')
      .replace(/\bReuters\b/gi, 'Royters')
      .replace(/\bAssociated Press\b/gi, 'Asosiyeytıd Pres')
      .replace(/\bBloomberght\b/gi, 'Blumberg Ha-Te')
      .replace(/\bOppo\b/gi, 'Oppo')
      .replace(/\bPad\b/gi, 'Ped')
      .replace(/\bPro\b/gi, 'Pı-ro')
      .replace(/\bBloomberg\b/gi, 'Blumberg')
      .replace(/[*#•]/g, '');
  };

  const playNext = async (index, list) => {
    if (!isPlayingRef.current || index >= list.length) {
      stopRadio();
      return;
    }

    if (!isPlayingRef.current) return;

    // UI Senkronizasyonu: Index'i tam ses başlamadan hemen önce ayarla
    setCurrentIndex(index);
    const item = list[index];

    if (!isPlayingRef.current) return;

    // Yabancı dildeki haberleri seslendirilmeden önce Türkçe'ye çevir.
    // item.translatedTitle: NewsCard tarafından dışarıdan set edilebilir (gelecek iyileştirme için).
    // Şimdilik: başlık Türkçe değilse çeviri servisini çağır.
    let titleToSpeak = item.translatedTitle || item.title || '';
    const settings = getAppSettings();
    const isTranslationEnabled = settings.autoTranslate !== false;

    if (isTranslationEnabled && titleToSpeak && !item.translatedTitle) {
      // Başlık Türkçe mi diye basit bir kontrol (Türkçe karakterler veya yaygın kelimeler)
      const turkishPattern = /[çÇğĞışİöÖşŞüÜ]|(\b(ve|bir|bu|ile|için|de|da|den|dan)\b)/i;
      const looksLikeTurkish = turkishPattern.test(titleToSpeak);

      if (!looksLikeTurkish) {
        try {
          const translated = await translateTextToTurkish(titleToSpeak);
          if (translated && translated !== titleToSpeak) {
            titleToSpeak = translated;
          }
        } catch (e) {
          console.warn('[Radio] Çeviri başarısız, orijinal okunacak:', e);
        }
      }
    }

    const fullSpeechText = sanitizeForAudio(titleToSpeak + ".");

    const goNext = () => {
      setTimeout(() => {
        if (isPlayingRef.current) playNext(index + 1, list);
      }, 800);
    };

    // --- NATIVE MOBILE TTS (Huawei & GMS Compatible) ---
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      try {
        const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
        await TextToSpeech.speak({
          text: fullSpeechText,
          lang: 'tr-TR',
          rate: playbackRateRef.current,
          pitch: voiceGenderRef.current === 'female' ? 1.1 : 0.9,
          volume: 1.0,
          category: 'ambient',
        });
        goNext();
        return;
      } catch (err) {
        console.warn("Native TTS failed, falling back to web:", err);
      }
    }

    // --- WEB / DESKTOP FALLBACK ---
    if (voiceGenderRef.current === 'female') {
      try {
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(fullSpeechText)}&tl=tr&client=tw-ob`;
        let audio = googleTtsRef.current;
        if (!audio) {
          audio = new Audio();
          googleTtsRef.current = audio;
        }
        audio.src = ttsUrl;
        audio.playbackRate = playbackRateRef.current;
        audio.onended = goNext;
        audio.onerror = goNext;
        audio.play().catch(goNext);
      } catch {
        goNext();
      }
    } else {
      const utterance = new SpeechSynthesisUtterance(fullSpeechText);
      utterance.lang = 'tr-TR';
      utterance.rate = playbackRateRef.current;
      utterance.pitch = 0.9;

      const trVoices = availableVoices.filter(v => v.lang.startsWith('tr'));
      let selectedVoice = trVoices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('tolga')) || trVoices[0];

      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.onend = goNext;
      utterance.onerror = goNext;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startRadio = async (list, index = 0) => {
    // Priming for Mobile
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      try {
        const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
        await TextToSpeech.stop();
      } catch (e) { }
    }

    if (typeof Audio !== 'undefined') {
      const unlockAudio = new Audio();
      unlockAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhAAWAAWAnYmF0YQAAAAA=";
      unlockAudio.play().catch(() => { });
      googleTtsRef.current = unlockAudio;
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    stopRadio();
    setCurrentQueue(list);
    setIsPlaying(true);
    isPlayingRef.current = true;
    playNext(index, list);
  };

  const stopRadio = async () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    setCurrentIndex(-1);
    setCurrentQueue([]); // Listeyi tamamen sıfırla

    // 1. Native Mobil Durdurma (Capacitor)
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      try {
        const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
        await TextToSpeech.stop().catch(() => { });
      } catch (e) {
        console.warn('[Radio] Native stop failed:', e);
      }
    }

    // 2. Tarayıcı Durdurma (Web Speech API)
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // 3. Google Audio / AI Audio Durdurma
    if (googleTtsRef.current) {
      googleTtsRef.current.pause();
      googleTtsRef.current.src = "";
      googleTtsRef.current = null;
    }

    console.log('[Radio] Tüm ses işlemleri durduruldu.');
  };

  const value = {
    isPlaying,
    currentQueue,
    currentIndex,
    voiceGender,
    setVoiceGender,
    playbackRate,
    startRadio,
    stopRadio,
    sanitizeForAudio,
    currentItem: currentIndex >= 0 ? currentQueue[currentIndex] : null
  };

  return <RadioContext.Provider value={value}>{children}</RadioContext.Provider>;
};

