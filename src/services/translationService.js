// src/services/translationService.js
// Bu servis, ücretsiz bir çeviri API'si kullanarak metinleri Türkçe'ye çevirir.
// Eğer ileride profesyonel bir Google/DeepL API'sine geçilmek istenirse sadece bu dosya değişecektir.

/**
 * Verilen metni otomatik olarak algılayıp Türkçe'ye çevirir.
 * @param {string} text - Çevrilecek orijinal metin
 * @returns {Promise<string>} Çevrilmiş metin
 */
export const translateTextToTurkish = async (text) => {
  if (!text || text.trim() === '') return text;

  try {
    // Google Translate'in ücretsiz (gayriresmi) API uç noktasını kullanarak çeviri yapıyoruz.
    // cliebt=gtx, sl=auto (orijinal dil algılanır), tl=tr (hedef dil Türkçe), dt=t (sadece çeviri metni döner)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=tr&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Çeviri hatası: ${response.status}`);
    }

    const data = await response.json();
    // Gelen data karmaşık bir dizi yapısındadır. Data[0] içinde çevrilmiş parçalar bulunur.
    // Tüm parçaları birleştirerek tam metni elde ediyoruz.
    const translatedText = data[0].map(item => item[0]).join('');
    
    return translatedText;
  } catch (error) {
    console.error('Çeviri işlemi başarısız oldu:', error);
    // Hata olursa en azından orijinal metni göstererek uygulamanın çökmesini engelliyoruz.
    return text;
  }
};
