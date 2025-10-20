# 🧪 Fiyat Çekme Test Sistemi

Bu proje, tüm varlık kategorileri için **Yahoo Finance API** kullanarak gerçek zamanlı fiyat çekme özelliğine sahiptir. Her kategori için nasıl çalıştığını test edebilir ve doğrulayabilirsiniz.

## 📊 Desteklenen Kategoriler

### 1. 💱 **Döviz Kurları (Currency)**
- **USD/TRY**: US Dollar → Turkish Lira
- **EUR/TRY**: Euro → Turkish Lira
- **Kaynak**: Yahoo Finance API
- **Sembol Formatı**: `TRY=X`, `EURTRY=X`

#### Nasıl Çalışır:
```
Yahoo Finance → TRY=X sembolü
↓
Gerçek zamanlı kur (örn: 35.1234 TRY)
↓
Önceki kapanış ile karşılaştırma
↓
Değişim yüzdesi hesaplama
```

#### Örnek Log:
```
💱 Testing USD/TRY currency pair...
📡 Source: Yahoo Finance (TRY=X)
✅ Current Rate: 35.1234 TRY
📊 Previous: 35.0890
📈 Change: +0.0344 (+0.10%)
```

---

### 2. 🏆 **Altın (Gold)**
- **Sembol**: `GC=F` (Gold Futures - COMEX)
- **Dönüşüm**: Ons (USD) → Gram (TRY)
- **Katsayı**: 1 ons = 31.1035 gram

#### Nasıl Çalışır:
```
1. Yahoo Finance → USD/TRY kuru (TRY=X)
   ↓
2. Yahoo Finance → Gold Ounce (GC=F)
   Örn: $2,650.00 / ounce
   ↓
3. Gram'a Çevirme:
   $2,650 ÷ 31.1035 = $85.19 per gram
   ↓
4. TRY'ye Çevirme:
   $85.19 × 35.1234 = ₺2,992.83 per gram
```

#### Örnek Log:
```
🏆 Testing Gold price...
💱 Step 1: Fetching USD/TRY rate...
✅ USD/TRY: 35.1234
🥇 Step 2: Fetching gold ounce price (USD)...
✅ Ounce (USD): $2,650.00
🔄 Step 3: Converting to gram (TRY)...
📐 Formula: ($2,650.00 ÷ 31.1035) × 35.1234
✅ Gram (TRY): ₺2,992.83
```

**Not**: Bu hesaplama gerçek piyasa fiyatına çok yakın (±%1-2 hata payı USD/TRY kurundan kaynaklanabilir).

---

### 3. 🥈 **Gümüş (Silver)**
- **Sembol**: `SI=F` (Silver Futures - COMEX)
- **Dönüşüm**: Altın ile aynı mantık
- **Katsayı**: 1 ons = 31.1035 gram

#### Hesaplama:
```
Silver Ounce (USD) → Gram (TRY)
Aynı formül: (OnsUSD ÷ 31.1035) × USD_TRY_Rate
```

---

### 4. ₿ **Bitcoin (Crypto)**
- **Sembol**: `BTC-USD`
- **Dönüşüm**: USD → TRY (direkt çarpma)

#### Nasıl Çalışır:
```
1. Yahoo Finance → BTC-USD fiyatı
   Örn: $68,500
   ↓
2. USD/TRY kuru ile çarp
   $68,500 × 35.1234 = ₺2,405,952.90
```

#### Örnek Log:
```
₿ Testing Bitcoin price...
✅ Price (USD): $68,500.00
✅ Price (TRY): ₺2,405,952.90
📊 Change: +2.35%
```

---

### 5. 📈 **BIST Hisse Senetleri (Stock)**
- **Sembol Formatı**: `TICKER.IS` (örn: `THYAO.IS`)
- **Piyasa**: Borsa Istanbul (BIST)
- **Para Birimi**: TRY (direkt)

#### Nasıl Çalışır:
```
Yahoo Finance → THYAO.IS
↓
Direkt TRY fiyatı (dönüşüm yok)
↓
Örn: ₺425.50
```

#### Örnek Semboller:
- `THYAO.IS` - Turkish Airlines
- `AKBNK.IS` - Akbank
- `EREGL.IS` - Ereğli Demir Çelik
- `TUPRS.IS` - Tüpraş

---

### 6. 💰 **Yatırım Fonları (TEFAS)**
**Not**: Yahoo Finance TEFAS fonlarını desteklemiyor. Alternatif:
- Borsa MCP ile TEFAS API entegrasyonu (ayrı implementasyon gerekli)
- Manuel fiyat girişi sistemi

---

## 🚀 Test Sistemi Kullanımı

### Dashboard Üzerinden Test

1. **Tarayıcıda aç:**
   ```
   http://localhost:3001/dashboard
   ```

2. **"🧪 Tüm Varlık Kategorileri Test Sistemi" kartını bul**

3. **"Tüm Fiyatları Test Et" butonuna tıkla**

4. **Sonuçları gör:**
   - ✅ Yeşil tik: Başarılı
   - ❌ Kırmızı çarpı: Hata
   - Her kart için "Show Logs" ile detayları aç

5. **Browser Console'da detaylı log:**
   - F12 tuşuna bas
   - Console sekmesine geç
   - Tüm adımları detaylı gör

---

## 🔍 API Endpoint'leri

