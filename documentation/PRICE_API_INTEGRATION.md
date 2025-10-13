# 💰 Fiyat API Entegrasyonu - Borsa MCP İle Varlık Fiyatı Takibi

## 📋 İçindekiler
1. [Genel Bakış](#genel-bakış)
2. [Borsa MCP Nedir?](#borsa-mcp-nedir)
3. [Mimari Tasarım](#mimari-tasarım)
4. [Kurulum ve Yapılandırma](#kurulum-ve-yapılandırma)
5. [Veri Senkronizasyon Stratejisi](#veri-senkronizasyon-stratejisi)
6. [Database Schema](#database-schema)
7. [API Endpoint Tasarımı](#api-endpoint-tasarımı)
8. [Cron Job Yapılandırması](#cron-job-yapılandırması)
9. [Error Handling & Monitoring](#error-handling--monitoring)
10. [Güvenlik Önlemleri](#güvenlik-önlemleri)
11. [Performans Optimizasyonu](#performans-optimizasyonu)
12. [Roadmap ve Gelecek](#roadmap-ve-gelecek)

---

## 🎯 Genel Bakış

### Problem
Portfolio tracker uygulamamızda kullanıcıların varlıklarının güncel fiyatlarını göstermek için harici bir fiyat API'sine ihtiyacımız var. Desteklediğimiz varlık tipleri:
- 🏆 **Altın** (Çeyrek, Yarım, Tam, Gram Altın)
- 💰 **Gümüş** (Gümüş, Ons Gümüş)
- 📈 **Hisse Senetleri** (BIST hisseleri - THYAO, GARAN, ASELS vb.)
- 💼 **Fonlar** (TEFAS fonları - 800+ fon)
- ₿ **Kripto Paralar** (BTC, ETH, ADA vb. - hem TRY hem USD)
- 💵 **Döviz** (USD, EUR, GBP vb.)
- 🌾 **Emtia** (Petrol, Doğalgaz vb.)

⚠️ **Kapsam Dışı Varlıklar** (Manuel fiyat girişi):
- 🌍 **Yabancı Hisseler** (AAPL, GOOGL, TSLA vb.) - Borsa MCP'de desteklenmiyor
- 📊 **ETF'ler** (SPY, QQQ, VOO vb.) - Manuel giriş gerekli
- 🏠 **Gayrimenkul** - Kullanıcı tarafından değerleme

### Çözüm
**Borsa MCP** kullanarak Türk piyasalarındaki tüm varlık tiplerinin fiyatlarını merkezi bir şekilde çekeceğiz.

### Neden Borsa MCP?
- ✅ **Kapsamlı Kapsam**: 758 BIST hissesi, 800+ TEFAS fonu, 295+ kripto çifti, 28+ döviz/emtia
- ✅ **Resmi Kaynaklar**: KAP, TEFAS, BtcTurk, Doviz.com, Yahoo Finance
- ✅ **Ücretsiz**: Açık kaynak, API limiti yok
- ✅ **Türk Piyasası**: Özellikle Türk piyasaları için optimize edilmiş
- ✅ **Aktif Geliştirme**: 359 star, aktif maintenance

### Limitasyonlar
- ❌ **Yabancı Hisseler Yok**: ABD, Avrupa, Asya hisseleri desteklenmiyor (AAPL, GOOGL vb.)
- ❌ **ETF Desteği Yok**: S&P 500, Nasdaq ETF'leri vb. yok
- ⚠️ **Manuel Giriş Gerekli**: Bu varlıklar için kullanıcılar fiyat manuel girecek

---

## 🔍 Borsa MCP Nedir?

**Borsa MCP**, Türk finansal piyasalarına programatik erişim sağlayan bir **FastMCP (Model Context Protocol)** sunucusudur.

### Temel Özellikler

#### 1. BIST Hisse Senetleri
- 758 BIST şirketi
- Gerçek zamanlı fiyatlar (Yahoo Finance + Mynet Finans)
- Bilanço, kar-zarar, nakit akışı tabloları
- Teknik analiz göstergeleri (RSI, MACD, Bollinger Bands)
- KAP haberleri ve duyuruları

#### 2. TEFAS Fonları
- 800+ Türk yatırım fonu
- 13 fon kategorisi
- Resmi TEFAS API'leri
- Geçmiş performans verileri
- Portföy dağılım analizi

#### 3. Kripto Paralar
**BtcTurk (Türk Piyasası):**
- 295+ kripto çifti (TRY/USDT piyasaları)
- Gerçek zamanlı ticker fiyatları
- Emir defteri derinliği
- İşlem geçmişi
- OHLC/Kline grafik verileri

**Coinbase (Global Piyasa):**
- 500+ global kripto çifti (USD/EUR piyasaları)
- Uluslararası piyasa verileri
- Çapraz piyasa analizi
- Profesyonel seviye veriler

#### 4. Döviz & Emtia (Doviz.com)
- **Döviz Kurları**: USD, EUR, GBP, JPY, CHF, CAD, AUD
- **Kıymetli Madenler**: Gram altın, gümüş, ons altın (XAU), gümüş (XAG), platin, paladyum
- **Enerji Emtiaları**: BRENT petrol, WTI petrol
- **Yakıt Fiyatları**: Dizel, benzin, LPG
- Dakikalık güncellemeler (60 veri noktası)
- Tarihsel OHLC verileri

#### 5. Makroekonomik Veriler
- **Ekonomik Takvim**: 30+ ülke (TR, US, EU, GB, JP, DE vb.)
- **TCMB Enflasyon**: TÜFE (2005-2025), ÜFE (2014-2025)
- Enflasyon hesaplayıcı

---

## 🏗️ Mimari Tasarım

### Yüksek Seviye Mimari

```
┌─────────────────────────────────────────────────────────────────┐
│                      Portfolio Tracker App                       │
│                                                                   │
│  ┌─────────────┐      ┌─────────────┐       ┌──────────────┐   │
│  │  Dashboard  │ ───► │  API Routes │ ◄───► │  Database    │   │
│  │  (Frontend) │      │  (Next.js)  │       │  (SQLite)    │   │
│  └─────────────┘      └─────────────┘       └──────────────┘   │
│                              │                       ▲           │
└──────────────────────────────┼───────────────────────┼───────────┘
                               │                       │
                               ▼                       │
                    ┌──────────────────────┐          │
                    │   Price Cache API    │          │
                    │   (Internal Cache)   │          │
                    └──────────────────────┘          │
                               ▲                       │
                               │                       │
                    ┌──────────────────────┐          │
                    │   Cron Job Service   │          │
                    │   (Scheduled Tasks)  │──────────┘
                    └──────────────────────┘
                               ▲
                               │
                    ┌──────────────────────┐
                    │    Borsa MCP CLI     │
                    │   (Python Process)   │
                    └──────────────────────┘
                               ▲
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌────────────────┐   ┌────────────────┐   ┌────────────────┐
│   KAP/TEFAS    │   │  BtcTurk API   │   │  Doviz.com     │
│  Yahoo Finance │   │  Coinbase API  │   │  TCMB API      │
└────────────────┘   └────────────────┘   └────────────────┘
```

### Bileşen Açıklamaları

#### 1. **Borsa MCP CLI** (Python)
- MCP server'ı Python subprocess olarak çalıştırır
- Veri çekme işlemlerini yapar
- JSON formatında veri döndürür
- Node.js'ten `child_process` ile çağrılır

#### 2. **Cron Job Service** (Node.js)
- Periyodik olarak (saatbaşı/dakikalık) fiyat verilerini çeker
- Borsa MCP CLI'ı tetikler
- Çekilen verileri veritabanına yazar
- Hata yönetimi ve retry logic

#### 3. **Price Cache API** (Next.js API Routes)
- Veritabanındaki cached fiyat verilerini sunar
- `/api/prices/latest` - En güncel fiyatlar
- `/api/prices/asset/:id` - Belirli varlık fiyatı
- `/api/prices/batch` - Toplu fiyat sorgulama

#### 4. **Database** (SQLite)
- Fiyat verileri cache table
- Senkronizasyon log table
- Error log table

---

## 💻 Kurulum ve Yapılandırma

### 1. Ön Gereksinimler

```bash
# Python 3.11+ kurulu olmalı
python3 --version

# uv kurulumu (Python package manager)
# Windows PowerShell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Git kurulumu (eğer yoksa)
# Windows: https://git-scm.com/downloads/win
# macOS: brew install git
# Linux: sudo apt install git
```

### 2. Borsa MCP Kurulumu

Borsa MCP'yi projeye entegre etmek için iki yöntem:

#### Yöntem A: Global Kurulum (Önerilen)

```bash
# uvx ile global olarak kur
uvx --from git+https://github.com/saidsurucu/borsa-mcp borsa-mcp

# Test et
uvx borsa-mcp --help
```

#### Yöntem B: Lokal Kurulum

```bash
# Projeye Python dependency olarak ekle
cd /path/to/portfolio-tracker

# Python virtual environment oluştur
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Borsa MCP'yi kur
pip install git+https://github.com/saidsurucu/borsa-mcp

# Test et
borsa-mcp --help
```

### 3. Node.js Entegrasyonu

```bash
# Gerekli paketleri kur
npm install node-cron @types/node-cron
```

### 4. Environment Variables

`.env` dosyasına ekle:

```env
# Borsa MCP Configuration
BORSA_MCP_ENABLED=true
BORSA_MCP_CLI_PATH=/usr/local/bin/uvx  # veya python executable path
BORSA_MCP_SYNC_INTERVAL=hourly  # hourly, daily, minute

# Price Cache Configuration
PRICE_CACHE_TTL=3600  # saniye (1 saat)
PRICE_CACHE_ENABLED=true

# Cron Job Configuration
CRON_ENABLED=true
CRON_PRICE_SYNC_SCHEDULE="0 * * * *"  # Her saat başı

# Monitoring
ENABLE_PRICE_SYNC_LOGS=true
LOG_LEVEL=info  # debug, info, warn, error
```

---

## 🗄️ Database Schema

### Price Cache Table

```sql
-- Fiyat cache tablosu
CREATE TABLE IF NOT EXISTS price_cache (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    asset_type TEXT NOT NULL,  -- gold, stock, fund, crypto, currency, commodity
    symbol TEXT,  -- ticker code, fund code, crypto pair
    name TEXT NOT NULL,
    
    -- Fiyat verileri
    current_price REAL NOT NULL,
    previous_close REAL,
    change_amount REAL,
    change_percent REAL,
    
    -- OHLCV verileri (opsiyonel)
    open_price REAL,
    high_price REAL,
    low_price REAL,
    volume REAL,
    
    -- Ek bilgiler
    currency TEXT DEFAULT 'TRY',
    market TEXT,  -- BIST, TEFAS, BtcTurk, Coinbase, Dovizcom
    last_updated INTEGER NOT NULL,  -- Unix timestamp
    
    -- Metadata
    data_source TEXT NOT NULL,  -- borsa-mcp
    sync_status TEXT DEFAULT 'active',  -- active, stale, error
    error_message TEXT,
    
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    
    -- Indexes
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_price_cache_asset_id ON price_cache(asset_id);
CREATE INDEX IF NOT EXISTS idx_price_cache_asset_type ON price_cache(asset_type);
CREATE INDEX IF NOT EXISTS idx_price_cache_symbol ON price_cache(symbol);
CREATE INDEX IF NOT EXISTS idx_price_cache_last_updated ON price_cache(last_updated);
CREATE INDEX IF NOT EXISTS idx_price_cache_sync_status ON price_cache(sync_status);

-- Fiyat senkronizasyon log tablosu
CREATE TABLE IF NOT EXISTS price_sync_logs (
    id TEXT PRIMARY KEY,
    sync_type TEXT NOT NULL,  -- full, partial, single
    asset_types TEXT,  -- JSON array: ["gold", "stock"]
    
    -- İstatistikler
    total_assets INTEGER DEFAULT 0,
    successful_updates INTEGER DEFAULT 0,
    failed_updates INTEGER DEFAULT 0,
    skipped_updates INTEGER DEFAULT 0,
    
    -- Timing
    started_at INTEGER NOT NULL,
    completed_at INTEGER,
    duration_ms INTEGER,
    
    -- Status
    status TEXT NOT NULL,  -- running, completed, failed, partial
    error_message TEXT,
    error_details TEXT,  -- JSON
    
    -- Metadata
    triggered_by TEXT,  -- cron, manual, api
    sync_config TEXT,  -- JSON
    
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_price_sync_logs_status ON price_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_price_sync_logs_started_at ON price_sync_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_price_sync_logs_sync_type ON price_sync_logs(sync_type);
```

### Assets Table Güncellemesi

Mevcut `assets` tablosuna fiyat cache bağlantısı için:

```sql
-- Assets tablosuna yeni alanlar ekle
ALTER TABLE assets ADD COLUMN price_source TEXT DEFAULT 'borsa-mcp';
ALTER TABLE assets ADD COLUMN auto_price_update BOOLEAN DEFAULT 1;
ALTER TABLE assets ADD COLUMN price_cache_enabled BOOLEAN DEFAULT 1;
```

---

## 🔌 API Endpoint Tasarımı

### 1. Price Sync API

```typescript
// app/api/prices/sync/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    // Manuel fiyat senkronizasyonu tetikle
    // Query params:
    //   - asset_types: string[] (opsiyonel)
    //   - force: boolean (cache'i bypass et)
}
```

### 2. Latest Prices API

```typescript
// app/api/prices/latest/route.ts
export async function GET(request: NextRequest) {
    // Tüm aktif varlıkların en güncel fiyatlarını döndür
    // Query params:
    //   - asset_types: string[]
    //   - asset_ids: string[]
    //   - max_age: number (saniye)
}
```

### 3. Asset Price API

```typescript
// app/api/prices/asset/[id]/route.ts
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    // Belirli bir varlığın fiyat bilgisini döndür
    // Cache'den veya fresh data
}
```

### 4. Batch Price Query API

```typescript
// app/api/prices/batch/route.ts
export async function POST(request: NextRequest) {
    // Toplu fiyat sorgulama
    // Body: { asset_ids: string[] }
    // Response: Map<asset_id, PriceData>
}
```

### 5. Price History API

```typescript
// app/api/prices/history/[id]/route.ts
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    // Belirli varlık için geçmiş fiyat verileri
    // Query params:
    //   - from: ISO date
    //   - to: ISO date
    //   - interval: 1m, 5m, 1h, 1d
}
```

---

## ⏰ Veri Senkronizasyon Stratejisi

### Senkronizasyon Türleri

#### 1. **Scheduled Sync** (Cron Job)
Periyodik otomatik senkronizasyon

```typescript
// lib/cron/price-sync.ts
import cron from 'node-cron';

// TEFAS Fonları: Hafta içi saat 11:00
cron.schedule('0 11 * * 1-5', async () => {
    console.log('Starting daily TEFAS fund price sync (11:00)...');
    await syncAssetPrices(['fund']);
});

// Diğer tüm varlıklar: Her saat başı (piyasa saatleri kontrolü ile)
cron.schedule('0 * * * *', async () => {
    console.log('Starting hourly price sync...');
    await syncAssetPrices(['gold', 'silver', 'stock', 'crypto', 'currency', 'commodity']);
});

// Gece tam senkronizasyon: 00:00
cron.schedule('0 0 * * *', async () => {
    console.log('Starting nightly full sync...');
    await syncAllAssetPrices({ force: true });
});
```

#### 2. **On-Demand Sync** (API Tetiklemeli)
Kullanıcı talebi veya API çağrısı ile

```typescript
// Manuel tetikleme
POST /api/prices/sync
{
  "asset_types": ["gold", "stock"],
  "force": true
}
```

### Senkronizasyon Önceliklendirme

```typescript
interface SyncPriority {
    asset_type: string;
    sync_interval: string;  // "daily-11am", "hourly"
    cache_ttl: number;      // saniye
    market_hours_only: boolean;
}

const SYNC_PRIORITIES: SyncPriority[] = [
    // TEFAS Fonları: Hafta içi saat 11:00 (günlük fiyat açıklanır)
    { 
        asset_type: 'fund', 
        sync_interval: 'daily-11am', 
        cache_ttl: 86400,  // 24 saat
        market_hours_only: true 
    },
    
    // Tüm diğer varlıklar: Saatlik
    { asset_type: 'crypto', sync_interval: 'hourly', cache_ttl: 3600, market_hours_only: false },
    { asset_type: 'currency', sync_interval: 'hourly', cache_ttl: 3600, market_hours_only: true },
    { asset_type: 'gold', sync_interval: 'hourly', cache_ttl: 3600, market_hours_only: true },
    { asset_type: 'silver', sync_interval: 'hourly', cache_ttl: 3600, market_hours_only: true },
    { asset_type: 'commodity', sync_interval: 'hourly', cache_ttl: 3600, market_hours_only: true },
    { asset_type: 'stock', sync_interval: 'hourly', cache_ttl: 3600, market_hours_only: true },
];
```

**Not**: Kripto dışındaki tüm varlıklar piyasa saatlerinde çekilir. Kripto 7/24 çalışır.

### Piyasa Saatleri Kontrolü

```typescript
function isMarketOpen(assetType: string): boolean {
    const now = new Date();
    const istanbulTime = new Date(now.toLocaleString('en-US', { 
        timeZone: 'Europe/Istanbul' 
    }));
    
    const hour = istanbulTime.getHours();
    const day = istanbulTime.getDay(); // 0: Pazar, 6: Cumartesi
    
    // Hafta sonu kontrolü
    if (day === 0 || day === 6) {
        // Sadece kripto 7/24 açık
        return assetType === 'crypto';
    }
    
    // BIST piyasa saatleri: 09:30 - 18:00
    if (assetType === 'stock') {
        return hour >= 9 && hour < 18;
    }
    
    // TEFAS fonlar: Hafta içi saat 11:00'da güncellenir
    if (assetType === 'fund') {
        return hour === 11; // Sadece saat 11:00'da çek
    }
    
    // Altın, döviz, emtia: 09:00 - 18:00
    if (['gold', 'silver', 'currency', 'commodity'].includes(assetType)) {
        return hour >= 9 && hour < 18;
    }
    
    // Kripto 7/24
    if (assetType === 'crypto') {
        return true;
    }
    
    return false;
}

function shouldSyncFund(): boolean {
    const istanbulTime = new Date(new Date().toLocaleString('en-US', { 
        timeZone: 'Europe/Istanbul' 
    }));
    
    const hour = istanbulTime.getHours();
    const day = istanbulTime.getDay();
    
    // Hafta içi saat 11:00
    return day >= 1 && day <= 5 && hour === 11;
}
```

---

## 🔧 Cron Job Yapılandırması

### 1. Cron Service Dosyası

```typescript
// lib/services/cron-service.ts
import cron from 'node-cron';
import { syncAssetPrices } from './price-sync-service';

class CronService {
    private jobs: Map<string, cron.ScheduledTask> = new Map();
    
    init() {
        if (process.env.CRON_ENABLED !== 'true') {
            console.log('Cron service disabled');
            return;
        }
        
        this.setupPriceSync();
        this.setupCleanup();
        console.log('✅ Cron service initialized');
    }
    
    private setupPriceSync() {
        // TEFAS Fonları: Hafta içi saat 11:00
        const fundJob = cron.schedule('0 11 * * 1-5', async () => {
            console.log('🕚 TEFAS fund sync (11:00)...');
            await syncAssetPrices(['fund']);
        });
        this.jobs.set('fund-sync', fundJob);
        
        // Tüm diğer varlıklar: Her saat başı (piyasa kontrolü ile)
        const hourlyJob = cron.schedule('0 * * * *', async () => {
            console.log('⏰ Hourly price sync...');
            await syncAssetPrices(['gold', 'silver', 'stock', 'crypto', 'currency', 'commodity']);
        });
        this.jobs.set('hourly-sync', hourlyJob);
        
        // Gece tam senkronizasyon: 00:00
        const fullSyncJob = cron.schedule('0 0 * * *', async () => {
            console.log('🌙 Nightly full sync...');
            await syncAssetPrices('all', { force: true });
        });
        this.jobs.set('full-sync', fullSyncJob);
    }
    
    private setupCleanup() {
        // Eski log kayıtlarını temizle: Her gün 02:00
        const cleanupJob = cron.schedule('0 2 * * *', async () => {
            await this.cleanupOldLogs();
        });
        this.jobs.set('cleanup', cleanupJob);
    }
    
    private async cleanupOldLogs() {
        // 30 günden eski log kayıtlarını sil
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        // Database cleanup logic
    }
    
    stop() {
        this.jobs.forEach((job, name) => {
            job.stop();
            console.log(`Stopped cron job: ${name}`);
        });
        this.jobs.clear();
    }
}

export const cronService = new CronService();
```

### 2. Next.js Server Başlatma

```typescript
// server.ts veya app başlangıcında
import { cronService } from './lib/services/cron-service';

// Server başlatıldığında
cronService.init();

// Graceful shutdown
process.on('SIGTERM', () => {
    cronService.stop();
    process.exit(0);
});
```

---

## 🛡️ Error Handling & Monitoring

### 1. Error Types

```typescript
// lib/errors/price-sync-errors.ts
export class PriceSyncError extends Error {
    constructor(
        message: string,
        public assetType: string,
        public symbol?: string,
        public cause?: Error
    ) {
        super(message);
        this.name = 'PriceSyncError';
    }
}

export class BorsaMCPError extends Error {
    constructor(
        message: string,
        public command: string,
        public exitCode?: number,
        public stderr?: string
    ) {
        super(message);
        this.name = 'BorsaMCPError';
    }
}
```

### 2. Retry Logic

```typescript
// lib/utils/retry.ts
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            const delay = initialDelay * Math.pow(2, i);
            console.warn(`Retry ${i + 1}/${maxRetries} after ${delay}ms`, error);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError!;
}
```

### 3. Monitoring & Alerting

```typescript
// lib/monitoring/price-sync-monitor.ts
interface SyncMetrics {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageDuration: number;
    lastSyncTime: number;
    errorRate: number;
}

class PriceSyncMonitor {
    private metrics: Map<string, SyncMetrics> = new Map();
    
    recordSyncStart(syncId: string) {
        // Record sync start
    }
    
    recordSyncComplete(syncId: string, duration: number, success: boolean) {
        // Update metrics
        // Alert if error rate > threshold
    }
    
    getHealthStatus() {
        // Return overall health status
        return {
            status: 'healthy',  // healthy, degraded, unhealthy
            metrics: Array.from(this.metrics.entries()),
            lastUpdate: Date.now()
        };
    }
}
```

---

## 🔐 Güvenlik Önlemleri

### 1. Rate Limiting

```typescript
// lib/rate-limiter.ts
import { LRUCache } from 'lru-cache';

class RateLimiter {
    private cache: LRUCache<string, number[]>;
    
    constructor(
        private maxRequests: number = 100,
        private windowMs: number = 60000  // 1 dakika
    ) {
        this.cache = new LRUCache({ max: 500 });
    }
    
    async checkLimit(key: string): Promise<boolean> {
        const now = Date.now();
        const requests = this.cache.get(key) || [];
        
        // Eski istekleri temizle
        const validRequests = requests.filter(
            time => now - time < this.windowMs
        );
        
        if (validRequests.length >= this.maxRequests) {
            return false;
        }
        
        validRequests.push(now);
        this.cache.set(key, validRequests);
        return true;
    }
}

export const priceSyncLimiter = new RateLimiter(60, 60000);  // 60 req/min
```

### 2. Input Validation

```typescript
// lib/validators/price-sync-validator.ts
import { z } from 'zod';

export const SyncRequestSchema = z.object({
    asset_types: z.array(z.enum([
        'gold', 'silver', 'stock', 'fund', 
        'crypto', 'currency', 'commodity'
    ])).optional(),
    asset_ids: z.array(z.string()).optional(),
    force: z.boolean().optional(),
    max_age: z.number().min(0).max(86400).optional()
});

export type SyncRequest = z.infer<typeof SyncRequestSchema>;
```

### 3. Process Isolation

```typescript
// Borsa MCP CLI'ı izole subprocess olarak çalıştır
import { spawn } from 'child_process';

function runBorsaMCP(command: string[], timeout: number = 30000): Promise<string> {
    return new Promise((resolve, reject) => {
        const process = spawn('uvx', [
            '--from', 'git+https://github.com/saidsurucu/borsa-mcp',
            'borsa-mcp',
            ...command
        ], {
            timeout,
            killSignal: 'SIGTERM',
            env: { ...process.env, PYTHONUNBUFFERED: '1' }
        });
        
        let stdout = '';
        let stderr = '';
        
        process.stdout.on('data', (data) => { stdout += data; });
        process.stderr.on('data', (data) => { stderr += data; });
        
        process.on('close', (code) => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(new BorsaMCPError(
                    'Borsa MCP command failed',
                    command.join(' '),
                    code,
                    stderr
                ));
            }
        });
        
        process.on('error', (error) => {
            reject(error);
        });
    });
}
```

---

## ⚡ Performans Optimizasyonu

### 1. Batch Processing

```typescript
// Varlıkları gruplara ayır ve paralel çek
async function syncAssetsBatch(assetIds: string[], batchSize: number = 10) {
    const batches = chunk(assetIds, batchSize);
    const results = [];
    
    for (const batch of batches) {
        const batchResults = await Promise.allSettled(
            batch.map(id => syncSingleAsset(id))
        );
        results.push(...batchResults);
    }
    
    return results;
}
```

### 2. Caching Strategy

```typescript
// Multi-level cache
// 1. Memory cache (LRU) - 5 dakika
// 2. Database cache - 1 saat
// 3. Stale-while-revalidate - 24 saat

interface CacheEntry {
    data: any;
    timestamp: number;
    ttl: number;
}

class PriceCache {
    private memoryCache: LRUCache<string, CacheEntry>;
    
    async get(key: string): Promise<any | null> {
        // 1. Memory cache
        const memEntry = this.memoryCache.get(key);
        if (memEntry && Date.now() - memEntry.timestamp < memEntry.ttl) {
            return memEntry.data;
        }
        
        // 2. Database cache
        const dbEntry = await this.getFromDatabase(key);
        if (dbEntry && Date.now() - dbEntry.last_updated < 3600000) {
            this.memoryCache.set(key, {
                data: dbEntry,
                timestamp: dbEntry.last_updated,
                ttl: 300000
            });
            return dbEntry;
        }
        
        return null;
    }
}
```

### 3. Database Optimization

```sql
-- Composite index for fast lookup
CREATE INDEX idx_price_cache_composite 
ON price_cache(asset_type, last_updated DESC);

-- Partial index for active prices only
CREATE INDEX idx_price_cache_active 
ON price_cache(asset_id, last_updated DESC)
WHERE sync_status = 'active';

-- Vacuum düzenli olarak çalıştır
PRAGMA auto_vacuum = INCREMENTAL;
```

---

## 🗺️ Roadmap ve Gelecek

### Phase 1: Temel Entegrasyon (Hafta 1-2)
- [x] Borsa MCP kurulumu ve test
- [ ] Database schema oluşturma
- [ ] Temel price cache API'leri
- [ ] Basit cron job (saatlik sync)
- [ ] Error handling ve logging

### Phase 2: Gelişmiş Özellikler (Hafta 3-4)
- [ ] Öncelikli senkronizasyon (dakikalık/saatlik)
- [ ] Batch processing ve paralel çekme
- [ ] Piyasa saatleri kontrolü
- [ ] Rate limiting ve güvenlik
- [ ] Dashboard entegrasyonu

### Phase 3: Optimizasyon (Hafta 5-6)
- [ ] Multi-level caching
- [ ] Performance monitoring
- [ ] Alerting sistemi
- [ ] Database optimizasyonu
- [ ] API response caching

### Phase 4: Premium Özellikler (Gelecek)
- [ ] Real-time WebSocket updates
- [ ] Teknik analiz göstergeleri
- [ ] Fiyat alertleri (threshold based)
- [ ] Historical chart data API
- [ ] ML-based price prediction

---

## 📚 Kaynaklar ve Referanslar

### Borsa MCP
- **GitHub**: https://github.com/saidsurucu/borsa-mcp
- **Stars**: 359
- **License**: MIT
- **Documentation**: README.md

### Veri Kaynakları
- **KAP**: https://www.kap.org.tr/
- **TEFAS**: https://www.tefas.gov.tr/
- **BtcTurk API**: https://docs.btcturk.com/
- **Coinbase API**: https://docs.cloud.coinbase.com/
- **Doviz.com**: https://www.doviz.com/
- **Yahoo Finance**: https://finance.yahoo.com/

### Teknolojiler
- **FastMCP**: https://gofastmcp.com/
- **node-cron**: https://www.npmjs.com/package/node-cron
- **Next.js**: https://nextjs.org/
- **Drizzle ORM**: https://orm.drizzle.team/
- **SQLite**: https://www.sqlite.org/

---

## 🎯 Hızlı Başlangıç Özeti

```bash
# 1. Borsa MCP kur
uvx --from git+https://github.com/saidsurucu/borsa-mcp borsa-mcp

# 2. Node.js dependencies
npm install node-cron @types/node-cron

# 3. Database migration çalıştır
npm run db:migrate

# 4. Environment variables ayarla
cp .env.example .env
# BORSA_MCP_ENABLED=true olarak ayarla

# 5. Cron service'i başlat
npm run dev

# 6. İlk manuel sync'i tetikle
curl -X POST http://localhost:3000/api/prices/sync

# 7. Fiyatları kontrol et
curl http://localhost:3000/api/prices/latest
```

---

## 📝 Senkronizasyon Özeti

| Varlık Tipi | Sync Zamanı | Piyasa Kontrolü | Cache TTL |
|------------|------------|----------------|-----------|
| 💼 **Fonlar** | Hafta içi 11:00 | ✅ Evet | 24 saat |
| 📈 **Hisseler** | Her saat başı | ✅ Evet (09:30-18:00) | 1 saat |
| 🏆 **Altın** | Her saat başı | ✅ Evet (09:00-18:00) | 1 saat |
| 💰 **Gümüş** | Her saat başı | ✅ Evet (09:00-18:00) | 1 saat |
| ₿ **Kripto** | Her saat başı | ❌ Hayır (7/24) | 1 saat |
| 💵 **Döviz** | Her saat başı | ✅ Evet (09:00-18:00) | 1 saat |
| 🌾 **Emtia** | Her saat başı | ✅ Evet (09:00-18:00) | 1 saat |

**Özel Notlar:**
- 🌍 **Yabancı Hisseler** ve 📊 **ETF'ler**: Manuel fiyat girişi (MCP desteklemiyor)
- 🌙 **Gece Sync**: 00:00'da tüm varlıklar için tam senkronizasyon
- ⚠️ **Hafta Sonu**: Sadece kripto çalışır, diğerleri pazartesi sabahı sync olur

---

**Son Güncelleme**: 2025-10-13  
**Yazar**: Portfolio Tracker Development Team  
**Durum**: Planning / Design Phase
