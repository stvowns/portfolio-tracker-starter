# Portföy Takip Sistemi - API Dokümantasyonu

## 📋 Genel Bakış

Portföy Takip Sistemi API'si, yatırım portföylerini yönetmek, varlık fiyatlarını çekmek ve işlem geçmişini takip etmek için kullanılan RESTful API'dir.

**Base URL:** `http://localhost:3000/api`

## 🔐 Authentication

Tüm API endpoint'leri Better Auth ile korunmuştur. İsteklerde geçerli session cookie bulunmalıdır.

```typescript
// Request headers
headers: {
  'Content-Type': 'application/json',
  'Cookie': 'better-auth.session_token=...'
}
```

---

## 📊 Portföy Yönetimi API'leri

### 1. Varlık Yönetimi

#### GET /api/portfolio/assets
Kullanıcının varlıklarını detaylı holding bilgileriyle listeler.

**Query Parameters:**
- `assetType` (optional): Varlık türü filtresi (`GOLD`, `SILVER`, `STOCK`, `FUND`, `CRYPTO`, `EUROBOND`, `ETF`, `CASH`)
- `portfolioId` (optional): Portföy ID filtresi
- `page` (optional): Sayfa numarası (default: 1)
- `limit` (optional): Sayfa başına sonuç sayısı (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "assets": [
      {
        "id": "asset_123",
        "name": "Gram Altın",
        "symbol": "GC=F",
        "assetType": "GOLD",
        "currency": "TRY",
        "currentPrice": 2485.50,
        "lastUpdated": "2025-01-20T10:30:00Z",
        "holdings": {
          "netQuantity": 5.2,
          "netAmount": 12924.60,
          "averagePrice": 2485.50,
          "currentValue": 12924.60,
          "profitLoss": 245.80,
          "profitLossPercent": 1.94,
          "totalTransactions": 3
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalCount": 5,
      "hasMore": false
    }
  }
}
```

#### POST /api/portfolio/assets
Yeni varlık oluşturur.

**Request Body:**
```json
{
  "name": "Gram Altın",
  "assetType": "GOLD",
  "symbol": "GC=F",
  "currency": "TRY",
  "category": "Altın",
  "portfolioId": "portfolio_123" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Varlık başarıyla eklendi",
  "data": {
    "id": "asset_123",
    "name": "Gram Altın",
    "assetType": "GOLD",
    "symbol": "GC=F",
    "currency": "TRY",
    "createdAt": "2025-01-20T10:30:00Z"
  }
}
```

### 2. İşlem Yönetimi

#### GET /api/portfolio/transactions
Kullanıcının işlem geçmişini listeler.

**Query Parameters:**
- `assetId` (optional): Varlık ID filtresi
- `transactionType` (optional): İşlem türü (`BUY`, `SELL`)
- `page` (optional): Sayfa numarası
- `limit` (optional): Sayfa başına sonuç sayısı

#### POST /api/portfolio/transactions
Yeni işlem (alış/satış) ekler.

**Request Body:**
```json
{
  "assetId": "asset_123",
  "assetName": "Gram Altın",
  "assetType": "GOLD",
  "transactionType": "BUY",
  "quantity": 2.5,
  "pricePerUnit": 2485.50,
  "transactionDate": "2025-01-20",
  "currency": "TRY",
  "notes": "Altın alım işlemi"
}
```

**Response:**
```json
{
  "success": true,
  "message": "İşlem başarıyla eklendi",
  "data": {
    "id": "transaction_123",
    "assetId": "asset_123",
    "transactionType": "BUY",
    "quantity": 2.5,
    "pricePerUnit": 2485.50,
    "totalAmount": 6213.75,
    "transactionDate": "2025-01-20T00:00:00Z"
  }
}
```

### 3. Portföy Özeti

#### GET /api/portfolio
Kullanıcının portföy özetini döner.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalValue": 125750.00,
    "totalInvestment": 120000.00,
    "totalProfitLoss": 5750.00,
    "totalProfitLossPercent": 4.79,
    "assetCount": 8,
    "transactionCount": 25,
    "lastUpdated": "2025-01-20T10:30:00Z"
  }
}
```

### 4. Performans Analizi

#### GET /api/portfolio/performance
Portföy performans metriklerini döner.

**Query Parameters:**
- `period` (optional): Analiz periyodu (`1D`, `1W`, `1M`, `3M`, `6M`, `1Y`, `ALL`)
- `assetType` (optional): Varlık türü filtresi

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "1M",
    "startValue": 118000.00,
    "endValue": 125750.00,
    "totalReturn": 7750.00,
    "totalReturnPercent": 6.57,
    "annualizedReturn": 78.84,
    "volatility": 12.5,
    "maxDrawdown": -3.2,
    "sharpeRatio": 2.1
  }
}
```

---

## 💰 Fiyat Verileri API'leri

### 1. Anlık Fiyat Çekme

#### GET /api/prices/latest
Belirtilen varlık için güncel fiyat bilgisini çeker.

**Query Parameters:**
- `symbol` (required): Varlık sembolü
- `type` (required): Varlık türü (`STOCK`, `FUND`, `CRYPTO`, `GOLD`, `SILVER`)

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "YKT",
    "name": "YAPI KREDİ PORTFÖY ALTIN FONU",
    "currentPrice": 0.812882,
    "previousClose": 0.804027,
    "changeAmount": 0.008855,
    "changePercent": 1.10,
    "currency": "TRY",
    "timestamp": "2025-10-22T12:41:09.093Z",
    "source": "tefas-official-v2"
  }
}
```

