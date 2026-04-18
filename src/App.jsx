import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { TranslationProvider } from './context/TranslationContext';
import { RadioProvider } from './context/RadioContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import NewsFeed from './pages/NewsFeed';
import Discover from './pages/Discover';
import HowToUseDrawer from './components/HowToUseDrawer';

import { useEffect, useState } from 'react';
import { getAppSettings } from './services/dbService';
import { AlertTriangle } from 'lucide-react';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);
  const [pcNotification, setPcNotification] = useState(null);

  // PC (Electron) Bildirim Dinleyicisi
  useEffect(() => {
    // Sadece Electron ortamındaysak çalıştır
    const isElectron = window.navigator.userAgent.toLowerCase().includes('electron');
    if (!isElectron) return;

    try {
      // Electron'un ipcRenderer'ına güvenli erişim
      const electron = window.require('electron');
      const { ipcRenderer } = electron;

      const handleNotification = (event, data) => {
        setPcNotification(data);
        // 5 saniye sonra otomatik kapat
        setTimeout(() => setPcNotification(null), 5000);
      };

      ipcRenderer.on('show-pc-notification', handleNotification);
      return () => ipcRenderer.removeListener('show-pc-notification', handleNotification);
    } catch (err) {
      console.warn("Electron IPC bağlatısı kurulamadı (Kritik değil):", err);
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

            <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
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
                </Routes>
              </main>
            </div>
            <HowToUseDrawer isOpen={isHowToUseOpen} onClose={() => setIsHowToUseOpen(false)} />
          </div>
        </Router>
      </RadioProvider>
    </TranslationProvider>
  );
}

export default App;
