import { Key, MousePointerClick, Type, Copy, ExternalLink, Sparkles } from 'lucide-react';

export default function AiKeyGuide() {
  const steps = [
    {
      icon: <ExternalLink size={20} />,
      title: "Linke Tıklayın",
      desc: "Alttaki butona basın, sizi doğrudan Groq API anahtarları sayfasına götürecektir.",
      color: "var(--primary-color)"
    },
    {
      icon: <MousePointerClick size={20} />,
      title: "Anahtar Oluştur",
      desc: 'Açılan sayfada "Create API Key" butonuna basın.',
      color: "#10b981"
    },
    {
      icon: <Type size={20} />,
      title: "İsim Ver",
      desc: "Kutuya herhangi bir isim yazın (Örn: Gündemim) ve 'Submit' deyin.",
      color: "#3b82f6"
    },
    {
      icon: <Copy size={20} />,
      title: "Kopyala & Kaydet",
      desc: "Çıkan kodu kopyalayıp uygulamadaki kutucuğa yapıştırın ve kaydedin.",
      color: "#a855f7"
    }
  ];

  return (
    <div className="ai-key-guide" style={{ marginTop: '2rem' }}>
      <h4 style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.6rem', 
        fontSize: '1rem', 
        color: 'var(--text-color)', 
        marginBottom: '1.5rem',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <Sparkles size={18} color="var(--primary-color)" /> 
        Hızlı Kurulum Rehberi (1 Dakika)
      </h4>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {steps.map((step, idx) => (
          <div key={idx} style={{ 
            background: 'rgba(255,255,255,0.02)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '12px', 
            padding: '1.2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.8rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ 
              position: 'absolute', 
              top: '-10px', 
              right: '-10px', 
              fontSize: '3rem', 
              fontWeight: '900', 
              opacity: 0.05,
              color: step.color
            }}>
              {idx + 1}
            </div>
            
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: `${step.color}15`,
              color: step.color
            }}>
              {step.icon}
            </div>

            <div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.3rem', color: 'var(--text-color)' }}>
                {idx + 1}. {step.title}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', lineHeight: '1.5' }}>
                {step.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <a 
          href="https://console.groq.com/keys" 
          target="_blank" 
          rel="noreferrer" 
          className="btn btn-primary"
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.6rem',
            padding: '0.9rem 2rem',
            fontSize: '1rem',
            background: 'var(--primary-color)',
            boxShadow: '0 8px 16px rgba(52, 211, 153, 0.2)'
          }}
        >
          <Key size={18} /> Groq Console'u Aç ve Anahtarını Al
        </a>
      </div>
    </div>
  );
}
