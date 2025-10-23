# 📊 Portfolio Tracker Database Yapısı Analiz Raporu

## 🏗️ Genel Mimari

**Database Türü:** SQLite (better-sqlite3)
**ORM:** Drizzle ORM
**Schema Organizasyonu:** 3 ana modül

---

## 📁 1. Authentication Schema (`auth.ts`)

### 🗄️ Tablolar:

#### **users** Tablosu
```sql
- id: text (PK)
- name: text (NOT NULL)
- email: text (NOT NULL, UNIQUE)
- emailVerified: boolean (default: false)
- image: text (nullable)
- createdAt/updatedAt: timestamp
```

#### **sessions** Tablosu
```sql
- id: text (PK)
- expiresAt: timestamp (NOT NULL)
- token: text (NOT NULL, UNIQUE)
- userId: text (FK → users.id, CASCADE)
- ipAddress/userAgent: text (nullable)
- createdAt/updatedAt: timestamp
```

#### **accounts** Tablosu
```sql
- id: text (PK)
- accountId: text (NOT NULL)
- providerId: text (NOT NULL)
- userId: text (FK → users.id, CASCADE)
- accessToken/refreshToken/idToken: text (nullable)
- scope/password: text (nullable)
- accessTokenExpiresAt/refreshTokenExpiresAt: timestamp (nullable)
```

#### **verification** Tablosu
```sql
- id: text (PK)
- identifier: text (NOT NULL)
- value: text (NOT NULL)
- expiresAt: timestamp (NOT NULL)
- createdAt/updatedAt: timestamp
```

---

## 💼 2. Portfolio Schema (`portfolio.ts`)

### 🗄️ Tablolar:

#### **portfolios** Tablosu
```sql
- id: text (PK)
- userId: text (NOT NULL)
- name: text (NOT NULL, default: "Ana Portföy")
- baseCurrency: text (NOT NULL, default: "TRY")
- createdAt/updatedAt: timestamp
- Index: userIdIndex
```

#### **assets** Tablosu
```sql
- id: text (PK)
- userId: text (NOT NULL)
- portfolioId: text (FK → portfolios.id, nullable)
- assetType: text (NOT NULL) [GOLD|SILVER|STOCK|FUND|CRYPTO|EUROBOND|ETF|CASH]
- symbol: text (nullable) [AAPL, BTC, vs.]
- name: text (NOT NULL)
- category: text (nullable)
- currency: text (default: "TRY")
- currentPrice: real (nullable)
- lastUpdated: timestamp (nullable)

// Price cache configuration (Migration 0003)
- priceSource: text (default: "borsa-mcp")
- autoPriceUpdate: boolean (default: true)
- priceCacheEnabled: boolean (default: true)
- createdAt/updatedAt: timestamp

- Indexes: userIdIndex, portfolioIdIndex, assetTypeIndex
```

#### **transactions** Tablosu
```sql
- id: text (PK)
- userId: text (NOT NULL)
- assetId: text (FK → assets.id, NOT NULL)
- transactionType: text (NOT NULL) [BUY|SELL]
- quantity: real (NOT NULL)
- pricePerUnit: real (NOT NULL)
- totalAmount: real (NOT NULL)
- transactionDate: timestamp (NOT NULL)
- currency: text (default: "TRY")
- notes: text (nullable)
- createdAt/updatedAt: timestamp

- Indexes: userIdIndex, assetIdIndex, transactionDateIndex, transactionTypeIndex
```

---

## 💰 3. Price Cache Schema (`price-cache.ts`)

### 🗄️ Tablolar:

#### **priceCache** Tablosu
```sql
- id: text (PK)
- assetId: text (FK → assets.id, CASCADE)
- assetType: text (NOT NULL)
- symbol/name: text (name NOT NULL)
- currentPrice: real (NOT NULL)
- previousClose/changeAmount/changePercent: real (nullable)
- OHLCV: openPrice/highPrice/lowPrice/volume (nullable)
- currency: text (default: "TRY")
- market: text (nullable)
- lastUpdated: timestamp_ms (NOT NULL)
- dataSource: text (default: "borsa-mcp")
- syncStatus: text (default: "active") [active|stale|error]
- errorMessage: text (nullable)
- createdAt/updatedAt: timestamp

- Indexes: assetIdIndex, assetTypeIndex, symbolIndex, lastUpdatedIndex, syncStatusIndex, compositeIndex
```

