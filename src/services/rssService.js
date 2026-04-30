import { generateUUID } from './dbService';

// ─────────────────────────────────────────────────────
// ETİKET KURALLARI — TR + EN, 500+ anahtar kelime
// ─────────────────────────────────────────────────────
const TAG_RULES = {
  '#oyun': [
    // Türkçe — bileşik ve belirgin formlar ("oyun" tek başına fazla genel)
    'video oyun', 'bilgisayar oyun', 'konsol oyun', 'online oyun', 'mobil oyun',
    'oyun dünyası', 'oyun haberleri', 'oyun inceleme', 'oyun tanıtım',
    'oyun çıkış', 'oyun güncelleme', 'oyun özellikleri', 'oyun modu',
    'indie', 'fps', 'moba', 'rpg', 'gamer',
    'steam', 'playstation', 'ps5', 'ps4', 'xbox', 'nintendo', 'switch ',
    'epic games', 'kayıp rıhtım',
    'esports', 'e-spor', 'e-sports',
    'dlc', 'genışleme paketi', 'remaster', 'game remake', 'erken erişim',
    'battle royale', 'multiplayer', 'singleplayer',
    'fortnite', 'minecraft', 'roblox', 'call of duty', 'valorant',
    'league of legends', 'dota', 'overwatch', 'counter-strike', 'apex legends',
    'cyberpunk', 'elder scrolls', 'skyrim', 'fallout', 'grand theft auto', 'gta',
    'red dead redemption', 'halo', 'god of war', 'zelda', 'pokemon', 'mario',
    'elden ring', 'dark souls', 'baldur', 'diablo', 'world of warcraft',
    'pubg', 'hearthstone', 'starcraft', 'civilization', 'the sims', 'fifa',
    // İngilizce
    'gaming', 'gameplay', 'game review', 'game update', 'game release',
    'video game', 'pc game', 'pc gaming', 'console game', 'mobile game',
    'patch notes', 'expansion pack', 'open world', 'early access',
    'game developer', 'game studio', 'game publisher',
  ],
  '#teknoloji': [
    // Türkçe
    'teknoloji', 'yazılım', 'donanım', 'uygulama', 'uygulaması',
    'akıllı telefon', 'telefon', 'tablet', 'dizüstü', 'laptop', 'bilgisayar',
    'işlemci', 'ekran kartı', 'bellek', 'pil', 'şarj cihazı',
    'sosyal medya', 'internet', 'web sitesi', 'tarayıcı',
    'siber güvenlik', 'fidye yazılım', 'veri ihlali', 'siber saldırı',
    'robot', 'otomasyon', 'bulut bilişim', 'veri merkezi',
    'yapay zeka', 'makine öğrenmesi', 'derin öğrenme',
    'samsung', 'huawei', 'xiaomi', 'oppo', 'realme', 'oneplus',
    // Site domainleri kaldırıldı — içerik bazlı keyword'ler yeterli, site domainleri false positive oluşturuyor
    // İngilizce
    'technology', 'tech', 'hardware', 'software', 'device', 'gadget',
    'smartphone', 'laptop', 'tablet', 'wearable', 'smartwatch',
    'artificial intelligence', 'machine learning', 'deep learning', 'neural network',
    'chatgpt', 'gpt', 'openai', 'gemini', 'claude', 'llm', 'copilot',
    'nvidia', 'amd', 'intel', 'qualcomm', 'arm', 'tsmc',
    'apple', 'google', 'microsoft', 'meta', 'sony',
    // Amazon: sadece AWS/alexa bağlamında — Amazon Prime/e-ticaret false positive önlemi
    'amazon aws', 'amazon web services', 'amazon echo', 'amazon alexa',
    'iphone', 'ipad', 'macbook', 'android', 'ios', 'windows', 'linux', 'macos',
    'chip', 'processor', 'gpu', 'cpu', 'ram', 'vram', 'ssd', 'display', 'screen',
    'cybersecurity', 'hacker', 'breach', 'malware', 'ransomware', 'phishing',
    'cloud', 'saas', 'paas', 'api', 'startup', 'silicon valley',
    'app store', 'play store', 'app launch', 'hands-on review',
  ],
  '#ekonomi': [
    // Türkçe
    'ekonomi', 'ekonomik', 'borsa', 'dolar', 'euro', 'sterlin', 'yen',
    'altın', 'gümüş', 'petrol', 'doğalgaz', 'enerji',
    'finans', 'finansal', 'hisse', 'hisse senedi', 'enflasyon', 'faiz',
    'piyasa', 'piyasalar', 'bütçe', 'ihracat', 'ithalat', 'ticaret',
    'istihdam', 'işsizlik', 'merkez bankası', 'yatırım', 'vergi', 'kamu',
    'zam', 'indirim', 'fiyat artışı', 'pahalılık', 'büyüme', 'resesyon',
    'şirket', 'firma', 'holding', 'şirketler', 'kazanç', 'kâr', 'zarar',
    'ihale', 'sözleşme', 'anlaşma', 'satın alma', 'birleşme', 'devralma',
    'kripto', 'bitcoin', 'ethereum', 'blockchain',
    // Emlak & Gayrimenkul
    'emlak', 'konut', 'gayrimenkul', 'kira', 'ev fiyatları', 'mortgage',
    'konut kredisi', 'inşaat', 'müteahhit',
    // İngilizce
    'economy', 'economic', 'finance', 'financial', 'market', 'markets',
    'stock', 'shares', 'equity', 'bond', 'treasury', 'yield',
    'inflation', 'interest rate', 'federal reserve', 'central bank', 'gdp',
    'recession', 'trade', 'import', 'export', 'deficit', 'surplus', 'debt',
    'earnings', 'revenue', 'profit', 'loss', 'quarterly', 'annual report',
    'merger', 'acquisition', 'ipo', 'investment', 'venture capital',
    'oil price', 'crude oil', 'gold price', 'commodity', 'forex', 'currency',
    'real estate', 'housing', 'mortgage', 'rent', 'property',
    'tariff', 'tax', 'subsidy', 'bailout', 'stimulus',
  ],
  '#spor': [
    // Türkçe
    'spor', 'futbol', 'basketbol', 'voleybol', 'tenis', 'atletizm',
    'yüzme', 'güreş', 'boks', 'mma', 'judo', 'köy olympiyatları', 'olimpiyat',
    'fenerbahçe', 'galatasaray', 'beşiktaş', 'trabzonspor', 'başakşehir',
    'bursaspor', 'adanaspor', 'kayserispor', 'sivasspor', 'antalyaspor',
    'süper lig', 'şampiyon', 'transfer', 'gol', 'maç', 'lig', 'turnuva', 'kupa',
    'milli takım', 'a milli', 'u21', 'u19', 'teknik direktör',
    'antrenman', 'sakat', 'ceza', 'kırmızı kart', 'sarı kart',
    // İngilizce
    'sport', 'sports', 'football', 'soccer', 'basketball', 'tennis', 'golf', 'cricket',
    'boxing', 'mma', 'wrestling', 'athletics', 'swimming', 'cycling',
    'nfl', 'nba', 'mlb', 'nhl', 'mls', 'ufc',
    'premier league', 'la liga', 'serie a', 'bundesliga',
    'champions league', 'europa league', 'uefa', 'fifa', 'world cup',
    'olympic', 'olympics', 'athlete', 'player', 'coach', 'manager',
    'goal', 'match', 'championship', 'tournament', 'trophy', 'transfer window',
    'liverpool', 'manchester', 'real madrid', 'barcelona', 'psg', 'bayern',
    'arsenal', 'chelsea', 'manchester city', 'juventus', 'inter milan',
    'espn', 'sky sports', 'bbc sport',
  ],
  '#dünya': [
    // Türkçe
    'savaş', 'çatışma', 'ittifak', 'diplomasi', 'büyükelçi', 'dışişleri',
    'abd', 'rusya', 'çin', 'ukrayna', 'gazze', 'filistin',
    'ortadoğu', 'avrupa birliği', 'nato', 'yaptırım', 'insani yardım',
    'göç', 'mülteci', 'sığınmacı', 'sel', 'deprem', 'afet',
    'hava saldırısı', 'füze', 'askeri operasyon', 'ateşkes',
    'darbe', 'iç savaş', 'terör', 'terörism', 'bombalama', 'patlama',
    'bm ', 'birleşmiş milletler', 'sınır', 'işgal', 'ambargo',
    'fransa', 'almanya', 'ingiltere', 'japonya', 'hindistan', 'kanada',
    'meksika', 'brezilya', 'avustralya', 'güney kore', 'tayvan',
    // İngilizce
    'war', 'conflict', 'military', 'army', 'navy', 'troops',
    'diplomat', 'diplomacy', 'foreign policy', 'sanctions', 'united nations',
    'politics', 'political', 'government', 'election', 'president',
    'prime minister', 'parliament', 'congress', 'senate', 'vote',
    'russia', 'ukraine', 'china', 'usa', 'iran', 'north korea', 'pakistan',
    'middle east', 'israel', 'gaza', 'west bank', 'lebanon', 'syria',
    'europe', 'asia', 'africa', 'latin america', 'south america',
    'france', 'germany', 'japan', 'india', 'canada', 'australia',
    'geopolitics', 'treaty', 'summit', 'ceasefire', 'peace talks',
    'refugee', 'humanitarian', 'flood', 'earthquake', 'disaster',
    'terrorism', 'bombing', 'explosion', 'border', 'invasion', 'coup',
  ],
  '#türkiye': [
    // TR — şehirler, siyaset, kurumlar
    'türkiye', 'ankara', 'istanbul', 'izmir', 'bursa', 'adana', 'konya',
    'antalya', 'gaziantep', 'mersin', 'kayseri', 'trabzon', 'eskişehir',
    'samsun', 'diyarbakır', 'şanlıurfa', 'malatya', 'van', 'erzurum',
    'erdoğan', 'cumhurbaşkanı', 'meclis', 'tbmm', 'hükümet',
    'bakanlık', 'bakan ', 'başbakan', 'seçim', 'yerel seçim', 'muhalefet',
    'chp', 'akp', 'mhp', 'iyi parti', 'deva', 'hdp', 'dem parti',
    'türk ', 'türk lirası', 'türk ordusu', 'jandarma', 'emniyet',
    // Siyaset & Hukuk
    'siyaset', 'politika', 'siyasi', 'anayasa', 'yasa', 'kanun',
    'mahkeme', 'savcı', 'hakim', 'dava', 'tutuklama', 'gözaltı',
    'polis', 'asayiş', 'cinayet', 'soruşturma', 'ceza',
    // Eğitim
    'üniversite', 'öğrenci', 'öğretmen', 'okul', 'eğitim',
    'yks', 'kpss', 'ales', 'sınav', 'müfredat', 'burs',
    // EN eşleniği
    'turkey', 'turkish', 'ankara', 'istanbul', 'erdogan', 'anatolia',
  ],
  '#bilim': [
    // Türkçe
    'bilim', 'bilimsel', 'uzay', 'astronomi', 'arkeoloji', 'keşif', 'keşfedildi',
    'deney', 'araştırma', 'araştırmacılar', 'iklim değişikliği', 'küresel ısınma',
    'çevre', 'ekoloji', 'biyoloji', 'evrim', 'genetik', 'virüs', 'bakteri',
    'fizik', 'kimya', 'matematik', 'hesaplama', 'kuantum',
    'fosil', 'dinozor', 'meteor', 'asteroid', 'gezegen', 'kara delik',
    'roket', 'uydu', 'uzay istasyonu', 'teleskop', 'mars', 'ay',
    // İngilizce
    'science', 'scientific', 'research', 'study', 'researchers', 'scientists',
    'discovery', 'experiment', 'laboratory', 'published', 'journal',
    'space', 'nasa', 'spacex', 'esa ', 'astronomy', 'planet', 'star',
    'galaxy', 'black hole', 'supernova', 'comet', 'moon', 'mars',
    'archaeology', 'fossil', 'dinosaur', 'climate change', 'global warming',
    'biology', 'physics', 'chemistry', 'genetics', 'evolution', 'quantum',
    'nature ', 'science daily', 'new scientist', 'scientific american',
  ],
  '#sağlık': [
    // Türkçe
    'sağlık', 'hastalık', 'tedavi', 'ilaç', 'ilaçlar', 'hastane', 'klinik',
    'doktor', 'uzman', 'hekim', 'hemşire', 'ameliyat', 'cerrahi',
    'salgın', 'aşı', 'bağışıklık', 'pandemi', 'virüs', 'koronavirüs',
    'kanser', 'diyabet', 'obezite', 'hipertansiyon', 'kalp hastalığı',
    'psikoloji', 'ruh sağlığı', 'depresyon', 'anksiyete', 'uyku',
    'beslenme', 'diyet', 'spor beslenmesi', 'takviye', 'vitamin',
    'sağlık bakanlığı', 'dünya sağlık örgütü',
    // İngilizce
    'health', 'healthcare', 'medicine', 'medical', 'hospital', 'clinic',
    'doctor', 'vaccine', 'vaccination', 'drug', 'treatment', 'therapy',
    'disease', 'illness', 'virus', 'bacteria', 'pandemic', 'epidemic',
    'cancer', 'diabetes', 'obesity', 'heart disease', 'stroke',
    'mental health', 'depression', 'anxiety', 'sleep', 'wellness',
    'nutrition', 'diet', 'exercise', 'fitness', 'supplement', 'vitamin',
    'who ', 'fda', 'cdc', 'nih ', 'pfizer', 'moderna', 'biontech',
    'webmd', 'healthline', 'mayo clinic', 'medscape',
  ],
  '#otomobil': [
    // Türkçe
    'otomobil', 'araç', 'araba', 'trafik', 'sürücü', 'sürüş', 'ehliyet',
    'togg', 'elektrikli araç', 'hibrit', 'motor', 'yakıt', 'benzin', 'dizel',
    'lastik', 'jant', 'fren', 'şanzıman', 'vites', 'airbag', 'egzoz',
    'sedan', 'hatchback', 'crossover', 'pickup',
    'park', 'kaza', 'çarpışma', 'trafik kazası', 'otoyol', 'karayolu',
    'fiyat listesi', 'oto fırsatları', 'sıfır araç', 'ikinci el',
    'otomobil fuarı', 'araç testi', 'test sürüşü',
    // İngilizce
    'car', 'cars', 'vehicle', 'automobile', 'automotive', 'truck', 'suv',
    'electric vehicle', 'ev ', 'hybrid', 'self-driving', 'autonomous',
    'tesla', 'bmw', 'mercedes', 'toyota', 'ford', 'gm', 'volkswagen',
    'audi', 'porsche', 'ferrari', 'lamborghini', 'rivian', 'lucid',
    'hyundai', 'kia', 'nissan', 'honda', 'mazda', 'volvo', 'renault',
    'tire', 'tires', 'brake', 'engine', 'horsepower', 'torque',
    'driving', 'fuel', 'mpg', 'charging', 'range anxiety',
    'f1', 'formula 1', 'formula e', 'motor racing', 'rally',
  ],
  '#yapay-zeka': [
    // TR + EN (Özelleşmiş — teknoloji ile örtüşebilir ama detaylı)
    'yapay zeka', 'büyük dil modeli', 'sohbet botu', 'chatbot', 'otomasyon',
    'yapay zekâ', 'yapay zekanın', 'zeka', 'dil modeli',
    'artificial intelligence', 'machine learning', 'deep learning', 'neural network',
    'chatgpt', 'gpt-4', 'gpt-5', 'gpt-4o', 'openai', 'anthropic',
    'gemini', 'claude', 'llama', 'mistral', 'grok', 'phi ',
    'copilot', 'midjourney', 'stable diffusion', 'dall-e', 'sora',
    'ai model', 'llm', 'generative ai', 'gen ai', 'agi ', 'transformer',
    'prompt', 'fine-tuning', 'inference', 'hallucination',
    'hugging face', 'replicate', 'runway', 'elevenlabs',
  ],
  '#kripto': [
    'kripto', 'bitcoin', 'btc', 'ethereum', 'eth', 'blockchain',
    'nft', 'defi', 'altcoin', 'stablecoin', 'token', 'web3',
    'cryptocurrency', 'crypto', 'binance', 'coinbase', 'kraken',
    'solana', 'xrp', 'ripple', 'dogecoin', 'shiba', 'cardano',
    'metaverse', 'mining', 'wallet', 'exchange', 'decentralized',
    'bull run', 'bear market', 'halving',
  ],
  '#sinema-tv': [
    // Türkçe
    'sinema', 'film', 'dizi', 'fragman', 'yönetmen', 'oyuncu kadrosu',
    'sinema filmi', 'yeni film', 'film inceleme', 'film eleştiri', 'film fragmanı',
    'fragman yayınlandı', 'yeni fragman', 'ön izleme fragmanı',
    'türk dizisi', 'yeni dizi', 'dizi inceleme', 'dizi önerisi',
    'netflix dizi', 'netflix filmi', 'netflix özgün', 'dizi final',
    'yeni sezon', 'sezon finali', 'ikinci sezon', 'yeni bölüm',
    'yönetmen koltuğu', 'başrol oyuncu', 'ödül töreni',
    'oscar ödülü', 'emmy ödülü', 'altın küre', 'sinema salonu',
    'box office rekoru', 'gişe rekoru', 'izlenme rekoru',
    'streaming platformu', 'yayın platformu',
    // İngilizce — tek kelimelik güçlü sinyaller + bileşik formlar
    'movie', 'cinema', 'trailer', 'actor', 'actress', 'director',
    'sequel', 'prequel', 'spin-off', 'reboot', 'remake film',
    'streaming', 'blockbuster', 'screenplay', 'box office',
    'tv series', 'tv show', 'film series', 'movie series',
    'movie trailer', 'film trailer', 'official trailer', 'teaser trailer',
    'new season', 'season finale', 'season premiere', 'new episode',
    'new movie', 'cinema release', 'theatrical release',
    'movie review', 'film review', 'show review',
    'netflix original', 'hbo series', 'hbo max', 'disney plus',
    'amazon prime video', 'apple tv plus',
    'netflix', 'disney+', 'hulu', 'paramount+', 'peacock',
    'hbo', 'showtime', 'binge-watch',
    'best actor', 'best actress', 'best director', 'best picture',
    'emmy', 'golden globe', 'bafta', 'oscar', 'cannes', 'sundance',
    'superhero movie', 'animated film', 'documentary',
  ],
  '#yaşam': [
    // Türkçe — günlük yaşam, lifestyle, kültür
    'yaşam', 'yaşam tarzı', 'moda', 'güzellik', 'makyaj', 'stil',
    'ev dekorasyonu', 'mobilya', 'mutfak', 'tarif', 'yemek', 'restoran',
    'seyahat', 'tatil', 'otel', 'turizm', 'vizyon', 'kültür',
    'müzik', 'konser', 'sanat', 'sergi', 'tiyatro', 'dans', 'edebiyat',
    'kitap', 'roman', 'şiir', 'hobi', 'bahçe', 'evcil hayvan',
    'tarım', 'çiftçi', 'hasat', 'gıda', 'organik',
    'hava durumu', 'sıcaklık', 'yağmur', 'kar yağışı', 'fırtına',
    'astroloji', 'burç', 'ilişki', 'evlilik', 'düğün',
    // İngilizce
    'lifestyle', 'fashion', 'beauty', 'makeup', 'style', 'trend',
    'food', 'recipe', 'restaurant', 'cuisine', 'cooking', 'travel',
    'hotel', 'vacation', 'tourism', 'culture', 'art', 'music', 'concert',
    'book', 'novel', 'literature', 'hobby', 'garden', 'pet',
    'weather', 'farming', 'agriculture', 'organic',
    'relationship', 'wedding', 'parenting',
  ],
  '#iş-dünyası': [
    // Türkçe
    'şirket', 'şirketler', 'ceo', 'genel müdür', 'yönetim kurulu',
    'girişim', 'startup', 'inovasyon', 'ar-ge', 'marka',
    'pazarlama', 'reklam', 'e-ticaret', 'e-commerce', 'satış',
    'işe alım', 'çalışan', 'kariyer', 'iş ilanı',
    'üretim', 'fabrika', 'tedarik zinciri', 'lojistik',
    // İngilizce
    'company', 'companies', 'business', 'corporate', 'ceo', 'executive',
    'entrepreneur', 'founder', 'venture', 'funding', 'series a', 'series b',
    'marketing', 'brand', 'advertising', 'e-commerce', 'retail',
    'employee', 'hiring', 'layoff', 'remote work', 'office',
    'supply chain', 'logistics', 'manufacturing', 'factory',
  ],
};

