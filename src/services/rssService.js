// src/services/rssService.js
// Bu servis, dış kaynaklı RSS XML verilerini çeker, parse eder (HTML içinden ayıklar) ve standart bir JSON yapısına dönüştürür.

/**
 * Verilen RSS linkinden haberleri çeker ve modele uygun dizi halinde döndürür.
 * @param {string} url - RSS linki
 * @returns {Promise<Array>} Haber objeleri dizisi
 */
export const fetchRssFeed = async (url) => {
  try {
    // Electron.js'te (veya webSecurity kapalıyken) doğrudan erişimi deneriz.
    // Eğer Tass gibi siteler bazı proxyleri engelliyorsa, direkt asıl URL'ye istek atmak %100 çalışır.
    let xmlText = '';
    
    // Haberi her seferinde CANLI çekmek için tarayıcı önbelleğini (cache) tamamen devre dışı bırakıyoruz.
    // Proxy'i tamamen kaldırdık çünkü proxy eski verileri önbelleğinde tutuyor!
    let cleanUrl = url.trim();
    // Cache busting için URL'i bozmak bazı sunucularda WAF bloklarına yol açar (Örn: AA).
    // Ancak TASS sunucularında hatalı önbelleği aşmak için zorunludur. Tass'a özel bypass:
    if (cleanUrl.includes('tass.com')) {
      cleanUrl += (cleanUrl.includes('?') ? '&' : '?') + 'bypass=' + new Date().getTime();
    }

    // Euronews gibi sitelerde '?format=itunes' gibi karmaşık eklentiler sonsuz döngüye girip "414 URI Too Long" hatası atabiliyor. 
    // Linkin sonundaki çöpü tırpanlayıp, doğrudan ana listeyi çekiyoruz.
    if (cleanUrl.includes('euronews.com')) {
      cleanUrl = cleanUrl.split('?')[0]; 
    }

    const response = await fetch(cleanUrl, { 
      cache: 'default',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });

    if (!response.ok) {
        throw new Error('Ağ veya CORS hatası. URL engellenmiş olabilir.');
    }
    
    xmlText = await response.text();
    
    // Gelen XML metnini tarayıcının yerel DOMParser sınıfıyla okuyoruz.
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Eğer parse sırasında hata olduysa
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('XML parse hatası.');
    }

    const items = xmlDoc.querySelectorAll('item, entry');
    const newsList = [];

    // Kaynak ismini (Haber Kaynağı) channel içindeki title'dan veya feed > title'dan alalım
    let sourceName = 'Bilinmeyen Kaynak';
    const channelTitleNode = xmlDoc.querySelector('channel > title') || xmlDoc.querySelector('feed > title');
    if (channelTitleNode && channelTitleNode.textContent) {
      sourceName = channelTitleNode.textContent.trim();
    }

    items.forEach((item) => {
      // Başlık, açıklama ve linki XML içinden alıyoruz
      const title = item.querySelector('title')?.textContent || 'Başlıksız';
      let description = item.querySelector('description')?.textContent || item.querySelector('summary')?.textContent || '';
      
      // Atom feed'lerde link attr href içindedir
      let linkNode = item.querySelector('link');
      let link = '#';
      if (linkNode) {
          link = linkNode.textContent.trim();
          if (!link || link.startsWith('\n')) {
              link = linkNode.getAttribute('href') || '#';
          }
      }
      
      // Tarih Parsing (RSS: pubDate, Atom: published/updated)
      let pubDateStr = item.querySelector('pubDate')?.textContent || item.querySelector('published')?.textContent || item.querySelector('updated')?.textContent || new Date().toISOString();
      
      const localDate = new Date(pubDateStr); // Otomatik olarak sistem local saatine (Örn: +3) dönüştürülür.

      // Görsel çekimi (Kapsamlı RSS Image Scraper)
      let imageUrl = null;
      const mediaContent = item.getElementsByTagName('media:content')[0];
      const mediaThumbnail = item.getElementsByTagName('media:thumbnail')[0];
      const enclosure = item.querySelector('enclosure');
      const imageNode = item.querySelector('image');
      const imageNodeUrl = item.querySelector('image > url');
      const contentEncoded = item.getElementsByTagName('content:encoded')[0];
      
      if (mediaContent && mediaContent.getAttribute('url')) {
        imageUrl = mediaContent.getAttribute('url');
      } else if (mediaThumbnail && mediaThumbnail.getAttribute('url')) {
        imageUrl = mediaThumbnail.getAttribute('url');
      } else if (enclosure && enclosure.getAttribute('url')) {
          // Tip kontrolü yapmadan çekeriz çünkü bazı RSS'ler yanlış tipler dönebiliyor.
        imageUrl = enclosure.getAttribute('url');
      } else if (imageNodeUrl && imageNodeUrl.textContent && imageNodeUrl.textContent.match(/https?:\/\//i)) {
        imageUrl = imageNodeUrl.textContent.trim().replace('uploadsContents', 'uploads/Contents');
      } else if (imageNode && imageNode.textContent && imageNode.textContent.match(/https?:\/\//i)) {
        imageUrl = imageNode.textContent.match(/(https?:\/\/[^\s'"><\]]+)/i)[1].replace('uploadsContents', 'uploads/Contents');
      } 
      
      // Eğer üstteki DOM metodları CDATA içeriklerini okuyamadıysa raw (saf) HTML/XML içinden zorla bul:
      if (!imageUrl && (item.innerHTML || item.outerHTML)) {
         const rawHtml = item.innerHTML || item.outerHTML;
         const rawMatch = rawHtml.match(/<image>.*?<!\[CDATA\[\s*(https?:\/\/[^\s\]]+)\s*\]\]>.*?<\/image>/i) || rawHtml.match(/<image>.*?(https?:\/\/[^\s'"><\]]+).*?<\/image>/i);
         if (rawMatch && rawMatch[1]) {
            imageUrl = rawMatch[1].replace('uploadsContents', 'uploads/Contents');
         }
      }
      
      if (!imageUrl) {
        // Description veya content:encoded bölümünde HTML olarak gömülü <img src="..." /> etiketi varsa çek.
        let combinedText = description + (contentEncoded ? contentEncoded.textContent : '');
        const imgRegex = /<img[^>]+src=["'](https?:\/\/[^"']+)["']/i;
        const match = imgRegex.exec(combinedText);
        if (match && match[1]) {
          imageUrl = match[1];
        }
      }

      // Description içindeki HTML etiketlerini temizleyelim (Daha şık ve sade bir görünüm için).
      // Bu adım opsiyonel olabilir ancak "Açıklama (Özet)" dendiği için düz metin olması iyidir.
      const tmpDiv = document.createElement('div');
      tmpDiv.innerHTML = description;
      const plainTextDescription = tmpDiv.textContent || tmpDiv.innerText || '';

      newsList.push({
        id: crypto.randomUUID(),
        sourceUrl: url,
        sourceName, // RSS channel title olarak eklendi
        title,
        description: plainTextDescription.substring(0, 200) + '...', // Özet haline getirdik
        link,
        imageUrl,
        date: localDate, // JS Date objesi olarak saklıyoruz, UI'da formatlanacak
      });
    });

    return newsList;

  } catch (error) {
    console.error(`RSS çekilirken hata: ${url}`, error);
    return []; // Hata durumunda boş dizi dönerek patlamasını engelliyoruz.
  }
};