**Örnek Kullanımlar:**

```bash
# BIST Hisse (Yahoo Finance)
GET /api/prices/latest?symbol=GARAN&type=STOCK
# Response: "source": "yahoo-finance"

# TEFAS Fonu (Resmi TEFAS API - v2 Crawler)
GET /api/prices/latest?symbol=YKT&type=FUND
# Response: "source": "tefas-official-v2"
# Real-time price: 0.812882

# Diğer TEFAS Fonları
GET /api/prices/latest?symbol=AAK&type=FUND
GET /api/prices/latest?symbol=AAL&type=FUND

# Kripto Para
GET /api/prices/latest?symbol=BTC-USD&type=CRYPTO

# Altın (Gram olarak dönüştürülür)
GET /api/prices/latest?symbol=GC=F&type=GOLD

# Gümüş (Gram olarak dönüştürülür)
GET /api/prices/latest?symbol=SI=F&type=SILVER
```

**TEFAS Fon API Özellikleri:**
- ✅ **Real-time fiyatlar** - Resmi TEFAS API'den anlık veri
- ✅ **Günlük değişim** - Otomatik hesaplama
- ✅ **5 dakika cache** - Performans optimizasyonu
- ✅ **1,910+ fon** - Tam fon kapsamı
- ✅ **Error handling** - 3 deneme, exponential backoff

**Tüm TEFAS Fonları Listesi:**
```bash
# Tüm fonları senkronize et
npx tsx scripts/sync-tefas-funds.ts

# Fon listesi (örnek)
AAK - ATA PORTFÖY ÇOKLU VARLIK DEĞİŞKEN FON
AAL - ATA PORTFÖY PARA PİYASASI (TL) FONU
YKT - YAPI KREDİ PORTFÖY ALTIN FONU
... (1,910+ fon)
```

### 2. Test API'leri

#### GET /api/test/all-prices
Tüm varlık kategorileri için fiyat testi yapar.

**Response:**
```json
{
  "success": true,
  "summary": {
    "total": 6,
    "successful": 6,
    "failed": 0,
    "duration": 1250
  },
  "results": [
    {
      "category": "Currency",
      "symbol": "USD/TRY",
      "description": "US Dollar to Turkish Lira exchange rate",
      "success": true,
      "data": {
        "currentPrice": 32.45,
        "previousClose": 32.38,
        "changeAmount": 0.07,
        "changePercent": 0.22
      },
      "logs": ["🔄 Testing USD/TRY currency pair...", "✅ Current Rate: 32.45 TRY"],
      "duration": 245
    }
  ]
}
```

#### GET /api/test/gold-price
Altın fiyat testi yapar.

---

## 🔄 Senkronizasyon API'leri

### 1. Ticker Senkronizasyonu

#### POST /api/tickers/sync
BIST ve TEFAS ticker verilerini senkronize eder.

