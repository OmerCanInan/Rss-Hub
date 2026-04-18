// src/pages/NewsFeed.jsx
// RSS Haberlerinin (Sonuçların) listelendiği Ana Ekran.
import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchRssFeed, generateTags } from '../services/rssService';
import { getRssLinks, getNewsCache, saveNewsItems, getFilters, saveFilters, getAppSettings } from '../services/dbService';
import { useRadio } from '../context/RadioContext';
import { summarizeNewsWithGemini } from '../services/aiService';
import NewsCard from '../components/NewsCard';
import { ArrowLeft, Loader2, RefreshCw, ShieldAlert, Target, Sparkles, Bot, Headphones, Square, Tag, Key, HelpCircle } from 'lucide-react';

// Haberler çekilirken zaten rssService içinde generateTags ile etiketleniyor.
// Bu yüzden cache'den okurken tekrar hesaplama yapmak CPU'yu yoruyordu, kaldırıldı.

// Tarih sıralama (Yardımcı fonksiyon)
const sortNews = (feedData) => {
  const now = new Date().getTime() + (24 * 60 * 60 * 1000);
  return feedData.sort((a, b) => {
    const timeA = a.date.getTime();
    const timeB = b.date.getTime();
    const isValidA = !isNaN(timeA) && timeA < now;
    const isValidB = !isNaN(timeB) && timeB < now;
    if (!isValidA && !isValidB) return 0;
    if (!isValidA) return 1;
    if (!isValidB) return -1;
    return timeB - timeA;
  });
};

