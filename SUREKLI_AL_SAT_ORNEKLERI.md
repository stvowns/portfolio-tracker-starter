# Sürekli Alım-Satım Senaryolarında Hesaplama Mantığı

## Şu Anki Sistemimiz: Ağırlıklı Ortalama Maliyet (Weighted Average Cost)

### Temel Formüller:
```
Ortalama Alış Fiyatı = Tüm Alışların Toplam Tutarı / Tüm Alışların Toplam Miktarı
Net Miktar = Toplam Alış Miktarı - Toplam Satış Miktarı
Net Maliyet = Net Miktar × Ortalama Alış Fiyatı
Gerçekleşen K/Z = Satış Tutarı - (Satış Miktarı × Ortalama Alış Fiyatı)
```

---

## Senaryo 1: Al → Sat → Al → Sat

### İşlemler:
```
1️⃣ 100 KOCH al @ 50 TL = 5,000 TL
2️⃣ 50 KOCH sat @ 55 TL = 2,750 TL
3️⃣ 100 KOCH al @ 60 TL = 6,000 TL  
4️⃣ 75 KOCH sat @ 65 TL = 4,875 TL
```

### Adım Adım Hesaplama:

#### İşlem 1 Sonrası:
```
Toplam Alış: 100 @ 50 TL = 5,000 TL
Toplam Satış: 0
Ortalama Alış Fiyatı: 5,000 / 100 = 50 TL/adet
Net Miktar: 100 adet
Net Maliyet: 100 × 50 = 5,000 TL
Gerçekleşen K/Z: 0 TL
```

#### İşlem 2 Sonrası (50 adet sat @ 55 TL):
```
Toplam Alış: 100 @ 50 TL = 5,000 TL (değişmedi)
Toplam Satış: 50 @ 55 TL = 2,750 TL
Ortalama Alış Fiyatı: 5,000 / 100 = 50 TL/adet
Net Miktar: 100 - 50 = 50 adet
Net Maliyet: 50 × 50 = 2,500 TL ✅

Gerçekleşen K/Z (bu satıştan): 2,750 - (50 × 50) = +250 TL ✅
```

#### İşlem 3 Sonrası (100 adet al @ 60 TL):
```
Toplam Alış: 100 @ 50 + 100 @ 60 = 11,000 TL
Toplam Satış: 50 @ 55 TL = 2,750 TL (değişmedi)
Ortalama Alış Fiyatı: 11,000 / 200 = 55 TL/adet ⚠️ DEĞİŞTİ!
Net Miktar: 200 - 50 = 150 adet
Net Maliyet: 150 × 55 = 8,250 TL ✅

Gerçekleşen K/Z (toplam): 2,750 - (50 × 55) = 0 TL ⚠️ DEĞİŞTİ!
```

**ÖNEMLI:** Yeni alım yaptığında ortalama alış fiyatı değişir, bu da geçmiş satışların K/Z'sini yeniden hesaplar!

#### İşlem 4 Sonrası (75 adet sat @ 65 TL):
```
Toplam Alış: 11,000 TL (değişmedi)
Toplam Satış: 50 @ 55 + 75 @ 65 = 7,625 TL
Ortalama Alış Fiyatı: 11,000 / 200 = 55 TL/adet
Net Miktar: 200 - 125 = 75 adet
Net Maliyet: 75 × 55 = 4,125 TL ✅

Gerçekleşen K/Z (toplam): 7,625 - (125 × 55) = +750 TL ✅
```

---

## Ortalama Maliyet Ne Zaman Anlamlı?

### ✅ ANLAMLI (Şu anki durumumuz):
- **Eldeki varlıkların maliyeti:** "Bu 75 adet hisseyi almak için ortalama 55 TL/adet ödedim"
- **Gelecek satışlar için referans:** "Şimdi 65 TL'den satarsam kâr ederim"
- **Portföy değeri:** "Elimdeki 75 adet × 55 = 4,125 TL maliyet"

### ⚠️ YANILTICI OLABİLİR:
- **Gerçekleşen K/Z hesabında:** Yeni alış yaptığında önceki satışların K/Z'si değişir
- **Vergi hesabında:** Gerçek FIFO ile hesaplanmalı (ülkeye göre)
- **İşlem bazlı analiz:** Her satışın gerçek karını göstermez

