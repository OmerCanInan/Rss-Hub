const fs = require('fs');
const path = require('path');

console.log('[PostInstall] Capacitor plugin patch\'leri uygulanıyor...\n');

// ─── PATCH 1: Gradle ProGuard düzeltmesi ───────────────────────────────────
const gradlePlugins = [
  'node_modules/@capacitor-community/text-to-speech/android/build.gradle',
  'node_modules/@capacitor-mlkit/translation/android/build.gradle'
];

gradlePlugins.forEach(relativePath => {
  const filePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Bulunamadı: ${relativePath}`);
    return;
  }
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('proguard-android.txt')) {
      content = content.replace(/proguard-android\.txt/g, 'proguard-android-optimize.txt');
      fs.writeFileSync(filePath, content);
      console.log(`✅ Gradle ProGuard düzeltildi: ${relativePath}`);
    } else {
      console.log(`ℹ️  Gradle zaten düzgün: ${relativePath}`);
    }
  } catch (err) {
    console.error(`❌ Hata (${relativePath}):`, err.message);
  }
});

// ─── PATCH 2: ML Kit WiFi kısıtı kaldırma ──────────────────────────────────
// Plugin, model indirme ve çeviri işlemlerinde requireWifi() kullanıyor.
// Bu kısıt, 4G/5G bağlantısında modelin sessizce inmemesine neden oluyor.
// DownloadConditions.Builder().requireWifi() → DownloadConditions.Builder()
const javaFilePath = path.join(
  process.cwd(),
  'node_modules/@capacitor-mlkit/translation/android/src/main/java/io/capawesome/capacitorjs/plugins/mlkit/translation/Translation.java'
);

if (!fs.existsSync(javaFilePath)) {
  console.log('⚠️  Translation.java bulunamadı (patch atlandı)');
} else {
  try {
    let content = fs.readFileSync(javaFilePath, 'utf8');
    const wifiPattern = /new DownloadConditions\.Builder\(\)\.requireWifi\(\)\.build\(\)/g;

    if (wifiPattern.test(content)) {
      // requireWifi() kaldır — koşulsuz indir (WiFi + mobil veri)
      content = content.replace(
        /new DownloadConditions\.Builder\(\)\.requireWifi\(\)\.build\(\)/g,
        'new DownloadConditions.Builder().build()'
      );
      fs.writeFileSync(javaFilePath, content);
      console.log('✅ ML Kit WiFi kısıtı kaldırıldı: Translation.java');
      console.log('   → Artık mobil veriyle (4G/5G) de model indirilecek');
    } else {
      // Zaten patch'li mi kontrol et
      if (content.includes('new DownloadConditions.Builder().build()')) {
        console.log('ℹ️  ML Kit WiFi patch zaten uygulanmış');
      } else {
        console.log('⚠️  ML Kit WiFi pattern bulunamadı — plugin versiyonu değişmiş olabilir');
      }
    }
  } catch (err) {
    console.error('❌ Translation.java patch hatası:', err.message);
  }
}

console.log('\n[PostInstall] Tüm patch\'ler tamamlandı.');
