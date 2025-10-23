# 📊 Portfolio Tracker Veritabanı Tasarımı

## 🎯 Tasarım Prensipleri

### ✅ Temel Kurallar
- **Kullanıcı verileri** ile **Market verileri** kesinlikle ayrılacak
- **Normalize ama over-engineering yapma**
- **Performans odaklı** - gereksiz join'lerden kaçın
- **Scalable** - 1M+ kullanıcı, 10M+ fiyat kaydı destekleyebilmeli
- **Flexible** - yeni varlık türleri kolay eklenebilmeli

---

## 🏗️ Veritabanı Şeması

### 👤 Kullanıcı Verileri (User Data)

```sql
-- USERS (Kullanıcılar)
users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- PORTFOLIOS (Portföyler)
portfolios (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT DEFAULT 'Ana Portföy',
    base_currency TEXT DEFAULT 'TRY',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- USER HOLDINGS (Kullanıcı Varlıkları)
user_holdings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    portfolio_id TEXT NOT NULL,
    instrument_id TEXT NOT NULL,
    quantity DECIMAL(15,8) NOT NULL,
    avg_cost DECIMAL(15,8) NOT NULL,
    total_cost DECIMAL(15,8) GENERATED ALWAYS AS (quantity * avg_cost) STORED,
    first_purchase_date TIMESTAMP,
    last_updated TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id),
    FOREIGN KEY (instrument_id) REFERENCES market_instruments(id),
    UNIQUE(user_id, instrument_id, portfolio_id)
);

-- TRANSACTIONS (İşlemler)
transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    holding_id TEXT NOT NULL,
    transaction_type ENUM('BUY','SELL') NOT NULL,
    quantity DECIMAL(15,8) NOT NULL,
    price_per_unit DECIMAL(15,8) NOT NULL,
    total_amount DECIMAL(15,8) GENERATED ALWAYS AS (quantity * price_per_unit) STORED,
    transaction_date TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (holding_id) REFERENCES user_holdings(id)
);
```

### 📈 Market Verileri (Market Data)

```sql
-- MARKET INSTRUMENTS (Tüm Enstrümanlar - Tek Tablo)
market_instruments (
    id TEXT PRIMARY KEY,
    type ENUM('STOCK','FUND','COMMODITY','CRYPTO','CASH','BOND','ETF') NOT NULL,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    exchange TEXT NOT NULL,
    sector TEXT,
    industry TEXT,
    city TEXT,
    currency TEXT DEFAULT 'TRY',
    is_active BOOLEAN DEFAULT true,
    current_price DECIMAL(15,8),
    previous_close DECIMAL(15,8),
    change_amount DECIMAL(15,8),
    change_percent DECIMAL(8,4),
    last_updated TIMESTAMP,
    extra_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- PRICE HISTORY (Tarihsel Fiyatlar)
price_history (
    id TEXT PRIMARY KEY,
    instrument_id TEXT NOT NULL,
    price DECIMAL(15,8) NOT NULL,
    volume BIGINT,
    high_price DECIMAL(15,8),
    low_price DECIMAL(15,8),
    open_price DECIMAL(15,8),
    change_amount DECIMAL(15,8),
    change_percent DECIMAL(8,4),
    currency TEXT NOT NULL,
    data_source TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    FOREIGN KEY (instrument_id) REFERENCES market_instruments(id)
);

-- DIVIDENDS (Temettü/Kuponlar)
dividends (
    id TEXT PRIMARY KEY,
    instrument_id TEXT NOT NULL,
    amount DECIMAL(15,8) NOT NULL,
    dividend_type ENUM('CASH','STOCK','BOND_COUPON') NOT NULL,
    ex_date DATE NOT NULL,
    payment_date DATE,
    currency TEXT NOT NULL,
    description TEXT,
    FOREIGN KEY (instrument_id) REFERENCES market_instruments(id)
);

-- USER PREFERENCES (Kullanıcı Ayarları)
user_preferences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, key)
);
```

---

## 🤔 Market Verileri Ayrımı Konusu

### ❌ Alternatif: Her Varlık Türü İçin Ayrı Tablo
```sql
-- KÖTÜ yaklaşım - over-engineering
bist_stocks (id, symbol, name, sector, ...)
tefas_funds (id, symbol, name, fund_type, ...)
commodities (id, symbol, name, unit, ...)
cryptocurrencies (id, symbol, name, blockchain, ...)
```

