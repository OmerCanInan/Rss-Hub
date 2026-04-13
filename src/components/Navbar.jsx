// src/components/Navbar.jsx
// Üst bar. Kullanıcının "Otomatik Türkçe'ye Çevir" tercihini değiştiren Toggle butonu burada bulunuyor.
import { useTranslation } from '../context/TranslationContext';
import { Rss, Languages } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { isTranslationEnabled, toggleTranslation } = useTranslation();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <Rss size={24} color="#FFF" />
          </div>
          <h1>Rss Hub</h1>
        </Link>
        
        <div className="navbar-actions">
          <button 
            className={`toggle-button ${isTranslationEnabled ? 'active' : ''}`}
            onClick={toggleTranslation}
            aria-pressed={isTranslationEnabled}
          >
            <Languages size={18} />
            <span>Otomatik Çeviri: {isTranslationEnabled ? 'AÇIK' : 'KAPALI'}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