**Request Body:**
```json
{
  "sync_type": "FULL", // "BIST", "TEFAS", "FULL"
  "force": false,
  "triggered_by": "manual" // "manual", "cron", "api"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ticker synchronization completed successfully",
  "data": {
    "sync_type": "FULL",
    "total_duration_ms": 15234,
    "results": [
      {
        "type": "BIST",
        "total_records": 523,
        "successful": 512,
        "failed": 11,
        "duration_ms": 8456,
        "status": "partial"
      },
      {
        "type": "TEFAS",
        "total_records": 3285,
        "successful": 3285,
        "failed": 0,
        "duration_ms": 6778,
        "status": "completed"
      }
    ]
  }
}
```

#### GET /api/tickers/sync
Senkronizasyon API'si sağlık kontrolü.

**Response:**
```json
{
  "success": true,
  "message": "Ticker sync API is operational",
  "endpoints": {
    "sync": "POST /api/tickers/sync",
    "search": "GET /api/tickers/search?q=GARAN&type=STOCK"
  }
}
```

### 2. Ticker Arama

#### GET /api/tickers/search
Cached ticker verilerinde arama yapar (autocomplete için).

**Query Parameters:**
- `q` (required): Arama terimi (minimum 2 karakter)
- `type` (optional): Varlık türü (`STOCK`, `FUND`)
- `limit` (optional): Sonuç limiti (default: 20, max: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ticker_123",
      "assetType": "STOCK",
      "symbol": "GARAN",
      "name": "Garanti Bankası A.Ş.",
      "city": "İstanbul",
      "category": "Bankacılık",
      "lastUpdated": "2025-01-20T09:30:00Z"
    }
  ],
  "meta": {
    "query": "GAR",
    "asset_type": "STOCK",
    "count": 1,
    "limit": 20
  }
}
```

---

## 📊 Veri Modelleri

### AssetType Enum
```typescript
type AssetType =
  | "GOLD"           // Altın
  | "SILVER"         // Gümüş
  | "STOCK"          // BIST Hisse
  | "INTERNATIONAL_STOCK" // Yabancı Hisse
  | "FUND"           // Yatırım Fonu
  | "CRYPTO"         // Kripto Para
  | "EUROBOND"       // Eurobond
  | "ETF"            // ETF
  | "CASH";          // Nakit
```

### TransactionType Enum
```typescript
type TransactionType = "BUY" | "SELL";
```

### Currency Enum
```typescript
type Currency = "TRY" | "USD" | "EUR" | "JPY" | "GBP" | "CHF";
```

---

## ⏰ Fiyat Çekme Zamanlamaları

### Piyasa Saatleri
- **BIST (STOCK)**: 09:30 - 18:00 (Hafta içi) - Yahoo Finance
- **TEFAS (FUND)**: 10:00 - 18:00 (Hafta içi) - Resmi API, Real-time
- **Altın/Gümüş**: 09:00 - 18:00 (Hafta içi) - Yahoo Finance
- **Kripto**: 24/7 - Yahoo Finance
- **Nakit**: Manuel giriş

### Cache Freshness
- **TEFAS Fonları**: 5 dakika (real-time caching)
- **Diğer Varlıklar**: 1 saat
- **Internal API**: Automatic cache management

---

## 🔗 Fiyat Kaynakları

### Yahoo Finance (External API)
**Endpoint:** `https://query1.finance.yahoo.com/v8/finance/chart/`
**Kapsam:** BIST Hisse, Kripto, Altın, Gümüş, Döviz
**Format:** `{symbol}.IS` for BIST, `{symbol}-USD` for crypto
**Features:** Real-time prices, market data
**Rate Limit:** Resmi olmayan, makul kullanım önerilir

### TEFAS Official API (Primary - v2 Crawler)
**Endpoint:** `POST https://www.tefas.gov.tr/api/DB/BindHistoryInfo`
**Kapsam:** 1,910+ Yatırım Fonu
**Implementation:** Modern TypeScript crawler with caching
**Features:**
- ✅ Real-time prices
- ✅ 5-minute cache with memory management
- ✅ Retry logic (3 attempts, exponential backoff)
- ✅ Data validation and error handling
- ✅ Previous day comparison

**Request Headers:**
```http
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
X-Requested-With: XMLHttpRequest
User-Agent: Mozilla/5.0 (compatible; PortfolioTracker/1.0)
Origin: https://www.tefas.gov.tr
Referer: https://www.tefas.gov.tr/TarihselVeriler.aspx
```

