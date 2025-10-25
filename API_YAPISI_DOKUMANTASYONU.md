# Portfolio Tracker API Dokümantasyonu

## 📋 Genel Bakış

Portfolio Tracker uygulamasının kapsamlı API dokümantasyonu. Bu doküman tüm endpoint'leri, varlık hesaplama mantıklarını ve entegrasyon detaylarını içerir.

## 🏗️ Veritabanı Schema

### Tablolar
- **`assets`**: Varlık bilgileri (sembol, tipi, güncel fiyat)
- **`transactions`**: Alım/satım işlemleri (miktar, fiyat, tarih)
- **`portfolios`**: Portföy bilgileri
- **`price_cache`**: Fiyat cache'i
- **`ticker_cache`**: Ticker/Sembol cache'i

## 🔐 Authentication

Tüm API endpoint'leri `requireAuth` middleware'i ile korunmaktadır. Session kontrolü zorunludur.

```typescript
// Her endpoint'in başında:
const session = await requireAuth(request);
if (session instanceof Response) return session; // Unauthorized ise
```

## 📊 Varlık Hesaplama Mantığı

### 🎯 Temel Formüller

#### 1. Net Miktar Hesabı
```sql
netQuantity = SUM(CASE WHEN transactionType = 'BUY' THEN quantity ELSE -quantity END)
```

#### 2. Net Tutar Hesabı
```sql
netAmount = SUM(CASE WHEN transactionType = 'BUY' THEN totalAmount ELSE -totalAmount END)
```

#### 3. Ortalama Maliyet (FIFO)
```typescript
const averageBuyPrice = buyTotalAmount / buyTotalQuantity;
```

#### 4. Mevcut Değer
```typescript
let currentValue: number;

if (asset.currentPrice) {
    currentPrice = parseFloat(asset.currentPrice.toString());
} else {
    // Real-time fiyat çekme
    currentPrice = await fetchMarketPrice(asset);
}

if (netQuantity <= 0) {
    currentValue = 0;
} else {
    currentValue = currentPrice * netQuantity;
}
```

#### 5. Kar/Zarar Hesaplaması

**Gerçekleşen Kar/Zarar (Realized P&L):**
```typescript
const realizedProfitLoss = sellQuantity > 0
    ? sellAmount - (sellQuantity * averageBuyPrice)
    : 0;
```

**Gerçekleşmemiş Kar/Zarar (Unrealized P&L):**
```typescript
const unrealizedProfitLoss = netQuantity > 0 && currentPrice !== null
    ? currentValue - netAmount
    : 0;
```

**Toplam Kar/Zarar:**
```typescript
const profitLoss = realizedProfitLoss + unrealizedProfitLoss;
```

**Kar/Zarar Yüzdesi:**
```typescript
const profitLossPercent = buyAmount > 0
    ? (profitLoss / buyAmount) * 100
    : 0;
```

## 📈 API Endpoint'leri

### 1. Portfolio API (`/api/portfolio/`)

#### GET `/api/portfolio`
**Açıklama:** Kullanıcının genel portföy özetini getirir

**Response:**
```json
{
  "success": true,
  "data": {
    "totalValue": 150000.50,
    "totalInvested": 120000.00,
    "totalProfitLoss": 30500.50,
    "totalProfitLossPercent": 25.42,
    "assetCount": 15,
    "lastUpdated": "2025-01-25T10:30:00Z"
  }
}
```

#### GET `/api/portfolio/assets`
**Açıklama:** Kullanıcının varlıklarını holding bilgileri ile listeler

