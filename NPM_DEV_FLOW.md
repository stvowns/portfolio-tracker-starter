# npm run dev - Uygulama Başlatma ve Veri Akışı Dokümantasyonu

## 🚀 1. Komut Başlatma

```bash
npm run dev
```

Bu komut, `package.json` içinde şu scripti çalıştırır:

```json
"dev": "next dev --turbopack"
```

- **Next.js Development Server** başlatılır (Turbopack ile optimize edilmiş)
- Varsayılan port: `http://localhost:3000`
- Hot Module Replacement (HMR) aktif
- TypeScript derlemesi otomatik yapılır

---

## 📂 2. Uygulama Başlangıç Sırası

### 2.1 Next.js Initialization
```
1. next.config.ts okunur
2. middleware.ts çalışır (auth kontrolü)
3. app/layout.tsx render edilir (root layout)
4. Theme provider, Toaster gibi global provider'lar yüklenir
```

### 2.2 Sayfa Yükleme
```
Kullanıcı / (root) URL'sine gider
↓
app/page.tsx render edilir (landing page)
↓
Kullanıcı /dashboard'a yönlendirilir
↓
app/dashboard/page.tsx yüklenir
```

---

## 🔄 3. Dashboard Yüklendiğinde Tetiklenen Süreçler

### 3.1 İlk Render (Client-Side)
`app/dashboard/page.tsx` component mount olur:

```tsx
useEffect(() => {
    refreshData();
}, []);
```

### 3.2 Paralel API Çağrıları
`refreshData()` fonksiyonu **2 API'yi paralel** çağırır:

```typescript
const [assetsData, summaryData] = await Promise.all([
    fetchPortfolioAssets(),     // GET /api/portfolio/assets
    fetchPortfolioSummary()     // GET /api/portfolio
]);
```

---

## 📡 4. API Endpoint'leri ve Veri Akışı

### 4.1 GET /api/portfolio/assets
**Amaç:** Kullanıcının tüm varlıklarını ve holdingleri getirir

**Veri Akışı:**
```
1. Auth kontrolü (requireAuth)
   ↓
2. Database query (Drizzle ORM)
   ↓
3. assets tablosundan varlıklar çekilir
   ↓
4. transactions tablosu ile JOIN edilir
   ↓
5. Her varlık için holdings hesaplanır:
   • Buy toplamı (quantity, amount)
   • Sell toplamı (quantity, amount)
   • Net miktar = Buy - Sell
   • Ortalama maliyet
   • Mevcut değer (currentPrice × netQuantity)
   • Kar/zarar (currentValue - netAmount)
   • Kar/zarar yüzdesi
   ↓
6. JSON response döner
```

**Database Tabloları:**
- `assets` - Varlık bilgileri (id, name, symbol, assetType, currentPrice)
- `transactions` - İşlem geçmişi (BUY/SELL, quantity, price, totalAmount)

**Örnek Response:**
```json
{
  "success": true,
  "data": {
    "assets": [
      {
        "id": "asset_123",
        "name": "GARAN",
        "symbol": "GARAN",
        "assetType": "STOCK",
        "currentPrice": "95.50",
        "holdings": {
          "netQuantity": 100,
          "netAmount": 9000,
          "averagePrice": 90,
          "currentValue": 9550,
          "profitLoss": 550,
          "profitLossPercent": 6.11,
          "totalTransactions": 3
        }
      }
    ]
  }
}
```

---

### 4.2 GET /api/portfolio
**Amaç:** Portföy özeti ve toplam değerleri hesaplar

**Veri Akışı:**
```
1. Auth kontrolü
   ↓
2. Kullanıcının portfolios kayıtları kontrol edilir
   ↓
3. Yoksa otomatik "Ana Portföy" oluşturulur
   ↓
4. Tüm assets ve transactions çekilir
   ↓
5. Her varlık için:
   • Buy/Sell toplamları hesaplanır
   • Realized P&L (gerçekleşen kar/zarar)
   • Unrealized P&L (gerçekleşmemiş kar/zarar)
   ↓
6. Portföy geneli özet hesaplanır:
   • totalValue (toplam mevcut değer)
   • totalCost (toplam maliyet)
   • totalRealizedPL (satışlardan kazanç)
   • totalUnrealizedPL (mevcut varlıklardan kazanç)
   • totalProfitLoss (toplam kar/zarar)
   • totalProfitLossPercent (yüzde kazanç)
   ↓
7. JSON response döner
```