**Request Body:**
```http
fontip=YAT&fonkod=FON_CODE&bastarih=DD.MM.YYYY&bittarih=DD.MM.YYYY
```

**Response Format:**
```json
{
  "draw": 0,
  "recordsTotal": 1910,
  "recordsFiltered": 1910,
  "data": [
    {
      "TARIH": 1761091200000,
      "FONKODU": "YKT",
      "FONUNVAN": "YAPI KREDİ PORTFÖY ALTIN FONU",
      "FIYAT": 0.812882,
      "TEDPAYSAYISI": 92750.0,
      "KISISAYISI": 375.0,
      "PORTFOYBUYUKLUK": 75402345.67
    }
  ]
}
```

### GitHub Fallback API (Backup Only)
**Endpoint:** `https://raw.githubusercontent.com/emirhalici/tefas_intermittent_api/data/fund_data.json`
**Usage:** Sadece TEFAS API çökmesi durumunda otomatik geçiş
**Coverage:** ~50-100 popüler fon
**Update:** Günlük 12:00 Türkiye saati

---

## 🚨 Hata Kodları

### HTTP Status Kodları
- `200` - Başarılı
- `201` - Başarıyla oluşturuldu
- `400` - Geçersiz istek
- `401` - Yetkilendirme hatası
- `404` - Bulunamadı
- `429` - Rate limit aşıldı
- `500` - Sunucu hatası

### Error Response Format
```json
{
  "success": false,
  "error": "Hata mesajı",
  "details": "Detaylı hata bilgisi (isteğe bağlı)"
}
```

---

## 📝 Örnek Kullanımlar

### 1. Yeni Varlık ve İşlem Ekleme
```javascript
// 1. Varlık oluştur
const assetResponse = await fetch('/api/portfolio/assets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Gram Altın',
    assetType: 'GOLD',
    symbol: 'GC=F',
    currency: 'TRY'
  })
});

const asset = await assetResponse.json();

// 2. Fiyat çek
const priceResponse = await fetch('/api/prices/latest?symbol=GC=F&type=GOLD');
const priceData = await priceResponse.json();

// 3. İşlem ekle
const transactionResponse = await fetch('/api/portfolio/transactions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    assetId: asset.data.id,
    assetName: 'Gram Altın',
    assetType: 'GOLD',
    transactionType: 'BUY',
    quantity: 2.5,
    pricePerUnit: priceData.data.currentPrice,
    transactionDate: new Date().toISOString().split('T')[0],
    currency: 'TRY'
  })
});
```

### 2. Portföy Özeti ve Performans
```javascript
// Portföy özeti
const summaryResponse = await fetch('/api/portfolio');
const summary = await summaryResponse.json();

// Aylık performans
const performanceResponse = await fetch('/api/portfolio/performance?period=1M');
const performance = await performanceResponse.json();
```

### 3. Ticker Arama ve Fiyat Çekme
```javascript
// Ticker arama
const searchResponse = await fetch('/api/tickers/search?q=GAR&type=STOCK&limit=5');
const tickers = await searchResponse.json();

// Fiyat çekme
const priceResponse = await fetch('/api/prices/latest?symbol=GARAN&type=STOCK');
const price = await priceResponse.json();
```

---

## 🔧 Optimizasyon Önerileri

### 1. Cache Kullanımı
- Fiyat verilerini client-side cache'de tutun
- 1 saatten eski verileri yeniden çekin

### 2. Batch İşlemler
- Çoklu işlem eklemek için batch endpoint kullanın
- Ticker senkronizasyonunu zamanlanmış yapın

### 3. Rate Limiting
- Fiyat çekme için rate limiting uygulayın
- Concurrent request sayısını sınırlayın

### 4. Error Handling
- Network hatalarında retry mekanizması kullanın
- Fallback fiyat kaynakları belirleyin

---

## 📞 Destek

API ile ilgili sorularınız ve hata bildirimleriniz için:
- GitHub Issues üzerinden issue açın
- [stvowns@gmail.com](mailto:stvowns@gmail.com)

---

**Son Güncelleme:** 2025-01-20
**Versiyon:** 1.0.0