#### **priceSyncLogs** Tablosu
```sql
- id: text (PK)
- syncType: text (NOT NULL)
- assetTypes: text (JSON array)
- Statistics: totalAssets/successfulUpdates/failedUpdates/skippedUpdates
- Timing: startedAt/completedAt/durationMs
- status: text [running|completed|failed|partial]
- errorMessage/errorDetails: text (errorDetails: JSON)
- Metadata: triggeredBy/syncConfig (JSON)
- createdAt: timestamp

- Indexes: statusIndex, startedAtIndex, syncTypeIndex
```

#### **tickerCache** Tablosu
```sql
- id: text (PK)
- assetType: text (NOT NULL) [STOCK|FUND]
- symbol: text (NOT NULL)
- name: text (NOT NULL)
- BIST specific: city: text
- TEFAS specific: category: text
- extraData: text (JSON)
- lastUpdated: timestamp_ms (NOT NULL)
- dataSource: text (default: "borsa-mcp")
- createdAt/updatedAt: timestamp

- Unique Index: assetType + symbol
- Indexes: symbolIndex, assetTypeIndex, nameIndex
```

#### **tickerSyncLogs** Tablosu
```sql
- id: text (PK)
- syncType: text (NOT NULL) [BIST|TEFAS|FULL]
- Statistics: totalRecords/successfulInserts/failedInserts
- Timing: startedAt/completedAt/durationMs
- status: text [running|completed|failed]
- errorMessage: text (nullable)
- triggeredBy: text [manual|cron|api]
- createdAt: timestamp

- Indexes: statusIndex, startedAtIndex, syncTypeIndex
```

---

## 🔍 Analiz ve Değerlendirme

### ✅ **Güçlü Yönler:**

1. **Modüler Tasarım:** Schema'lar mantıksal modüllere ayrılmış
2. **İlişkisel Yapı:** Proper foreign key relationships ve cascade delete
3. **İndeksleme:** Performans için kritik alanlarda indeksler mevcut
4. **Type Safety:** TypeScript ile tam tip güvenliği
5. **Audit Trail:** created/updated timestamp'leri mevcut
6. **Fiyat Yönetimi:** Comprehensive price caching sistemi
7. **Sync Monitoring:** Detaylı sync loglama sistemi

### ⚠️ **Potansiyel İyileştirme Alanları:**

1. **Database Karmaşıklığı:** 11 tablo - bazıları birleştirilebilir
2. **Redundancy:** `assets.currentPrice` ve `priceCache.currentPrice` - duplicate
3. **Migration Yönetimi:** Schema değişiklikleri için migration sistemi eksik
4. **Data Tipleri:** Bazı alanlar için daha specific data tipleri kullanılabilir
5. **Performance:** Büyük veri setleri için partitioning düşünülebilir

### 🎯 **Öneriler:**

1. **Simplification:** `assets` ve `priceCache` tabloları birleştirilebilir
2. **Migration System:** Drizzle migrations eklenebilir
3. **Data Archiving:** Eski log'ları arşivleme sistemi
4. **Analytics:** Performans metrikleri için additional tablolar
5. **Caching:** Application-level caching katmanı

---

## 📈 **Genel Değerlendirme: 8.5/10**

Database yapınız oldukça iyi tasarlanmış, ölçeklenebilir ve güvenilir. Modern bir portföy takip sistemi için gereken tüm temel özellikleri içeriyor.

## 🔗 İlişkisel Diagram

```
users (1) ←→ (n) sessions
users (1) ←→ (n) accounts
users (1) ←→ (n) portfolios
users (1) ←→ (n) assets
users (1) ←→ (n) transactions

portfolios (1) ←→ (n) assets
assets (1) ←→ (n) transactions
assets (1) ←→ (n) priceCache

priceSyncLogs (standalone)
tickerCache (standalone)
tickerSyncLogs (standalone)
```

---

*Oluşturulma Tarihi: 22.10.2025*
*Analiz Eden: Claude AI*