**Örnek Response:**
```json
{
  "success": true,
  "data": {
    "totalValue": 125000,
    "totalCost": 100000,
    "totalProfitLoss": 25000,
    "totalProfitLossPercent": 25.0,
    "totalRealizedPL": 5000,
    "totalUnrealizedPL": 20000,
    "totalAssets": 8,
    "currency": "TRY"
  }
}
```

---

## 💰 5. Fiyat Güncelleme Sistemi

### 5.1 Manuel Fiyat Güncelleme
Dashboard'da **Senkronizasyon Butonları** var:

```tsx
<Button onClick={() => handleTickerSync('BIST')}>
  📊 BIST
</Button>

<Button onClick={() => handleTickerSync('TEFAS')}>
  💰 TEFAS (58)
</Button>
```

**API Çağrısı:**
```
POST /api/tickers/sync
Body: {
  "sync_type": "BIST" | "TEFAS",
  "force": true,
  "triggered_by": "manual"
}
```

---

### 5.2 Ticker Sync API Flow

#### BIST Senkronizasyonu
```
1. Yahoo Finance API çağrılır
   ↓
2. BIST hisse listesi çekilir
   ↓
3. ticker_cache tablosuna yazılır:
   • symbol: "GARAN"
   • name: "Garanti Bankası"
   • assetType: "STOCK"
   • dataSource: "yahoo-finance"
   ↓
4. Autocomplete için hazır hale gelir
```

#### TEFAS Senkronizasyonu
```
1. Statik fon listesi kullanılır (POPULAR_TEFAS_FUNDS)
   ↓
2. 58 popüler fon ticker_cache'e yazılır
   ↓
3. NOT: Rate limit koruması için statik liste kullanılır
   (RapidAPI: 10 request/day limit)
```

**Database Tablo:**
```sql
ticker_cache
- id
- asset_type (STOCK, FUND, etc.)
- symbol (GARAN, AKG, etc.)
- name (fon adı)
- category (fon türü)
- last_updated
- data_source (yahoo-finance, takasbank)
```

---

### 5.3 Fiyat Senkronizasyonu (Price Sync)

**Otomatik Tetikleme:**
- Şu anda **manuel tetikleme** aktif
- Gelecekte: Cron job veya scheduled task eklenebilir

**Manuel Tetikleme:**
```
POST /api/prices/sync
Body: {
  "asset_types": ["stock", "fund"],
  "force": true,
  "max_age": 3600000  // 1 saat
}
```

**Price Sync Service Flow:**
```
1. lib/services/price-sync-service.ts çalışır
   ↓
2. assets tablosundan güncellenecek varlıklar seçilir:
   • autoPriceUpdate = true
   • priceCacheEnabled = true
   ↓
3. Piyasa saatleri kontrolü:
   • BIST: 09:30-18:00 (Hafta içi)
   • TEFAS: 11:00 (Hafta içi, günde 1 kez)
   • Crypto: 24/7
   • Gold/Silver: 09:00-18:00
   ↓
4. Her varlık için fiyat çekilir:
   • STOCK → Yahoo Finance API
   • FUND → GitHub API (öncelik) veya RapidAPI (fallback)
   • GOLD/SILVER → Yahoo Finance (GC=F, SI=F)
   ↓
5. Fiyatlar güncellenir:
   • price_cache tablosuna yazılır
   • assets.currentPrice güncellenir
   • assets.lastUpdated timestamp
   ↓
6. Sync log kaydedilir:
   • price_sync_logs tablosuna yazılır
   • başarı/başarısız sayısı
   • süre (duration_ms)
   • hata mesajları
```

---

## 🗄️ 6. Database Yapısı ve Tablolar

### 6.1 Core Portfolio Tables

