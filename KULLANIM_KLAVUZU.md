# 📱 Portföy Takip Sistemi - Kullanım Kılavuzu

Hoş geldiniz! Bu kılavuz, yatırım portföyünüzü etkili bir şekilde takip etmeniz için ihtiyacınız olan her şeyi içermektedir.

---

## 📋 İçindekiler

1. [Uygulamanın Yetenekleri](#-uygulamanın-yetenekleri)
2. [Hızlı Başlangıç](#-hızlı-başlangıç)
3. [Adım Adım Kullanım](#-adım-adım-kullanım)
4. [Önemli Bilgiler ve İpuçları](#-önemli-bilgiler-ve-i̇puçları)
5. [Sıkça Sorulan Sorular (SSS)](#-sıkça-sorulan-sorular-sss)

---

## 🎯 Uygulamanın Yetenekleri

### 💰 Desteklenen Varlık Türleri

Portföy Takip Sistemi, geniş bir varlık yelpazesini destekler:

| Varlık Türü | Örnekler | Özellikler |
|-------------|----------|-----------|
| **🪙 Altın** | Çeyrek, Yarım, Tam, Cumhuriyet, Gram, Has Altın, 14-18-22 Ayar Bilezik | 12 farklı altın çeşidi |
| **🥈 Gümüş** | Gram Gümüş, Gümüş Külçe, Gümüş Bilezik, Gümüş Ons | 4 farklı gümüş çeşidi |
| **🇹🇷 BIST Hisseleri** | THYAO, GARAN, ISCTR, PETKM | Borsa İstanbul hisseleri |
| **🌍 Yabancı Hisse** | AAPL, GOOGL, MSFT, TSLA | Uluslararası hisse senetleri |
| **💼 Yatırım Fonları** | A tipi fon, B tipi fon | Katılım ve diğer yatırım fonları |
| **₿ Kripto Para** | Bitcoin, Ethereum, BNB | Tüm kripto paralar |
| **📕 Eurobond** | Hazine bonosu, Kurumsal tahvil | Döviz cinsinden tahviller |
| **📦 ETF** | SPY, QQQ, DIA | Yatırım fonları sepeti |
| **💵 Nakit** | TRY, USD, EUR, GBP, CHF, ve daha fazlası | Tüm para birimleri |

### ✨ Ana Özellikler

#### 📊 **Dashboard ve Portföy Görünümü**
- 📈 **Toplam Portföy Değeri**: Tüm varlıklarınızın toplam değerini görün
- 💹 **Kar/Zarar Takibi**: Anlık kar/zarar durumunuzu TRY veya USD cinsinden izleyin
- 📱 **Mobil-First Tasarım**: Telefon, tablet ve bilgisayarda kusursuz çalışır
- 🌙 **Karanlık Mod**: Göz dostu karanlık tema desteği
- 🎨 **Varlık Grupları**: Varlıklarınız türlerine göre organize edilmiş gruplar halinde

#### 🔄 **İşlem Yönetimi**
- ➕ **Kolay Alış**: Hızlı ve basit alış işlemi ekleme
- ➖ **Satış İşlemleri**: Otomatik bakiye kontrolü ile satış yapma
- 📝 **İşlem Notları**: Her işleme özel notlar ekleyebilme
- 📅 **Tarihli İşlemler**: Geçmiş veya gelecek tarihli işlem ekleme
- 💱 **Çoklu Para Birimi**: TRY, USD, EUR desteği

#### 📐 **Otomatik Hesaplamalar**
- 🧮 **Ortalama Maliyet**: Her varlık için otomatik ortalama maliyet hesaplama
- 💰 **Toplam Tutar**: Alış ve satış işlemlerinden net tutar hesaplama
- 📊 **Kar/Zarar Oranı**: Yüzde bazında getiri hesaplama
- 🔢 **Net Miktar**: Alış - Satış = Net Pozisyon hesaplama

#### 🎯 **Gelişmiş Özellikler**
- 🔍 **Detaylı Varlık Görünümü**: Her varlığa tıklayarak tüm işlem geçmişini görme
- 🔐 **Güvenli Bakiye Kontrolü**: Yetersiz bakiye ile işlem yapamama
- ⚡ **Anlık Güncellemeler**: Her işlemde otomatik sayfa yenileme
- 📱 **Daraltılabilir Gruplar**: Varlık gruplarını açıp kapatarak düzenli görünüm

---

## 🚀 Hızlı Başlangıç

### Adım 1: İlk Giriş Yapın
1. Uygulamayı açın: `http://localhost:3000`
2. Hesap oluşturun veya mevcut hesabınızla giriş yapın
3. Dashboard sayfasına yönlendirileceksiniz

### Adım 2: İlk İşleminizi Ekleyin (Önemli!)

⚠️ **ÖNEMLİ**: Herhangi bir varlık almadan önce portföyünüze nakit eklemelisiniz!

#### Nakit Ekleme (İlk Adım)
1. Sağ üst köşedeki **"Yeni İşlem"** butonuna tıklayın
2. **Varlık Türü**: `Nakit` seçin
3. **Varlık Adı**: `💵 Türk Lirası` (veya istediğiniz para birimi)
4. **İşlem Türü**: `ALIŞ` seçin
5. **Miktar**: Portföyünüze eklemek istediğiniz nakit miktarı (örn: `10000`)
6. **Birim Fiyat**: `1` yazın (nakit için her zaman 1)
7. **İşlemi Ekle** butonuna tıklayın

✅ Artık kasanızda nakit var ve varlık satın alabilirsiniz!

### Adım 3: İlk Varlığınızı Alın
1. **"Yeni İşlem"** butonuna tekrar tıklayın
2. Varlık türünü ve adını seçin (örn: Altın → Gram Altın)
3. Alış miktarını ve birim fiyatını girin
4. İşlemi ekleyin

🎉 Tebrikler! Artık portföyünüzde ilk varlığınız var.

---

## 📖 Adım Adım Kullanım

### 1️⃣ Nakit Yönetimi

#### Nakit Ekleme
```
Senaryo: Bankadan 50.000 TL para yatırdınız
```
1. `Yeni İşlem` → `Nakit` → `💵 Türk Lirası`
2. İşlem Türü: `ALIŞ`
3. Miktar: `50000`
4. Birim Fiyat: `1` (önemli!)
5. Para Birimi: `TRY`
6. İşlemi Ekle

#### Farklı Para Birimleri
```
Örnek: Döviz bürosundan 1000 USD aldınız
```
1. `Yeni İşlem` → `Nakit` → `💵 Amerikan Doları`
2. İşlem Türü: `ALIŞ`
3. Miktar: `1000`
4. Birim Fiyat: `1`
5. Para Birimi: `USD`
6. İşlemi Ekle

💡 **İpucu**: Özel para birimleri için "✏️ Özel Para Birimi" seçeneğini kullanın (SAR, AED, vb.)

---

### 2️⃣ Altın İşlemleri

#### Altın Alışı
```
Senaryo: Kuyumcudan 10 gram altın aldınız, gram fiyatı 2.450 TL
```
1. `Yeni İşlem` → `Altın` → `Gram Altın`
2. İşlem Türü: `ALIŞ`
3. Miktar: `10`
4. Birim Fiyat: `2450`
5. Para Birimi: `TRY`
6. Not (opsiyonel): "Mahalle kuyumcusu - Fatura No: 123"
7. İşlemi Ekle

✅ **Sistem kontrolleri**:
- Kasanızda `24.500 TL` var mı? → Varsa işlem onaylanır
- Yoksa → "Yetersiz bakiye" hatası alırsınız

#### Altın Satışı
```
Senaryo: 5 gram altını 2.500 TL'den sattınız
```
1. Varlığa tıklayın → `Satış Yap` (veya Yeni İşlem)
2. İşlem Türü: `SATIŞ`
3. Miktar: `5` (mevcut: 10 gram)
4. Birim Fiyat: `2500`
5. İşlemi Ekle

✅ **Sistem kontrolleri**:
- Portföyünüzde `5 gram` var mı? → Varsa işlem onaylanır
- 10 gramdan fazla satmaya çalışırsanız → "Yetersiz miktar" hatası

📊 **Otomatik Hesaplamalar**:
- Ortalama Maliyet: `2.450 TL`
- Net Pozisyon: `5 gram` (10 - 5)
- Kar: `250 TL` (5 gram × 50 TL fark)
- Kar Yüzdesi: `+2.04%`

---

### 3️⃣ Hisse Senedi İşlemleri

#### BIST Hisse Alımı
```
Senaryo: 100 adet THYAO hissesi 320 TL'den aldınız
```
1. `Yeni İşlem` → `BIST` → Manuel giriş
2. Varlık Adı: `THYAO`
3. İşlem Türü: `ALIŞ`
4. Miktar: `100`
5. Birim Fiyat: `320`
6. Para Birimi: `TRY`
7. İşlemi Ekle

💰 **Toplam Tutar**: 100 × 320 = `32.000 TL`

#### Sürekli Alım Stratejisi (Ortalamalama)
```
Senaryo: Farklı zamanlarda farklı fiyatlardan aynı hisseyi aldınız
```
**1. Alım**: 100 adet @ 320 TL = 32.000 TL  
**2. Alım**: 50 adet @ 300 TL = 15.000 TL  
**3. Alım**: 50 adet @ 340 TL = 17.000 TL

📊 **Sistem Hesaplaması**:
- Toplam Miktar: `200 adet`
- Toplam Harcama: `64.000 TL`
- Ortalama Maliyet: `64.000 ÷ 200 = 320 TL`

💡 Bu sayede farklı zamanlarda yaptığınız alımların gerçek maliyetini görürsünüz!

---

### 4️⃣ Kripto Para İşlemleri

#### Bitcoin Alımı
```
Senaryo: 0.5 BTC, birim fiyatı 2.500.000 TL
```
1. `Yeni İşlem` → `Kripto Para` → Manuel giriş
2. Varlık Adı: `Bitcoin` veya `BTC`
3. İşlem Türü: `ALIŞ`
4. Miktar: `0.5`
5. Birim Fiyat: `2500000`
6. Para Birimi: `TRY`
7. İşlemi Ekle

💰 **Toplam Tutar**: 0.5 × 2.500.000 = `1.250.000 TL`

---

### 5️⃣ Yatırım Fonu İşlemleri

#### Fon Alımı
```
Senaryo: 1000 adet "AAK" fonu 10.5 TL'den
```
1. `Yeni İşlem` → `Yatırım Fonu` → Manuel giriş
2. Varlık Adı: `AAK`
3. İşlem Türü: `ALIŞ`
4. Miktar: `1000`
5. Birim Fiyat: `10.5`
6. Para Birimi: `TRY`
7. İşlemi Ekle

---

### 6️⃣ Dashboard Kullanımı

#### Para Birimi Değiştirme
- Sağ üstteki **TRY** veya **USD** butonuna tıklayın
- Tüm değerler seçili para birimine göre gösterilir
- Not: Döviz kurları otomatik hesaplanır

#### Karanlık Mod
- Sağ üstteki **🌙 Ay** veya **☀️ Güneş** ikonuna tıklayın
- Tema seçiminiz kaydedilir

#### Varlık Gruplarını Açma/Kapatma
- Her varlık grubu (Altın, Hisse, vb.) varsayılan olarak açık gelir
- Grup başlığına tıklayarak daraltabilir veya genişletebilirsiniz
- Temiz ve düzenli bir görünüm için gereksiz grupları kapatın

#### Varlık Detaylarını Görme
- Herhangi bir varlık kartına tıklayın
- Tüm işlem geçmişi, ortalama maliyet, kar/zarar detayları görünür
- Buradan direkt **Alış** veya **Satış** işlemi yapabilirsiniz

---

## 💡 Önemli Bilgiler ve İpuçları

### 🔐 Güvenlik Kontrolleri

#### Yetersiz Bakiye Hatası
```
❌ Hata: "Yetersiz bakiye! Kasanızda 5.000 TL var. 10.000 TL tutarında alım yapamazsınız."
```
**Çözüm**:
1. Dashboard'a dönün
2. Nakit grubunu kontrol edin (mevcut bakiyenizi görün)
3. Yeterli nakit yoksa, önce nakit ekleyin
4. Sonra varlık alımı yapın

#### Yetersiz Miktar Hatası
```
❌ Hata: "Yetersiz miktar! Portföyünüzde sadece 10 gram var. 15 gram satamazsınız."
```
**Çözüm**:
1. Varlık detayına girin
2. "Mevcut: X adet" kısmını kontrol edin
3. Sadece mevcut miktarınız kadar satış yapabilirsiniz

### 📊 Ortalama Maliyet Hesaplama

Sistem, FIFO (First In, First Out) yerine **Ağırlıklı Ortalama Maliyet** yöntemini kullanır:

```
Örnek:
1. İşlem: 100 adet @ 50 TL = 5.000 TL
2. İşlem: 200 adet @ 55 TL = 11.000 TL
────────────────────────────────────────
Toplam: 300 adet, Toplam Harcama: 16.000 TL
Ortalama Maliyet = 16.000 ÷ 300 = 53.33 TL/adet
```

**Satış sonrası**:
```
Satış: 100 adet @ 60 TL
────────────────────────────────────────
Kalan: 200 adet
Ortalama Maliyet: Hala 53.33 TL (değişmez!)
Kar: 100 × (60 - 53.33) = 667 TL
```

💡 Bu yöntem, vergi raporlaması için de idealdir!

### 💵 Nakit Yönetimi İpuçları

1. **Her Para Birimi Ayrı Varlık**: USD, EUR, GBP her biri ayrı nakit varlığı olarak eklenir
2. **Birim Fiyat Her Zaman 1**: Nakit için birim fiyat her zaman `1` olmalıdır
3. **Döviz Alım-Satımı**: 
   - Döviz bürosundan USD alımı → `USD Nakit ALIŞ`
   - USD ile ödeme → `USD Nakit SATIŞ`

4. **Nakit Transferleri**:
```
Senaryo: 1000 USD'yi TL'ye çevirdiniz (kur: 34.5)
```
**Adım 1**: USD Satış
- Varlık: `Nakit USD`
- Miktar: `1000`
- Birim Fiyat: `1`
- İşlem: `SATIŞ`

**Adım 2**: TRY Alış
- Varlık: `Nakit TRY`
- Miktar: `34500` (1000 × 34.5)
- Birim Fiyat: `1`
- İşlem: `ALIŞ`

### 📝 İşlem Notları Kullanımı

İşlem notları, gelecekte işlemlerinizi hatırlamanız için çok önemlidir:

**İyi Örnekler**:
- "Ziraat Bankası - Hesap: 1234 - Fatura: AB/001"
- "Altın fiyatı düşükte, uzun vade için aldım"
- "Kâr realizasyonu, hedef %20'ye ulaştı"
- "Vergi öncesi satış, 2024 yılı"

**Kötü Örnekler**:
- "Alış" (çok genel)
- "..." (bilgi yok)

---

## ❓ Sıkça Sorulan Sorular (SSS)

### 🚫 Alım Yapmakla İlgili Sorunlar

#### S: Alım yapmaya çalışıyorum ama "Yetersiz bakiye" hatası alıyorum. Ne yapmalıyım?
**C**: Bu hata, kasanızda yeterli TRY bulunmadığı anlamına gelir. Çözüm:
1. Dashboard'a gidin
2. **Nakit (TRY)** grubunu bulun - mevcut bakiyenizi görün
3. Yeterli değilse:
   - `Yeni İşlem` → `Nakit` → `Türk Lirası`
   - İşlem Türü: `ALIŞ`
   - Miktar: Eklemek istediğiniz tutar
   - Birim Fiyat: `1`
4. Şimdi varlık alımı yapabilirsiniz

#### S: İlk defa kullanıyorum, ne yapmalıyım?
**C**: İlk adım **mutlaka nakit eklemektir**! Gerçek hayatta da önce paranız olmalı, sonra yatırım yaparsınız:
1. `Yeni İşlem` butonuna tıklayın
2. `Nakit` → `💵 Türk Lirası` seçin
3. Portföyünüzde görmek istediğiniz başlangıç bakiyesini girin (örn: 100.000 TL)
4. Birim fiyat: `1`
5. İşlemi ekleyin
6. Artık varlık satın alabilirsiniz!

---

### 💸 Satış İşlemleriyle İlgili Sorunlar

#### S: Altınımı satmak istiyorum ama "Yetersiz miktar" hatası alıyorum?
**C**: Portföyünüzde o varlıktan yeterli miktarda olmadığı anlamına gelir:
1. Dashboard'da o varlığa tıklayın
2. "Mevcut: X adet" bilgisine bakın
3. Sadece o kadar miktar satabilirsiniz
4. Örnek: 10 gram altınınız varsa, maksimum 10 gram satabilirsiniz

#### S: Satış yaptıktan sonra param nereye gidiyor?
**C**: Satış tutarı otomatik olarak **Nakit (TRY)** bakiyenize eklenir:
- Örnek: 5 gram altını 2.500 TL'den sattınız = 12.500 TL
- Nakit (TRY) bakiyeniz 12.500 TL artar
- Altın (Gram) miktarınız 5 gram azalır

---

### 📊 Hesaplamalar ve Raporlama

#### S: Ortalama maliyet nasıl hesaplanıyor?
**C**: Sistem, tüm alışlarınızın **ağırlıklı ortalamasını** alır:
```
Örnek:
- 1. Alış: 100 adet @ 50 TL = 5.000 TL
- 2. Alış: 200 adet @ 56 TL = 11.200 TL
───────────────────────────────────────
Toplam: 300 adet, Harcama: 16.200 TL
Ortalama = 16.200 ÷ 300 = 54 TL/adet
```
Bu sayede farklı zamanlarda yaptığınız alımların gerçek ortalamasını görürsünüz.

#### S: Satış yaptığımda ortalama maliyet değişiyor mu?
**C**: **Hayır!** Ortalama maliyetiniz değişmez. Sadece kalan miktar azalır:
```
Örnek (yukarıdaki devamı):
- Satış: 100 adet @ 60 TL
───────────────────────────────────────
Kalan: 200 adet
Ortalama: Hala 54 TL/adet
Kar: 100 × (60 - 54) = 600 TL
```

#### S: Kar/Zarar oranı nasıl hesaplanıyor?
**C**: Kar/Zarar % = `(Mevcut Değer - Toplam Maliyet) ÷ Toplam Maliyet × 100`
```
Örnek:
- Ortalama Maliyet: 50 TL
- Mevcut Fiyat: 55 TL
- Kar: 5 TL
- Kar %: (5 ÷ 50) × 100 = %10
```

---

### 💱 Para Birimi ve Döviz

#### S: Farklı para birimlerinde işlem yapabilir miyim?
**C**: Evet! Sistem 3 para birimini destekler:
- **TRY** (Türk Lirası)
- **USD** (Amerikan Doları)
- **EUR** (Euro)

Her işlem eklerken "Satın Alma Para Birimi" seçeneğinden seçebilirsiniz.

#### S: USD ile BTC alsam nasıl eklenir?
**C**: İşlem para birimi olarak USD seçin:
```
Örnek:
- Varlık: Bitcoin
- Miktar: 0.1 BTC
- Birim Fiyat: 70000
- Para Birimi: USD ← Buradan seçin
```
Sistem otomatik olarak döviz kurunu uygular.

#### S: Dashboard'da TRY/USD geçişi nasıl yapılır?
**C**: Sağ üst köşede **TRY** veya **USD** butonları var:
- Tıklayarak para birimini değiştirin
- Tüm dashboard bu para birimine göre güncellenir
- Not: Döviz kurları anlık hesaplanır

---

### 🎨 Arayüz ve Kullanım

#### S: Varlık grupları nedir, nasıl kullanılır?
**C**: Varlıklarınız türlerine göre gruplandırılır:
- 🪙 Altın → Tüm altın çeşitleriniz
- 🥈 Gümüş → Tüm gümüş çeşitleriniz
- 🇹🇷 BIST → Borsa İstanbul hisseleri
- 💵 Nakit → Her para birimi ayrı grup

Grup başlığına tıklayarak açıp kapatabilirsiniz (temiz görünüm için).

#### S: Karanlık modu nasıl açarım?
**C**: Sağ üst köşede **Ay (🌙)** veya **Güneş (☀️)** ikonuna tıklayın. Tema seçiminiz kaydedilir.

#### S: Mobil cihazda kullanılabilir mi?
**C**: Evet! Uygulama mobil-first tasarım prensipleriyle geliştirildi. Telefon, tablet ve bilgisayarda sorunsuz çalışır.

---

### 🔄 İşlem Düzeltme ve Silme

#### S: Yanlış işlem ekledim, nasıl düzeltebilirim?
**C**: Şu anda direkt düzenleme özelliği yok, ancak:
1. **Yöntem 1**: Ters işlem yapın
   - Yanlışlıkla 100 adet alış yaptıysanız
   - 100 adet satış yapın (sıfırlarsınız)
   - Sonra doğru miktarı tekrar alın

2. **Yöntem 2**: Admin panel (geliştirilecek)
   - Gelecek sürümlerde işlem düzenleme gelecek

#### S: İşlemi silerken veri kaybı olur mu?
**C**: İşlem silindiğinde:
- Otomatik olarak tersine işlem yapılır
- Nakit bakiyeniz güncellenir
- Varlık miktarınız güncellenir
- Ortalama maliyet yeniden hesaplanır

---

### 🛠️ Teknik Sorunlar

#### S: Sayfa yavaş yükleniyor / Yanıt vermiyor?
**C**: Birkaç çözüm:
1. Sayfayı yenileyin (F5)
2. Tarayıcı cache'ini temizleyin
3. Farklı tarayıcı deneyin (Chrome, Firefox, Safari)
4. İnternet bağlantınızı kontrol edin

#### S: İşlem eklerken "Sunucu hatası" alıyorum?
**C**: Birkaç nedeni olabilir:
1. **İnternet bağlantısı**: Bağlantınızı kontrol edin
2. **Form eksiklikleri**: Tüm alanları doldurduğunuzdan emin olun
3. **Geçersiz veri**: Miktar ve fiyat pozitif sayı olmalı
4. **Sunucu sorunları**: Birkaç dakika sonra tekrar deneyin

#### S: Dashboard'da varlıklarım görünmüyor?
**C**: Kontrol listesi:
1. Sayfayı yenileyin
2. En az bir işlem eklediniz mi?
3. Varlık grupları daraltılmış olabilir → Başlıklara tıklayın
4. Giriş yaptığınız hesaptan emin olun

---

### 📈 Performans ve Analiz

#### S: Geçmiş işlemlerimi nasıl görürüm?
**C**: 
1. Dashboard'da varlığa tıklayın
2. Açılan modal'da **"İşlem Geçmişi"** tabı var
3. O varlığa ait tüm alış-satışlar tarih sırasıyla görünür

#### S: En karlı varlığımı nasıl bulurum?
**C**: Dashboard'da her varlık kartında:
- 📊 **Mevcut Değer** (ne kadar ediyor)
- 💰 **Toplam Maliyet** (ne kadar harcadınız)
- 📈 **Kar/Zarar %** (getiri oranı)

Yeşil renkli ve yüksek % olanlar en karlı varlıklarınızdır.

#### S: Portföyümün toplam getirisini nasıl görürüm?
**C**: Dashboard üst kısmında:
- **Toplam Değer**: Tüm varlıklarınızın mevcut değeri
- **Toplam Kar/Zarar**: Ne kadar kar/zarar ettiğiniz
- **Getiri %**: Toplam portföy getiri oranınız

---

### 💼 Gelişmiş Senaryolar

#### S: Aynı varlıktan farklı fiyatlardan aldım, nasıl takip edebilirim?
**C**: Sistem otomatik olarak halleder! Örnek:
```
1. İşlem: 100 gram @ 2.400 TL
2. İşlem: 50 gram @ 2.500 TL
3. İşlem: 100 gram @ 2.450 TL
───────────────────────────────────────
Sistem otomatik hesaplar:
- Toplam: 250 gram
- Ortalama: 2.440 TL/gram
```
Siz sadece işlemleri ekleyin, gerisini sistem halleder!

#### S: Vergi raporlaması için kullanabilir miyim?
**C**: Evet! Sistem:
- Her işlemin tarihini kaydeder
- Ortalama maliyet metodunu kullanır (vergi uyumlu)
- Kar/zarar hesaplamalarını yapar
- İşlem geçmişini tutar

Ancak **resmi vergi belgesi değildir**, kendi kayıtlarınız içindir.

#### S: Kısa vadeli alım-satım yapıyorum, nasıl takip ederim?
**C**: Her alım-satımı normal şekilde ekleyin:
```
Örnek: Gün içi trade
09:00 → Alış: 1000 adet @ 100 TL
11:00 → Satış: 1000 adet @ 105 TL
───────────────────────────────────────
Sonuç:
- Kar: 5.000 TL
- Getiri: %5
```
Sistem her işlemi kaydeder ve karı hesaplar.

---

## 🎓 Son Notlar ve İpuçları

### ✅ En İyi Pratikler

1. **Düzenli İşlem Girişi**: İşlemlerinizi günlük girin, biriktirmeyin
2. **Notlar Ekleyin**: Her işleme kısa açıklama ekleyin
3. **Nakit Takibi**: Kasanızı her zaman güncel tutun
4. **Grupları Kullanın**: Varlıklarınızı organize edin
5. **Tarih Doğruluğu**: İşlem tarihlerini doğru girin

### ⚠️ Dikkat Edilmesi Gerekenler

1. **Ondalık Sayılar**: Miktar ve fiyat için ondalık kullanabilirsiniz (örn: 0.5, 2.75)
2. **Para Birimi Tutarlılığı**: Aynı varlık için aynı para birimini kullanın
3. **Negatif Sayılar**: Sistem negatif sayı kabul etmez
4. **İşlem Tarihi**: Gelecek tarihli işlem ekleyebilirsiniz (planlı alım için)

### 📞 Destek

Sorunuz mu var? 
- 📧 Email: support@portfolio-tracker.com
- 💬 Discord: [Community Server](https://discord.gg/portfolio)
- 📚 Dokümantasyon: [GitHub Wiki](https://github.com/portfolio-tracker/docs)

---

## 📚 Ek Kaynaklar

### Video Eğitimler (Yakında)
- [ ] İlk Kurulum ve Başlangıç
- [ ] Nakit ve Varlık Yönetimi
- [ ] Gelişmiş Özellikler

### Örnek Senaryolar
✅ Tüm senaryolar bu dokümanda mevcuttur!

### Güncellemeler
Bu klavuz düzenli olarak güncellenir. Son güncelleme: **2025-10-14**

---

**🎉 İyi Yatırımlar!**

Bu kılavuzla portföyünüzü etkili bir şekilde yönetebilir ve yatırım kararlarınızı daha bilinçli alabilirsiniz.
