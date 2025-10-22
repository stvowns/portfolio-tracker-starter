# TEFAS API Integration Guide

## Current Status
**✅ Official TEFAS API is FULLY OPERATIONAL** - returning real-time fund data
**Current Strategy:** Direct TEFAS API with modern crawler implementation

## 🚀 Modern TEFAS Crawler Implementation

### Core Architecture
- **Class-based:** `TEFASCrawler` with modern TypeScript interfaces
- **Caching:** 5-minute TTL with memory management (max 50 entries)
- **Retry Logic:** 3 attempts with exponential backoff (1s, 2s, 4s)
- **Timeout:** 30 seconds per request
- **Connection Optimization:** Keep-alive, compression enabled

## 📍 Internal API Routes

### 1. Fund Price API
**Route:** `GET /api/prices/latest?symbol=CODE&type=FUND`

**Example:**
```bash
curl "http://localhost:3000/api/prices/latest?symbol=YKT&type=FUND"
```

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

**Features:**
- ✅ Real-time prices from official TEFAS API
- ✅ Daily change calculations
- ✅ Automatic previous day comparison
- ✅ Caching enabled (5 minutes)

### 2. Fund Sync Script
**Route:** `scripts/sync-tefas-funds.ts`

**Usage:**
```bash
npx tsx scripts/sync-tefas-funds.ts
```

**Performance:**
- ✅ Syncs 1,910+ funds in ~5 seconds
- ✅ Database integration with ticker cache
- ✅ Error handling and progress logging
- ✅ Atomic updates (clear then insert)

## 🔌 External API Calls

### 1. TEFAS Official API
**Endpoint:** `POST https://www.tefas.gov.tr/api/DB/BindHistoryInfo`

**Headers:**
```http
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
Accept: application/json, text/javascript, */*; q=0.01
X-Requested-With: XMLHttpRequest
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36
Origin: https://www.tefas.gov.tr
Referer: https://www.tefas.gov.tr/TarihselVeriler.aspx
Accept-Language: tr-TR,tr;q=0.9,en;q=0.8
```

**Request Body:**
```http
fontip=YAT&sfontur=&kurucukod=&fonkod=FON_CODE&bastarih=DD.MM.YYYY&bittarih=DD.MM.YYYY&fonturkod=
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
      "PORTFOYBUYUKLUK": 75402345.67,
      "BORSABULTENFIYAT": "-"
    }
  ]
}
```

### 2. GitHub Fallback API (Backup)
**Endpoint:** `GET https://raw.githubusercontent.com/emirhalici/tefas_intermittent_api/data/fund_data.json`

**Usage:** Only used when official API fails
**Coverage:** ~50-100 popular funds
**Update Frequency:** Daily at 12PM Turkey time

## 📊 Rate Limits & Performance

### TEFAS Official API
- ✅ **No explicit rate limits** (based on testing)
- ⚠️ **Recommended:** Max 1 request per second
- ✅ **Connection pooling** via keep-alive
- ✅ **Automatic retries** for temporary failures

### Internal Caching
- **TTL:** 5 minutes for price data
- **Memory limit:** 50 cached entries
- **Cache key:** `{start_date}-{end_date}-{fund_code}`

## 🛡️ Error Handling

### Retry Strategy
```typescript
const maxRetries = 3;
const retryDelay = (attempt) => Math.min(1000 * Math.pow(2, attempt), 5000);
// Attempts: 1s, 2s, 4s (max)
```

### Error Types Handled
- ✅ Network timeouts (30s)
- ✅ Connection refused/reset
- ✅ HTTP 5xx server errors
- ✅ HTTP 429 rate limiting
- ✅ HTML error pages (blocked access)
- ✅ Invalid JSON responses
- ✅ Data validation errors

## 🔧 Implementation Classes

### TEFASCrawler
**File:** `lib/services/tefas-crawler.ts`

**Key Methods:**
```typescript
class TEFASCrawler {
  async fetch(start: Date, end?: Date, fundCode?: string): Promise<TEFASFundInfo[]>
  async fetchLatestFunds(): Promise<TEFASFundInfo[]>
  async fetchFund(fundCode: string): Promise<TEFASFundInfo[]>
  clearCache(): void
  getCacheStats(): { size: number; keys: string[] }
}
```

**Interface:**
```typescript
interface TEFASFundInfo {
  date: string;
  code: string;
  name: string;
  price: number;
  numberOfShares: number;
  personCount: number;
  portfolioSize: number;
  stockMarketBulletinPrice: string | null;
}
```

## 📈 Performance Metrics

### Sync Performance
- **1910 funds:** ~5.14 seconds
- **Individual fund price:** ~300-400ms (first request)
- **Cached requests:** ~10-20ms
- **Concurrent requests:** Supported via connection pooling

### Memory Usage
- **Cache:** ~1-2MB for full fund dataset
- **Peak memory:** During sync operations
- **Cleanup:** Automatic cache size management

## 🔄 Usage Examples

### 1. Get Single Fund Price
```typescript
import { TEFASCrawler } from '../lib/services/tefas-crawler';

const crawler = new TEFASCrawler();
const funds = await crawler.fetch(new Date(), new Date(), 'YKT');
console.log(funds[0].price); // 0.812882
```

### 2. Get All Latest Funds
```typescript
const crawler = new TEFASCrawler();
const allFunds = await crawler.fetchLatestFunds();
console.log(`Fetched ${allFunds.length} funds`); // 1910
```

### 3. With Column Filtering
```typescript
const crawler = new TEFASCrawler();
const funds = await crawler.fetch(
  new Date(),
  undefined,
  undefined,
  ['code', 'name', 'price'] // Only these columns
);
```

## 🔍 Data Validation

### Required Fields
- `FONKODU`: Fund code (2-6 uppercase letters/numbers)
- `FONUNVAN`: Fund name (string)
- `FIYAT`: Price (positive number)
- `TARIH`: Timestamp (milliseconds)

### Optional Fields
- `TEDPAYSAYISI`: Number of shares
- `KISISAYISI`: Person count
- `PORTFOYBUYUKLUK`: Portfolio size
- `BORSABULTENFIYAT`: Stock market bulletin price

## 🚦 Monitoring & Debugging

### Logging Levels
- `INFO`: Successful operations, cache hits
- `WARN`: Unusual fund codes, parsing errors
- `ERROR`: API failures, network issues

### Cache Statistics
```typescript
const stats = crawler.getCacheStats();
// { size: 5, keys: ["22.10.2025-22.10.2025-all", "22.10.2025-22.10.2025-YKT", ...] }
```

### Health Checks
```bash
# Test API endpoint
curl "http://localhost:3000/api/prices/latest?symbol=YKT&type=FUND"

# Run sync script
npx tsx scripts/sync-tefas-funds.ts
```

## 🎯 Best Practices

1. **Use caching:** Avoid unnecessary API calls
2. **Handle errors gracefully:** Always wrap API calls in try-catch
3. **Monitor performance:** Check sync duration and cache hit rates
4. **Validate data:** Check for required fields before processing
5. **Rate limiting:** Don't make excessive concurrent requests

## 🔮 Future Enhancements

1. **WebSocket streaming:** Real-time price updates
2. **Batch operations:** Fetch multiple funds in single request
3. **Historical data:** Extended date range support
4. **Analytics:** Price trends and performance metrics
5. **Alerting:** Price change notifications

---

**Last Updated:** October 22, 2025
**Status:** ✅ Production Ready
**API Version:** v2 (Modern TEFAS Crawler)