---

## Alternatif Yöntemler

### 1. FIFO (First In, First Out) - İlk Giren İlk Çıkar

**Aynı örnek:**
```
İşlem 1: 100 @ 50 TL = 5,000 TL
İşlem 2: 50 sat @ 55 TL
  → İlk 50 adeti sattı (50 TL/adet)
  → K/Z: 2,750 - (50 × 50) = +250 TL ✅
  → Kalan: 50 @ 50 TL = 2,500 TL

İşlem 3: 100 @ 60 TL = 6,000 TL
  → Kalan: 50 @ 50 + 100 @ 60 = 8,500 TL (toplam 150 adet)

İşlem 4: 75 sat @ 65 TL
  → Önce kalan 50 @ 50 TL'lik hisseleri sat
  → Sonra 25 @ 60 TL'lik hisseleri sat
  → K/Z: (50×65 - 50×50) + (25×65 - 25×60) = 750 + 125 = +875 TL
  → Kalan: 75 @ 60 TL = 4,500 TL
```

**FIFO Sonucu:**
- Net Maliyet: 4,500 TL (75 adet @ 60 TL)
- Gerçekleşen K/Z: +875 TL

**Weighted Average Sonucu (bizimki):**
- Net Maliyet: 4,125 TL (75 adet @ 55 TL ortalama)
- Gerçekleşen K/Z: +750 TL

**Fark:** FIFO daha yüksek K/Z gösterir çünkü ucuz alışları önce satıyor

---

### 2. LIFO (Last In, First Out) - Son Giren İlk Çıkar

**Aynı örnek:**
```
İşlem 4: 75 sat @ 65 TL
  → Önce 75 @ 60 TL'lik hisseleri sat (en son alınanlar)
  → K/Z: 75 × (65 - 60) = +375 TL
  → Kalan: 50 @ 50 + 25 @ 60 = 4,000 TL
```

**LIFO Sonucu:**
- Net Maliyet: 4,000 TL
- Gerçekleşen K/Z: +625 TL

---

## Bizim Sistemin Avantajları

### ✅ Basit ve Sezgisel:
```
"Tüm alımlarımın ortalaması 55 TL/adet"
"Elimde 75 adet var, maliyeti 4,125 TL"
```

### ✅ Yeni alış-satışlarda tutarlı:
- Her zaman güncel ortalama kullanılır
- Karmaşık takip gerektirmez

### ✅ Uluslararası kabul gören:
- Çoğu yatırım platformu bu yöntemi kullanır
- Kolay anlaşılır

---

## Bizim Sistemin Dezavantajları

### ⚠️ Gerçekleşen K/Z Değişebilir:
```
Satış yaptıktan SONRA yeni alış yapınca, 
önceki satışın K/Z'si yeniden hesaplanır!
```

**Örnek:**
```
1. 100 @ 50 al → Ortalama: 50 TL
2. 50 @ 60 sat → K/Z: +500 TL ✅
3. 100 @ 40 al → Ortalama: 45 TL ⚠️
   → Önceki satışın K/Z'si yeniden: 50 × (60-45) = +750 TL
```

### ⚠️ Vergi Hesabında Uyumsuz:
Türkiye'de vergi mevzuatı FIFO kullanır, bizim sistem Weighted Average

---

## Çözüm: Hangi Yöntem Daha İyi?

### Portföy Takibi için: **Weighted Average (şu anki)** ✅
- Basit ve anlaşılır
- Eldeki varlıkların gerçek maliyetini gösterir
- Gelecek kararlar için iyi referans

### Vergi Beyanı için: **FIFO** 
- Türkiye vergi mevzuatı gerektirir
- Her işlem ayrı takip edilmeli
- Profesyonel muhasebe gerektir

### Trader'lar için: **FIFO veya Lot Tracking**
- Her alışı ayrı takip et
- Her satışın gerçek karını gör
- Daha karmaşık ama detaylı

---

## Pratik Öneriler

### 1. Günlük Kullanım:
Şu anki sistemimiz **YETER** ✅
```
"Ortalama 55 TL'ye aldığım hisseleri 65 TL'den satıyorum"
"Eldeki 75 adet hissenin maliyeti 4,125 TL"
```

