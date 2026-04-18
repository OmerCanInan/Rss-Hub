# Google Play Store Yayınlama Klavuzu 🚀

Google Play Console'da uygulamayı yayına alırken "Uygulama İçeriği" (App Content) sekmesinde doldurmanız gereken kritik alanlar için hazır şablonlar aşağıdadır.

---

### 1. Haber Uygulaması Beyanı (News App)
**Soru:** Uygulamanız bir haber uygulaması mı?
**Cevap:** Evet.

**Beyan Metni (İstenirse):**
"Gündemim, kamuya açık RSS servislerini kullanarak haberleri bir araya getiren teknik bir araçtır. Uygulama, haber içeriklerine editoryal müdahalede bulunmaz; içerikleri otomatik olarak çeker ve kullanıcıyı doğrudan orijinal kaynağa (yayıncıya) yönlendirir."

---

### 2. Veri Güvenliği (Data Safety) Formu
Bu formda en önemli kısım **"Üçüncü Taraf İşleme"** kısmıdır.

*   **Veri Toplanıyor mu?** Evet (Teknik işleyiş için).
*   **Veriler Paylaşılıyor mu?** Evet (Özetleme için).
    *   **Paylaşılan Veri Türü:** Haber metinleri (Üçüncü taraf içerik).
    *   **Nereye Gidiyor?** Groq (Yapay Zeka Servis Sağlayıcısı).
*   **Kullanıcı Verileri (Özel):** Uygulama hiçbir kişisel bilgi (isim, e-posta, rehber, konum) toplamaz. Her şey yerel cihazda (on-device) saklanır.
*   **Şifreleme:** "Cihaz ile sunucu arasındaki tüm veriler (RSS linkleri ve AI özet istekleri) HTTPS üzerinden güvenli bir şekilde iletilir." (MANIFEST'teki fix'imiz sayesinde).

---

### 3. Gizlilik Politikası URL'si (Zorunlu)
Google, uygulama silinse bile erişilebilen **genel bir URL** ister. 
**Yapmanız Gereken:**
1.  Uygulama içindeki `Legal.jsx` içeriğini kopyalayın.
2.  [GitHub Gist](https://gist.github.com/) veya bir metin paylaşım sitesine yapıştırın.
3.  Oluşan linki Google Play Console'daki "Gizlilik Politikası URL'si" alanına girin.

---

### 4. Teknik Bilgiler (Audit Kontrolü)
*   **Paket Adı (Package ID):** `com.omer.reader` (Senkronize edildi).
*   **Min SDK:** 21 (Android 5.0+).
*   **Target SDK:** 34 (Android 14) veya en günceli.

---

**NOT:** Bu bilgiler uygulamanın V13 (Hardened) sürümüne tam uyumludur. Gönül rahatlığıyla formları doldurabilirsiniz.
