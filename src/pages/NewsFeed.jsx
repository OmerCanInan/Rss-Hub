// src/pages/NewsFeed.jsx
// RSS Haberlerinin (Sonuçların) listelendiği Ana Ekran.
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchRssFeed } from '../services/rssService';
import { getRssLinks } from '../services/dbService';
import NewsCard from '../components/NewsCard';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function NewsFeed() {
  const [searchParams] = useSearchParams();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(150);

  const queryUrl = searchParams.get('url');
  const searchAll = searchParams.get('all') === 'true';

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true);
      setError(null);
      let feedData = [];

      try {
        if (searchAll) {
          // Sistemdeki tüm RSS kaynaklarını çek.
          const links = getRssLinks();
          if (links.length === 0) {
            setError("Kayıtlı RSS linki bulunamadı. Lütfen ana sayfaya dönüp link ekleyin.");
            setLoading(false);
            return;
          }
          
          // Çoklu API isteklerini paralel olarak ('Promise.all' ile) yönetiyoruz, performansı maksimize ediyor.
          const promises = links.map(linkObj => fetchRssFeed(linkObj.url));
          const results = await Promise.allSettled(promises);
          
          results.forEach(res => {
            if (res.status === 'fulfilled' && Array.isArray(res.value)) {
              feedData = [...feedData, ...res.value];
            }
          });

        } else if (queryUrl) {
          // Sadece parametre olarak gelen tek URL'yi çekiyoruz
          feedData = await fetchRssFeed(queryUrl);
          if (feedData.length === 0) {
            setError("Bu URL'den herhangi bir haber çekilemedi veya veriler uygun formatta değil.");
          }
        }

        // Gelen veriyi Tarihe Göre (En yeniler en üstte) sıralıyoruz.
        // Hatalı veya gelecekteki (bozuk) tarihleri süzmek için ekstra kontroller:
        const now = new Date().getTime() + (24 * 60 * 60 * 1000); // Max yarınki tarihe kadar izin ver.
        feedData.sort((a, b) => {
          const timeA = a.date.getTime();
          const timeB = b.date.getTime();
          
          const isValidA = !isNaN(timeA) && timeA < now;
          const isValidB = !isNaN(timeB) && timeB < now;

          if (!isValidA && !isValidB) return 0;
          if (!isValidA) return 1; // Bozuk veya çok ileri tarihleri en alta at!
          if (!isValidB) return -1;
          
          return timeB - timeA;
        });

        // Hepsini birden State'e atıyoruz.
        setNews(feedData);
      } catch (err) {
        console.error("Haberler yüklenirken ana hata:", err);
        setError("Haberler yüklenemedi. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.");
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, [queryUrl, searchAll]);

  return (
    <div className="news-feed-container">
      <div className="feed-header fade-in">
        <Link to="/" className="btn-back">
          <ArrowLeft size={18} /> Ana Sayfaya Dön
        </Link>
        <h2 className="page-title">
          {searchAll ? 'Ortak Haber Akışı (Tüm Kaynaklar)' : 'Arama Sonuçları'} {news.length > 0 && `(${news.length} Haber)`}
        </h2>
      </div>

      {loading ? (
        <div className="loading-state fade-in">
          <Loader2 className="spinner" size={48} />
          <p>Haberler toplanıyor, lütfen bekleyin...</p>
        </div>
      ) : error ? (
        <div className="error-state fade-in">
          <p>{error}</p>
        </div>
      ) : (
        <div className="news-list-container">
          <div className="news-grid">
            {news.slice(0, visibleCount).map((item) => (
              <NewsCard key={item.id} news={item} />
            ))}
          </div>
          {visibleCount < news.length && (
            <div className="load-more-container" style={{ textAlign: 'center', margin: '2rem 0' }}>
              <button 
                onClick={() => setVisibleCount(prev => prev + 50)} 
                className="btn btn-primary"
                style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }}
              >
                Daha Fazla Göster ({news.length - visibleCount} kaldı)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