#### `portfolios`
```sql
id              TEXT PRIMARY KEY
user_id         TEXT NOT NULL
name            TEXT NOT NULL
base_currency   TEXT DEFAULT 'TRY'
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### `assets`
```sql
id                   TEXT PRIMARY KEY
user_id              TEXT NOT NULL
portfolio_id         TEXT
name                 TEXT NOT NULL
asset_type           TEXT NOT NULL  -- STOCK, FUND, GOLD, etc.
symbol               TEXT
category             TEXT
currency             TEXT DEFAULT 'TRY'
current_price        TEXT           -- Güncel fiyat (string formatında)
last_updated         TIMESTAMP      -- Fiyat güncelleme zamanı
auto_price_update    BOOLEAN DEFAULT true
price_cache_enabled  BOOLEAN DEFAULT true
created_at           TIMESTAMP
updated_at           TIMESTAMP
```

#### `transactions`
```sql
id                TEXT PRIMARY KEY
asset_id          TEXT NOT NULL
user_id           TEXT NOT NULL
transaction_type  TEXT NOT NULL  -- BUY, SELL
quantity          NUMERIC NOT NULL
price_per_unit    NUMERIC NOT NULL
total_amount      NUMERIC NOT NULL
transaction_date  DATE NOT NULL
notes             TEXT
created_at        TIMESTAMP
```

---

### 6.2 Price Cache Tables

#### `price_cache`
```sql
id              TEXT PRIMARY KEY
asset_id        TEXT UNIQUE
asset_type      TEXT NOT NULL
symbol          TEXT NOT NULL
name            TEXT
current_price   NUMERIC
previous_close  NUMERIC
change_amount   NUMERIC
change_percent  NUMERIC
currency        TEXT
market          TEXT
last_updated    TIMESTAMP
data_source     TEXT  -- yahoo-finance, tefas-github, etc.
sync_status     TEXT  -- active, stale, error
```

#### `price_sync_logs`
```sql
id                  TEXT PRIMARY KEY
sync_type           TEXT  -- full, partial
asset_types         TEXT  -- JSON array
started_at          TIMESTAMP
completed_at        TIMESTAMP
duration_ms         INTEGER
total_assets        INTEGER
successful_updates  INTEGER
failed_updates      INTEGER
skipped_updates     INTEGER
status              TEXT  -- running, completed, partial, failed
triggered_by        TEXT  -- api, manual, scheduled
error_details       TEXT  -- JSON
```

---

### 6.3 Ticker Cache Tables

#### `ticker_cache`
```sql
id           TEXT PRIMARY KEY
asset_type   TEXT NOT NULL
symbol       TEXT NOT NULL
name         TEXT
category     TEXT
last_updated TIMESTAMP
data_source  TEXT  -- yahoo-finance, takasbank
```

#### `ticker_sync_logs`
```sql
id                  TEXT PRIMARY KEY
sync_type           TEXT  -- BIST, TEFAS
started_at          TIMESTAMP
completed_at        TIMESTAMP
duration_ms         INTEGER
total_records       INTEGER
successful_inserts  INTEGER
failed_inserts      INTEGER
status              TEXT  -- running, completed, partial, failed
triggered_by        TEXT  -- manual, api
```

---

## 🔍 7. Fiyat Çekme API'leri (External)

### 7.1 Yahoo Finance API
**Endpoint:** `https://query1.finance.yahoo.com/v8/finance/chart/{SYMBOL}`

**Kullanım Alanları:**
- BIST hisseleri (symbol + ".IS" eklenir)
- Altın fiyatı (GC=F)
- Gümüş fiyatı (SI=F)
- USD/TRY kuru (TRY=X)

**Örnek Request:**
```bash
GET https://query1.finance.yahoo.com/v8/finance/chart/GARAN.IS?interval=1d&range=1d
```

**Response:**
```json
{
  "chart": {
    "result": [{
      "meta": {
        "regularMarketPrice": 95.50,
        "chartPreviousClose": 94.00,
        "currency": "TRY"
      }
    }]
  }
}
```

---

### 7.2 TEFAS GitHub API (Primary)
**Endpoint:** `https://raw.githubusercontent.com/emirhalici/tefas_intermittent_api/data/fund_data.json`

**Avantajlar:**
- Ücretsiz
- Rate limit yok
- Günde 1 kez güncellenir (12:00 Turkey time)

**Response:**
```json
[
  {
    "code": "AKG",
    "description": "Ak Portföy Gelişen Ülkeler Yabancı Hisse Senedi Fonu",
    "priceTRY": "0.062345",
    "changePercentageDaily": "1.23"
  }
]
```

---

### 7.3 RapidAPI TEFAS (Fallback)
**Endpoint:** `https://tefas-api.p.rapidapi.com/api/v1/funds/{FUND_CODE}`

**Kullanım:**
- GitHub API başarısız olursa fallback
- **Rate Limit:** 10 request/day (Free plan)
- **Dikkat:** Çok dikkatli kullanılmalı!

**Request:**
```bash
GET https://tefas-api.p.rapidapi.com/api/v1/funds/AKG
Headers:
  x-rapidapi-key: YOUR_KEY
  x-rapidapi-host: tefas-api.p.rapidapi.com
```

---

## 📊 8. UI Component Data Flow

