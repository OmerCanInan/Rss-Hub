import { useState, useEffect } from 'react';
import { ensureMLKitModelReady, mlKitStatus } from '../services/mlKitService';
import { useTranslation } from '../context/TranslationContext';
import { Languages, ShieldCheck, Zap, Download } from 'lucide-react';

export default function FirstLaunchSetup({ onComplete }) {
  const [status, setStatus] = useState(mlKitStatus.state);
  const [message, setMessage] = useState(mlKitStatus.message);
  const { toggleTranslation } = useTranslation();

  useEffect(() => {
    const unsub = mlKitStatus.subscribe((s) => {
      setStatus(s.state);
      setMessage(s.message);
      
      if (s.state === 'ready') {
        // Otomatik kapat ve çeviriyi aç
        setTimeout(() => {
          if (!window.localStorage.getItem('autoTranslate') || window.localStorage.getItem('autoTranslate') === 'false') {
             toggleTranslation(); // İlk kurulumda indirdiyse çeviriyi aktif et
          }
          onComplete();
        }, 1500);
      }
    });
    return unsub;
  }, [onComplete, toggleTranslation]);

  const handleDownload = () => {
    ensureMLKitModelReady();
  };

  const handleSkip = () => {
    onComplete();
  };

  const isDownloading = status === 'downloading';
  const isReady = status === 'ready';
  const isError = status === 'error';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'var(--bg-color)', zIndex: 9999,
      display: 'flex', flexDirection: 'column',
      padding: '2rem', overflowY: 'auto'
    }} className="fade-in">
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '500px', margin: '0 auto', width: '100%' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '50%', 
            background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem auto'
          }}>
            <Languages size={40} />
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>Akıllı Çeviri Kurulumu</h2>
          <p style={{ color: 'var(--text-light)', lineHeight: '1.6' }}>
            Yabancı kaynaklı haberleri anında Türkçe okuyabilmeniz için çevrimdışı dil paketine ihtiyacımız var.
          </p>
        </div>

        <div style={{ 
          background: 'var(--bg-secondary)', padding: '1.5rem', 
          borderRadius: '12px', border: '1px solid var(--border-color)',
          marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem'
        }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <Zap size={24} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ marginBottom: '4px' }}>Işık Hızında Çeviri</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Haberler internete bağlanmadan cihazınızda anında çevrilir.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <ShieldCheck size={24} color="var(--primary-color)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ marginBottom: '4px' }}>Gizlilik Odaklı</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Okuduğunuz metinler hiçbir sunucuya gönderilmez.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <Download size={24} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ marginBottom: '4px' }}>Tek Seferlik İndirme</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Yaklaşık 30 MB boyutunda küçük bir dil paketi (Sadece ilk kurulumda).</p>
            </div>
          </div>
        </div>

        {isDownloading ? (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div className="spinner" style={{ display: 'inline-block', marginBottom: '1rem' }}>
              <Languages size={32} />
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>Paketler İndiriliyor...</h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>{message}</p>
            <div style={{ 
              width: '100%', height: '4px', background: 'var(--border-color)', 
              borderRadius: '2px', marginTop: '1.5rem', overflow: 'hidden' 
            }}>
              <div style={{ 
                height: '100%', background: 'var(--primary-color)',
                width: '50%', animation: 'slideRight 2s infinite ease-in-out'
              }} />
            </div>
            <style>{`
              @keyframes slideRight {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(200%); }
              }
            `}</style>
          </div>
        ) : isReady ? (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--success-color)' }}>
            <ShieldCheck size={48} style={{ margin: '0 auto 1rem auto' }} />
            <h3>Kurulum Tamamlandı!</h3>
            <p style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.5rem' }}>Uygulamaya yönlendiriliyorsunuz...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button 
              onClick={handleDownload}
              className="btn btn-primary" 
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
            >
              Şimdi İndir
            </button>
            <button 
              onClick={handleSkip}
              className="btn btn-secondary" 
              style={{ width: '100%', padding: '1rem' }}
            >
              Atla (Çeviri Kullanmayacağım)
            </button>
            {isError && (
              <p style={{ color: 'var(--danger-color)', textAlign: 'center', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Hata: {message}
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