// ─────────────────────────────────────────────────────
// EXPORT EDİLEN ETİKET ÜRETME FONKSİYONU
// Hem yeni fetch'lerde hem de cache retroaktif tag'lamasında kullanılır.
// ─────────────────────────────────────────────────────
export const generateTags = (title = '', description = '', sourceName = '') => {
  const lowerAll = (title + ' ' + description + ' ' + sourceName).toLowerCase();

  const matchesKeyword = (text, kw) => {
    const idx = text.indexOf(kw);
    if (idx === -1) return false;
    const wordChars = /[a-zA-Z0-9ğüşıöçĞÜŞİÖÇ]/;
    // SOL SINIR: Tüm keyword'ler için kontrol et
    // "feared dead" → "red dead" gibi false positive'leri önler
    if (idx > 0) {
      const before = text[idx - 1];
      if (wordChars.test(before)) return false;
    }
    // SAĞ SINIR: 1-6 karakter arası tek kelimelik keyword'lerde ek sınır
    // ("oyun" → "oyunlarıyla", "tech" → "techcrunch" gibi prefix false positive'ler)
    if (kw.length <= 6 && !kw.includes(' ')) {
      const after = idx + kw.length >= text.length ? '' : text[idx + kw.length];
      if (wordChars.test(after)) return false;
    }
    return true;
  };

  const tags = [];
  Object.entries(TAG_RULES).forEach(([tag, keywords]) => {
    if (keywords.some(kw => matchesKeyword(lowerAll, kw))) {
      tags.push(tag);
    }
  });

  // --- AKILLI DİL ALGILAMA (V13) ---
  const isTurkish = /[ğüşıöçĞÜŞİÖÇ]/.test(title + ' ' + description);
  if (isTurkish) {
    tags.push('#tr');
  } else {
    // Türkçe değilse (veya karakter yoksa) yabancı dil olduğunu varsayabiliriz
    tags.push('#en'); // Genel yabancı dil etiketi
  }

  // Hiçbir kategoriye uymayan haberler için genel tag
  if (tags.length === 0) tags.push('#genel');

  return tags;
};