**Problemleri:**
- 🐌 **Performans**: Fiyat çekmek için 4 farklı tabloya query atmak
- 🔧 **Maintainance**: Her yeni varlık türü için yeni tablo
- 🔄 **Complexity**: Join'ler ve union'lar karmaşıklaşıyor
- 📊 **Analytics**: Tüm varlıkları bir arada göstermek zor

### ✅ Seçilen Yaklaşım: Tek Market Instruments Tablosu
```sql
-- İYİ yaklaşım - flexible ve performanslı
market_instruments (
    type ENUM('STOCK','FUND','COMMODITY','CRYPTO','CASH'),
    symbol TEXT,
    name TEXT,
    -- Common fields
    exchange, sector, currency, is_active,
    -- Type-specific fields in extra_data
    extra_data JSONB
)
```

**Avantajları:**
- ⚡ **Performance**: Tek tablo, tek index
- 🔍 **Search**: Tüm varlıklarda aynı anda arama
- 📊 **Analytics**: Toplam portföy değeri, dağılım kolay hesaplanır
- 🚀 **Scalable**: JSONB ile type-specific veriler
- 💰 **Cost**: 1 tablo vs 5+ tablo

---

## 📋 Field Detayları

### Market Instruments için Type-Specific extra_data

#### 🏦 BIST Hisseleri (type='STOCK')
```json
{
  "bloomberg_code": "GARAN:TI",
  "reuters_code": "GARAN.IS",
  "isin": "TRGGRB41015",
  "market_cap": 123456789012,
  "ipo_date": "1990-01-01",
  "employees": 18000,
  "website": "https://www.garanti.com.tr",
  "beta": 1.2
}
```

#### 💰 Yatırım Fonları (type='FUND')
```json
{
  "tefas_code": "ADP",
  "mkk_code": "A12345",
  "fund_type": "HİSSE SENEDİ YOĞUN",
  "fund_category": "BIST Banka",
  "fund_manager": "AK Portföy",
  "inception_date": "2018-03-15",
  "minimum_investment": 1.0,
  "expense_ratio": 0.0125,
  "risk_level": "ORTA",
  "benchmark": "BIST 100 Banka Endeksi",
  "aum": 1234567890
}
```

#### 🪙 Altın/Gümüş (type='COMMODITY')
```json
{
  "commodity_type": "PRECIOUS_METAL",
  "unit": "GRAM",
  "purity": 999.9,
  "market_source": "kapalicarsi",
  "update_frequency": "realtime"
}
```

#### ₿ Kripto Paralar (type='CRYPTO')
```json
{
  "coinmarketcap_id": 1,
  "coingecko_id": "bitcoin",
  "blockchain": "Bitcoin",
  "market_cap_rank": 1,
  "circulating_supply": 19500000,
  "max_supply": 21000000,
  "consensus": "PoW",
  "exchanges": ["binance", "coinbase"],
  "launch_date": "2009-01-03"
}
```

#### 💵 Nakit (type='CASH')
```json
{
  "currency_code": "TRY",
  "currency_name": "Türk Lirası",
  "country": "Türkiye",
  "central_bank": "TCMB",
  "interest_rate": 0.50
}
```

---

## 🚀 Performans Stratejisi

### Index Strategy
```sql
-- Ana performans index'leri
CREATE INDEX idx_market_instruments_type_symbol ON market_instruments(type, symbol);
CREATE INDEX idx_market_instruments_active ON market_instruments(is_active) WHERE is_active = true;
CREATE INDEX idx_price_history_instrument_timestamp ON price_history(instrument_id, timestamp DESC);
CREATE INDEX idx_user_holdings_user_portfolio ON user_holdings(user_id, portfolio_id);
CREATE INDEX idx_transactions_holding_date ON transactions(holding_id, transaction_date DESC);

-- Unique constraints
CREATE UNIQUE INDEX uniq_user_instrument_portfolio ON user_holdings(user_id, instrument_id, portfolio_id);
CREATE UNIQUE INDEX uniq_user_preferences_key ON user_preferences(user_id, key);
```

### Query Optimizasyonu
```sql
-- Fast portfolio value calculation
SELECT
  u.id as user_id,
  SUM(h.quantity * i.current_price) as total_value,
  SUM(h.total_cost) as total_cost
FROM users u
JOIN user_holdings h ON u.id = h.user_id
JOIN market_instruments i ON h.instrument_id = i.id
WHERE u.id = $1 AND i.is_active = true
GROUP BY u.id;

-- Fast price updates
UPDATE market_instruments
SET current_price = $1, last_updated = NOW()
WHERE id = $2 AND type = $3;
```

---

## 🔄 Migration Planı