**Query Parameters:**
- `assetType` (optional): "GOLD" | "SILVER" | "STOCK" | "FUND" | "CRYPTO" | "EUROBOND"
- `portfolioId` (optional): Portföy ID
- `page` (optional): Sayfa numarası (default: 1)
- `limit` (optional): Sayfa başına sonuç (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "assets": [
      {
        "id": "asset_id",
        "name": "Gram Altın",
        "symbol": "GOLD",
        "assetType": "GOLD",
        "currentPrice": 1850.75,
        "holdings": {
          "netQuantity": 10.5,
          "netAmount": 15750.00,
          "averagePrice": 1500.00,
          "currentValue": 19432.88,
          "profitLoss": 3682.88,
          "profitLossPercent": 23.38,
          "totalTransactions": 5
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalAssets": 25,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### POST `/api/portfolio/assets`
**Açıklama:** Yeni varlık oluşturur

**Request Body:**
```json
{
  "name": "Yapı Kredi Bankası",
  "symbol": "YKBNK",
  "assetType": "STOCK",
  "currency": "TRY"
}
```

#### GET `/api/portfolio/transactions`
**Açıklama:** Kullanıcının işlemlerini listeler

**Query Parameters:**
- `assetId` (optional): Varlık ID
- `transactionType` (optional): "BUY" | "SELL"
- `startDate` (optional): Başlangıç tarihi
- `endDate` (optional): Bitiş tarihi
- `page` (optional): Sayfa numarası
- `limit` (optional): Sayfa başına sonuç

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "transaction_id",
        "assetId": "asset_id",
        "assetName": "Garanti BBVA",
        "assetSymbol": "GARAN",
        "assetType": "STOCK",
        "transactionType": "BUY",
        "quantity": 100,
        "pricePerUnit": 45.50,
        "totalAmount": 4550.00,
        "transactionDate": "2025-01-20",
        "notes": "Alım emri"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalTransactions": 15
    }
  }
}
```

#### POST `/api/portfolio/transactions`
**Açıklama:** Yeni işlem (alım/satım) ekler

**Request Body:**
```json
{
  "assetId": "asset_id",
  "transactionType": "BUY",
  "quantity": 50,
  "pricePerUnit": 42.75,
  "transactionDate": "2025-01-25",
  "notes": "Yeni alım"
}
```

#### POST `/api/portfolio/sync-prices`
**Açıklama:** Portföy varlıklarının fiyatlarını manuel senkronize eder

**Request Body:**
```json
{
  "assetIds": ["asset_id_1", "asset_id_2"], // optional
  "force": true // Zorla güncelle
}
```

**Response:**
```json
{
  "success": true,
  "message": "Fiyat senkronizasyonu tamamlandı",
  "data": {
    "totalAssets": 15,
    "successful": 13,
    "failed": 2,
    "skipped": 0,
    "duration": 2.5,
    "errors": ["Fon X için fiyat alınamadı"]
  }
}
```

#### GET `/api/portfolio/performance`
**Açıklama:** Portföy performans metriklerini hesaplar

**Query Parameters:**
- `period` (optional): "1d" | "7d" | "30d" | "90d" | "1y" | "all" (default: "30d")

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "startValue": 145000.00,
    "endValue": 150000.50,
    "periodReturn": 5000.50,
    "periodReturnPercent": 3.45,
    "bestPerformer": {
      "name": "TEFAS Fon X",
      "returnPercent": 12.5
    },
    "worstPerformer": {
      "name": "Hisse Y",
      "returnPercent": -5.2
    }
  }
}
```

### 2. Prices API (`/api/prices/`)

#### GET `/api/prices/latest`
**Açıklama:** Belirli bir varlığın güncel fiyatını getirir

**Query Parameters:**
- `symbol` (required): Varlık sembolü
- `type` (required): "STOCK" | "FUND" | "COMMODITY" | "CRYPTO" | "CURRENCY"

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "GARAN",
    "name": "Garanti BBVA",
    "currentPrice": 45.75,
    "previousClose": 44.80,
    "changeAmount": 0.95,
    "changePercent": 2.12,
    "currency": "TRY",
    "timestamp": "2025-01-25T10:30:00Z",
    "source": "borsa-mcp"
  }
}
```

#### Fiyat Kaynakları

**Altın/Gümüş (COMMODITY):**
- Internal API: `/api/prices/latest?symbol=GOLD&type=COMMODITY`
- Yahoo Finance entegrasyonu

**Hisse Senetleri (STOCK):**
- Borsa MCP entegrasyonu
- Yahoo Finance fallback
- **Önemli:** `symbol` alanı zorunlu

**TEFAS Fonları (FUND):**
- Direkt TEFAS API: `tefasService.fetchFundPrice(symbol)`
- **Önemli:** `symbol` alanı zorunlu (fon kodu)

**Kripto Paralar (CRYPTO):**
- Yahoo Finance
- Symbol mapping (BTC → Bitcoin, ETH → Ethereum)

### 3. Tickers API (`/api/tickers/`)

#### GET `/api/tickers/search`
**Açıklama:** Cached ticker'lar için arama yapar (autocomplete)

**Query Parameters:**
- `q` (required): Arama sorgusu (minimum 2 karakter)
- `type` (required): "STOCK" | "FUND"
- `limit` (optional): Sonuç limiti (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "tickers": [
      {
        "id": "ticker_id",
        "symbol": "GARAN",
        "name": "Garanti BBVA",
        "city": "İstanbul",
        "assetType": "STOCK",
        "relevanceScore": 0.95
      }
    ]
  }
}
```

#### POST `/api/tickers/sync`
**Açıklama:** BIST/TEFAS ticker senkronizasyonunu tetikler