export const fetchRssFeed = async (url, signal = null, timeoutMs = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let xmlText = '';
    let cleanUrl = url.trim();

    if (cleanUrl.includes('tass.com')) {
      cleanUrl += (cleanUrl.includes('?') ? '&' : '?') + 'bypass=' + new Date().getTime();
    }

    if (cleanUrl.includes('euronews.com')) {
      cleanUrl = cleanUrl.split('?')[0];
    }

    // --- PC (Electron) GÜVENLİ ÇEKİM ---
    if (window.electronAPI && typeof window.electronAPI.fetchRss === 'function') {
      try {
        xmlText = await window.electronAPI.fetchRss(cleanUrl, timeoutMs);
        if (!xmlText) throw new Error('Fetch aborted or empty in electron');
        // Devam ediyoruz, aşağıda parse edilecek.
      } catch (err) {
        throw err;
      }
    } else if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorHttp) {
      try {
        const { CapacitorHttp } = window.Capacitor.Plugins;
        const capResponse = await CapacitorHttp.get({
          url: cleanUrl,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          connectTimeout: 10000,
          readTimeout: 10000
        });
        if (capResponse.status >= 200 && capResponse.status < 300) {
          xmlText = capResponse.data;
        } else {
          throw new Error(`CapacitorHttp error: ${capResponse.status}`);
        }
      } catch (err) {
        console.warn("CapacitorHttp failed, falling back to fetch:", err);
      }
    }

    if (!xmlText) {
      // --- NORMAL FETCH (Mobil Fallback / Web) ---
      // AbortSignal.any() polyfill/alternative for older WebView/Electron
      let activeSignal = controller.signal;
      if (signal) {
        if (typeof AbortSignal.any === 'function') {
          activeSignal = AbortSignal.any([signal, controller.signal]);
        } else {
          // Fallback: If either signal aborts, the fetch will be cancelled (limited support)
          // Note: In older environments we prioritize the main timeout controller
          activeSignal = controller.signal;
        }
      }

      const fetchOptions = {
        signal: activeSignal,
        cache: 'default',
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      };

      try {
        const response = await fetch(cleanUrl, fetchOptions);
        if (!response.ok) {
          throw new Error(`Sunucu Hatası (${response.status})`);
        }
        xmlText = await response.text();
      } catch (err) {
        // CORS Proxy (allorigins) güvenilirlik ve gizlilik gerekçesiyle kaldırıldı.
        // Masaüstü ve Mobil sürümlerde zaten native fetch kullanıldığı için bu bölüme nadiren düşülür.
        console.error(`Direct fetch failed for ${cleanUrl}:`, err);
        throw new Error(`Haber kaynağına bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.`);
      }
    }

    clearTimeout(id);

    // BOŞ VEYA HATALI İÇERİK KONTROLÜ
    if (!xmlText || xmlText.trim().length === 0 || !xmlText.includes('<')) {
      throw new Error('Geçersiz XML içeriği alındı.');
    }

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

    if (items.length === 0) {
      console.warn(`[RSS] Kaynak başarılı ancak haber bulunamadı (Bot engeli olabilir): ${url}`);
    }

    items.forEach((item) => {
      // Başlık, açıklama ve linki XML içinden alıyoruz
      const title = item.querySelector('title')?.textContent || 'Başlıksız';
      let description = item.querySelector('description')?.textContent || item.querySelector('summary')?.textContent || '';

      // Atom feed'lerde link attr href içindedir
      let link = '#';
      // RSS link tagı
      const linkNode = item.querySelector('link');
      if (linkNode) {
        link = linkNode.textContent.trim();
        // Eğer text boşsa attribute (Atom) kontrol et
        if (!link || link.startsWith('\n')) {
          link = linkNode.getAttribute('href') || '#';
        }
      }

      // Bazı feedlerde link guid içinde olabilir
      if (link === '#' || !link.startsWith('http')) {
        const guidNode = item.querySelector('guid');
        if (guidNode && guidNode.textContent.startsWith('http')) {
          link = guidNode.textContent.trim();
        }
      }

      // Link hala relative ise (/) ana domain ile birleştir
      if (link.startsWith('/') && !link.startsWith('//')) {
        try {
          const rootUrl = new URL(url);
          link = `${rootUrl.protocol}//${rootUrl.hostname}${link}`;
        } catch (e) { }
      }

      // Tarih Parsing (RSS: pubDate, Atom: published/updated)
      let pubDateStr = item.querySelector('pubDate')?.textContent || item.querySelector('published')?.textContent || item.querySelector('updated')?.textContent;
      
      let localDate;
      if (pubDateStr) {
        localDate = new Date(pubDateStr);
      } else {
        // Tarih yoksa: Kullanıcının "aynı tarihte ise spama at" kuralına takılması için hepsine aynı saniyeyi ver
        localDate = new Date();
      }

      // GELECEK TARİH KORUMASI: Eğer haber gelecekten geliyorsa (timezone hatası vb.), şimdiki zamanı ata.
      const now = new Date();
      const isMissingDate = !pubDateStr;
      if (localDate > now && !isMissingDate) {
        localDate = now;
      }
      

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
      const tmpDiv = document.createElement('div');
      tmpDiv.innerHTML = description;
      const plainTextDescription = tmpDiv.textContent || tmpDiv.innerText || '';

      // ETİKETLEME — ortak generateTags fonksiyonu kullanılıyor
      const tags = generateTags(title, plainTextDescription, sourceName);

      const rawLink = link && link !== '#' ? link.split('?')[0] : '';
      const stableId = (title.trim().toLowerCase() + "||" + rawLink).substring(0, 200);

      newsList.push({
        id: stableId,
        sourceUrl: url,
        sourceName,
        title,
        description: plainTextDescription.substring(0, 200) + '...',
        link,
        imageUrl,
        date: localDate,
        tags
      });
    });

    // --- AKILLI SPAM FİLTRESİ (V11) ---
    const timeCount = {};
    newsList.forEach(item => {
      const ts = Math.floor(item.date.getTime() / 1000);
      timeCount[ts] = (timeCount[ts] || 0) + 1;
    });

    return newsList.map(item => {
      const ts = Math.floor(item.date.getTime() / 1000);
      // KESİN KURAL: Aynı saniyede, aynı kaynaktan 5+ haber gelirse içeriğe bakmadan SPAM say.
      item.isSpam = timeCount[ts] >= 5;
      return item;
    });

  } catch (error) {
    console.error(`RSS çekilirken hata: ${url}`, error);
    throw error;
  }
};
