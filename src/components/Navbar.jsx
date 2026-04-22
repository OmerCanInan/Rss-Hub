// src/components/Navbar.jsx
// Üst bar. Uygulama adı ve çeviri butonu.
import { useTranslation } from '../context/TranslationContext';
import { Newspaper, Languages, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar({ toggleSidebar }) {
  const { isTranslationEnabled, toggleTranslation, hasSeenDownloadWarning, markWarningAsSeen } = useTranslation();

  const handleToggle = () => {
    const isMobile = window.Capacitor && window.Capacitor.isNativePlatform();
    
    // Eğer çeviri açılıyorsa ve henüz uyarı görülmemişse (sadece mobilde)
    if (!isTranslationEnabled && !hasSeenDownloadWarning && isMobile) {
      const confirmed = window.confirm(
        "Çeviri özelliğini ilk kez açıyorsunuz. \n\n" +
        "Mobil cihazlarda daha hızlı ve çevrimdışı çeviri yapabilmek için " +
        "yaklaşık 30MB boyutunda küçük bir dil paketi bir defaya mahsus indirilecektir. \n\n" +
        "Devam etmek istiyor musunuz?"
      );
      
      if (confirmed) {
        markWarningAsSeen();
        toggleTranslation();
      }
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
              <img src="/icon.png?v=1.0" alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
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