**Request Body:**
```json
{
  "sync_type": "BIST" | "TEFAS" | "FULL",
  "force": false,
  "triggered_by": "manual"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ticker synchronization completed successfully",
  "data": {
    "sync_type": "FULL",
    "total_duration_ms": 15000,
    "results": [
      {
        "type": "BIST",
        "total_records": 755,
        "successful": 755,
        "failed": 0,
        "duration_ms": 5000,
        "status": "completed"
      },
      {
        "type": "TEFAS",
        "total_records": 1918,
        "successful": 1918,
        "failed": 0,
        "duration_ms": 11950,
        "status": "completed"
      }
    ]
  }
}
```

## 🔄 Fiyat Senkronizasyonu

### Otomatik Fiyat Güncelleme

**AssetType'a göre strateji:**

1. **GOLD/SILVER:**
```typescript
const goldUrl = `${baseUrl}/api/prices/latest?symbol=GOLD&type=COMMODITY`;
```

2. **STOCK:**
```typescript
const stockUrl = `${baseUrl}/api/prices/latest?symbol=${asset.symbol}&type=STOCK`;
```

3. **FUND:**
```typescript
const fundData = await tefasService.fetchFundPrice(asset.symbol);
```

4. **CRYPTO:**
```typescript
const cryptoSymbol = cryptoSymbolMap[asset.name] || asset.symbol;
```

### Price Cache Sistemi

**Cache TTL:** 1 saat (3600 saniye)
**Cache Kontrolü:**
```typescript
const shouldUpdate = !lastUpdated || Date.now() - lastUpdated.getTime() > maxAge;
```

## ⚠️ Önemli Notlar

### Varlık Oluşturma Kuralları

1. **Symbol Alanı:**
   - STOCK/FON için **zorunlu**
   - GOLD/SILVER için otomatik ("GOLD"/"SILVER")
   - CRYPTO için mapping ile belirlenir

2. **Otomatik Fiyat Çekme:**
   - Asset oluşturulurken sembol varsa fiyat çekilir
   - `auto_price_update` default: `true`

3. **Currency Handling:**
   - Default: "TRY"
   - Altın/Gümüş: Otomatik TRY
   - Kripto: Otomatik USD
   - Diğerleri: Manuel seçim

### Hata Yönetimi

**Standard Response Format:**
```typescript
return Response.json({
  success: boolean,
  message?: string,
  data?: any,
  error?: string,
  details?: string
}, { status: 200 | 400 | 401 | 404 | 500 });
```

### Validasyon

**Zod Schema'ları:**
- `CreateAssetSchema`
- `TransactionSchema`
- `AssetListQuerySchema`
- `TickerSearchSchema`

## 🚀 Performans Optimizasyonları

1. **Database Indexing:**
   - `assets_user_id_idx`
   - `assets_portfolio_id_idx`
   - `assets_asset_type_idx`
   - `price_cache_composite_idx`

2. **Query Optimizasyon:**
   - Batch processing for price updates
   - Efficient aggregation queries
   - Proper joins with indexes

3. **Caching:**
   - Price cache with TTL
   - Ticker cache for autocomplete
   - Response caching where appropriate

## 📝 Örnek İşlem Akışı

### Yeni Hisse Ekleme

1. **Ticker Arama:**
```typescript
GET /api/tickers/search?q=GARAN&type=STOCK&limit=10
```

2. **Asset Oluşturma:**
```typescript
POST /api/portfolio/assets
{
  "name": "Garanti BBVA",
  "symbol": "GARAN",
  "assetType": "STOCK",
  "currency": "TRY"
}
```

3. **İşlem Ekleme:**
```typescript
POST /api/portfolio/transactions
{
  "assetId": "garanti_asset_id",
  "transactionType": "BUY",
  "quantity": 100,
  "pricePerUnit": 45.50,
  "transactionDate": "2025-01-25"
}
```

4. **Fiyat Güncelleme:**
```typescript
POST /api/portfolio/sync-prices
{
  "assetIds": ["garanti_asset_id"],
  "force": true
}
```

### Kar/Zarar Hesaplama Örneği

**Garanti BBVA için:**
- Alış: 100 lot @ 45.50 = 4.550 TL
- Mevcut Fiyat: 48.25 TL
- Mevcut Değer: 100 × 48.25 = 4.825 TL
- **Kar/Zarar:** 4.825 - 4.550 = 275 TL (+6.04%)

---

*Bu doküman uygulamanın mevcut durumunu (v2.0) yansıtmaktadır. Son güncelleme: 25 Ocak 2025*