export default function NewsFeed() {
  const [searchParams] = useSearchParams();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // Arka plan yenileme
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(50); // İlk yüklemede performans için 50'ye düşürüldü
  const [filterForm, setFilterForm] = useState(() => getFilters());
  const [debouncedFilterForm, setDebouncedFilterForm] = useState(filterForm);
  const [tagSearch, setTagSearch] = useState(''); // Yazarak etiket araması
  const [selectedTag, setSelectedTag] = useState('');  // Karta tıklayarak seçilen etiket
  const [showTagDropdown, setShowTagDropdown] = useState(false); // Dropdown aç/kapat
  const tagDropdownRef = useRef(null); // Dışarı tıklanınca kapat

  // AI States
  const [aiSummary, setAiSummary] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const queryUrl = searchParams.get('url');
  const searchAll = searchParams.get('all') === 'true';
  const filterYesterday = searchParams.get('filter') === 'yesterday';
  const targetFolder = searchParams.get('folder'); // Klasör / Etiket desteği

  // Radyo Context
  const { 
    isPlaying: isPlayingRadio, 
    currentIndex: currentPlayingIndex, 
    startRadio, 
    stopRadio, 
    sanitizeForAudio,
    voiceGender: radioVoiceGender, 
    setVoiceGender: setRadioVoiceGender,
    playbackRate
  } = useRadio();

  // AI Özeti Sesli Okuma State
  const [isPlayingAiAudio, setIsPlayingAiAudio] = useState(false);
  const isPlayingAiRef = useRef(false);
  
  const googleTtsRef = useRef(null); // AI için yerel audio objesi
  
  // AI Modal Menü State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  
  // V5: İlerleme ve Hız Yönetimi
  const [refreshStat, setRefreshStat] = useState({ done: 0, total: 0 });
  const latestRequestIdRef = useRef(0);

  // Filtreler için Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterForm(filterForm);
    }, 300);
    return () => clearTimeout(timer);
  }, [filterForm]);

  // Dropdown dışına tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target)) {
        setShowTagDropdown(false);
      }
    };
    if (showTagDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTagDropdown]);

  // AI özetindeki Markdown (kalın yazı ve liste) yapılarını basitçe render eder
  const formatSummary = (text) => {
    if (!text) return null;
    
    // Markdown renderer basic implementation
    let formatted = text
       // Headers (h3, h4)
       .replace(/^### (.*$)/gm, '<h4 style="color:var(--primary-color); margin:1.5rem 0 0.8rem 0; font-size:1.1rem; border-bottom:1px solid var(--border-color); padding-bottom:0.4rem; font-weight:800; letter-spacing:-0.01em;">$1</h4>')
       .replace(/^#### (.*$)/gm, '<h5 style="color:var(--text-color); margin:1rem 0 0.5rem 0; font-size:1rem; font-weight:700;">$1</h5>')
       // Bullets
       .replace(/^[•\-\*] (.*$)/gm, '<li style="margin-bottom:0.8rem; list-style-type:none; display:flex; gap:0.6rem; line-height:1.5; align-items:flex-start;"><span style="color:var(--primary-color); font-weight:bold; margin-top:2px;">•</span> <span>$1</span></li>')
       // Bold
       .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-color); font-weight:700;">$1</strong>')
       // Habere Git Link (Stylized)
       .replace(/\[Haber ↗\]\((.*?)\)/g, '<a href="$1" target="_blank" style="display:inline-flex; align-items:center; gap:4px; font-size:0.75rem; color:#10b981; text-decoration:none; margin-left:8px; opacity:0.8; font-weight:700; border:1px solid rgba(16, 185, 129, 0.4); padding:2px 8px; border-radius:6px; background:rgba(16, 185, 129, 0.05); transition:all 0.2s; white-space:nowrap;">Haber ↗</a>')
       // Transparent Source
       .replace(/\{\{(.*?)\}\}/g, '<span style="display:inline-block; font-size:0.75rem; color:var(--text-light); opacity:0.4; margin-left:10px; font-weight:500;">$1</span>')
       // Source highlight
       .replace(/(Kaynak: .*$)/gmi, '<em style="display:block; font-size:0.8rem; color:var(--text-light); margin-top:0.2rem; font-style:normal; opacity:0.8;">$1</em>');

    return (
       <div className="summary-content" style={{ padding: '0.5rem 0' }}>
          {formatted.split('\n').map((line, i) => (
             line.trim() ? <div key={i} dangerouslySetInnerHTML={{ __html: line }} /> : null
          ))}
       </div>
    );
  };



  useEffect(() => {
    const controller = new AbortController();
    let isCancelled = false;
    const requestId = ++latestRequestIdRef.current;

    const loadNews = async () => {
      // 1. ANINDA YÜKLEME (Cache) 
      const initialData = getNewsCache();
      const currentLinks = getRssLinks();
      
      const filterByContext = (data) => {
        let result = data;
        const currentLinksMap = getRssLinks(); // Her zaman güncel linkleri referans al
        if (targetFolder) {
          const allowedUrls = currentLinksMap.filter(l => l.folder === targetFolder).map(l => l.url);
          result = result.filter(item => allowedUrls.includes(item.sourceUrl));
        } else if (queryUrl) {
          result = result.filter(item => item.sourceUrl === queryUrl);
        } else {
          const allowedUrls = currentLinksMap.map(l => l.url);
          result = result.filter(item => allowedUrls.includes(item.sourceUrl));
          if (filterYesterday && !searchAll) {
             const now = new Date();
             const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
             const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - 1;
             result = result.filter(item => {
                const time = item.date.getTime();
                return time >= startOfYesterday && time <= endOfYesterday;
             });
          }
        }
        return result;
      };

      const initialDisplay = filterByContext(initialData);
      
      if (!isCancelled && requestId === latestRequestIdRef.current) {
        setNews(sortNews(initialDisplay));
        setLoading(initialDisplay.length === 0);
        setIsRefreshing(true);
        setError(null);
      }

      // 2. TURBO GÜNCELLEME (V5 Final: Two-Pass Architecture)
      try {
        let linksToFetch = [];
        if (searchAll || filterYesterday || targetFolder) {
          linksToFetch = getRssLinks();
          if (targetFolder) {
            linksToFetch = linksToFetch.filter(l => l.folder === targetFolder);
          }
        } else if (queryUrl) {
          linksToFetch = [{ url: queryUrl }];
        }

        // --- AKILLI ÖNCELİKLENDİRME (V5.1) ---
        // Cache'de son 1 saatte haberi olan kaynakları bul ve en başa al
        if (linksToFetch.length > 1 && initialData.length > 0) {
          const oneHourAgo = new Date().getTime() - (60 * 60 * 1000);
          const activeSourceUrls = new Set();
          
          initialData.forEach(item => {
            if (item.date && item.date.getTime() > oneHourAgo) {
              activeSourceUrls.add(item.sourceUrl);
            }
          });

          // Öncelikli olanları başa al
          linksToFetch.sort((a, b) => {
            const aActive = activeSourceUrls.has(a.url) ? 1 : 0;
            const bActive = activeSourceUrls.has(b.url) ? 1 : 0;
            return bActive - aActive; 
          });
        }

        if (linksToFetch.length === 0) {
          if (!isCancelled) {
             setIsRefreshing(false);
             setLoading(false);
          }
          return;
        }

        if (!isCancelled && requestId === latestRequestIdRef.current) {
          setRefreshStat({ done: 0, total: linksToFetch.length });
        }

        // --- CONCURRENCY POOL RUNNER ---
        const runTasks = async (tasks, concurrency, timeout) => {
          const pool = new Set();
          const results = [];
          const failed = [];

          for (const linkObj of tasks) {
            if (isCancelled || requestId !== latestRequestIdRef.current) break;
            
            const promise = fetchRssFeed(linkObj.url, controller.signal, timeout)
              .then(items => {
                if (!isCancelled && requestId === latestRequestIdRef.current) {
                   setRefreshStat(prev => ({ ...prev, done: prev.done + 1 }));
                   if (items && items.length > 0) {
                     saveNewsItems(items);
                     setNews(prevNews => {
                        const combined = [...prevNews];
                        const existingKeys = new Set(combined.map(n => n.title + n.link));
                        items.forEach(it => {
                           if (!existingKeys.has(it.title + it.link)) combined.push(it);
                        });
                        return sortNews(filterByContext(combined));
                     });
                     setLoading(false);
                   }
                }
                return { status: 'fulfilled', url: linkObj.url };
              })
              .catch(err => {
                if (!isCancelled && requestId === latestRequestIdRef.current) {
                   setRefreshStat(prev => ({ ...prev, done: prev.done + 1 }));
                }
                failed.push(linkObj);
                return { status: 'rejected', url: linkObj.url };
              })
              .finally(() => pool.delete(promise));

            pool.add(promise);
            if (pool.size >= concurrency) {
              await Promise.race(pool);
            }
          }
          await Promise.all(pool);
          return failed;
        };

        // PASS 1: Hızlı Şerit (5 saniye limit)
        const failedInPass1 = await runTasks(linksToFetch, 20, 5000);

        // Birinci aşama bitti, spinner'ı kapatıp "Hızlı Entegrasyon"u kutlayalım
        if (!isCancelled && requestId === latestRequestIdRef.current) {
          setIsRefreshing(false);
          setLoading(false);
        }

        // PASS 2: Güvenli Şerit (Arka Plan - 15 saniye limit)
        if (failedInPass1.length > 0 && !isCancelled && requestId === latestRequestIdRef.current) {
           // Kalanları daha uzun süreyle sessizce dene
           await runTasks(failedInPass1, 5, 15000);
        }

      } catch (err) {
        if (!isCancelled && err.name !== 'AbortError') {
          console.error("V5 Update Error:", err);
        }
      } finally {
        if (!isCancelled && requestId === latestRequestIdRef.current) {
          setIsRefreshing(false);
          setLoading(false);
          setRefreshStat({ done: 0, total: 0 }); // Sayacı temizle
        }
      }
    };

    loadNews();
    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [queryUrl, searchAll, filterYesterday, targetFolder]);

  // Klasör / Kategori değiştiğinde AI özetini sıfırla (Eski özetin kalmaması için)
  useEffect(() => {
    setAiSummary(null);
    setAiError(null);
    setIsAiLoading(false);
  }, [queryUrl, searchAll, filterYesterday, targetFolder]);

  // Klasör, Tümü veya Tekil başlık seçimi
  let pageTitle = 'Arama Sonuçları';
  if (searchAll) pageTitle = 'Tüm Haberler';
  if (filterYesterday) pageTitle = 'Dünün Özeti';
  if (targetFolder) pageTitle = `Klasör: ${targetFolder}`;

  const handleFilterChange = (type, value) => {
    const newFilters = { ...filterForm, [type]: value };
    setFilterForm(newFilters);
    saveFilters(newFilters);
  };

  // Tag'a tıklanınca: aynı tag tekrar tıklanırsa filtre kalkar (toggle)
  const handleTagClick = (tag) => {
    const normalizedTag = tag.toLowerCase().trim();
    setSelectedTag(prev => (prev.toLowerCase() === normalizedTag ? '' : normalizedTag));
    setTagSearch('');
    // Sayfanın başına scroll yap ki chip görünsün
    const scrollContainer = document.querySelector('.main-content');
    if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- HABERLERİ FİLTRELEME (useMemo ile Optimizasyon) ---
  const displayedNews = useMemo(() => {
    let result = [...news];

    // Klasör Filtresi (Eğer URL'den geliyorsa)
    if (targetFolder) {
      const links = getRssLinks();
      const allowedUrls = links.filter(l => l.folder === targetFolder).map(l => l.url);
      result = result.filter(item => allowedUrls.includes(item.sourceUrl));
    }

    // Kelime Filtreleri (Debounced)
    const bl = debouncedFilterForm.blacklist ? debouncedFilterForm.blacklist.split(',').map(s => s.trim().toLowerCase()).filter(s => s) : [];
    const wl = debouncedFilterForm.whitelist ? debouncedFilterForm.whitelist.split(',').map(s => s.trim().toLowerCase()).filter(s => s) : [];

    if (bl.length > 0) {
      result = result.filter(item => {
        const text = (item.title + " " + (item.description || "")).toLowerCase();
        return !bl.some(word => text.includes(word));
      });
    }

    if (wl.length > 0) {
      result = result.filter(item => {
        const text = (item.title + " " + (item.description || "")).toLowerCase();
        return wl.some(word => text.includes(word));
      });
    }

    // Etiket Filtresi
    if (selectedTag) {
      result = result.filter(item =>
        Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase())
      );
    } else if (tagSearch.trim()) {
      const ts = tagSearch.trim().toLowerCase();
      result = result.filter(item =>
        Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase().includes(ts))
      );
    }

    return result;
  }, [news, targetFolder, debouncedFilterForm, selectedTag, tagSearch]);

  // --- ETİKET ANALİZİ (useMemo ile Optimizasyon) ---
  const { tagFreq, allTags } = useMemo(() => {
    const freq = {};
    news.forEach(item => {
      if (Array.isArray(item.tags)) {
        item.tags.forEach(t => {
          const normalized = t.toLowerCase();
          freq[normalized] = (freq[normalized] || 0) + 1;
        });
      }
    });
    const sortedTags = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t);
    
    return { tagFreq: freq, allTags: sortedTags };
  }, [news]);

  const handleGenerateSummary = async () => {
    setIsAiLoading(true);
    setAiError(null);
    setAiSummary(null);
    try {
      const summaryText = await summarizeNewsWithGemini(displayedNews, pageTitle);
      setAiSummary(summaryText);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleOpenAiModal = () => {
     setIsAiModalOpen(true);
     // Eğer daha önce özet çıkarılmamışsa modal açılınca otomatik üretmeye başlasın
     if (!aiSummary && !aiError && !isAiLoading) {
         handleGenerateSummary();
     }
  };

  const handleCloseAiModal = () => {
    setIsAiModalOpen(false);
    if (isPlayingAiAudio) {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        if (googleTtsRef.current) { 
          googleTtsRef.current.pause(); 
          googleTtsRef.current.src = ""; 
          googleTtsRef.current = null; 
        }
        setIsPlayingAiAudio(false);
        isPlayingAiRef.current = false;
    }
  };

  // --- RADYO MANTIĞI (GLOBAL CONTEXT'E BAĞLI) ---
  const handleToggleRadio = () => {
    if (isPlayingRadio) {
      stopRadio();
    } else {
      if (displayedNews.length === 0) return;
      
      // AI okumasını durdur (Eğer varsa)
      if (isPlayingAiAudio) {
        setIsPlayingAiAudio(false);
        isPlayingAiRef.current = false;
        if (googleTtsRef.current) {
          googleTtsRef.current.pause();
          googleTtsRef.current.src = "";
        }
      }
      
      startRadio(displayedNews, 0);
    }
  };

  // --- AI ÖZETİ SESLİ OKUMA ---
  const handleToggleAiAudio = () => {
    const hasSpeech = 'speechSynthesis' in window;
    const hasAudio = typeof Audio !== 'undefined';

    if (!hasSpeech && !hasAudio) {
        alert("Cihazınız sesli okumayı desteklemiyor.");
        return;
    }

    if (isPlayingAiAudio) {
       isPlayingAiRef.current = false;
       if (hasSpeech) window.speechSynthesis.cancel();
       if (googleTtsRef.current) { googleTtsRef.current.pause(); googleTtsRef.current.src = ""; googleTtsRef.current = null; }
       setIsPlayingAiAudio(false);
    } else {
       if (!aiSummary) return;
       
       // Global Radyo'yu durdur
       if (isPlayingRadio) stopRadio();

       isPlayingAiRef.current = true;

       // SES KİLİDİNİ AÇMA (Mobile Audio Unlock)
       if (hasAudio) {
         const unlockAudio = new Audio();
         unlockAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhAAWAAWAnYmF0YQAAAAA=";
         unlockAudio.play().catch(() => {});
         googleTtsRef.current = unlockAudio;
       }

       // Eğer seçilen ses erkekse ve sistemde destek yoksa otomatik kadına geç
       if (radioVoiceGender === 'male' && !hasSpeech) {
          setRadioVoiceGender('female');
       }

       setIsPlayingAiAudio(true);
       
       // Context'ten gelen sanitizeForAudio'yu kullan
       const audioText = sanitizeForAudio(aiSummary);
       
       if (radioVoiceGender === 'female') {
         // Google Translate TTS — kadın sesi
         const chunks = [];
         let remaining = audioText;
         while (remaining.length > 0) {
           if (remaining.length <= 200) { chunks.push(remaining); break; }
           let cutAt = remaining.lastIndexOf(' ', 200);
           if (cutAt <= 0) cutAt = 200;
           chunks.push(remaining.substring(0, cutAt));
           remaining = remaining.substring(cutAt).trim();
         }
         
         let ci = 0;
         const playChunk = () => {
           if (!isPlayingAiRef.current || ci >= chunks.length) { setIsPlayingAiAudio(false); isPlayingAiRef.current = false; return; }
           const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunks[ci])}&tl=tr&client=tw-ob`;
           const audio = new Audio(url); 
           audio.playbackRate = playbackRate;
           googleTtsRef.current = audio;
           audio.onended = () => { if (isPlayingAiRef.current) { ci++; playChunk(); } };
           audio.onerror = () => { setIsPlayingAiAudio(false); isPlayingAiRef.current = false; };
           audio.play().catch(() => { setIsPlayingAiAudio(false); isPlayingAiRef.current = false; });
         };
         playChunk();
       } else {
         // Erkek — yerel Tolga
         const utterance = new SpeechSynthesisUtterance(audioText);
         utterance.lang = 'tr-TR';
         utterance.rate = playbackRate;
         utterance.pitch = 0.9;
         
         const voices = window.speechSynthesis.getVoices();
         const trVoice = voices.find(v => v.lang.startsWith('tr'));
         if (trVoice) utterance.voice = trVoice;
         
         utterance.onend = () => setIsPlayingAiAudio(false);
         utterance.onerror = () => setIsPlayingAiAudio(false);
         
         window.speechSynthesis.speak(utterance);
       }
    }
  };





  return (
    <div className="news-feed-container">
      <div className="feed-header fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link to="/" className="btn-back">
            <ArrowLeft size={18} /> Geri Dön
          </Link>
          <h2 className="page-title" style={{ marginTop: '0.5rem' }}>
            {pageTitle} {news.length > 0 && `(${news.length})`}
          </h2>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {isRefreshing && (
            <div style={{ color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <RefreshCw size={16} className="spinner" /> Güncelleniyor
            </div>
          )}
          
          <button 
            onClick={handleOpenAiModal}
            title="Haberlerin yapay zeka özetini okuyun"
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981', 
              border: '1px solid rgba(16, 185, 129, 0.4)', 
              cursor: 'pointer', transition: 'all 0.3s ease', fontWeight: '600', fontSize: '0.9rem', zIndex: 5
            }}
          >
            <Bot size={18} />
            AI Özeti 
          </button>

          <button 
            onClick={handleToggleRadio}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '8px',
              background: isPlayingRadio ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-secondary)',
              color: isPlayingRadio ? '#ff8a8a' : 'var(--text-color)', 
              border: isPlayingRadio ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)', 
              boxShadow: isPlayingRadio ? '0 0 12px rgba(239, 68, 68, 0.15)' : 'none',
              cursor: 'pointer', transition: 'all 0.3s ease', fontWeight: '600', fontSize: '0.9rem', zIndex: 5
            }}
          >
            {isPlayingRadio ? <Square size={16} fill="currentColor" /> : <Headphones size={18} />}
            {isPlayingRadio ? 'Radyoyu Kapat' : 'Radyo Dinle'}
          </button>

          {/* Ses Cinsiyet Seçimi */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: 0,
              borderRadius: '8px', overflow: 'hidden',
              border: '1px solid var(--border-color)',
            }}>
              <button
                onClick={() => setRadioVoiceGender('female')}
                title="Kadın Sesi"
                style={{
                  padding: '0.5rem 0.7rem', cursor: 'pointer', fontSize: '0.85rem',
                  border: 'none', transition: 'all 0.2s',
                  background: radioVoiceGender === 'female' ? 'rgba(236,72,153,0.15)' : 'var(--bg-secondary)',
                  color: radioVoiceGender === 'female' ? '#f9a8d4' : 'var(--text-light)',
                  borderRight: '1px solid var(--border-color)',
                }}
              >
                ♀ Kadın
              </button>
              <button
                onClick={() => setRadioVoiceGender('male')}
                title="Erkek Sesi (Beta)"
                style={{
                  padding: '0.5rem 0.7rem', cursor: 'pointer', fontSize: '0.85rem',
                  border: 'none', transition: 'all 0.2s',
                  background: radioVoiceGender === 'male' ? 'rgba(59,130,246,0.15)' : 'var(--bg-secondary)',
                  color: radioVoiceGender === 'male' ? '#93c5fd' : 'var(--text-light)',
                }}
              >
                ♂ Erkek <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>(Beta)</span>
              </button>
            </div>
            <div style={{ 
              position: 'absolute', bottom: '-1.1rem', left: '50%', transform: 'translateX(-50%)',
              fontSize: '0.6rem', color: 'var(--text-light)', opacity: 0.5, whiteSpace: 'nowrap' 
            }}>
               * Bazı cihazlarda desteklenmeyebilir.
            </div>
          </div>
        </div>
      </div>

      {/* Kelime Filtreleri Alanı — ref ile dropdown click-outside */}
      <div ref={tagDropdownRef} style={{ position: 'relative' }}>
      <div className="fade-in" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
        <div style={{ flex: '1 1 250px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--danger-color)', fontWeight: '600' }}>
            <ShieldAlert size={16} /> Sessize Alınanlar
          </label>
          <input 
            type="text" 
            placeholder="Virgülle ayırın (Örn: kaza, kriz)"
            value={filterForm.blacklist}
            onChange={(e) => handleFilterChange('blacklist', e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-color)', color: 'var(--text-color)', borderRadius: '6px', fontSize: '0.9rem' }}
          />
        </div>
        <div style={{ flex: '1 1 250px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--primary-color)', fontWeight: '600' }}>
            <Target size={16} /> Odak Kelimeler
          </label>
          <input 
            type="text" 
            placeholder="Virgülle ayırın (Örn: yapay zeka, spor)"
            value={filterForm.whitelist}
            onChange={(e) => handleFilterChange('whitelist', e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-color)', color: 'var(--text-color)', borderRadius: '6px', fontSize: '0.9rem' }}
          />
        </div>
        <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--success-color)', fontWeight: '600' }}>
            <Tag size={16} /> Etiket Filtresi
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Aktif tag varsa chip göster */}
            {selectedTag && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '0.4rem 0.9rem', borderRadius: '20px', fontSize: '0.85rem',
                fontWeight: '700', background: 'rgba(16,185,129,0.15)',
                color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.4)',
                letterSpacing: '0.04em', flexShrink: 0,
              }}>
                {selectedTag}
                <button
                  onClick={() => { setSelectedTag(''); setTagSearch(''); }}
                  style={{ background: 'none', border: 'none', color: '#6ee7b7', cursor: 'pointer', padding: '0', lineHeight: 1, fontSize: '1rem', display: 'flex', alignItems: 'center' }}
                >✕</button>
              </span>
            )}
            {/* Dropdown aç/kapat butonu */}
            <button
              onClick={() => setShowTagDropdown(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '0.6rem 1rem', borderRadius: '6px', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: '600',
                border: showTagDropdown ? '1px solid var(--success-color)' : '1px solid var(--border-color)',
                background: showTagDropdown ? 'rgba(16,185,129,0.1)' : 'var(--bg-color)',
                color: showTagDropdown ? 'var(--success-color)' : 'var(--text-color)',
                transition: 'all 0.18s ease', whiteSpace: 'nowrap',
              }}
            >
              <Tag size={14} /> Etiketler {showTagDropdown ? '▲' : '▼'}
            </button>
          </div>
        </div>
      </div>

      {/* ── DROPDOWN PANEL ── — filter alanının altında açılır */}
      {showTagDropdown && news.length > 0 && (() => {
        const TAG_COLORS = [
          { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.5)', text: '#a5b4fc' },
          { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.4)', text: '#6ee7b7' },
          { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)', text: '#fcd34d' },
          { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.4)',  text: '#fca5a5' },
          { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.4)', text: '#93c5fd' },
          { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.4)', text: '#d8b4fe' },
          { bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.4)', text: '#f9a8d4' },
          { bg: 'rgba(20,184,166,0.12)', border: 'rgba(20,184,166,0.4)', text: '#5eead4' },
          { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.4)', text: '#fdba74' },
          { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.4)',  text: '#86efac' },
        ];
        const getColor = (tag) => {
          let hash = 0;
          for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
          return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
        };
        return (
          <div className="fade-in" style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 300,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1rem',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
            marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={14} /> Etiket Seç <span style={{ color: 'var(--text-light)', fontWeight: '400' }}>({allTags.length} etiket)</span>
              </span>
              <button onClick={() => setShowTagDropdown(false)} style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '1.1rem', padding: '0 4px' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem' }}>
              {/* Tümü */}
              <button
                onClick={() => { setSelectedTag(''); setTagSearch(''); setShowTagDropdown(false); }}
                style={{
                  padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '0.8rem', fontWeight: '700', textAlign: 'left',
                  border: !selectedTag && !tagSearch ? '1px solid rgba(255,255,255,0.5)' : '1px solid var(--border-color)',
                  background: !selectedTag && !tagSearch ? 'rgba(255,255,255,0.12)' : 'var(--bg-color)',
                  color: 'var(--text-color)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'all 0.15s',
                }}
              >
                <span>🗂 Tümü</span>
                <span style={{ fontSize: '0.72rem', opacity: 0.6, background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: '8px' }}>{news.length}</span>
              </button>

              {allTags.map(tag => {
                const color = getColor(tag);
                const isActive = selectedTag.toLowerCase() === tag.toLowerCase();
                const count = tagFreq[tag];
                const emoji = {
                  '#oyun': '🎮', '#teknoloji': '💻', '#ekonomi': '📈',
                  '#spor': '⚽', '#dünya': '🌍', '#türkiye': '🇹🇷',
                  '#bilim': '🔬', '#sağlık': '🏥', '#otomobil': '🚗',
                  '#yapay-zeka': '🤖', '#kripto': '₿', '#sinema-tv': '🎬',
                  '#yaşam': '🌿', '#iş-dünyası': '💼', '#genel': '📰',
                }[tag] || '🏷';
                return (
                  <button
                    key={tag}
                    onClick={() => { handleTagClick(tag); setShowTagDropdown(false); }}
                    style={{
                      padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                      fontSize: '0.8rem', fontWeight: '700', textAlign: 'left',
                      border: `1px solid ${isActive ? color.text : color.border}`,
                      background: isActive ? color.text : color.bg,
                      color: isActive ? '#0f172a' : color.text,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      boxShadow: isActive ? `0 0 12px ${color.border}` : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span>{emoji} {tag}</span>
                    <span style={{ fontSize: '0.72rem', background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: '8px' }}>{count}</span>
                  </button>
                );
              })}
            </div>
            <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.7rem', color: 'var(--text-light)', opacity: 0.5, textAlign: 'center', fontStyle: 'italic' }}>
              ⚠ Beta — Etiketler anahtar kelime tabanlıdır ve tüm haberleri tam olarak kapsamayabilir.
            </p>
          </div>
        );
      })()}
      </div>

      {/* AI ÖZET MODALI */}
      {isAiModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }} onClick={handleCloseAiModal}>
          <div className="fade-in" style={{
            background: 'var(--bg-color)', width: '100%', maxWidth: '700px', maxHeight: '85vh',
            borderRadius: '16px', border: '1px solid var(--border-color)', overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(145deg, var(--bg-secondary) 0%, rgba(16, 185, 129, 0.05) 100%)' }}>
               <div>
                  <h3 style={{ margin: '0 0 0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '1.2rem' }}>
                    <Sparkles size={20} /> Yapay Zeka Özeti
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-light)' }}>Listedeki {displayedNews.length} habere göre hazırlanıyor...</p>
               </div>
               
               <div style={{ display: 'flex', gap: '0.5rem' }}>
                   {!isAiLoading && !aiError && aiSummary && (
                       <button
                         onClick={handleToggleAiAudio}
                         style={{
                           display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.8rem', borderRadius: '8px',
                           background: isPlayingAiAudio ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-color)',
                           color: isPlayingAiAudio ? 'var(--danger-color)' : 'var(--text-color)', 
                           border: isPlayingAiAudio ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-color)',
                           cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem', fontWeight: '600'
                         }}
                       >
                         {isPlayingAiAudio ? <Square size={14} fill="currentColor" /> : <Headphones size={14} />}
                         {isPlayingAiAudio ? 'Okumayı Durdur' : 'Sesli Dinle'}
                       </button>
                   )}
                   <button onClick={handleCloseAiModal} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-color)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Kapat
                   </button>
               </div>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '2rem' }}>
               {isAiLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 0', color: 'var(--text-light)' }}>
                     <Loader2 size={40} className="spinner" style={{ marginBottom: '1rem', color: '#10b981' }} />
                     <p>
                       Yapay Zeka (Groq) haberleri analiz ediyor...
                       {refreshStat.total > 0 && (
                         <span style={{ marginLeft: '8px', opacity: 0.7 }}>
                           ({refreshStat.done}/{refreshStat.total})
                         </span>
                       )}
                     </p>
                  </div>
                ) : aiError ? (
                  <div className="glass-error-panel" style={{ 
                    position: 'relative',
                    padding: '2.5rem',
                    borderRadius: '20px',
                    background: 'rgba(239, 68, 68, 0.03)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '1.5rem',
                    overflow: 'hidden'
                  }}>
                    {/* Background decoration */}
                    <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '150px', height: '150px', background: 'rgba(239, 68, 68, 0.05)', filter: 'blur(50px)', borderRadius: '50%', zIndex: 0 }}></div>
                    
                    <div style={{ 
                      width: '60px', height: '60px', borderRadius: '50%', 
                      background: 'rgba(239, 68, 68, 0.1)', display: 'flex', 
                      alignItems: 'center', justifyContent: 'center', color: '#ff8a8a',
                      marginBottom: '0.5rem', zIndex: 1
                    }}>
                      <ShieldAlert size={32} />
                    </div>

                    <div style={{ zIndex: 1 }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-color)', fontSize: '1.1rem', fontWeight: '800' }}>Bir Yapılandırma Eksikliği Var</h4>
                      <p style={{ margin: 0, color: 'var(--text-light)', lineHeight: '1.6', fontSize: '0.95rem', maxWidth: '400px' }}>
                        {aiError.includes('Groq API anahtarınızı girin') 
                          ? 'Yapay zeka analizini başlatabilmek için Groq API anahtarınızı tanımlamanız gerekiyor.' 
                          : aiError}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', zIndex: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                      <Link 
                        to="/?tab=apikey" 
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: '8px', padding: '0.8rem 1.5rem', 
                          borderRadius: '10px', background: 'var(--text-color)', color: 'var(--bg-color)', 
                          textDecoration: 'none', fontWeight: '700', fontSize: '0.9rem', transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <Key size={18} /> Anahtar Girişi Yap
                      </Link>
                      
                      <button 
                         onClick={() => window.dispatchEvent(new CustomEvent('toggle_how_to_use'))}
                         style={{ 
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '0.8rem 1.5rem', 
                            borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-color)', 
                            border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem',
                            transition: 'all 0.2s'
                         }}
                         onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'var(--text-light)'; }}
                         onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                      >
                         <HelpCircle size={18} /> Nasıl Alınır? Rehberi Gör
                      </button>
                    </div>
                    
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', opacity: 0.5, zIndex: 1 }}>
                        * Groq API ücretsizdir ve kredi kartı gerektirmez.
                    </div>
                  </div>
               ) : aiSummary ? (
                  <div style={{ color: 'var(--text-color)', lineHeight: '1.8', fontSize: '1.05rem' }}>
                    {formatSummary(aiSummary)}
                  </div>
               ) : (
                  <div style={{ textAlign: 'center' }}>
                     <button onClick={handleGenerateSummary} className="btn btn-primary" style={{ background: '#10b981', border: 'none', padding: '0.8rem 2rem', fontSize: '1.1rem' }}>
                        Yeniden Özet Çıkart
                     </button>
                  </div>
               )}
            </div>

          </div>
        </div>
      )}




      {loading ? (
        <div className="loading-state fade-in">
          <Loader2 className="spinner" size={48} />
          <p>Haberler toplanıyor, lütfen bekleyin...</p>
        </div>
      ) : error ? (
        <div className="error-state fade-in">
          <p>{error}</p>
        </div>
      ) : (
        <div className="news-list-container fade-in">
          {displayedNews.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-light)', marginTop: '4rem', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
               <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>{news.length > 0 ? "Filtrenize uygun haber bulunamadı" : "Henüz haber bulunmuyor"}</h3>
               <p>{news.length > 0 ? "Lütfen Kara Liste veya Odak Kelimeler listenizi kontrol edin." : "Bu kategorideki kaynaklarda güncel bir haber bulunamadı. (Sistem, eski haberleri temizleme kuralı gereği son 7 günden eski haberleri göstermez)."}</p>
            </div>
          ) : (
            <div className="news-grid">
              {displayedNews.slice(0, visibleCount).map((item, index) => (
                <div key={item.id} style={{
                  position: 'relative',
                  borderRadius: '12px',
                  boxShadow: isPlayingRadio && currentPlayingIndex === index ? '0 0 0 3px var(--primary-color)' : 'none',
                  transform: isPlayingRadio && currentPlayingIndex === index ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.3s ease-in-out',
                  zIndex: isPlayingRadio && currentPlayingIndex === index ? 10 : 1
                }}>
                  {isPlayingRadio && currentPlayingIndex === index && (
                    <div style={{ position: 'absolute', top: '-10px', left: '-10px', background: 'var(--primary-color)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', zIndex: 11, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Headphones size={12} /> Okunuyor
                    </div>
                  )}
                  <NewsCard news={item} onTagClick={handleTagClick} activeTag={selectedTag} />
                </div>
              ))}
            </div>
          )}
          {visibleCount < displayedNews.length && (
            <div className="load-more-container" style={{ textAlign: 'center', margin: '2rem 0' }}>
              <button 
                onClick={() => setVisibleCount(prev => prev + 50)} 
                className="btn btn-primary"
                style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }}
              >
                Daha Fazla Göster
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