### 2. Vergi Beyanı:
Ayrı bir Excel dosyası tut, FIFO ile hesapla

### 3. Detaylı Analiz:
Gelecekte "İşlem Detayları" sayfası ekleyebiliriz:
```
İşlem 1: 100 @ 50 → Maliyet: 5,000 TL
İşlem 2: -50 @ 55 → K/Z: +250 TL (FIFO)
İşlem 3: 100 @ 60 → Maliyet: 6,000 TL
İşlem 4: -75 @ 65 → K/Z: +875 TL (FIFO)
```

---

## Örnek: Senin KOCH Senaryonu

### Şu anki durum:
```
1. 100 @ 50 al = 5,000 TL
2. 50 @ 55 sat = 2,750 TL
```

### Hesaplama:
```
Ortalama Alış: 5,000 / 100 = 50 TL/adet
Net Miktar: 50 adet
Net Maliyet: 50 × 50 = 2,500 TL ✅
Gerçekleşen K/Z: 2,750 - (50 × 50) = +250 TL ✅
```

### Şimdi yeni alış yaparsan:
```
3. 100 @ 60 al = 6,000 TL
```

### Yeni hesaplama:
```
Ortalama Alış: 11,000 / 200 = 55 TL/adet ⚠️
Net Miktar: 150 adet
Net Maliyet: 150 × 55 = 8,250 TL
Gerçekleşen K/Z: 2,750 - (50 × 55) = 0 TL ⚠️
```

**GÖRDÜN MÜ?** Yeni alış yaptığında önceki satışın K/Z'si 250 TL'den 0 TL'ye düştü! Çünkü ortalama 55 TL'ye çıktı.

---

## Sonuç ve Öneri

### Şu Anki Sistem ✅
**Avantajlar:**
- Basit ve anlaşılır
- Eldeki varlıkların gerçek maliyetini gösterir
- Çoğu platformun kullandığı yöntem

**Dezavantajlar:**
- Yeni alışlarda gerçekleşen K/Z değişir
- Vergi hesabı için uygun değil

### Gelecek İyileştirmeler (opsiyonel):

#### 1. FIFO Seçeneği Ekleyelim ✅
```
Ayarlar → Hesaplama Yöntemi:
○ Ağırlıklı Ortalama (önerilen)
○ FIFO (ilk giren ilk çıkar)
○ LIFO (son giren ilk çıkar)
```

#### 2. İşlem Detay Sayfası ✅
Her satışın FIFO ile gerçek karını göster

#### 3. Vergi Raporu ✅
Yıllık FIFO bazlı kar/zarar raporu

---

## Kafa Karışıklığı Giderme

### Soru: "Ortalama maliyet satış sonrası anlamlı mı?"

**EVET ✅ - Eldeki varlıklar için:**
```
"Elimdeki 50 adet hisseyi almak için ortalama 50 TL ödedim"
```

**KISMEN ⚠️ - Gerçekleşen K/Z için:**
```
"İlk satıştan 250 TL kar ettim"
(Ama sonraki alışlarda bu değişebilir)
```

### Soru: "Sürekli al-sat yaparken doğru hesaplıyor mu?"

**EVET ✅** - Weighted Average yöntemi için doğru hesaplıyor.

**AMA** - FIFO istiyorsan farklı sonuçlar verir.

---

## Özet Tablo

| Yöntem | Net Maliyet | Gerçekleşen K/Z | Vergi | Basitlik |
|--------|-------------|-----------------|-------|----------|
| **Weighted Avg (Bizim)** | 4,125 TL | +750 TL | ❌ | ⭐⭐⭐⭐⭐ |
| **FIFO** | 4,500 TL | +875 TL | ✅ | ⭐⭐⭐ |
| **LIFO** | 4,000 TL | +625 TL | ❌ | ⭐⭐⭐ |

---

**ŞU ANKI SİSTEMİMİZ DOĞRU VE YETER Mİ?**

**EVET ✅** - Günlük portföy takibi için mükemmel!

**Vergi için ayrı hesaplama yap** - FIFO ile Excel'de tutabilirsin.

**Soru sorabilirsin!** Herhangi bir örnekte kafa karışıklığı varsa detaylı açıklayabilirim.
