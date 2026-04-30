// src/components/Navbar.jsx
// Üst bar. Uygulama adı ve çeviri butonu.
import { useTranslation } from '../context/TranslationContext';
import { Newspaper, Languages, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ensureMLKitModelReady } from '../services/mlKitService';

export default function Navbar({ toggleSidebar }) {
  const { isTranslationEnabled, toggleTranslation, hasSeenDownloadWarning, markWarningAsSeen } = useTranslation();

  const handleToggle = () => {
    const isMobile = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
    
    // Eğer çeviri açılıyorsa ve henüz uyarı görülmemişse (sadece mobilde)
    if (!isTranslationEnabled && !hasSeenDownloadWarning && isMobile) {
      const confirmed = window.confirm(
        "Çeviri özelliğini açıyorsunuz.\n\n" +
        "Hızlı ve çevrimdışı çeviri yapabilmek için " +
        "yaklaşık 30MB boyutunda dil paketinin (sadece bir defa) indirilmesi gerekiyor.\n\n" +
        "İndirilsin mi?"
      );
      
      if (confirmed) {
        markWarningAsSeen();
        ensureMLKitModelReady(); // İndirmeyi başlat (Progress bar görecek)
        toggleTranslation(); // Çeviriyi açık duruma getir
      } else {
        // İptal ederse hiçbir şey yapma, çeviri kapalı kalsın
      }
    } else if (!isTranslationEnabled && hasSeenDownloadWarning && isMobile) {
      // Daha önce uyarılmış ama kapatıp açıyor. 
      // Belki de yarım kalmış bir indirme var, emin olmak için tetikliyoruz.
      ensureMLKitModelReady();
      toggleTranslation();
    } else {
      toggleTranslation();
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="mobile-menu-toggle" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <Link to="/" className="navbar-logo" style={{ gap: '0.5rem' }}>
            <div className="logo-icon">
              <img src="icon.png?v=1.0" alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            </div>
            <h1>Gündemim</h1>
          </Link>
        </div>
        
        <div className="navbar-actions">

          <button 
            className={`toggle-button ${isTranslationEnabled ? 'active' : ''}`}
            onClick={handleToggle}
            aria-pressed={isTranslationEnabled}
          >
            <Languages size={18} />
            <span>Çeviri: {isTranslationEnabled ? 'AÇIK' : 'KAPALI'}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
