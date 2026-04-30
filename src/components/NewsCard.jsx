// src/components/NewsCard.jsx
// Haberin başlığını ve içeriğini gösteren, çeviri yeteneğine sahip izolasyonlu kart bileşeni.
import { useState, useEffect } from 'react';
import { useTranslation } from '../context/TranslationContext';
import { translateTextToTurkish } from '../services/translationService';
import { ImageOff, ExternalLink } from 'lucide-react';

// Renk paleti: her tag için sabit bir renk ata (hash tabanlı)
const TAG_COLORS = [
  { bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.5)', text: '#a5b4fc' },   // indigo
  { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.4)', text: '#6ee7b7' },   // emerald
  { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.4)', text: '#fcd34d' },   // amber
  { bg: 'rgba(239, 68, 68, 0.12)',  border: 'rgba(239, 68, 68, 0.4)',  text: '#fca5a5' },   // red
  { bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.4)', text: '#93c5fd' },   // blue
  { bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.4)', text: '#d8b4fe' },   // purple
  { bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.4)', text: '#f9a8d4' },   // pink
  { bg: 'rgba(20, 184, 166, 0.12)', border: 'rgba(20, 184, 166, 0.4)', text: '#5eead4' },   // teal
  { bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.4)', text: '#fdba74' },   // orange
  { bg: 'rgba(34, 197, 94, 0.12)',  border: 'rgba(34, 197, 94, 0.4)',  text: '#86efac' },   // green
];

const getTagColor = (tag) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
};

export default function NewsCard({ news, onTagClick, activeTag }) {
  const { isTranslationEnabled } = useTranslation();
  
  const [translatedTitle, setTranslatedTitle] = useState(null);
  const [translatedDesc, setTranslatedDesc] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // isTranslationEnabled değiştiğinde, eğer önceden çevrilmemişse API'yi çağır:
  useEffect(() => {
    let active = true;

    const translateContent = async () => {
      // AKILLI FİLTRE: Eğer haber zaten Türkçe ise (#tr etiketi varsa) çevirme.
      const isAlreadyTurkish = news.tags?.includes('#tr');
      
      if (!isTranslationEnabled || translatedTitle || isAlreadyTurkish) return;

      setIsTranslating(true);
      try {
        const titleTr = await translateTextToTurkish(news.title);
        const descTr = await translateTextToTurkish(news.description);
        
        if (active) {
          setTranslatedTitle(titleTr);
          setTranslatedDesc(descTr);
        }
      } catch (error) {
        console.error("Kart çeviri hatası:", error);
      } finally {
        if (active) setIsTranslating(false);
      }
    };

    translateContent();

    return () => { active = false; };
  }, [isTranslationEnabled, news.title, news.description, translatedTitle]);

  // Hangi değerin gösterileceğine karar veriyoruz: Orijinal mi, Çevrilmiş mi?
  const displayTitle = isTranslationEnabled 
    ? (translatedTitle || (isTranslating ? 'Çevriliyor...' : news.title))
    : news.title;
    
  const displayDesc = isTranslationEnabled 
    ? (translatedDesc || (isTranslating ? 'Çevriliyor...' : news.description))
    : news.description;

  const formattedDate = new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).format(news.date);

  const getDomainName = (url) => {
    try {
      if (!url || url === '#') return '';
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  };
  
  const sourceDomain = getDomainName(news.link) || news.sourceName || 'Bilinmeyen Kaynak';

  const [imageError, setImageError] = useState(false);

  return (
    <article className="news-card fade-in">
      {/* Eğer resim varsa göster, yoksa modern bir placeholder ver */}
      <div className="card-image-container">
        {news.imageUrl && !imageError ? (
          <img 
            src={news.imageUrl} 
            alt={news.title} 
            className="card-image" 
            loading="lazy" 
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="card-no-image" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-secondary)', padding: '2rem' }}>
            <img 
              src={`https://logo.clearbit.com/${sourceDomain}`} 
              alt={`${sourceDomain} logo`}
              style={{ width: '64px', height: '64px', objectFit: 'contain', opacity: 0.9, borderRadius: '8px' }}
              onError={(e) => {
                // Clearbit'te logo yoksa, Google Favicon servisine düş
                if (e.target.src.includes('clearbit')) {
                  e.target.src = `https://s2.googleusercontent.com/s2/favicons?domain=${sourceDomain}&sz=128`;
                } else {
                  // İkisi de yoksa en son çare ikonu gizle
                  e.target.style.display = 'none';
                }
              }}
            />
          </div>
        )}
      </div>

      <div className="card-content">

        <h3 className="card-title">{displayTitle}</h3>
        <p className="card-date">
          {formattedDate} &bull; <span className="card-source">{sourceDomain}</span>
        </p>
        <p className="card-description">{displayDesc}</p>
        
        {/* Etiketler (Tags) - Tıklanabilir */}
        {news.tags && news.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '1rem' }}>
            {news.tags.map(tag => {
              const color = getTagColor(tag);
              const isActive = activeTag === tag;
              return (
                <button
                  key={tag}
                  onClick={(e) => { e.preventDefault(); onTagClick && onTagClick(tag); }}
                  title={`"${tag}" etiketiyle filtrele`}
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: '700',
                    color: isActive ? '#fff' : color.text,
                    background: isActive ? color.text.replace(')', ', 0.9)').replace('rgb', 'rgba') : color.bg,
                    padding: '3px 9px',
                    borderRadius: '20px',
                    border: `1px solid ${isActive ? color.text : color.border}`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    transform: isActive ? 'scale(1.07)' : 'scale(1)',
                    boxShadow: isActive ? `0 0 8px ${color.border}` : 'none',
                    userSelect: 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = color.text.replace(')', ', 0.15)').replace('rgb', 'rgba');
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = color.bg;
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}
        
        <a href={news.link} target="_blank" rel="noopener noreferrer" className="read-more-button">
          Okumaya Devam Et <ExternalLink size={16} />
        </a>
      </div>
    </article>
  );
}
