// src/components/NewsCard.jsx
// Haberin başlığını ve içeriğini gösteren, çeviri yeteneğine sahip izolasyonlu kart bileşeni.
import { useState, useEffect } from 'react';
import { useTranslation } from '../context/TranslationContext';
import { translateTextToTurkish } from '../services/translationService';
import { ImageOff, ExternalLink } from 'lucide-react';

export default function NewsCard({ news }) {
  const { isTranslationEnabled } = useTranslation();
  
  const [translatedTitle, setTranslatedTitle] = useState(null);
  const [translatedDesc, setTranslatedDesc] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // isTranslationEnabled değiştiğinde, eğer önceden çevrilmemişse API'yi çağır:
  useEffect(() => {
    let active = true;

    const translateContent = async () => {
      // Çeviri açık değilse veya zaten çevirildiyse tekrar istek atma.
      if (!isTranslationEnabled || translatedTitle) return;

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

  return (
    <article className="news-card fade-in">
      {/* Eğer resim varsa göster, yoksa modern bir placeholder ver */}
      <div className="card-image-container">
        {news.imageUrl ? (
          <img src={news.imageUrl} alt={news.title} className="card-image" loading="lazy" />
        ) : (
          <div className="card-no-image">
            <ImageOff size={40} opacity={0.3} />
          </div>
        )}
      </div>

      <div className="card-content">
        <h3 className="card-title">{displayTitle}</h3>
        <p className="card-date">
          {formattedDate} &bull; <span className="card-source">{sourceDomain}</span>
        </p>
        <p className="card-description">{displayDesc}</p>
        
        <a href={news.link} target="_blank" rel="noopener noreferrer" className="read-more-button">
          Okumaya Devam Et <ExternalLink size={16} />
        </a>
      </div>
    </article>
  );
}
