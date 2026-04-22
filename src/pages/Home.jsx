// src/pages/Home.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { getRssLinks, addRssLink, deleteRssLink, updateFolderName, getGroqApiKey, saveGroqApiKey, getAppSettings, saveAppSettings } from '../services/dbService';
import { importOPML, exportOPML } from '../services/opmlService';
import { Search, Globe, Trash2, PlusCircle, Folder, Download, Upload, Compass, Rss, ShieldAlert, Target, Sparkles, Key, ExternalLink, Settings, Type, LayoutGrid, LayoutList, Sun, Moon, CheckCircle, AlertCircle, Volume2, Play, HelpCircle, Edit2, Check, X } from 'lucide-react';

// Önerilen kaynaklar listesi ayrı bir "Discover" (Keşfet) sayfasına taşındı.

export default function Home() {
  const [url, setUrl] = useState('');
  const [folder, setFolder] = useState('');
  const [links, setLinks] = useState(() => getRssLinks());
  const [activeTab, setActiveTab] = useState('add'); // 'add', 'manage', 'settings', 'apikey'
  const [apiKeyInput, setApiKeyInput] = useState('');
  
  // Şifreli API Anahtarını yükle (V11)
  useEffect(() => {
    getGroqApiKey().then(key => setApiKeyInput(key));
  }, []);
  const [appSettings, setAppSettings] = useState(() => getAppSettings());
  const [searchParams] = useSearchParams();

  // Custom Suggestions State
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredFolders, setFilteredFolders] = useState([]);
  const [manageSearch, setManageSearch] = useState('');
  const [editingFolder, setEditingFolder] = useState(null);
  const [editValue, setEditValue] = useState('');
  const suggestionRef = useRef(null);
  
  // URL'den tab parametresini oku
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'apikey') {
      setActiveTab('apikey');
    } else if (activeTab === 'apikey') {
      setActiveTab('add'); // apikey'den çıkınca normal sekmeye dön
    }
  }, [searchParams]);

  // Toast bildirimi
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Özel onay modalı
  const [confirmModal, setConfirmModal] = useState(null);

  // Helper: URL'den site ismi türet (V13)
  const getDisplayName = (targetUrl) => {
    try {
      const urlObj = new URL(targetUrl);
      let host = urlObj.hostname.replace('www.', '');
      // .com, .net vb. temizle
      host = host.split('.')[0];
      // İlk harfi büyüt
      return host.charAt(0).toUpperCase() + host.slice(1);
    } catch (e) {
      return targetUrl;
    }
  };

  const handleSettingChange = (key, value) => {
     const newSet = { ...appSettings, [key]: value };
     setAppSettings(newSet);
     saveAppSettings(newSet);
     window.dispatchEvent(new Event('rss_settings_updated'));
  };

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Linkleri klasörlere göre grupla (V14 - useMemo eklendi)
  const groupedLinks = React.useMemo(() => links.reduce((acc, link) => {
    const f = link.folder || 'Genel';
    if (!acc[f]) acc[f] = [];
    acc[f].push(link);
    return acc;
  }, {}), [links]);

  // Suggestion Filter Logic
  useEffect(() => {
    const existingFolders = Object.keys(groupedLinks).filter(f => f !== 'Genel');
    if (!folder.trim()) {
      setFilteredFolders(existingFolders);
    } else {
      setFilteredFolders(existingFolders.filter(f => f.toLowerCase().includes(folder.toLowerCase())));
    }
  }, [folder, groupedLinks]);

  // Outside click for suggestions
  useEffect(() => {
    const handleClick = (e) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleAddNewLink = (e) => {
    e?.preventDefault();
    if (!url.trim()) return showToast('Lütfen geçerli bir RSS linki giriniz.', 'error');
    addRssLink(url.trim(), folder.trim());
    setLinks(getRssLinks());
    showToast('Kaynak başarıyla eklendi!');
    setUrl('');
    // Art arda aynı klasöre ekleme yapabilmek için folder state'ini temizlemiyoruz
  };

  const handleRenameFolder = (oldName) => {
    if (!editValue.trim() || editValue.trim() === oldName) {
      setEditingFolder(null);
      return;
    }
    updateFolderName(oldName, editValue.trim());
    setLinks(getRssLinks());
    setEditingFolder(null);
    showToast(`Klasör "${editValue.trim()}" olarak değiştirildi.`);
  };


  const handleDelete = (id) => {
    setConfirmModal({
      message: 'Bu RSS kaynağını silmek istediğinize emin misiniz?',
      onConfirm: () => {
        deleteRssLink(id);
        setLinks(getRssLinks());
        setConfirmModal(null);
        showToast('Kaynak silindi.');
      }
    });
  };

  const handleExportOPML = () => {
    if (links.length === 0) return showToast('Dışa aktarılacak link yok.', 'error');
    const opmlStr = exportOPML();
    const blob = new Blob([opmlStr], { type: "text/xml" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = "antigravity_rss_backup.opml";
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  const handleImportOPML = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const added = importOPML(event.target.result);
      setLinks(getRssLinks());
      showToast(`${added} yeni RSS kaynağı başarıyla içe aktarıldı!`);
    };
    reader.readAsText(file);
    e.target.value = null; // reset
  };

  return (
    <div className="home-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      
      {/* SEKMELER (Tabs) — apikey sekmesinde gizlenir */}
      {activeTab !== 'apikey' && (
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>
        <button 
           onClick={() => setActiveTab('add')}
           style={{ background: 'transparent', border: 'none', color: activeTab === 'add' ? 'var(--text-color)' : 'var(--text-light)', fontWeight: activeTab === 'add' ? '700' : '500', fontSize: '1.1rem', cursor: 'pointer', padding: '0 0 0.8rem 0', borderBottom: activeTab === 'add' ? '2px solid var(--primary-color)' : '2px solid transparent', transition: 'all 0.2s' }}
        >
           Manuel Kaynak Ekle
        </button>
        <button 
           onClick={() => setActiveTab('manage')}
           style={{ background: 'transparent', border: 'none', color: activeTab === 'manage' ? 'var(--text-color)' : 'var(--text-light)', fontWeight: activeTab === 'manage' ? '700' : '500', fontSize: '1.1rem', cursor: 'pointer', padding: '0 0 0.8rem 0', borderBottom: activeTab === 'manage' ? '2px solid var(--primary-color)' : '2px solid transparent', transition: 'all 0.2s' }}
        >
           Kaynakları Yönet
        </button>
        <button 
           onClick={() => setActiveTab('settings')}
           style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'transparent', border: 'none', color: activeTab === 'settings' ? 'var(--text-color)' : 'var(--text-light)', fontWeight: activeTab === 'settings' ? '700' : '500', fontSize: '1.1rem', cursor: 'pointer', padding: '0 0 0.8rem 0', borderBottom: activeTab === 'settings' ? '2px solid var(--primary-color)' : '2px solid transparent', transition: 'all 0.2s' }}
        >
           <Settings size={18} /> Genel Ayarlar
        </button>
      </div>
      )}

      {/* Kaynak Ekleme Alanı */}
      {activeTab === 'add' && (
      <section className="card fade-in" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-secondary)' }}>
        <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem' }}>
           <PlusCircle size={18} /> Yeni Kaynak Ekle
        </h3>
        <form onSubmit={handleAddNewLink} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ 
            flex: '2 1 300px', display: 'flex', alignItems: 'center', background: 'var(--bg-color)', 
            border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0 0.8rem',
            transition: 'all 0.3s ease-in-out',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
           }} className="input-group">
            <Globe size={18} color="var(--primary-color)" />
            <input required
              type="url" 
              placeholder="RSS Linki (Örn: https://...)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{ width: '100%', padding: '0.8rem', border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-color)', fontSize: '0.95rem' }}
            />
          </div>
          
          <div style={{ 
            flex: '1 1 200px', position: 'relative'
          }} ref={suggestionRef}>
            <div style={{ 
              display: 'flex', alignItems: 'center', background: 'var(--bg-color)', 
              border: showSuggestions ? '1px solid var(--primary-color)' : '1px solid var(--border-color)', 
              borderRadius: '12px', padding: '0 0.8rem',
              transition: 'all 0.3s ease',
              boxShadow: showSuggestions ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none'
            }}>
              <Folder size={18} color={showSuggestions ? "var(--primary-color)" : "var(--text-light)"} />
              <input 
                type="text" 
                placeholder="Klasör / Kategori"
                value={folder}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => { setFolder(e.target.value); setShowSuggestions(true); }}
                style={{ width: '100%', padding: '0.8rem', border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-color)', fontSize: '0.95rem' }}
              />
            </div>
            
            {showSuggestions && filteredFolders.length > 0 && (
              <div className="fade-in" style={{
                position: 'absolute', top: '110%', left: 0, right: 0, 
                background: 'rgba(30, 41, 59, 0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                zIndex: 1000,
                maxHeight: '200px',
                overflowY: 'auto',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                padding: '0.5rem'
              }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', padding: '0.3rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mevcut Klasörler</p>
                {filteredFolders.map(f => (
                  <div 
                    key={f} 
                    onClick={() => { setFolder(f); setShowSuggestions(false); }}
                    style={{
                      padding: '0.6rem 0.8rem', cursor: 'pointer', borderRadius: '6px',
                      fontSize: '0.85rem', color: 'var(--text-color)',
                      transition: 'background 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {f}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 2.5rem' }}>
             <PlusCircle size={18} /> Ekle
          </button>
        </form>

        <hr style={{ border: 'none', borderTop: '1px dashed var(--border-color)', margin: '1.5rem 0' }} />
        
        <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: 'var(--text-light)', fontWeight: '500' }}>
           Veya Toplu Yükleme (OPML)
        </h4>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <label style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', 
              background: 'var(--bg-color)', border: '1px solid var(--border-color)', padding: '0.8rem', 
              borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: 'var(--text-color)', fontSize: '0.95rem'
           }}>
              <Upload size={18} color="var(--primary-color)" /> İçe Aktar
              <input type="file" accept=".opml, .xml" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImportOPML} />
           </label>
           
           <button onClick={handleExportOPML} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', 
              background: 'var(--bg-color)', border: '1px solid var(--border-color)', padding: '0.8rem', 
              borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: 'var(--text-color)', fontSize: '0.95rem'
           }}>
              <Download size={18} /> Dışa Aktar
           </button>
        </div>

      </section>
      )}



      {/* Kayıtlı Klasörler & Linkler */}
      {activeTab === 'manage' && (
      <section className="fade-in">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          Kaynakları Yönet
        </h3>

        {/* Canlı Arama Sistemi (V13) */}
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '0.8rem', 
          background: 'rgba(30, 41, 59, 0.4)', border: '1px solid var(--border-color)', 
          borderRadius: '12px', padding: '0.4rem 1rem', marginBottom: '2rem',
          transition: 'all 0.3s',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
        }}>
          <Search size={18} color="var(--primary-color)" />
          <input 
            type="text" 
            placeholder="Kaynaklarda veya klasörlerde ara..." 
            value={manageSearch}
            onChange={(e) => setManageSearch(e.target.value)}
            style={{ flex: 1, padding: '0.6rem 0', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-color)', fontSize: '0.95rem' }}
          />
        </div>

        {links.length === 0 ? (
          <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Henüz hiç kaynak eklemediniz.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
             {Object.keys(groupedLinks).sort().map(folderName => {
               const folderSearchMatch = folderName.toLowerCase().includes(manageSearch.toLowerCase());
               const folderLinks = groupedLinks[folderName].filter(link => 
                  folderSearchMatch || 
                  link.url.toLowerCase().includes(manageSearch.toLowerCase()) ||
                  getDisplayName(link.url).toLowerCase().includes(manageSearch.toLowerCase())
               );

               if (manageSearch && folderLinks.length === 0) return null;

               return (
                <div key={folderName} className="fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    {editingFolder === folderName ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                        <input 
                          autoFocus
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameFolder(folderName);
                            if (e.key === 'Escape') setEditingFolder(null);
                          }}
                          style={{ 
                            background: 'var(--bg-color)', border: '1px solid var(--primary-color)', 
                            color: 'var(--text-color)', padding: '0.4rem 0.8rem', borderRadius: '6px',
                            fontSize: '0.95rem', outline: 'none', width: '200px'
                          }}
                        />
                        <button onClick={() => handleRenameFolder(folderName)} className="btn" style={{ padding: '4px', border: 'none', background: 'var(--primary-color)', color: 'var(--bg-color)' }} title="Kaydet">
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditingFolder(null)} className="btn" style={{ padding: '4px', border: 'none' }} title="İptal">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <h4 style={{ fontSize: '1.05rem', color: 'var(--text-color)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Folder size={18} color="var(--primary-color)" style={{ flexShrink: 0 }} /> 
                        {folderName} ({groupedLinks[folderName].length})
                        <button 
                          onClick={() => { setEditingFolder(folderName); setEditValue(folderName); }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', opacity: 0.5, padding: '4px', display: 'flex', alignItems: 'center' }}
                          onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                          onMouseOut={(e) => e.currentTarget.style.opacity = 0.5}
                          title="Klasör Adını Değiştir"
                        >
                          <Edit2 size={14} />
                        </button>
                      </h4>
                    )}
                    <button 
                      onClick={() => {
                        setConfirmModal({
                           message: `"${folderName}" klasöründeki ${groupedLinks[folderName].length} kaynağın tamamı silinecek. Emin misiniz?`,
                           onConfirm: () => {
                             groupedLinks[folderName].forEach(link => deleteRssLink(link.id));
                             setLinks(getRssLinks());
                             setConfirmModal(null);
                             showToast(`"${folderName}" klasörü silindi.`);
                           }
                         })
                      }}
                      className="btn"
                      style={{ 
                        border: 'none', 
                        color: 'var(--danger-color)', 
                        fontWeight: '700', 
                        fontSize: '0.9rem',
                        background: 'transparent',
                        padding: '0.4rem 0.8rem'
                      }}
                      title="Klasördeki tüm kaynakları sil"
                    >
                      Klasörü Sil
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {folderLinks.map(link => (
                      <div key={link.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1.2rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)', transition: 'all 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                         <div style={{ overflow: 'hidden', paddingRight: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                           <Globe size={18} color="var(--primary-color)" style={{ opacity: 0.7, flexShrink: 0 }} />
                           <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                              <span style={{ fontSize: '0.95rem', color: 'var(--text-color)', fontWeight: '700' }}>{getDisplayName(link.url)}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', opacity: 0.6, wordBreak: 'break-all', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.url}</span>
                           </div>
                         </div>
                         <button 
                            onClick={() => handleDelete(link.id)} 
                            className="btn" 
                            title="Kaynağı Sil" 
                            style={{ 
                              border: 'none', 
                              color: 'var(--danger-color)', 
                              fontWeight: '700', 
                              fontSize: '0.85rem',
                              background: 'transparent',
                              padding: '0.4rem 0.8rem',
                              flexShrink: 0 
                            }}
                         >
                            Sil
                         </button>
                      </div>
                    ))}
                  </div>
                </div>
              )})}
          </div>
        )}
      </section>
      )}

      {/* Genel ve AI Ayarları Bölümü */}
      {activeTab === 'settings' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
        {/* ================= GÖRÜNÜM AYARLARI ================= */}
        <section className="fade-in" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
           <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-color)' }}>
              <Compass size={20} color="var(--primary-color)" /> Görünüm & Okuma Ayarları
           </h3>
           
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>

               {/* Renk Teması */}
               <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', marginBottom: '0.8rem', color: 'var(--text-light)', fontSize: '0.95rem' }}>
                     <Sun size={16} /> Renk Teması
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <button 
                       onClick={() => handleSettingChange('colorTheme', 'dark')}
                       style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', background: appSettings.colorTheme === 'dark' ? 'var(--text-color)' : 'var(--bg-color)', color: appSettings.colorTheme === 'dark' ? 'var(--bg-color)' : 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                     ><Moon size={16} /> Koyu</button>
                     <button 
                       onClick={() => handleSettingChange('colorTheme', 'light')}
                       style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', background: appSettings.colorTheme === 'light' ? 'var(--text-color)' : 'var(--bg-color)', color: appSettings.colorTheme === 'light' ? 'var(--bg-color)' : 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                     ><Sun size={16} /> Açık</button>
                  </div>
               </div>
               
               {/* Font Tercihi */}
              <div>
                 <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', marginBottom: '0.8rem', color: 'var(--text-light)', fontSize: '0.95rem' }}>
                    <Type size={16} /> Yazı Tipi (Tipografi)
                 </label>
                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleSettingChange('fontTheme', 'sans')}
                      style={{ flex: 1, padding: '0.8rem', background: appSettings.fontTheme === 'sans' ? 'var(--text-color)' : 'var(--bg-color)', color: appSettings.fontTheme === 'sans' ? 'var(--bg-color)' : 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif' }}
                    >Modern</button>
                    <button 
                      onClick={() => handleSettingChange('fontTheme', 'serif')}
                      style={{ flex: 1, padding: '0.8rem', background: appSettings.fontTheme === 'serif' ? 'var(--text-color)' : 'var(--bg-color)', color: appSettings.fontTheme === 'serif' ? 'var(--bg-color)' : 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Merriweather, serif' }}
                    >Klasik Gazete</button>
                    <button 
                      onClick={() => handleSettingChange('fontTheme', 'mix')}
                      style={{ flex: 1, padding: '0.8rem', background: appSettings.fontTheme === 'mix' ? 'var(--text-color)' : 'var(--bg-color)', color: appSettings.fontTheme === 'mix' ? 'var(--bg-color)' : 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                    >Karışık</button>
                 </div>
              </div>

               {/* Layout Tercihi */}
               <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', marginBottom: '0.8rem', color: 'var(--text-light)', fontSize: '0.95rem' }}>
                     <LayoutGrid size={16} /> Haber Kartları Düzeni
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <button 
                       onClick={() => handleSettingChange('layoutStrategy', 'grid')}
                       style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', background: appSettings.layoutStrategy === 'grid' ? 'var(--text-color)' : 'var(--bg-color)', color: appSettings.layoutStrategy === 'grid' ? 'var(--bg-color)' : 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                     ><LayoutGrid size={16} /> Izgara Düzeni</button>
                     <button 
                       onClick={() => handleSettingChange('layoutStrategy', 'list')}
                       style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', background: appSettings.layoutStrategy === 'list' ? 'var(--text-color)' : 'var(--bg-color)', color: appSettings.layoutStrategy === 'list' ? 'var(--bg-color)' : 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                     ><LayoutList size={16} /> Alt Alta Liste</button>
                  </div>
               </div>

               {/* Sesli Okuma Hızı */}
               <div style={{ gridColumn: '1 / -1', paddingTop: '1rem', borderTop: '1px dashed var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                     <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: 'var(--text-light)', fontSize: '0.95rem' }}>
                        <Volume2 size={18} color="var(--primary-color)" /> Sesli Okuma Hızı
                     </label>
                     <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary-color)', background: 'rgba(52, 211, 153, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                        {appSettings.playbackRate?.toFixed(1) || '1.0'}x
                     </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                     <div style={{ flex: 1, minWidth: '200px' }}>
                        <input 
                           type="range" 
                           min="0.5" 
                           max="2.0" 
                           step="0.1" 
                           value={appSettings.playbackRate || 1.0} 
                           onChange={(e) => handleSettingChange('playbackRate', parseFloat(e.target.value))}
                           style={{ 
                              width: '100%', height: '6px', cursor: 'pointer', accentColor: 'var(--primary-color)',
                              background: 'var(--border-color)', borderRadius: '10px', outline: 'none'
                           }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '500' }}>
                           <span>Yavaş</span>
                           <span>Normal</span>
                           <span>Hızlı</span>
                           <span>Çok Hızlı</span>
                        </div>
                     </div>
                     
                     <button 
                        onClick={() => {
                           if ('speechSynthesis' in window) {
                              window.speechSynthesis.cancel();
                              const utterance = new SpeechSynthesisUtterance("Gündemim sesli okuma hızı bu şekilde ayarlandı.");
                              utterance.lang = 'tr-TR';
                              utterance.rate = appSettings.playbackRate || 1.0;
                              window.speechSynthesis.speak(utterance);
                           } else {
                              showToast('Cihazınız sesli okumayı desteklemiyor.', 'error');
                           }
                        }}
                        style={{ 
                           display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.2rem', 
                           background: 'var(--primary-color)', color: 'var(--bg-color)', border: 'none', 
                           borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem',
                           boxShadow: '0 4px 12px rgba(52, 211, 153, 0.2)', transition: 'transform 0.2s'
                        }}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                     >
                        <Play size={16} fill="currentColor" /> Hızı Test Et
                     </button>
                  </div>
               </div>

            </div>
          </section>

          {/* SESSİZ HUKUKİ LİNK - Ayarlar sekmesinin en altında gömülü */}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <Link 
              to="/legal" 
              style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-light)', 
                opacity: 0.6, 
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = 1}
              onMouseOut={(e) => e.currentTarget.style.opacity = 0.6}
            >
              <ShieldAlert size={12} /> Hukuki Bilgiler, Kullanım Şartları ve Gizlilik Politikası
            </Link>
          </div>

      </div>
      )}

      {/* AI Anahtarı Sekmesi */}
      {activeTab === 'apikey' && (
      <section className="fade-in" style={{ padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-color)' }}>
          <Sparkles size={22} color="var(--primary-color)" /> Hızlı AI Özeti (Groq)
        </h3>
        <p style={{ color: 'var(--text-light)', lineHeight: '1.7', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Dünün haberlerini saniyeler içinde özetlemek için <strong>Groq API</strong> kullanılıyor. 
          Kredi kartı gerektirmez, tamamen ücretsiz. Kendi ücretsiz Groq API anahtarınızı aşağıya girin.
        </p>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-light)' }}>
            Groq API Anahtarı
          </label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px', display: 'flex', alignItems: 'center', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 0.8rem' }}>
              <Key size={18} color="var(--text-light)" />
              <input 
                type="password" 
                placeholder="gsk_ ile başlayan Groq API Key'inizi giriniz..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-color)' }}
              />
            </div>
            <button 
              onClick={() => { saveGroqApiKey(apiKeyInput); showToast('Groq anahtarınız başarıyla kaydedildi!'); }} 
              className="btn btn-primary" 
              style={{ flex: '0 0 auto', padding: '0.8rem 1.5rem' }}
            >
              Anahtarı Kaydet
            </button>
          </div>
        </div>

        <div style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-color)', marginTop: '2rem' }}>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-light)', lineHeight: '1.6' }}>
            🔒 Anahtarınız yalnızca <strong>bu cihazda</strong> saklanır. Sunucuya aktarılmaz.
            Uygulama sadece haber özetlerini işler, harici veri toplamaz.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', flexWrap: 'wrap' }}>
            <a 
              href="https://console.groq.com/keys" 
              target="_blank" 
              rel="noreferrer" 
              style={{ 
                color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '700', fontSize: '0.9rem',
                display: 'inline-flex', alignItems: 'center', gap: '6px'
              }}
            >
              <ExternalLink size={16} /> Groq Console'a Git &rarr;
            </a>
            <div style={{ width: '1px', height: '14px', background: 'var(--border-color)' }}></div>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('toggle_how_to_use'))}
              style={{ 
                background: 'transparent', border: 'none', color: 'var(--text-light)', 
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', padding: 0,
                textDecoration: 'underline', textUnderlineOffset: '3px'
              }}
            >
              Nasıl Alınır? Rehberi Aç
            </button>
          </div>
        </div>
      </section>
      )}

      {/* ONAY MODALI */}
      {confirmModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }} onClick={() => setConfirmModal(null)}>
          <div className="fade-in" style={{
            background: 'var(--bg-secondary)', borderRadius: '16px', padding: '2rem',
            border: '1px solid var(--border-color)', maxWidth: '400px', width: '90%',
            boxShadow: 'var(--shadow-modal)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
              <AlertCircle size={24} color="var(--danger-color)" />
              <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.5', color: 'var(--text-color)' }}>{confirmModal.message}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmModal(null)} style={{ padding: '0.7rem 1.5rem', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-color)', cursor: 'pointer', fontWeight: '600' }}>
                İptal
              </button>
              <button onClick={confirmModal.onConfirm} className="btn btn-danger" style={{ padding: '0.7rem 1.5rem', border: 'none', fontWeight: '600' }}>
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST BİLDİRİMİ */}
      {toast && (
        <div className="fade-in" style={{
          position: 'fixed', bottom: '2rem', right: '2rem',
          background: toast.type === 'error' ? 'var(--danger-color)' : 'var(--success-color)',
          color: '#fff', padding: '1rem 1.5rem', borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)', zIndex: 10000,
          fontWeight: '600', fontSize: '0.95rem',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          maxWidth: '400px'
        }}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          {toast.message}
        </div>
      )}

    </div>
  );
}