### Phase 1: Schema Oluşturma
1. Yeni tabloları oluştur
2. Index'leri ekle
3. Constraint'leri ekle

### Phase 2: Seed Data
1. BIST hisseleri master data (500+ hisse)
2. TEFAS fonları master data (1000+ fon)
3. Temel kripto paralar (BTC, ETH, vb)
4. Altın/Gümüş çeşitleri

### Phase 3: API Layer
1. Market data API'leri yeniden yaz
2. User data API'leri güncelle
3. **Güvenli batch upsert fiyat senkronizasyon servisi**

### Phase 4: Frontend
1. Varlık ekleme formu güncelle
2. Dashboard performans hesaplamaları
3. Arama ve filtreleme

---

## ⚡ Performans Odaklı Sync Stratejisi

### 🚀 Güvenli Batch Upsert Yaklaşımı

#### **✅ Seçilen Yöntem:**
1. **Batch upsert** (500'lik gruplar halinde)
2. **Transaction içinde** (ya hep ya hiç)
3. **Selective update** (sadece değişen alanlar)
4. **Fiyat geçmişi** için ayrı tablo

#### **🔄 Sync Algoritması:**
```sql
-- 1. Transaction başlat
BEGIN;

-- 2. Batch 1: Fiyat geçmişine aktar
INSERT INTO price_history (instrument_id, price, timestamp, data_source)
SELECT id, current_price, last_updated, 'bist-api'
FROM market_instruments
WHERE type = 'STOCK'
  AND current_price IS NOT NULL
  AND last_updated > $last_sync_time;

-- 3. Batch 2: Sadece değişenleri upsert et
INSERT INTO market_instruments (id, type, symbol, current_price, previous_close, change_amount, change_percent, last_updated, updated_at)
VALUES
  ('inst_001', 'STOCK', 'GARAN', 45.50, 45.20, 0.30, 0.66, NOW(), NOW()),
  ('inst_002', 'STOCK', 'ISCTR', 23.75, 23.80, -0.05, -0.21, NOW(), NOW()),
  -- ... 500 kayıt daha
ON CONFLICT (type, symbol)
DO UPDATE SET
  current_price = EXCLUDED.current_price,
  previous_close = EXCLUDED.previous_close,
  change_amount = EXCLUDED.change_amount,
  change_percent = EXCLUDED.change_percent,
  last_updated = EXCLUDED.last_updated,
  updated_at = EXCLUDED.updated_at
WHERE market_instruments.current_price IS DISTINCT FROM EXCLUDED.current_price
   OR market_instruments.last_updated IS DISTINCT FROM EXCLUDED.last_updated;

-- 4. Transaction commit
COMMIT;
```

#### **📊 Batch Processing Implementation:**
```typescript
async function batchUpsertInstruments(instruments: Instrument[], batchSize = 500) {
  const batches = [];
  for (let i = 0; i < instruments.length; i += batchSize) {
    batches.push(instruments.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    await db.transaction(async (tx) => {
      // Fiyat geçmişini kaydet
      await tx.insert(priceHistory).values(
        batch.map(inst => ({
          instrumentId: inst.id,
          price: inst.currentPrice,
          timestamp: new Date(),
          dataSource: 'bist-api'
        }))
      );

      // Upsert yap
      await tx.insert(marketInstruments).values(batch)
        .onConflictDoUpdate({
          target: [marketInstruments.type, marketInstruments.symbol],
          set: {
            currentPrice: sql`excluded.current_price`,
            previousClose: sql`excluded.previous_close`,
            changeAmount: sql`excluded.change_amount`,
            changePercent: sql`excluded.change_percent`,
            lastUpdated: sql`excluded.last_updated`,
            updatedAt: new Date()
          },
          where: sql`
            ${marketInstruments.currentPrice} IS DISTINCT FROM excluded.current_price
            OR ${marketInstruments.lastUpdated} IS DISTINCT FROM excluded.last_updated
          `
        });
    });

    console.log(`✅ Processed batch: ${batch.length} instruments`);
  }
}
```

#### **🎯 Performance Optimizasyonları:**

**1. Index Strategy:**
```sql
-- Batch upsert için optimal index'ler
CREATE INDEX idx_market_instruments_type_symbol ON market_instruments(type, symbol);
CREATE INDEX idx_price_history_instrument_timestamp ON price_history(instrument_id, timestamp DESC);

-- Upsert performansı için
CREATE UNIQUE INDEX uniq_market_instruments_type_symbol ON market_instruments(type, symbol);
```

**2. Selective Update (Değişenleri Yakala):**
```sql
-- Sadece fiyatı değişenleri güncelle
DO UPDATE SET
  current_price = EXCLUDED.current_price,
  updated_at = NOW()
WHERE market_instruments.current_price IS DISTINCT FROM EXCLUDED.current_price
   OR market_instruments.last_updated IS DISTINCT FROM EXCLUDED.last_updated;
```

**3. Memory Efficient:**
```typescript
// Stream processing - 3000 kaydı hafızada tutma
async function* fetchInstrumentsBatch(apiUrl: string, batchSize = 100) {
  let offset = 0;
  while (true) {
    const batch = await fetchFromAPI(apiUrl, { limit: batchSize, offset });
    if (batch.length === 0) break;
    yield batch;
    offset += batchSize;
  }
}
```

#### **📈 Fiyat Geçmişi Tablosu:**
```sql
-- Tarihsel fiyat verileri (isteğe bağlı)
price_history (
    id TEXT PRIMARY KEY,
    instrument_id TEXT NOT NULL,
    price DECIMAL(15,8) NOT NULL,
    volume BIGINT,
    timestamp TIMESTAMP NOT NULL,
    data_source TEXT NOT NULL,
    FOREIGN KEY (instrument_id) REFERENCES market_instruments(id)
);

-- Performance için partitioning (isteğe bağlı)
-- Tarihe göre ayır - 1 ayda bir partition
CREATE TABLE price_history_y2024m01 PARTITION OF price_history
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

#### **🛡️ Güvenlik ve Hata Yönetimi:**
```typescript
class SafeBatchSync {
  async sync() {
    const startTime = Date.now();
    let processedCount = 0;
    let failedBatches = 0;

    try {
      for await (const batch of this.fetchInstrumentsBatches()) {
        try {
          await this.processBatch(batch);
          processedCount += batch.length;
        } catch (batchError) {
          console.error(`❌ Batch failed:`, batchError);
          failedBatches++;
          continue; // Sonraki batch'e geç
        }
      }

      console.log(`✅ Sync completed: ${processedCount} processed, ${failedBatches} failed`);
      return { success: true, processedCount, failedBatches, duration: Date.now() - startTime };

    } catch (error) {
      console.error('❌ Critical sync error:', error);
      await this.rollbackPartialChanges();
      throw error;
    }
  }

  private async rollbackPartialChanges() {
    // Kritik hata durumunda partial değişiklikleri geri al
    console.log('🔄 Rolling back partial changes...');
    // Örnek: Son 5 dakikadaki değişiklikleri geri al
  }
}
```

#### **📊 Monitoring ve Analytics:**
```sql
-- Sync performansı için monitoring
CREATE TABLE sync_performance_log (
    id TEXT PRIMARY KEY,
    sync_type TEXT NOT NULL,
    batch_count INTEGER NOT NULL,
    total_records INTEGER NOT NULL,
    processed_records INTEGER NOT NULL,
    failed_records INTEGER NOT NULL,
    duration_ms INTEGER NOT NULL,
    memory_usage_mb INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Günlük sync istatistikleri
SELECT
    DATE(created_at) as sync_date,
    sync_type,
    COUNT(*) as sync_count,
    AVG(duration_ms) as avg_duration,
    SUM(total_records) as total_processed,
    AVG(failed_records) as avg_failed
FROM sync_performance_log
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), sync_type
ORDER BY sync_date DESC;
```

#### **🚀 Performans Karşılaştırması:**
| Metrik | Eski Yöntem (Delete+Insert) | Yeni Yöntem (Batch Upsert) |
|--------|---------------------------|--------------------------|
| **3.000 kayıt sync** | ~15-20 saniye | ~3-5 saniye |
| **Memory kullanımı** | High (tüm veri) | Low (batch processing) |
| **Data loss riski** | ❌ Yüksek | ✅ Minimal |
| **Fiyat geçmişi** | ❌ Kaybolur | � Saklanır |
| **Error recovery** | ❌ Tamamen baştan | ✅ Batch bazında |
| **Concurrent sync** | ❌ Conflict | ✅ Güvenli |

#### **🎯 Sonuç:**
Bu yaklaşım ile:
- ✅ **5x daha hızlı** sync
- ✅ **Güvenli** (data loss yok)
- ✅ **Tarihsel veri** (price_history)
- ✅ **Scalable** (milyonlarca kayıt)
- ✅ **Monitorable** (performans logları)
- ✅ **Recovery** (hata yönetimi)

---

## 🚀 IMPLEMENTATION PLANI (FRESH START)

### 📋 Genel Bakış
Bu plan, **sıfırdan** yeni veritabanı yapısı oluşturmayı hedefler. Mevcut veri olmadığı için **clean start** yaklaşımı kullanılıyor. Her adım **database-design.md'deki TO-DO** işaretleri ile takip edilecek.

### 🎯 Başlangıç Durumu
- **Branch:** `feature/new-database-architecture`
- **Veritabanı:** Sıfırlanacak (`portfolio.db` silinecek)
- **Legacy Kod:** Temizlenecek
- **Timeline:** 8-12 gün (hızlandırılmış)
- **Risk:** Minimum (clean slate)

### 🗑️ Phase 0: Temizlik ve Hazırlık (0.5 gün)
**[ ] TO-DO: Temizlik ve hazırlık**
- [ ] `portfolio.db` veritabanı dosyasını sil
- [ ] Legacy cache tablolarını temizle (`price_cache`, `ticker_cache`, `*_logs`)
- [ ] Gereksiz script'leri sil (`scripts/sync-*.ts`)
- [ ] Eski API'leri geçici olarak devre dışı bırak
- [ ] Development environment'ı hazırla

### 🎯 Phase 1: Yeni Schema Oluşturma (1 gün)
**[ ] TO-DO: Yeni tablolar oluştur**
```sql
-- 1. Market instruments tablosu oluştur
CREATE TABLE market_instruments ( ... );

-- 2. User holdings tablosu oluştur
CREATE TABLE user_holdings ( ... );

-- 3. Price history tablosu oluştur
CREATE TABLE price_history ( ... );

-- 4. Performance log tablosu oluştur
CREATE TABLE sync_performance_log ( ... );
```

**Güncellenecek dosyalar:**
- [ ] `db/schema/index.ts` - Yeni tablolar ekle
- [ ] `drizzle.config.ts` - Migration config

### 🌱 Phase 2: Seed Data ve Master Data (1 gün)
**[ ] TO-DO: Master data ekle**
```sql
-- 1. BIST hisseleri (örnek 500 hisse)
INSERT INTO market_instruments (type, symbol, name, exchange, sector, extra_data) VALUES
('STOCK', 'GARAN', 'Garanti Bankası A.Ş.', 'BIST', 'Bankacılık', '{"isin":"TRGGRB41015","market_cap":123456789012}'),
('STOCK', 'ISCTR', 'İş Bankası A.Ş.', 'BIST', 'Bankacılık', '{"isin":"TRISKB91015","market_cap":234567890123}'),
-- ... daha fazla hisse

-- 2. TEFAS fonları (örnek 200 fon)
INSERT INTO market_instruments (type, symbol, name, exchange, extra_data) VALUES
('FUND', 'ADP', 'AK Portföy BIST Banka Endeks...', 'TEFAS', '{"tefas_code":"ADP","fund_type":"HİSSE SENEDİ YOĞUN"}'),
('FUND', 'ANL', 'Anadolu Hayat Emeklilik...', 'TEFAS', '{"tefas_code":"ANL","fund_type":"KATILIM"}'),
-- ... daha fazla fon

-- 3. Kripto paralar
INSERT INTO market_instruments (type, symbol, name, exchange, extra_data) VALUES
('CRYPTO', 'BTC', 'Bitcoin', 'MULTIPLE', '{"coinmarketcap_id":1,"consensus":"PoW"}'),
('CRYPTO', 'ETH', 'Ethereum', 'MULTIPLE', '{"coinmarketcap_id":2,"consensus":"PoS"}'),
-- ... daha fazla kripto

-- 4. Emtialar ve Nakit
INSERT INTO market_instruments (type, symbol, name, exchange, extra_data) VALUES
('COMMODITY', 'GOLD', 'Gram Altın', 'FREE_MARKET', '{"unit":"GRAM","purity":999.9}'),
('COMMODITY', 'SILVER', 'Gram Gümüş', 'FREE_MARKET', '{"unit":"GRAM","purity":999.9}'),
('CASH', 'TRY', 'Türk Lirası', 'CBRT', '{"currency_code":"TRY","central_bank":"TCMB"}'),
('CASH', 'USD', 'ABD Doları', 'CBRT', '{"currency_code":"USD","central_bank":"FED"}');
```

**Güncellenecek dosyalar:**
- [ ] `scripts/seed-market-data.ts` - Master data seed script
- [ ] `scripts/seed-cryptos.ts` - Kripto seed data
- [ ] `scripts/seed-commodities.ts` - Emtia seed data

### ⚡ Phase 3: Batch Upsert Service (3-4 gün)
**[ ] TO-DO: Güvenli senkronizasyon servisi**
```typescript
// 1. Safe batch sync service
class SafeBatchSync {
  async syncBISTTickers() { /* implementation */ }
  async syncTEFASFunds() { /* implementation */ }
  async syncCryptoPrices() { /* implementation */ }
}

// 2. Performance monitoring
class SyncPerformanceLogger {
  logBatchPerformance(batchData, duration) { /* implementation */ }
}
```

**Güncellenecek dosyalar:**
- [ ] `lib/services/safe-batch-sync.ts` - Yeni sync service
- [ ] `lib/services/performance-logger.ts` - Monitoring service
- [ ] `scripts/sync-bist-tickers.ts` - Güncelle (batch upsert)
- [ ] `scripts/sync-tefas-data.ts` - Güncelle (batch upsert)

### 🔄 Phase 4: API Layer Güncelleme (3-5 gün)
**[ ] TO-DO: API'leri yeni yapıya göre güncelle**

#### **4.1 Market Data APIs**
- [ ] `app/api/market/instruments/route.ts` - Yeni market instruments API
- [ ] `app/api/market/sync/route.ts` - Yeni sync API (batch upsert)
- [ ] `app/api/prices/latest/route.ts` - Market instruments'dan fiyat çek
- [ ] `app/api/market/price-history/route.ts` - Fiyat geçmişi API

#### **4.2 User Data APIs (Backward Compatible)**
- [ ] `app/api/portfolio/assets/route.ts` - User holdings'den veri çek
- [ ] `app/api/portfolio/holdings/route.ts` - Yeni holdings API
- [ ] `app/api/portfolio/transactions/route.ts` - Aynı kalsın

#### **4.3 Legacy API'leri Koru**
```typescript
// Assets API backward compatibility
export async function GET(request: NextRequest) {
  // Mevcut assets formatını koru, veriyi yeni tablolardan çek
  const holdings = await db.select().from(user_holdings)
    .where(eq(user_holdings.userId, session.user.id));

  // Legacy format'a dönüştür
  return legacyFormat;
}
```

### 🎨 Phase 5: Frontend Güncelleme (2-3 gün)
**[ ] TO-DO: UI'yi yeni yapıya göre güncelle**

#### **5.1 Component Updates**
- [ ] `components/portfolio/asset-list.tsx` - Yeni holdings formatı
- [ ] `components/portfolio/asset-detail-modal.tsx` - Market data integration
- [ ] `components/portfolio/fund-performance.tsx` - Yeni veri yapısı

#### **5.2 Service Updates**
- [ ] `lib/api/portfolio-service.ts` - API çağrıları güncelle
- [ ] `lib/hooks/use-portfolio.ts` - React hooks güncelle

### 🧪 Phase 6: Testing & Validation (2-3 gün)
**[ ] TO-DO: Kapsamlı testing**

#### **6.1 Unit Tests**
- [ ] `tests/sync/performance.test.ts` - Batch sync performance
- [ ] `tests/migration/data-integrity.test.ts` - Veri bütünlüğü
- [ ] `tests/api/backward-compatibility.test.ts` - Legacy API test

#### **6.2 Integration Tests**
- [ ] `tests/e2e/portfolio-sync.test.ts` - End-to-end sync
- [ ] `tests/e2e/migration.test.ts` - Migration validation

#### **6.3 Performance Tests**
- [ ] `tests/performance/5000-records.test.ts` - Büyük veri test
- [ ] `tests/performance/concurrent-sync.test.ts` - Concurrent sync

### 🚀 Phase 7: Go-Live (1 gün)
**[ ] TO-DO: Production'a geçiş**

#### **7.1 Pre-Deployment**
- [ ] Database backup
- [ ] Dry-run migration
- [ ] Performance baseline measurement

#### **7.2 Deployment**
- [ ] Migration script çalıştır
- [ ] Yeni API'leri aktif et
- [ ] Monitoring kurulumu

#### **7.3 Post-Deployment**
- [ ] Validation checks
- [ ] Performance monitoring
- [ ] Rollback plan (if needed)

---

## 📊 IMPLEMENTATION CHECKLIST

### ✅ Phase 1 - Schema (Tahmini: 1-2 gün)
- [ ] `market_instruments` tablosu oluştur
- [ ] `user_holdings` tablosu oluştur
- [ ] `price_history` tablosu oluştur
- [ ] `sync_performance_log` tablosu oluştur
- [ ] Index'leri ekle
- [ ] Foreign key constraints ekle
- [ ] Drizzle schema güncelle

### ✅ Phase 2 - Migration (Tahmini: 2-3 gün)
- [ ] Migration script yaz
- [ ] Validation script yaz
- [ ] Mevcut assets → market_instruments
- [ ] Transactions → user_holdings
- [ ] Veri bütünlüğü kontrolü
- [ ] Performance test

### ✅ Phase 3 - Sync Service (Tahmini: 3-4 gün)
- [ ] SafeBatchSync class yaz
- [ ] Batch upsert implementation (500 kayıt)
- [ ] Transaction handling
- [ ] Error recovery mechanism
- [ ] Performance logger
- [ ] Monitoring dashboard

### ✅ Phase 4 - API Layer (Tahmini: 3-5 gün)
- [ ] Market instruments API
- [ ] Batch sync API
- [ ] Price history API
- [ ] Legacy API compatibility
- [ ] API documentation
- [ ] Error handling

### ✅ Phase 5 - Frontend (Tahmini: 2-3 gün)
- [ ] Component güncellemeleri
- [ ] Service layer güncellemeleri
- [ ] React hooks güncellemeleri
- [ ] UI testing
- [ ] Performance optimization

### ✅ Phase 6 - Testing (Tahmini: 2-3 gün)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance tests
- [ ] E2E tests
- [ ] Load testing

### ✅ Phase 7 - Deployment (Tahmini: 1 gün)
- [ ] Backup strategy
- [ ] Deployment script
- [ ] Monitoring setup
- [ ] Rollback plan
- [ ] Post-deployment validation

---

## ⏰ Tahmini Timeline (FRESH START)

| Phase | Süre | Başlangıç | Bitiş | Durum |
|-------|------|-----------|-------|-------|
| Phase 0 - Temizlik | 0.5 gün | 2025-01-23 | 2025-01-23 | ✅ **TAMAMLANDI** |
| Phase 1 - Schema | 1 gün | 2025-01-23 | 2025-01-24 | 🚀 **BAŞLIYOR** |
| Phase 2 - Seed Data | 1 gün | 2025-01-24 | 2025-01-25 | 📋 Plan |
| Phase 3 - Sync Service | 2-3 gün | 2025-01-25 | 2025-01-28 | 📋 Plan |
| Phase 4 - API Layer | 2-3 gün | 2025-01-28 | 2025-01-31 | 📋 Plan |
| Phase 5 - Frontend | 2-3 gün | 2025-01-31 | 2025-02-03 | 📋 Plan |
| Phase 6 - Testing | 1-2 gün | 2025-02-03 | 2025-02-05 | 📋 Plan |
| **TOPLAM** | **8-12 gün** | 2025-01-23 | 2025-02-05 | |

---

## 📊 IMPLEMENTATION CHECKLIST (FRESH START)

### ✅ Phase 0 - Temizlik (Tahmini: 0.5 gün)
- [ ] `portfolio.db` veritabanı dosyasını sil
- [ ] Legacy cache tablolarını temizle
- [ ] Gereksiz script'leri sil
- [ ] Eski API'leri devre dışı bırak
- [ ] Development environment hazırla

### ✅ Phase 1 - Schema (Tahmini: 1 gün)
- [ ] `market_instruments` tablosu oluştur
- [ ] `user_holdings` tablosu oluştur
- [ ] `price_history` tablosu oluştur
- [ ] `sync_performance_log` tablosu oluştur
- [ ] Index'leri ekle
- [ ] Foreign key constraints ekle
- [ ] Drizzle schema güncelle

**[ ] Phase 1 BAŞLANGIÇ:** Schema oluşturma `feature/new-database-architecture` branch'inde!

### ✅ Phase 2 - Seed Data (Tahmini: 1 gün)
- [ ] BIST hisseleri seed data (500+)
- [ ] TEFAS fonları seed data (200+)
- [ ] Kripto paralar seed data (10+)
- [ ] Emtialar seed data
- [ ] Nakit varlıkları seed data

### ✅ Phase 3 - Sync Service (Tahmini: 2-3 gün)
- [ ] SafeBatchSync class yaz
- [ ] Batch upsert implementation (500 kayıt)
- [ ] Transaction handling
- [ ] Error recovery mechanism
- [ ] Performance logger
- [ ] Monitoring dashboard

### ✅ Phase 4 - API Layer (Tahmini: 2-3 gün)
- [ ] Market instruments API
- [ ] Batch sync API
- [ ] Price history API
- [ ] User holdings API
- [ ] Performance API
- [ ] API documentation

### ✅ Phase 5 - Frontend (Tahmini: 2-3 gün)
- [ ] Component'ları yeniden yaz
- [ ] Service layer güncellemeleri
- [ ] React hooks güncellemeleri
- [ ] Performance dashboard
- [ ] Responsive design

### ✅ Phase 6 - Testing (Tahmini: 1-2 gün)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance tests
- [ ] E2E tests
- [ ] Load testing

### 🚀 BAŞLANGIÇ KONTROL LİSTESİ

**[x] Phase 0 Başlangıç Kontrolü:**
- [x] Yeni branch oluşturuldu: `feature/new-database-architecture`
- [x] Database design dokümanı güncellendi
- [x] Legacy kodlar listelendi
- [x] Temizlik planı hazır

**[x] Phase 0 - Temizlik İşlemleri:**
- [x] `portfolio.db` veritabanı dosyasını sil (✅)
- [x] Legacy cache tablolarını temizle (✅ - DB silindiği ile temizlendi)
- [x] Gereksiz script'leri sil ve yedekle (✅)
- [ ] Eski API'leri devre dışı bırak (gelecek phase'de)
- [ ] Development environment hazırla (✅)

**📋 Tamamlanan Yedekleme İşlemleri:**
- ✅ Script'ler `scripts/legacy/` klasörüne taşındı
- ✅ Veritabanı `scripts/backup/portfolio-backup-*.db` olarak yedeklendi
- ✅ `scripts/legacy/README.md` ile referans rehberi oluşturuldu
- ✅ Kullanılabilir kod parçaları belgelendirildi

---

## 🎯 Başarı Metrikleri

### Performance Hedefleri
- ⚡ Sync süresi: 20s → 4s (5x improvement)
- 💾 Memory kullanımı: %80 azalma
- 📊 API response time: <200ms
- 🔄 Concurrent sync: 3+ parallel processes

### Quality Hedefleri
- 🛡️ Zero data loss
- 🔄 99.9% uptime
- 📈 Backward compatibility: 100%
- 🧪 Test coverage: >90%

---

## 📊 Örnek Veriler

### Market Instruments Sample
```sql
INSERT INTO market_instruments VALUES
('inst_001', 'STOCK', 'GARAN', 'Garanti Bankası A.Ş.', 'BIST', 'Bankacılık', 'Mali Bankacılık', 'İstanbul', 'TRY', true, 45.50, 45.20, 0.30, 0.66, NOW(), '{"isin":"TRGGRB41015","market_cap":123456789012}', NOW(), NOW()),

('inst_002', 'FUND', 'ADP', 'AK Portföy BIST Banka Endeks...', 'TEFAS', 'Fon', 'Hisse Senedi Yoğun', 'İstanbul', 'TRY', true, 1.0638, 1.0638, 0.00, 0.00, NOW(), '{"tefas_code":"ADP","fund_type":"HİSSE SENEDİ YOĞUN","risk_level":"ORTA"}', NOW(), NOW()),

('inst_003', 'COMMODITY', 'GOLD', 'Gram Altın', 'FREE_MARKET', 'Değerli Metaller', null, null, 'TRY', true, 2450.75, 2445.20, 5.55, 0.23, NOW(), '{"unit":"GRAM","purity":999.9}', NOW(), NOW()),

('inst_004', 'CRYPTO', 'BTC', 'Bitcoin', 'MULTIPLE', 'Kripto Para', null, null, 'USD', true, 67250.00, 66500.00, 750.00, 1.13, NOW(), '{"coinmarketcap_id":1,"consensus":"PoW"}', NOW(), NOW()),

('inst_005', 'CASH', 'TRY', 'Türk Lirası', 'CBRT', 'Nakit', null, null, 'TRY', true, 1.00, 1.00, 0.00, 0.00, NOW(), '{"currency_code":"TRY","central_bank":"TCMB"}', NOW(), NOW());
```

### User Holdings Sample
```sql
INSERT INTO user_holdings VALUES
('hold_001', 'user_123', 'port_001', 'inst_002', 2.0, 1.0, 2.0, NOW(), NOW()), -- ADP fonu
('hold_002', 'user_123', 'port_001', 'inst_003', 1.5, 2400.0, 3600.0, NOW(), NOW()); -- Gram altın
```

---

## 🎯 Sonuç

Bu tasarım:
- ✅ **Kullanıcı ve market verileri ayrı**
- ✅ **Performans odaklı** - minimum join, maksimum hız
- ✅ **Flexible** - JSONB ile type-specific veriler
- ✅ **Scalable** - 1M+ kullanıcı destekler
- ✅ **Maintainable** - over-engineering yok
- ✅ **Ready for production** - tüm ihtiyaçları karşılar