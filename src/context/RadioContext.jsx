import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { getAppSettings } from '../services/dbService';

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
    const loadVoices = () => {
      if (!window.speechSynthesis) return;
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    loadVoices();
    if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // Fallback için her saniye bir kez kontrol et (Bazı mobil WebView'larda event tetiklenmeyebiliyor)
    const timer = setInterval(() => {
      if (availableVoices.length === 0) loadVoices();
    }, 1000);

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
      .replace(/\bBloomberg\b/gi, 'Blumberg')
      .replace(/[*#•]/g, '');
  };

  const playNext = async (index, list) => {
    const hasSpeech = 'speechSynthesis' in window;

    if (!isPlayingRef.current || index >= list.length) {
      stopRadio();
      return;
    }

    setCurrentIndex(index);
    const item = list[index];

    let finalTitle = item.title;
    try {
      if (window.electronAPI && typeof window.electronAPI.translateText === 'function') {
        // --- DESKTOP (Electron) - Use Safe IPC Bridge ---
        const translatedText = await window.electronAPI.translateText(finalTitle, 'tr');
        if (translatedText) finalTitle = translatedText;
      } else {
        // --- MOBILE / WEB (LibreTranslate - Play Store Safe) ---
        const endpoints = [
          'https://libretranslate.de/translate',
          'https://de.libretranslate.com/translate',
          'https://translate.terraprint.co/translate'
        ];
        
        let translated = null;
        for (const ep of endpoints) {
          // 1. Yol: JSON
          try {
            const resJSON = await fetch(ep, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ q: finalTitle, source: 'auto', target: 'tr', format: 'text' }),
              signal: AbortSignal.timeout(6000)
            });
            if (resJSON.ok) {
              const data = await resJSON.json();
              if (data?.translatedText) {
                translated = data.translatedText;
                break;
              }
            }
          } catch (e) { /* JSON Başarısız, Form Data'yı dene */ }

          // 2. Yol: Form Data
          try {
            const params = new URLSearchParams();
            params.append('q', finalTitle);
            params.append('source', 'auto');
            params.append('target', 'tr');
            params.append('format', 'text');

            const resForm = await fetch(ep, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: params,
              signal: AbortSignal.timeout(6000)
            });
            if (resForm.ok) {
              const data = await resForm.json();
              if (data?.translatedText) {
                translated = data.translatedText;
                break;
              }
            }
          } catch (e) { 
            console.warn(`Radyo çeviri denemesi başarısız (${ep}):`, e);
          }
        }
        if (translated) finalTitle = translated;
      }
    } catch (err) {
      console.warn("Radyo çeviri hatası:", err);
    }

    if (!isPlayingRef.current) return;

    let cleanSource = item.sourceName || '';
    if (cleanSource) {
      cleanSource = cleanSource.split('-')[0].split('|')[0].split(':')[0].split('–')[0].trim();
      if (cleanSource.length > 25) cleanSource = cleanSource.split('.')[0];
    } else {
      try {
        const u = new URL(item.sourceUrl);
        const parts = u.hostname.replace('www.', '').split('.');
        cleanSource = parts.length > 1 ? parts[0] : 'Sıradaki haber';
      } catch {
        cleanSource = 'Sıradaki haber';
      }
    }

    const introText = cleanSource ? `${cleanSource} bildiriyor: ` : 'Sıradaki haber: ';
    const fullSpeechText = sanitizeForAudio(introText + "... " + finalTitle + ".");

    const gender = voiceGenderRef.current;

    const goNext = () => {
      setTimeout(() => {
        if (isPlayingRef.current) playNext(index + 1, list);
      }, 800);
    };

    if (gender === 'female') {
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

      // En iyi Türkçe sesini bul
      const trVoices = availableVoices.filter(v => v.lang.startsWith('tr'));
      let selectedVoice = null;
      
      if (trVoices.length > 0) {
        // Öncelik: Erkek olarak bilinen sesler (Tolga, Male vb)
        selectedVoice = trVoices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('tolga'));
        // Yoksa herhangi bir Türkçe ses
        if (!selectedVoice) selectedVoice = trVoices[0];
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onend = goNext;
      utterance.onerror = (e) => {
        console.error("Speech error", e);
        goNext();
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const startRadio = (list, index = 0) => {
    // MOBİL İÇİN MOTORLARI HAZIRLA (Priming)
    // 1. Audio Motoru
    if (typeof Audio !== 'undefined') {
      const unlockAudio = new Audio();
      unlockAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhAAWAAWAnYmF0YQAAAAA="; // 1ms sessizlik
      unlockAudio.play().catch(() => {});
      googleTtsRef.current = unlockAudio;
    }
    // 2. Speech Motoru
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const primeUtterance = new SpeechSynthesisUtterance("");
      window.speechSynthesis.speak(primeUtterance);
    }

    stopRadio(); 
    setCurrentQueue(list);
    setIsPlaying(true);
    isPlayingRef.current = true;
    playNext(index, list);
  };

  const stopRadio = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    setCurrentIndex(-1);
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    if (googleTtsRef.current) {
      googleTtsRef.current.pause();
      googleTtsRef.current.src = "";
      // googleTtsRef.current = null; // Don't nullify if we want to reuse it for priming
    }
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
