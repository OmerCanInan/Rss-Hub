import { PlusCircle, CheckCircle, Globe, AlertCircle, Package, Download, Folder, Search, Eye, X } from 'lucide-react';
import { getRssLinks, addRssLink } from '../services/dbService';
import { useState, useEffect } from 'react';

// Sabit keşfet listemiz - Buraya istenildiği kadar site eklenebilir.
// Sabit keşfet listemiz - Buraya istenildiği kadar site eklenebilir.
const DISCOVER_FEEDS = [
  { folder: "Haber & Gündem", feeds: [
    { name: "TRT Haber", url: "https://www.trthaber.com/sondakika_articles.rss" },
    { name: "NTV Son Dakika", url: "https://www.ntv.com.tr/son-dakika.rss" },
    { name: "Sözcü", url: "https://www.sozcu.com.tr/feeds-rss-category-gundem" },
    { name: "Gazete Duvar", url: "https://www.gazeteduvar.com.tr/rss" },
    { name: "Diken", url: "https://www.diken.com.tr/feed/" },
    { name: "Habertürk", url: "https://www.haberturk.com/rss" },
    { name: "Hürriyet", url: "https://www.hurriyet.com.tr/rss/anasayfa" },
    { name: "BBC Türkçe", url: "https://feeds.bbci.co.uk/turkce/rss.xml" },
    { name: "Medyascope", url: "https://medyascope.tv/feed/" },
    { name: "Euronews TR", url: "https://tr.euronews.com/rss?level=vertical&name=turkey" },
    { name: "Milliyet", url: "https://www.milliyet.com.tr/rss/rssNew/gundemRss.xml" },
    { name: "Karar Gazetesi", url: "https://www.karar.com/rss.xml" },
    { name: "Anadolu Ajansı", url: "https://www.aa.com.tr/tr/rss/default?cat=guncel" }
  ]},
  { folder: "Oyun Sektörü", feeds: [
    { name: "Turuncu Levye", url: "https://www.turunculevye.com/feed/" },
    { name: "Technopat Oyun", url: "https://www.technopat.net/sosyal/bolum/oyun-haberleri.11/index.rss" },
    { name: "IGN Türkiye", url: "https://tr.ign.com/feed.xml" },
    { name: "FRPNET", url: "https://frpnet.net/feed/" },
    { name: "Kayıp Rıhtım", url: "https://kayiprihtim.com/feed/" },
    { name: "Multiplayer", url: "https://multiplayer.com.tr/feed/" },
    { name: "Eurogamer", url: "https://www.eurogamer.net/rss" },
    { name: "PC Gamer", url: "https://www.pcgamer.com/rss/" },
    { name: "Polygon", url: "https://www.polygon.com/rss/index.xml" }
  ]},
  { folder: "Teknoloji", feeds: [
    { name: "DonanımHaber", url: "https://www.donanimhaber.com/rss/tum" },
    { name: "Webtekno", url: "https://www.webtekno.com/rss.xml" },
    { name: "ShiftDelete", url: "https://shiftdelete.net/feed" },
    { name: "LOG Dergisi", url: "https://www.log.com.tr/feed/" },
    { name: "Hwp (Hardware Plus)", url: "https://hwp.com.tr/feed" },
    { name: "TechInside", url: "https://www.techinside.com/feed/" },
    { name: "Megabayt", url: "https://megabayt.com/feed/" },
    { name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
    { name: "TechCrunch", url: "https://techcrunch.com/feed/" },
    { name: "Wired", url: "https://www.wired.com/feed/rss" }
  ]},
  { folder: "Ekonomi & Finans", feeds: [
    { name: "Bloomberg HT", url: "https://www.bloomberght.com/rss" },
    { name: "Ekonomim", url: "https://www.ekonomim.com/rss" },
    { name: "Borsagündem", url: "https://www.borsagundem.com.tr/rss" },
    { name: "Dünya Gazetesi", url: "https://www.dunya.com/rss" },
    { name: "Bigpara", url: "https://bigpara.hurriyet.com.tr/rss/" },
    { name: "Investing.com TR", url: "https://tr.investing.com/rss/news.rss" },
    { name: "Financial Times", url: "https://www.ft.com/?format=rss" }
  ]},
  { folder: "Kripto Para", feeds: [
    { name: "Koin Bülteni", url: "https://koinbulteni.com/feed" },
    { name: "BTCHaber", url: "https://www.btchaber.com/feed/" },
    { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
    { name: "Cointelegraph", url: "https://cointelegraph.com/rss" }
  ]},
  { folder: "Spor", feeds: [
    { name: "Ajansspor", url: "https://ajansspor.com/rss" },
    { name: "Mackolik", url: "https://www.mackolik.com/rss" }
  ]}
];

// HAZIR PAKETLER - Tek tıkla tüm kaynakları yükler
const READY_PACKAGES = [
  {
    name: "Oyun Sektörü Dev Paket",
    emoji: "🎮",
    description: "Turuncu Levye, IGN, FRPNET ve buralardaki en iyi oyun kanalları",
    color: "#8b5cf6",
    folder: "Oyun Sektörü",
    feeds: [
      { name: "Turuncu Levye", url: "https://www.turunculevye.com/feed/" },
      { name: "IGN Türkiye", url: "https://tr.ign.com/feed.xml" },
      { name: "FRPNET", url: "https://frpnet.net/feed/" },
      { name: "Kayıp Rıhtım", url: "https://kayiprihtim.com/feed/" },
      { name: "Multiplayer", url: "https://multiplayer.com.tr/feed/" },
      { name: "Eurogamer", url: "https://www.eurogamer.net/rss" },
      { name: "Technopat Oyun", url: "https://www.technopat.net/sosyal/bolum/oyun-haberleri.11/index.rss" }
    ]
  },
  {
    name: "Türkiye Medya Devi",
    emoji: "🗞️",
    description: "TRT, NTV, Sözcü, Cumhuriyet ve daha fazlası (7 Kaynak)",
    color: "#e11d48",
    folder: "Haber & Gündem",
    feeds: [
      { name: "TRT Haber", url: "https://www.trthaber.com/sondakika_articles.rss" },
      { name: "NTV Son Dakika", url: "https://www.ntv.com.tr/son-dakika.rss" },
      { name: "Sözcü", url: "https://www.sozcu.com.tr/feeds-rss-category-gundem" },
      { name: "Gazete Duvar", url: "https://www.gazeteduvar.com.tr/rss" },
      { name: "Habertürk", url: "https://www.haberturk.com/rss" }
    ]
  },
  {
    name: "Teknoloji Maksimum",
    emoji: "⚡",
    description: "DonanımHaber'den The Verge'e kadar her şey",
    color: "#2563eb",
    folder: "Teknoloji",
    feeds: [
      { name: "DonanımHaber", url: "https://www.donanimhaber.com/rss/tum" },
      { name: "Webtekno", url: "https://www.webtekno.com/rss.xml" },
      { name: "ShiftDelete", url: "https://shiftdelete.net/feed" },
      { name: "LOG Dergisi", url: "https://www.log.com.tr/feed/" },
      { name: "Hardware Plus", url: "https://hwp.com.tr/feed" },
      { name: "Technopat", url: "https://www.technopat.net/feed/" },
      { name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
      { name: "TechCrunch", url: "https://techcrunch.com/feed/" }
    ]
  },
  {
    name: "Finans & Borsa Pro",
    emoji: "🏙️",
    description: "Bloomberg, Ekonomim ve Borsagündem",
    color: "#059669",
    folder: "Ekonomi",
    feeds: [
      { name: "Bloomberg HT", url: "https://www.bloomberght.com/rss" },
      { name: "Ekonomim", url: "https://www.ekonomim.com/rss" },
      { name: "Borsagündem", url: "https://www.borsagundem.com.tr/rss" },
      { name: "Dünya Gazetesi", url: "https://www.dunya.com/rss" },
      { name: "Bigpara", url: "https://bigpara.hurriyet.com.tr/rss/" },
      { name: "Investing TR", url: "https://tr.investing.com/rss/news.rss" },
      { name: "Financial Times", url: "https://www.ft.com/?format=rss" }
    ]
  },
  {
    name: "Kripto & Web3 Dünyası",
    emoji: "₿",
    description: "Altcoin ve Blockchain haberleri",
    color: "#f59e0b",
    folder: "Kripto Para",
    feeds: [
      { name: "Koin Bülteni", url: "https://koinbulteni.com/feed" },
      { name: "BTCHaber", url: "https://www.btchaber.com/feed/" },
      { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
      { name: "Cointelegraph", url: "https://cointelegraph.com/rss" }
    ]
  },
  {
    name: "Bilim & Uzay Meraklısı",
    emoji: "🚀",
    description: "NASA, Bilim ve Evren haberleri",
    color: "#6d28d9",
    folder: "Bilim & Uzay",
    feeds: [
      { name: "NASA", url: "https://www.nasa.gov/feed/" },
      { name: "Science Daily", url: "https://www.sciencedaily.com/rss/all.xml" },
      { name: "Space.com", url: "https://www.space.com/feeds/all" }
    ]
  },
  {
    name: "Dünya Basını (Global)",
    emoji: "🌎",
    description: "Global haber ajansları (İngilizce)",
    color: "#374151",
    folder: "Dünya Basını",
    feeds: [
      { name: "NY Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml" },
      { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
      { name: "The Guardian", url: "https://www.theguardian.com/world/rss" },
      { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
      { name: "Wired", url: "https://www.wired.com/feed/rss" }
    ]
  }
];

export default function Discover() {
  const [activeLinks, setActiveLinks] = useState([]);
  const [selectedFeed, setSelectedFeed] = useState(null); // Modal açık/kapalı/veri
  const [viewingPackage, setViewingPackage] = useState(null); // Paket detayı modalı
  const [folderInput, setFolderInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  
  useEffect(() => {
    setActiveLinks(getRssLinks().map(link => link.url));
  }, []);

  // Mevcut klasörleri getir (Alfabetik sıralı ve eşsiz)
  const getExistingFolders = () => {
    const links = getRssLinks();
    const folders = links.map(link => link.folder || 'Genel');
    return Array.from(new Set(folders)).sort();
  };

  const openFolderModal = (feed, categoryFolder) => {
    setSelectedFeed(feed);
    setFolderInput(categoryFolder);
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleQuickAdd = (folderName) => {
    if (!selectedFeed) return;
    const success = addRssLink(selectedFeed.url, folderName);
    if (success) {
      if (!activeLinks.includes(selectedFeed.url)) {
        setActiveLinks([...activeLinks, selectedFeed.url]);
      }
      window.dispatchEvent(new Event('rss_db_updated'));
      showToast(`Haber kaynağı "${folderName}" klasörüne eklendi!`, 'success');
    } else {
      showToast(`Bu kaynak zaten "${folderName}" klasöründe mevcut.`, 'error');
    }
    setSelectedFeed(null);
  };

  const confirmAdd = (e) => {
    e.preventDefault();
    if (!selectedFeed) return;
    
    // Klasör ismi en az 1 karakterli olsun, yoksa varsayılan 'Genel' atanır
    const safeFolder = folderInput.trim() || 'Genel';
    const success = addRssLink(selectedFeed.url, safeFolder);
    
    if (success) {
      if (!activeLinks.includes(selectedFeed.url)) {
        setActiveLinks([...activeLinks, selectedFeed.url]);
      }
      window.dispatchEvent(new Event('rss_db_updated'));
      showToast(`Haber kaynağı "${safeFolder}" klasörüne eklendi!`, 'success');
    } else {
      showToast(`Bu kaynak zaten "${safeFolder}" klasöründe mevcut.`, 'error');
    }
    setSelectedFeed(null);
  };

  const handleInstallPackage = (pkg) => {
    let addedCount = 0;
    pkg.feeds.forEach(feed => {
      const result = addRssLink(feed.url, pkg.folder);
      if (result) addedCount++;
    });
    
    setActiveLinks(getRssLinks().map(link => link.url));
    window.dispatchEvent(new Event('rss_db_updated'));
    
    if (addedCount > 0) {
      showToast(`"${pkg.name}" paketi yüklendi! (${addedCount} yeni kaynak eklendi)`, 'success');
    } else {
      showToast(`"${pkg.name}" paketindeki tüm kaynaklar zaten ekli.`, 'error');
    }
  };

  const getPackageStatus = (pkg) => {
    const addedFeeds = pkg.feeds.filter(feed => activeLinks.includes(feed.url));
    if (addedFeeds.length === pkg.feeds.length) return 'installed';
    if (addedFeeds.length > 0) return 'partial';
    return 'available';
  };

  const getDomainFromUrl = (url) => {
    try {
      return new URL(url).hostname;
    } catch {
      return 'google.com';
    }
  };

  return (
    <>
      <div className="fade-in" style={{ paddingBottom: '4rem' }}>
      <div className="feed-header" style={{ marginBottom: '2rem' }}>
        <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Globe size={28} color="var(--primary-color)" /> Keşfet
        </h2>
        <p style={{ color: 'var(--text-light)', marginTop: '0.5rem' }}>
          Hazır paketlerle anında başlayın veya kaynakları tek tek seçin.
        </p>
      </div>

      {/* ARAMA ÇUBUĞU */}
      <div style={{ marginBottom: '2rem', position: 'relative' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)',
          padding: '0.8rem 1.2rem', borderRadius: '12px', border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-card)', transition: 'all 0.2s'
        }}>
          <Search size={22} color="var(--text-light)" />
          <input 
            type="text"
            placeholder="Kanal adı veya URL ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-color)', fontSize: '1.05rem'
            }}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}
            >
              Temizle
            </button>
          )}
        </div>
      </div>

      {/* HAZIR PAKETLER */}
      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.2rem', color: 'var(--text-color)', marginBottom: '1.2rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={20} /> Hazır Paketler
        </h3>
        <div className="pkg-grid">
          {READY_PACKAGES.map((pkg, idx) => {
            const status = getPackageStatus(pkg);
            return (
              <div key={idx} style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                borderRadius: '12px', padding: '1rem', display: 'flex', 
                alignItems: 'center', transition: 'all 0.15s ease-in-out',
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = pkg.color; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
              >
                {/* Accent Line */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: pkg.color }}></div>
                
                <div style={{ 
                  fontSize: '1.4rem', background: 'var(--bg-color)', 
                  width: '48px', height: '48px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginRight: '1rem', border: '1px solid var(--border-color)'
                }}>
                   {pkg.emoji}
                </div>
                
                <div style={{ flex: 1 }}>
                   <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-color)', fontWeight: '700' }}>
                     {pkg.name}
                   </h4>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '500' }}>
                        {pkg.feeds.length} Kaynak
                      </span>
                      <button 
                         onClick={() => setViewingPackage(pkg)}
                         style={{ 
                            background: 'transparent', border: 'none', color: 'var(--text-light)', 
                            fontSize: '0.75rem', padding: 0, cursor: 'pointer', display: 'flex', 
                            alignItems: 'center', gap: '4px', opacity: 0.7
                         }}
                         onMouseEnter={(e) => e.target.style.opacity = 1}
                         onMouseLeave={(e) => e.target.style.opacity = 0.7}
                      >
                         • İçeriği Gör
                      </button>
                   </div>
                </div>

                <div style={{ paddingLeft: '1rem' }}>
                  <button
                    onClick={() => handleInstallPackage(pkg)}
                    disabled={status === 'installed'}
                    style={{
                      padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none',
                      cursor: status === 'installed' ? 'default' : 'pointer', fontWeight: '700', fontSize: '0.85rem',
                      background: status === 'installed' ? 'transparent' : pkg.color,
                      color: status === 'installed' ? 'var(--success-color)' : '#fff',
                      transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    {status === 'installed' ? <CheckCircle size={16} /> : 'Yükle'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        {DISCOVER_FEEDS.map((category) => ({
          ...category,
          feeds: category.feeds.filter(f => 
            f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            f.url.toLowerCase().includes(searchTerm.toLowerCase())
          )
        })).filter(cat => cat.feeds.length > 0).map((category, catIdx) => (
          <div key={catIdx}>
            <h3 style={{ 
              fontSize: '1.2rem', color: 'var(--text-color)', marginBottom: '1.2rem', 
              paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' 
            }}>
              {category.folder}
            </h3>
            
            <div style={{ 
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' 
            }}>
              {category.feeds.map((feed, idx) => {
                const isAdded = activeLinks.includes(feed.url);
                const domain = getDomainFromUrl(feed.url);

                return (
                  <div key={idx} style={{
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                    padding: '1.2rem', borderRadius: '12px', display: 'flex', gap: '1rem',
                    alignItems: 'center', transition: 'all 0.2s',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}>
                    {/* Logo Alanı */}
                    <img 
                      src={`https://logo.clearbit.com/${domain}`}
                      alt={feed.name}
                      style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'contain', background: 'var(--bg-color)', padding: '5px' }}
                      onError={(e) => {
                        if (e.target.src.includes('clearbit')) {
                          e.target.src = `https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=64`;
                        } else {
                          e.target.style.display = 'none';
                        }
                      }}
                    />
                    
                    {/* Bilgi Alanı */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-color)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {feed.name}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '4px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {domain}
                      </p>
                    </div>

                    {/* Ekle / Sil Butonu */}
                    <button
                      onClick={() => openFolderModal(feed, category.folder)}
                      style={{
                        background: 'var(--primary-color)',
                        color: 'var(--bg-color)',
                        border: 'none',
                        padding: '8px', borderRadius: '50%', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                      }}
                      title="Kütüphaneye Ekle"
                    >
                      <PlusCircle size={20} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      </div>

      {/* KLASÖR SEÇİM MODALI */}
      {selectedFeed && (
        <div 
          onClick={(e) => { if(e.target === e.currentTarget) setSelectedFeed(null) }}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
            zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'
          }}
        >
          <div className="fade-in" style={{
            background: 'var(--bg-secondary)', width: '380px', borderRadius: '12px',
            padding: '2rem', border: '1px solid var(--border-color)', 
            boxShadow: '0 10px 40px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-color)', fontSize: '1.2rem' }}>Klasör Belirle</h3>
             <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-light)', fontSize: '0.85rem' }}>
               <strong>{selectedFeed.name}</strong> kaynağını hangi klasöre kaydetmek istiyorsunuz?
             </p>

            {/* MEVCUT KLASÖRLER LİSTESİ */}
            {getExistingFolders().length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Kayıtlı Klasörlerin
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {getExistingFolders().map(fname => (
                    <button 
                      key={fname}
                      type="button"
                      onClick={() => handleQuickAdd(fname)}
                      style={{
                        padding: '6px 14px', borderRadius: '20px', background: 'var(--bg-color)',
                        border: '1px solid var(--border-color)', color: 'var(--text-color)',
                        fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary-color)'; e.currentTarget.style.color = 'var(--primary-color)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-color)'; }}
                    >
                      <Folder size={12} /> {fname}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={confirmAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-light)' }}>Klasör Adı</label>
                <input required autoFocus
                  type="text" 
                  value={folderInput}
                  onChange={(e) => setFolderInput(e.target.value)}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '8px',
                    background: 'var(--bg-color)', border: '1px solid var(--border-color)',
                    color: 'var(--text-color)', fontSize: '0.95rem', outline: 'none', transition: 'border 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setSelectedFeed(null)} 
                  style={{ 
                    flex: 1, padding: '12px', borderRadius: '8px', background: 'transparent',
                    color: 'var(--text-light)', border: '1px solid var(--border-color)', cursor: 'pointer'
                  }}
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  style={{ 
                    flex: 1, padding: '12px', borderRadius: '8px', background: 'var(--primary-color)',
                    color: 'var(--bg-color)', border: 'none', cursor: 'pointer', fontWeight: 'bold'
                  }}
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAKET İÇERİĞİ MODALI */}
      {viewingPackage && (
        <div 
          onClick={(e) => { if(e.target === e.currentTarget) setViewingPackage(null) }}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
            zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center'
          }}
        >
          <div className="fade-in" style={{
            background: 'var(--bg-secondary)', width: '450px', maxHeight: '80vh', borderRadius: '16px',
            padding: '2rem', border: '1px solid var(--border-color)', 
            boxShadow: '0 20px 60px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '1.8rem' }}>{viewingPackage.emoji}</div>
                  <div>
                     <h3 style={{ margin: 0, color: 'var(--text-color)', fontSize: '1.2rem' }}>{viewingPackage.name}</h3>
                     <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-light)' }}>Paket İçeriği ({viewingPackage.feeds.length} Kaynak)</p>
                  </div>
               </div>
               <button onClick={() => setViewingPackage(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}>
                  <X size={24} />
               </button>
            </div>

            <div style={{ overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1.5rem' }}>
               {viewingPackage.feeds.map((feed, fIdx) => (
                  <div key={fIdx} style={{ 
                     padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', 
                     marginBottom: '0.5rem', border: '1px solid var(--border-color)',
                     display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                     <div>
                        <div style={{ color: 'var(--text-color)', fontSize: '0.9rem', fontWeight: '600' }}>{feed.name}</div>
                        <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', opacity: 0.7 }}>{new URL(feed.url).hostname}</div>
                     </div>
                     {activeLinks.includes(feed.url) && (
                        <CheckCircle size={16} color="var(--success-color)" title="Zaten Ekli" />
                     )}
                  </div>
               ))}
            </div>

            <button 
               onClick={() => { handleInstallPackage(viewingPackage); setViewingPackage(null); }}
               disabled={getPackageStatus(viewingPackage) === 'installed'}
               style={{ 
                  width: '100%', padding: '1rem', borderRadius: '10px', 
                  background: getPackageStatus(viewingPackage) === 'installed' ? 'var(--bg-color)' : viewingPackage.color,
                  color: getPackageStatus(viewingPackage) === 'installed' ? 'var(--text-light)' : '#fff', 
                  border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', gap: '8px'
               }}
            >
               {getPackageStatus(viewingPackage) === 'installed' ? <><CheckCircle size={18} /> Tüm Kaynaklar Yüklü</> : <><Download size={18} /> Paketi Şimdi Yükle</>}
            </button>
          </div>
        </div>
      )}

      {/* TOAST BILDIRIM ALANI */}
      {toast && (
        <div className="fade-in" style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          backgroundColor: toast.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 10000,
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.95rem'
        }}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {toast.message}
        </div>
      )}
    </>
  );
}