### 1. Tüm Kategoriler Test
```bash
GET /api/test/all-prices
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "total": 6,
    "successful": 6,
    "failed": 0,
    "duration": 1234
  },
  "results": [
    {
      "category": "Currency",
      "symbol": "USD/TRY",
      "success": true,
      "data": {
        "currentPrice": 35.1234,
        "changePercent": 0.10
      },
      "logs": ["..."],
      "duration": 234
    },
    // ... diğer kategoriler
  ]
}
```

### 2. Sadece Altın Test
```bash
GET /api/test/gold-price
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ounce": {
      "currentPrice": 2650.00,
      "currency": "USD"
    },
    "gram": {
      "currentPrice": 2992.83,
      "currency": "TRY",
      "usdTryRate": 35.1234
    }
  },
  "logs": ["..."]
}
```

---

## 🧮 Hesaplama Formülleri

### Altın/Gümüş (Ons → Gram TRY)
```typescript
const GRAMS_PER_OUNCE = 31.1035;

// Adım 1: USD/TRY kurunu al
const usdTryRate = await fetchUSDTRY(); // örn: 35.1234

// Adım 2: Ons fiyatını al (USD)
const ounceUSD = await fetchGoldOunce(); // örn: 2650.00

// Adım 3: Gram'a çevir
const gramUSD = ounceUSD / GRAMS_PER_OUNCE; // 2650 ÷ 31.1035 = 85.19

// Adım 4: TRY'ye çevir
const gramTRY = gramUSD * usdTryRate; // 85.19 × 35.1234 = 2992.83
```

### Bitcoin (USD → TRY)
```typescript
// Adım 1: Bitcoin fiyatı (USD)
const btcUSD = await fetchBitcoinPrice(); // örn: 68500

// Adım 2: USD/TRY kuru
const usdTryRate = await fetchUSDTRY(); // örn: 35.1234

// Adım 3: TRY'ye çevir
const btcTRY = btcUSD * usdTryRate; // 68500 × 35.1234 = 2,405,952.90
```

### Döviz Kurları (Direkt)
```typescript
// Direkt Yahoo Finance'dan al (dönüşüm yok)
const usdTry = await fetch('TRY=X'); // 35.1234
const eurTry = await fetch('EURTRY=X'); // 38.5678
```

---

## 📝 Doğruluk Kontrolü

### Gerçek Kaynaklarla Karşılaştırma:

1. **Altın Gram TRY**:
   - Kaynak: [Doviz.com](https://www.doviz.com/altin-fiyatlari)
   - Beklenen Fark: ±%1-2 (USD/TRY kuru anlık değişim)

2. **USD/TRY**:
   - Kaynak: [TCMB](https://www.tcmb.gov.tr/)
   - Beklenen Fark: ±0.01 TRY (Yahoo Finance約2-3 dakika gecikmeli olabilir)

3. **Bitcoin**:
   - Kaynak: [CoinMarketCap](https://coinmarketcap.com/)
   - Beklenen Fark: ±%0.5 (anlık fiyat farkları)

4. **BIST Hisse**:
   - Kaynak: [BIST Resmi](https://www.borsaistanbul.com/)
   - Beklenen Fark: Çok düşük (Yahoo Finance BIST'ten direkt çekiyor)

---

## 🛠️ Sorun Giderme

### Hata: "Invalid response structure"
**Neden**: Yahoo Finance API bazen farklı format döndürür  
**Çözüm**: Birkaç saniye sonra tekrar dene

### Hata: "Network error"
**Neden**: İnternet bağlantısı veya Yahoo Finance downtime  
**Çözüm**: Bağlantını kontrol et, firewall/proxy ayarlarını gözden geçir

### Fiyat Farkı Çok Yüksek (>%5)
**Neden**: USD/TRY kuru eski veya yanlış  
**Çözüm**: 
1. Console log'da USD/TRY kurunu kontrol et
2. TCMB'den gerçek kuru karşılaştır
3. Gerekirse API'yi manuel refresh et

### BIST Hisse Bulunamadı
**Neden**: Sembol yanlış yazılmış veya hisse listelenmiyor  
**Çözüm**: 
1. `.IS` uzantısını kontrol et (örn: `THYAO.IS`)
2. [Yahoo Finance](https://finance.yahoo.com) üzerinden sembolü doğrula

---

## 📚 İleri Seviye

### Otomatik Saatlik Güncelleme (Cron Job)

Gelecekte eklenecek:
```typescript
// lib/services/price-cron-service.ts
import cron from 'node-cron';

// Her saat başı fiyat güncelleme
cron.schedule('0 * * * *', async () => {
  console.log('⏰ Running hourly price sync...');
  await syncAssetPrices({ force: true });
});
```

### Fiyat Geçmişi (Price History)

Yahoo Finance'dan geçmiş fiyatlar:
```typescript
// 1 yıllık geçmiş
const url = 'https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=1y';
```

### Gerçek Zamanlı Kur (TCMB API)

Daha doğru USD/TRY için:
```typescript
// TCMB API (XML format)
const tcmbUrl = 'https://www.tcmb.gov.tr/kurlar/today.xml';
```

---

## 🎯 Sonuç

Bu test sistemi sayesinde:
- ✅ Her kategori için fiyat çekme doğruluğu kontrol edilir
- ✅ Gerçek zamanlı USD/TRY kuru kullanılır
- ✅ Detaylı log'larla hata ayıklama kolaylaşır
- ✅ Formüller ve dönüşümler görüntülenir

**Test Et**: http://localhost:3001/dashboard → "Tüm Fiyatları Test Et" 🚀
