# Play Store — Veri Güvenliği Formu Doldurma Kılavuzu

Bu belge, Google Play Console'daki **"Uygulama içeriği → Veri güvenliği"** formunu adım adım doldurmanıza yardımcı olur.

---

## 1. Gizlilik Politikası URL'si

Önce `PRIVACY_POLICY.md` dosyasını GitHub Gist olarak yayınlayın:

1. https://gist.github.com adresine gidin
2. Yeni bir **public** gist oluşturun, `PRIVACY_POLICY.md` içeriğini yapıştırın
3. **"Create public gist"** butonuna tıklayın
4. Gist URL'sini kopyalayın (örn: `https://gist.github.com/OmerCanInan/xxxx`)
5. Play Console → **Uygulama içeriği → Gizlilik politikası** → URL'yi yapıştırın

---

## 2. Veri Güvenliği Formu

Play Console → **Uygulama içeriği → Veri güvenliği → Başlayın**

### Bölüm 1: Veri toplama ve paylaşma

| Soru | Cevap |
|------|-------|
| Uygulamanız veri topluyor mu? | **Hayır** — "Bu uygulama herhangi bir veri toplamaz" seçeneğini işaretleyin |

> Groq kullandığınızda bile: bu veriler *siz tarafınızdan* üçüncü tarafa gönderilir, uygulama *toplamaz*.

### Bölüm 2: Güvenlik uygulamaları

| Soru | Cevap | Neden |
|------|-------|-------|
| Veriler aktarım sırasında şifreleniyor mu? | **Evet** | Tüm RSS ve Groq bağlantıları HTTPS/TLS kullanır |
| Kullanıcı verileri silinmesi mümkün mü? | **Evet** | Kullanıcı uygulama verilerini uygulama içinden silebilir |

### Bölüm 3: Veri türleri (hiçbirini seçmeyin)

Uygulamanız aşağıdaki kategorilerden **hiçbirini** toplamadığından kutuları **boş bırakın**:

- Konum, Kişisel bilgiler, Finansal bilgiler, Sağlık, Mesajlar, Fotoğraf/video, Ses, Dosyalar, Takvim, Kişiler, Uygulama etkinliği, Web tarama, Cihaz kimlikleri

---

## 3. Form Sonrası Kontrol Listesi

- [ ] Gist URL'si Play Console'a eklendi
- [ ] Veri güvenliği formu kaydedildi
- [x] `allowBackup="false"` AndroidManifest.xml'de (yapıldı)
- [x] Groq API key Capacitor Preferences ile saklanıyor (yapıldı)
- [x] Tüm ara sunucular ve LibreTranslate kaldırıldı, doğrudan erişime geçildi (yapıldı)
