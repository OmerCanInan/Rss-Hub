import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Folder, Compass, Settings, Headphones, X, Send, Globe, Key, Square, Volume2, HelpCircle } from 'lucide-react';
import { getRssLinks } from '../services/dbService';
import { useRadio } from '../context/RadioContext';
import { useState, useEffect } from 'react';

export default function Sidebar({ isOpen, closeSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isPlaying, stopRadio, currentItem, currentIndex } = useRadio();
  const [folders, setFolders] = useState([]);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportState, setSupportState] = useState('idle'); // idle, sending, success
  const [supportForm, setSupportForm] = useState({ email: '', subject: '', message: '' });

  // Mobil navigasyon sonrası kapatma
  const handleNav = (path, search = '') => {
    navigate(path + search);
    if (window.innerWidth <= 768) closeSidebar();
  };

  useEffect(() => {
    const updateFolders = () => {
      const links = getRssLinks();
      const uniqueFolders = [...new Set(links.map(l => l.folder || 'Genel'))].sort();
      setFolders(uniqueFolders);
    };
    updateFolders();
    window.addEventListener('rss_db_updated', updateFolders);
    return () => window.removeEventListener('rss_db_updated', updateFolders);
  }, [location.pathname, location.search]);

  const isActive = (path, search = '') => location.pathname === path && location.search === search;
  const isFolderActive = (folderName) => location.pathname === '/news' && location.search === `?folder=${encodeURIComponent(folderName)}`;

  const handleSupportSubmit = async (e) => {
    // ... same as before
  };

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-section">
          <div className="sidebar-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Gündemim
            <button className="mobile-only close-btn" onClick={closeSidebar} style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
          <button className={`sidebar-link ${isActive('/news', '?all=true') ? 'active' : ''}`} onClick={() => handleNav('/news', '?all=true')}>
            <Search size={18} /> Tüm Haberler
          </button>
          <button className={`sidebar-link ${isActive('/news', '?filter=yesterday') ? 'active' : ''}`} onClick={() => handleNav('/news', '?filter=yesterday')}>
            <Compass size={18} /> Dünün Özeti
          </button>
          <button className={`sidebar-link ${isActive('/discover') ? 'active' : ''}`} onClick={() => handleNav('/discover')}>
            <Globe size={18} /> Keşfet
          </button>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">Aboneliklerim</div>
          {folders.length === 0 ? (
            <div style={{ padding: '0.5rem', color: 'var(--text-light)', fontSize: '0.85rem' }}>Henüz kaynak yok.</div>
          ) : (
            folders.map((folder, idx) => (
              <button key={idx} className={`sidebar-link ${isFolderActive(folder) ? 'active' : ''}`} onClick={() => handleNav('/news', `?folder=${encodeURIComponent(folder)}`)}>
                <Folder size={18} /> {folder}
              </button>
            ))
          )}
        </div>
        
        {isPlaying && (
          <div className="sidebar-section radio-player-fade" style={{ 
            marginTop: '1rem', 
            background: 'rgba(239, 68, 68, 0.05)', 
            borderRadius: '12px', 
            padding: '1rem',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            boxShadow: '0 0 15px rgba(239, 68, 68, 0.1)'
          }}>
            <div className="sidebar-title" style={{ 
              color: '#ff8a8a', 
              fontSize: '0.75rem', 
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Volume2 size={14} className="pulse-slow" /> ŞU AN ÇALIYOR
            </div>
            <div style={{ 
              fontSize: '0.85rem', 
              color: 'var(--text-color)', 
              fontWeight: '600',
              marginBottom: '0.8rem',
              lineHeight: '1.4',
              display: '-webkit-box',
              WebkitLineClamp: '2',
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {currentItem?.title || 'Okunuyor...'}
            </div>
            <button 
              onClick={stopRadio}
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: '8px',
                background: '#e11d48',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '0.85rem'
              }}
            >
              <Square size={14} fill="currentColor" /> RADYOYU DURDUR
            </button>
          </div>
        )}

        <div className="sidebar-section" style={{ marginTop: 'auto' }}>
          <div className="sidebar-title">Yönetim & Destek</div>
          <button className={`sidebar-link ${isActive('/') ? 'active' : ''}`} onClick={() => handleNav('/')}>
            <Settings size={18} /> Ayarlar & Kaynak Ekle
          </button>
          <button className="sidebar-link" onClick={() => handleNav('/', '?tab=apikey')}>
            <Key size={18} /> AI Anahtarı
          </button>
          <button className="sidebar-link" onClick={() => { window.dispatchEvent(new CustomEvent('toggle_how_to_use')); if(window.innerWidth <= 768) closeSidebar(); }}>
            <HelpCircle size={18} /> Nasıl Kullanılır?
          </button>
          <button className="sidebar-link" onClick={() => { setIsSupportOpen(true); if(window.innerWidth <= 768) closeSidebar(); }}>
            <Headphones size={18} /> Müşteri Hizmetleri
          </button>
        </div>
      </aside>



      {/* DESTEK FORMU SAĞ ÇEKMECE (DRAWER) */}
      {isSupportOpen && (
        <div 
          onClick={(e) => { 
            // Sadece form dışındaki koyu alana tıklanırsa kapat
            if(e.target === e.currentTarget) setIsSupportOpen(false) 
          }}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
            zIndex: 9999, display: 'flex', justifyContent: 'flex-end'
          }}
        >
          <div className="fade-in" style={{
            background: 'var(--bg-secondary)', width: '400px', height: '100vh',
            padding: '2rem', borderLeft: '1px solid var(--border-color)', 
            boxShadow: '-10px 0 40px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column',
            animation: 'slideInRight 0.3s ease-out forwards'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Headphones size={22} color="var(--primary-color)" /> Destek Talebi
              </h2>
              <button 
                onClick={() => setIsSupportOpen(false)} 
                style={{ 
                  background: 'transparent', color: 'var(--text-light)', border: 'none', 
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '8px', borderRadius: '50%'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <X size={22} />
              </button>
            </div>
            
            {supportState === 'success' ? (
              <div className="fade-in" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--primary-color)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <Send size={56} style={{ marginBottom: '1.5rem', animation: 'bounce 2s infinite' }} />
                <h3 style={{ fontSize: '1.4rem', color: 'var(--text-color)' }}>Talebiniz İletildi!</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', marginTop: '1rem', lineHeight: '1.5' }}>
                  Destek ekibimiz en kısa sürede <strong>{supportForm.email}</strong> adresi üzerinden size dönüş yapacaktır.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-light)' }}>Sizin E-postanız</label>
                  <input required
                    type="email" 
                    placeholder="ornek@mail.com"
                    value={supportForm.email}
                    onChange={(e) => setSupportForm({...supportForm, email: e.target.value})}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '8px',
                      background: 'var(--bg-color)', border: '1px solid var(--border-color)',
                      color: 'var(--text-color)', fontSize: '0.95rem', outline: 'none', transition: 'border 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-light)' }}>Konu Başlığı</label>
                  <input required
                    type="text" 
                    placeholder="Nasıl yardımcı olabiliriz?"
                    value={supportForm.subject}
                    onChange={(e) => setSupportForm({...supportForm, subject: e.target.value})}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '8px',
                      background: 'var(--bg-color)', border: '1px solid var(--border-color)',
                      color: 'var(--text-color)', fontSize: '0.95rem', outline: 'none', transition: 'border 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-light)' }}>Mesajınız</label>
                  <textarea required
                    rows={6} 
                    placeholder="Sorununuzu veya önerinizi detaylıca yazın..."
                    value={supportForm.message}
                    onChange={(e) => setSupportForm({...supportForm, message: e.target.value})}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '8px',
                      background: 'var(--bg-color)', border: '1px solid var(--border-color)',
                      color: 'var(--text-color)', fontSize: '0.95rem', outline: 'none', transition: 'border 0.2s',
                      resize: 'none', fontFamily: 'inherit'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  ></textarea>
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
                  <button 
                    type="submit" 
                    disabled={supportState === 'sending'} 
                    style={{ 
                      width: '100%', padding: '14px', borderRadius: '8px',
                      background: supportState === 'sending' ? 'var(--border-color)' : 'var(--primary-color)',
                      color: 'var(--bg-color)', border: 'none', fontSize: '1rem', fontWeight: '600',
                      cursor: supportState === 'sending' ? 'not-allowed' : 'pointer',
                      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                      transition: 'background 0.2s', boxShadow: '0 4px 12px rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    {supportState === 'sending' ? 'Gönderiliyor...' : <><Send size={18} /> İletiyi Gönder</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
