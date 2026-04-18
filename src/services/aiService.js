// src/services/aiService.js
import { getGroqApiKey } from './dbService';

/**
 * Verilen RSS haber nesnelerini (Title + Description) alıp Groq API'ye
 * gönderir ve genel bir özet metni döndürür.
 * 
 * YASAL UYARI: Bu işlem web scraping (veri kazıma) içermez. Sadece RSS standartlarıyla 
 * ücretsiz ve yayıncı onaylı sunulan "title" ve "description" metinlerini okur.
 */
export const summarizeNewsWithGemini = async (newsItems, category = 'Genel Haberler') => {
  const apiKey = await getGroqApiKey();
  if (!apiKey) {
    throw new Error('Lütfen Gündem (Ayarlar) sekmesinden Groq API anahtarınızı girin.');
  }

  // Daha geniş bir pencereden (50 haber) en önemli ve çeşitli olanları seçebilmesi için limiti artırdık
  const itemsToSummarize = newsItems.slice(0, 50);
  
  if (itemsToSummarize.length === 0) {
    throw new Error('Özetlenecek haber bulunamadı.');
  }

  // Format the input purely based on provided RSS data (Fair Use)
  const summaryInputs = itemsToSummarize.map((item, idx) => {
     const desc = item.description ? item.description.substring(0, 250).replace(/<[^>]+>/g, '') : 'Yok';
     return `[HABER ${idx + 1}]\nBAŞLIK: ${item.title}\nÖZET: ${desc}\nKAYNAK: ${item.sourceName || 'Bilinmiyor'}\nLİNK: ${item.link || ''}\n---`;
  }).join('\n');

  // Kategoriye özel talimat ekle
  const categoryContext = category !== 'Genel Haberler' && category !== 'Tüm Haberler' 
    ? `Şu an "${category}" klasöründeki haberleri özetliyorsun. Lütfen bu konu odağından sapma.`
    : `Tüm kategorilerden karışık haberler özetliyorsun.`;

  const systemPrompt = `Sen profesyonel bir haber editörü ve küratörüsün. Sana sunulan haber listesinden en önemli gelişmeleri seçip %100 TÜRKÇE bir bülten oluşturacaksın.
  
HAYATİ KURALLAR:
1. DİL: Kesinlikle %100 TÜRKÇE. İngilizce haberleri çevirerek özetle.
2. BAĞLAM: ${categoryContext}
3. ÇEŞİTLİLİK: Farklı kaynaklardan en önemli gelişmeleri seç.
4. FORMAT (ÇOK ÖNEMLİ): 
   - Sadece "### Kategori Adı" (h3) başlığını kullan. 
   - Haberleri "• **Haber Başlığı**: Özet metni... [Haber ↗](LİNK_URL_BURAYA) {{KAYNAK}}" formatında ver.
   - ÖRNEK: • **Tıpta Yeni Buluş**: Kanser araştırmalarında yeni bir evreye geçildi. [Haber ↗](https://...) {{DonanımHaber}}
   - Başka hiçbir başlık seviyesi (#### vb.) veya karmaşık işaretleme kullanma.
   - Her haber maddesi bir satır (bullet) olsun.
5. SADE OL: Gereksiz giriş-çıkış cümleleri kurma, doğrudan habere gir.`;

  const url = `https://api.groq.com/openai/v1/chat/completions`;
  const cleanKey = apiKey.trim();

  // 1. DİNAMİK MODEL TESPİTİ
  let targetModel = 'llama3-70b-8192'; 
  try {
     const listUrl = `https://api.groq.com/openai/v1/models`;
     const listRes = await fetch(listUrl, {
         headers: { 'Authorization': `Bearer ${cleanKey}` }
     });
     if (listRes.ok) {
        const listData = await listRes.json();
        const models = listData.data || [];
        
        const validModels = models.filter(m => m.id.toLowerCase().includes('llama') && !m.id.toLowerCase().includes('vision') && !m.id.toLowerCase().includes('tool'));
        
        if (validModels.length > 0) {
            const bestModel = validModels.find(m => m.id.includes('70b-versatile'))
                           || validModels.find(m => m.id.includes('70b'))
                           || validModels.find(m => m.id.includes('8b-instant'))
                           || validModels[0];
            
            targetModel = bestModel.id;
        }
     }
  } catch (err) {
     console.warn("Groq model listesi çekilemedi, varsayılan deneniyor.", err);
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanKey}`
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `HABERLER:\n${summaryInputs}\n\nÖNEMLİ HATIRLATMA: Lütfen raporu tamamen Türkçe hazırla ve İngilizce haberleri Türkçeye çevir.` }
        ],
        temperature: 0.3,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
        let errorReason = '';
        const errData = await response.json().catch(() => ({}));
        if (errData && errData.error && errData.error.message) {
            errorReason = `\nDetay: ${errData.error.message}`;
        }
        throw new Error(`Groq Bağlantı Hatası (Durum: ${response.status})${errorReason}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    
    if (!text) {
      throw new Error('Yapay zeka geçerli bir metin döndürmedi.');
    }
    
    return text;
  } catch (err) {
    console.error("AI Summarize Error:", err);
    throw new Error(err.message || 'Özetleme işlemi sırasında bilinmeyen bir hata oluştu.');
  }
};
