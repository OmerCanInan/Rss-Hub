import { HashRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { TranslationProvider } from './context/TranslationContext';
import { RadioProvider } from './context/RadioContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import NewsFeed from './pages/NewsFeed';
import Discover from './pages/Discover';
import HowToUseDrawer from './components/HowToUseDrawer';
import Legal from './pages/Legal';

import { useEffect, useState, useRef, useCallback } from 'react';
import { getAppSettings, clearNewsCache } from './services/dbService';
import FirstLaunchSetup from './components/FirstLaunchSetup';
import TranslationProgressBar from './components/TranslationProgressBar';
import { AlertTriangle } from 'lucide-react';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [pcNotification, setPcNotification] = useState(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  // Mobil: Soldan sağa kaydırınca sidebar aç, sağdan sola kapat
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);

    // Yatay hareket dikey hareketten belirgin biçimde fazlaysa (kaydırma, scroll değil)
    if (dy > 60) return; // Dikey scroll'u yoksay
    if (Math.abs(dx) < 60) return; // Kısa dokunuşları yoksay

    if (dx > 0 && touchStartX.current < 40) {
      // Sol kenarden sağa: sidebar aç
      setIsSidebarOpen(true);
    } else if (dx < 0) {
      // Sağdan sola: sidebar kapat
      setIsSidebarOpen(false);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }, []);

  useEffect(() => {
    const isMobile = window.Capacitor?.isNativePlatform() || window.innerWidth < 768;
    if (!isMobile) return;
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  // İlk açılışta ML Kit Setup ekranı kontrolü
  useEffect(() => {
    // Biraz gecikmeli kontrol yapalım ki Capacitor objesi kesin yüklenmiş olsun
    setTimeout(() => {
      const isMobile = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
      const hasDoneSetup = localStorage.getItem('gundemim_mlkit_setup_done');
      
      if (isMobile && !hasDoneSetup) {
        setIsSetupOpen(true);
      } else {
        // Eğer setup ekranı açılmayacaksa, rehberi kontrol et
        const hasSeenOnboarding = localStorage.getItem('gundemim_first_start');
        if (!hasSeenOnboarding) {
          setIsHowToUseOpen(true);
          localStorage.setItem('gundemim_first_start', 'done');
        }
      }
    }, 500);
  }, []);

  // PC (Electron) Bildirim Dinleyicisi
  useEffect(() => {
    // Sadece Electron ortamındaysak çalıştır
    if (window.electronAPI && typeof window.electronAPI.onPcNotification === 'function') {
      const cleanup = window.electronAPI.onPcNotification((data) => {
        setPcNotification(data);
        // 5 saniye sonra otomatik kapat
        setTimeout(() => setPcNotification(null), 5000);
      });
      
      return () => cleanup();
    }
  }, []);

  // Uygulama ayarlarını dinleyip ana DOM'a işliyoruz
  useEffect(() => {
    const applySettings = () => {
      const settings = getAppSettings();
      document.documentElement.setAttribute('data-theme-font', settings.fontTheme || 'mix');
      document.documentElement.setAttribute('data-theme-layout', settings.layoutStrategy || 'grid');
      document.documentElement.setAttribute('data-theme', settings.colorTheme || 'dark');
    };
    
    // --- TEK SEFERLİK CACHE TEMİZLİĞİ (Kullanıcı İsteği) ---
    const hasWiped = sessionStorage.getItem('gundemim_cache_wiped');
    if (!hasWiped) {
      clearNewsCache();
      sessionStorage.setItem('gundemim_cache_wiped', 'true');
      console.warn("Önbellek (Cache) temizlendi - Yeni kurallarla başlanıyor.");
    }

    applySettings(); // İlk yüklemede çalıştır
    window.addEventListener('rss_settings_updated', applySettings); // İçeriden tetiklendiğinde güncellesin
    
    // Global Yardım Çekmecesi Dinleyicisi
    const handleToggleHowToUse = () => setIsHowToUseOpen(prev => !prev);
    window.addEventListener('toggle_how_to_use', handleToggleHowToUse);

    return () => {
      window.removeEventListener('rss_settings_updated', applySettings);
      window.removeEventListener('toggle_how_to_use', handleToggleHowToUse);
    };
  }, []);

  return (
    <TranslationProvider>
      <RadioProvider>
        <Router>
          <AppContent 
            isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
            isHowToUseOpen={isHowToUseOpen} setIsHowToUseOpen={setIsHowToUseOpen}
            isSetupOpen={isSetupOpen} setIsSetupOpen={setIsSetupOpen}
            pcNotification={pcNotification}
          />
        </Router>
      </RadioProvider>
    </TranslationProvider>
  );
}

// Alt bileşende Router context'ine (useLocation) erişebilmek için AppContent oluşturuldu
function AppContent({ isSidebarOpen, setIsSidebarOpen, isHowToUseOpen, setIsHowToUseOpen, isSetupOpen, setIsSetupOpen, pcNotification }) {
  const location = useLocation();
  const navigate = useNavigate();

  // --- SCROLL RESET (Tepeden Başlatma) ---
  useEffect(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }, [location.pathname]);

  // --- ONBOARDING (İlk Karşılama) ---
  // Rehber mantığı App.jsx'teki FirstLaunchSetup tamamlanınca veya es geçilince tetikleniyor.

  // --- PC BAŞLANGIÇ YÖNLENDİRMESİ (Redirect to Discover) ---
  useEffect(() => {
    const isElectron = window.navigator.userAgent.toLowerCase().includes('electron');
    if (isElectron && location.pathname === '/') {
      navigate('/discover', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div className={`app-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      
      {/* Premium PC Bildirim Paneli */}
      {pcNotification && (
        <div className="pc-notification-container">
          <div className={`pc-notification ${pcNotification.type || ''}`}>
            <div className="pc-notification-icon">
              <AlertTriangle size={20} />
            </div>
            <div className="pc-notification-content">
              <div className="pc-notification-title">{pcNotification.title}</div>
              <div className="pc-notification-message">
                {pcNotification.message}
                <div style={{ marginTop: '4px', fontSize: '10px', opacity: 0.8 }}>{pcNotification.detail}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSetupOpen && (
        <FirstLaunchSetup onComplete={() => {
          setIsSetupOpen(false);
          localStorage.setItem('gundemim_mlkit_setup_done', 'true');
          
          // Kurulum bittikten sonra rehberi göster
          const hasSeenOnboarding = localStorage.getItem('gundemim_first_start');
          if (!hasSeenOnboarding) {
            setIsHowToUseOpen(true);
            localStorage.setItem('gundemim_first_start', 'done');
          }
        }} />
      )}

      <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <TranslationProgressBar />
      <div className="app-body">
        <Sidebar isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />
        
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div className="mobile-overlay" onClick={() => setIsSidebarOpen(false)}></div>
        )}

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/news" element={<NewsFeed />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/legal" element={<Legal />} />
          </Routes>
        </main>
      </div>
      <HowToUseDrawer isOpen={isHowToUseOpen} onClose={() => setIsHowToUseOpen(false)} />
    </div>
  );
}

export default App;