### 8.1 Dashboard Component Hierarchy
```
page.tsx (Dashboard)
  ↓
PortfolioDashboard
  ├── PortfolioPieChart (Asset dağılımı)
  ├── AssetGroupList (Gruplu varlık listesi)
  │   └── AssetCard (Her bir varlık)
  │       └── onClick → AssetDetailModal açılır
  └── AssetDetailModal (Varlık detayı ve işlem ekleme)
```

### 8.2 Data Refresh Triggers
```
1. Sayfa ilk açıldığında (useEffect)
2. Transaction eklendikten sonra
3. Transaction silindikten sonra
4. Manuel refresh butonu (gelecekte eklenebilir)
```

---

## ⚡ 9. Performance Optimizasyonları

### 9.1 Paralel API Çağrıları
```typescript
// 2 API'yi paralel çağırarak süre %50 azalır
Promise.all([
    fetchPortfolioAssets(),
    fetchPortfolioSummary()
]);
```

### 9.2 Database Sorgu Optimizasyonları
```typescript
// Left join ile tek sorguda transaction summary
.leftJoin(transactions, eq(transactions.assetId, assets.id))
.groupBy(assets.id)
```

### 9.3 Cache Stratejisi
```typescript
// Next.js fetch cache
fetch(url, {
    next: { revalidate: 3600 }  // 1 saat cache
});
```

---

## 🛠️ 10. Development ve Debug

### 10.1 Console Logları
Fiyat sync işlemleri console'da takip edilebilir:

```
[TEFAS Price] Trying GitHub API for AKG...
[TEFAS Price] Found AKG in GitHub data
[Price API] Fetching price for GARAN.IS...
[Price API] Success: GARAN.IS = 95.50 TRY
```

### 10.2 Database Inspection
```bash
npm run db:studio
```
Drizzle Studio açılır: `https://local.drizzle.studio`

### 10.3 Test Endpoint'leri
```
GET /api/test/gold-price
GET /api/test/all-prices
GET /api/tickers/test
```

---

## 📝 11. Özet: npm run dev Sonrası Ne Olur?

```
1. Next.js dev server başlar (localhost:3000)
   ↓
2. Kullanıcı /dashboard'a gider
   ↓
3. 2 paralel API çağrısı:
   • GET /api/portfolio/assets → Varlıklar + Holdings
   • GET /api/portfolio → Portföy özeti
   ↓
4. Database'den veriler çekilir:
   • assets tablosu
   • transactions tablosu
   • portfolios tablosu
   ↓
5. Holdings hesaplanır (client-side değil, server-side):
   • Buy - Sell = Net Quantity
   • Current Value = Price × Quantity
   • Profit/Loss = Current Value - Cost
   ↓
6. UI render edilir:
   • Pie chart (dağılım)
   • Asset kartları (gruplu)
   • Stat kartlar (özet)
   ↓
7. Kullanıcı etkileşimleri:
   • Transaction ekleme → POST /api/portfolio/transactions
   • Fiyat sync → POST /api/tickers/sync
   • Asset detay → Modal açılır (yeni API yok, mevcut data kullanılır)
```

---

## 🚨 12. Rate Limit ve Dikkat Edilmesi Gerekenler

### RapidAPI TEFAS - 10 Request/Day
- ⚠️ Sadece fallback olarak kullan
- ✅ Primary: GitHub API (unlimited)
- ✅ Static list kullanımı tercih edilir

### Yahoo Finance
- Rate limit yok (public API)
- User-Agent header gerekli
- Bazen timeout olabilir (retry logic yok şu anda)

---

## 🔮 13. Gelecek Geliştirmeler

### 13.1 Otomatik Fiyat Sync (Scheduled)
```typescript
// Cron job eklenebilir (Vercel Cron or Next.js Edge Functions)
// Her gün 12:00'da TEFAS
// Her saat BIST (piyasa saatleri)
```

### 13.2 WebSocket Real-Time Prices
```typescript
// BtcTurk WebSocket
// BIST real-time feed (ücretli)
```

### 13.3 Notification System
```typescript
// Fiyat alert'leri
// Hedef fiyat bildirimleri
```

---

## 📚 14. Referanslar ve Kaynaklar

- Next.js Docs: https://nextjs.org/docs
- Drizzle ORM: https://orm.drizzle.team
- Yahoo Finance API: (unofficial, public endpoint)
- TEFAS GitHub: https://github.com/emirhalici/tefas_intermittent_api
- RapidAPI TEFAS: https://rapidapi.com/erenunal/api/tefas-api

---

**Son Güncelleme:** {{ new Date().toLocaleDateString('tr-TR') }}
**Doküman Versiyonu:** 1.0.0
