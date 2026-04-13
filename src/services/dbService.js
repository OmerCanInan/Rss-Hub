// src/services/dbService.js
// Uygulamamızda veritabanı olarak şimdilik LocalStorage kullanıyoruz.
// Clean Architecture prensiplerine uymak için veritabanı işlemlerini bu serviste soyutladık (abstract ettik).
// Yarın SQLite veya IndexDB'ye geçmek istersek sadece bu dosyayı değiştirmemiz yeterli olacak.

const DB_KEY = 'rss_links_db';

/**
 * Veritabanından tüm RSS linklerini getirir.
 * @returns {Array<{id: string, url: string, addedAt: string}>} RSS link objeleri
 */
export const getRssLinks = () => {
  try {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Veritabanından okunurken hata oluştu:', error);
    return [];
  }
};

/**
 * Veritabanına yeni bir RSS linki ekler. Aynı URL varsa eklemez.
 * @param {string} url - RSS bağlantısı
 * @returns {Object} Eklenen RSS link objesi veya var olan
 */
export const addRssLink = (url) => {
  const links = getRssLinks();
  const existing = links.find(link => link.url === url);
  
  if (existing) return existing;

  const newLink = {
    id: crypto.randomUUID(), // Benzersiz ID
    url,
    addedAt: new Date().toISOString() // Sistemde tarihlerin standart tutulması (ISO 8601)
  };

  links.push(newLink);
  localStorage.setItem(DB_KEY, JSON.stringify(links));
  return newLink;
};

/**
 * ID'si verilen RSS linkini veritabanından siler.
 * @param {string} id - Silinecek linkin ID'si
 */
export const deleteRssLink = (id) => {
  let links = getRssLinks();
  links = links.filter(link => link.id !== id);
  localStorage.setItem(DB_KEY, JSON.stringify(links));
};
