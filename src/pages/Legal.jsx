// src/pages/Legal.jsx
import { ShieldAlert, ArrowLeft, Scale, Lock, Info, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Legal() {
  const navigate = useNavigate();

  return (
    <div className="legal-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <button
        onClick={() => navigate(-1)}
        style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem', fontSize: '1rem' }}
      >
        <ArrowLeft size={20} /> Geri Dön
      </button>

      <div className="card fade-in" style={{ padding: '2.5rem', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--text-color)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert size={32} color="var(--primary-color)" /> Hukuki Bilgiler & Gizlilik
        </h1>

        <p style={{ color: 'var(--text-light)', lineHeight: '1.6', marginBottom: '2.5rem', fontSize: '1rem' }}>
          Gündemim uygulamasını kullanarak aşağıdaki şartları ve gizlilik politikasını kabul etmiş sayılırsınız.
          Bu metin, yasal dayanıklılık ve "Google Play Store Haber Politikası" standartlarına tam uyum için hazırlanmıştır.
        </p>

        {/* 1. İçerik Kullanımı ve Telif Hakları */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
            <Scale size={20} color="var(--primary-color)" /> 1. İçerik Kullanımı ve Telif Hakları
          </h2>
          <div style={{ color: 'var(--text-light)', fontSize: '0.95rem', lineHeight: '1.8' }}>
            <p>Gündemim bir içerik üreticisi değildir; üçüncü taraf haber kaynaklarına ait içerikleri kalıcı olarak depolamaz veya yeniden dağıtmaz.</p>
            <ul>
              <li><strong>Anlık Gösterim:</strong> İçerikler, ilgili kaynağın sağladığı RSS verilerinden anlık olarak alınır ve yalnızca görüntüleme amacıyla sunulur.</li>
              <li><strong>Önbellekleme:</strong> Uygulama, içerikleri kalıcı veya yeniden dağıtım amaçlı olarak önbelleğe (cache) almaz.</li>
              <li><strong>Yönlendirme:</strong> Kullanıcı, "Devamını Oku" seçeneği ile doğrudan orijinal kaynağa yönlendirilir.</li>
              <li><strong>Sorumluluk:</strong> Uygulama, üçüncü taraf içeriklerin doğruluğu veya hukuka uygunluğu konusunda garanti vermez.</li>
              <li><strong>Kullanıcı Sorumluluğu:</strong> Kullanıcı, uygulamaya eklediği içerik kaynaklarının kullanım haklarına uygunluğundan bizzat sorumludur.</li>
            </ul>
          </div>
        </section>

        {/* 2. Yapay Zeka (AI) Analizi ve Sınırları */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
            <Bot size={20} color="#3b82f6" /> 2. Yapay Zeka (AI) Analizi ve Sınırları
          </h2>
          <div style={{ color: 'var(--text-light)', fontSize: '0.95rem', lineHeight: '1.8' }}>
            <ul>
              <li><strong>Anonim İletim:</strong> İçerik, yalnızca özetleme amacıyla üçüncü taraf yapay zeka hizmet sağlayıcılarına (ör. Groq API) anonim olarak iletilir.</li>
              <li><strong>Depolama:</strong> Bu veriler servis sağlayıcılar tarafında kalıcı olarak saklanmaz ve eğitim amacıyla kullanılmaz.</li>
              <li><strong>Hata Payı:</strong> AI çıktıları "olduğu gibi" sunulur; hatalı veya eksik olabilir. Kritik kararlar öncesinde orijinal kaynak kontrol edilmelidir.</li>
            </ul>
          </div>
        </section>

        {/* 3. Gizlilik Politikası (KVKK/GDPR) */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
            <Lock size={20} color="var(--success-color)" /> 3. Gizlilik Politikası (KVKK/GDPR)
          </h2>
          <div style={{ color: 'var(--text-light)', fontSize: '0.95rem', lineHeight: '1.8' }}>
            <p>Gündemim, kullanıcı gizliliğini "Cihaz Üstü" (On-Device) yaklaşımı ile korur:</p>
            <ul>
              <li><strong>Hassas Veri:</strong> Uygulama kimlik, konum veya rehber gibi hassas verileri toplamaz.</li>
              <li><strong>Veri İşleme Amacı:</strong> Uygulama, yalnızca temel RSS okuma ve özetleme işlevlerini yerine getirmek amacıyla teknik veri kullanır.</li>
              <li><strong>Kullanıcı Hakları:</strong> Kullanıcılar, veri işleme ile ilgili taleplerini aşağıdaki iletişim adresi üzerinden iletebilirler.</li>
              <li><strong>Veri Sorumlusu:</strong> Ömer Can İnan (Bireysel Geliştirici)</li>
              <li><strong>İletişim:</strong> omer1243a@gmail.com</li>
            </ul>
          </div>
        </section>

        {/* 4. Platform ve İçerik Politikası Uyumu */}
        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
            <ShieldAlert size={20} color="#3b82f6" /> 4. Platform ve İçerik Politikası Uyumu
          </h2>
          <div style={{ color: 'var(--text-light)', fontSize: '0.95rem', lineHeight: '1.8' }}>
            <p>Gündemim, içerikleri otomatik olarak toplar ve <strong>editoryal müdahale yapmaz</strong>. Uygulama, yanıltıcı bilgi üretmeyi amaçlamaz ve kullanıcıyı her zaman orijinal kaynaklara yönlendirmeyi esas alır.</p>
          </div>
        </section>

        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-light)' }}>
          © 2024 Gündemim - Profesyonel Haber Okuma Servisi <br />
          Son Güncelleme: 18 Nisan 2026
        </div>
      </div>
    </div>
  );
}
