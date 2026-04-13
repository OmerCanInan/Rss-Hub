// src/pages/Home.jsx
// Kullanıcının RSS bağlantısı eklediği, yönettiği ve tarama işlemlerini başlattığı Ana Ekran.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRssLinks, addRssLink, deleteRssLink } from '../services/dbService';
import { Search, Globe, Trash2, PlusCircle } from 'lucide-react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [links, setLinks] = useState(() => getRssLinks());
  const navigate = useNavigate();

  const handleSearchSingle = (e) => {
    e.preventDefault();
    if (!url.trim()) return alert('Lütfen geçerli bir RSS linki giriniz.');
    
    // Girilen linki otomatik olarak veritabanına ekle
    addRssLink(url.trim());
    
    // İlgili linkin haberlerini görmek için Yönlendir
    navigate(`/news?url=${encodeURIComponent(url.trim())}`);
  };

  const handleSearchAll = () => {
    if (links.length === 0) {
      return alert('Sistemde kayıtlı link bulunmuyor. Lütfen önce link ekleyin.');
    }
    // Tüm linkleri aramak için Yönlendir
    navigate('/news?all=true');
  };

  const handleDelete = (id) => {
    if (window.confirm('Bu RSS kaynağını silmek istediğinize emin misiniz?')) {
      deleteRssLink(id);
      setLinks(getRssLinks()); // Listeyi güncelle
    }
  };

  const handleAddNewLink = () => {
    if (!url.trim()) return alert('Lütfen eklenecek bir RSS linki giriniz.');
    addRssLink(url.trim());
    setLinks(getRssLinks());
    setUrl(''); // Input'u temizle
  };

  return (
    <div className="home-container">
      <header className="hero-section text-center">
        <h2 className="hero-title">Gündemi Tek Bir Yerden Takip Edin</h2>
        <p className="hero-subtitle">İstediğiniz RSS kaynaklarını ekleyin, haberleri ister orijinal dilinde ister anında Türkçe çevirisiyle okuyun.</p>
      </header>

      <section className="action-section card glassmorphism fade-in">
        <form onSubmit={handleSearchSingle} className="search-form">
          <div className="input-group">
            <Globe className="input-icon" size={20} />
            <input 
              type="url" 
              placeholder="https://example.com/rss"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="text-input"
            />
            <button type="button" onClick={handleAddNewLink} className="icon-btn tooltip" aria-label="Sadece Kaydet">
              <PlusCircle size={24} />
            </button>
          </div>

          <div className="button-group mt-4">
            <button type="submit" className="btn btn-primary" aria-label="Sadece Bu Linki Ara">
              <Search size={18} /> Sadece Bu Linki Ara
            </button>
            <button type="button" onClick={handleSearchAll} className="btn btn-secondary" aria-label="Tüm Linkleri Ara">
              <RssGlobeIcon /> Tüm Linkleri Ara
            </button>
          </div>
        </form>
      </section>

      <section className="saved-links-section fade-in">
        <h3 className="section-title">Kayıtlı RSS Kaynakları</h3>
        {links.length === 0 ? (
          <p className="empty-state">Henüz hiç RSS linki eklemediniz.</p>
        ) : (
          <ul className="link-list">
            {links.map((link) => (
              <li key={link.id} className="link-item card">
                <span className="link-text" title={link.url}>{link.url}</span>
                <button onClick={() => handleDelete(link.id)} className="btn-danger-icon" title="Sil">
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// Özel ikon birleşimi
function RssGlobeIcon() {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginRight: '8px' }}>
      <Globe size={18} />
    </div>
  );
}
