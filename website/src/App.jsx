import React from 'react';
import { Bot, Headphones, Shield, Zap, Download, Github, Globe, FileText } from 'lucide-react';
import laptopMockup from './assets/hero-laptop.png';
import radioMockup from './assets/radio-mobile.png';

function App() {
  const latestReleaseUrl = "https://github.com/OmerCanInan/Gundemim/releases/latest";

  return (
    <div className="landing">
      {/* Hero Section */}
      <header className="hero container">
        <p className="hero-tagline fade-in">Yapay Zeka Destekli Haber Deneyimi</p>
        <h1 className="hero-title fade-in" style={{ animationDelay: '0.1s' }}>
          Haberin Ötesini <span>Dinleyin ve Keşfedin.</span>
        </h1>
        <p className="hero-desc fade-in" style={{ animationDelay: '0.2s' }}>
          Gündemim, karmaşık haber akışlarını yapay zeka ile özetleyen, reklamdan arındırılmış ve 
          kişisel radyo moduna sahip yeni nesil bir haber okuyucudur.
        </p>
        
        <div className="fade-in" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', animationDelay: '0.3s' }}>
          <a href={latestReleaseUrl} className="btn btn-primary">
            <Download size={18} /> Windows (Masaüstü)
          </a>
          <a href={latestReleaseUrl} className="btn btn-outline" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
            <Globe size={18} /> Android (APK)
          </a>
          <a href="#ozellikler" className="btn btn-outline">
            Tüm Özellikler
          </a>
        </div>

        <div className="trust-badges fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="trust-badge">
            <Zap size={14} /> Açık Kaynak
          </div>
          <div className="trust-badge">
            <Shield size={14} /> %100 Güvenli
          </div>
          <div className="trust-badge">
            <Monitor size={14} /> Masaüstü & Mobil
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="ozellikler" className="features container">
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Süper Güçlerinizle Tanışın</h2>
          <p style={{ color: 'var(--text-muted)' }}>Gündemi takip etmek hiç bu kadar zahmetsiz ve akıllıca olmamıştı.</p>
        </div>

        <div className="feature-grid">
          <div className="feature-card glass">
            <div className="feature-icon"><Bot /></div>
            <h3>AI Haber Özetleri</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
              Saatlerinizi alan haber okuma maratonuna son. Gemini AI ile yüzlerce haberi saniyeler içinde analiz edin ve en önemli noktaları yakalayın.
            </p>
          </div>

          <div className="feature-card glass">
            <div className="feature-icon"><Headphones /></div>
            <h3>Sesli Radyo Modu</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
              Haberleri okumayın, dinleyin. Kendi haber bülteninizi oluşturun ve yolda, sporda veya işte gündemi bir radyo spikeri tadında takip edin.
            </p>
          </div>

          <div className="feature-card glass">
            <div className="feature-icon"><Shield /></div>
            <h3>Reklamsız & Güvenli</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
              İzleyici yok, reklam yok, veri toplama yok. Sadece haberlerin olduğu saf ve temiz bir okuma deneyimi sunuyoruz.
            </p>
          </div>

          <div className="feature-card glass">
            <div className="feature-icon"><Zap /></div>
            <h3>Gelişmiş Filtreleme</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
              Kelime bazlı filtreler ile görmek istemediğiniz içerikleri (spam, reklam, istemediğiniz konular) anında engelleyin.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container" style={{ padding: '4rem 0', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          © 2026 Gündemim - OmerCanInan tarafından geliştirilmiştir. <br/>
          Gizlilik Odaklı, Açık Kaynak RSS Okuyucu.
        </p>
      </footer>
    </div>
  );
}

export default App;
