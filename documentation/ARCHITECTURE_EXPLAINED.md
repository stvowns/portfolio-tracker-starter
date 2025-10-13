# 🏗️ Borsa MCP Mimarisi - Detaylı Açıklama

## 📖 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [npm run dev ile Ne Oluyor?](#npm-run-dev-ile-ne-oluyor)
3. [Borsa MCP Ne Zaman Çalışıyor?](#borsa-mcp-ne-zaman-çalışıyor)
4. [Veri Akış Diyagramı](#veri-akış-diyagramı)
5. [Component Detayları](#component-detayları)
6. [Subprocess Mekanizması](#subprocess-mekanizması)
7. [Fiyatlar UI'a Nasıl Yansıyor?](#fiyatlar-uia-nasıl-yansıyor)

---

## 🎯 Genel Bakış

Borsa MCP entegrasyonu **hibrit bir mimari** kullanır:
- **Frontend**: React/Next.js (TypeScript)
- **Backend**: Next.js API Routes (Node.js)
- **Price Service**: Python (Borsa MCP - FastMCP)
- **Database**: SQLite (price_cache)

### Anahtar Prensip

**Borsa MCP sürekli çalışmaz!** Sadece fiyat güncellemesi istendiğinde devreye girer.

---

## 🚀 npm run dev ile Ne Oluyor?

### Adım 1: Next.js Server Başlar

```bash
npm run dev
  ↓
next dev --turbopack
  ↓
Next.js Development Server başlatılır
Port: 3000 (veya uygun port)
```

### Adım 2: API Route'lar Yüklenir

```
app/
├── api/
│   ├── prices/
│   │   └── sync/
│   │       └── route.ts  ← Bu dosya yüklenir
│   └── ...
```

**Önemli**: Bu aşamada sadece **route tanımları** yüklenir. Kod henüz çalışmaz!

### Adım 3: Server Hazır

```
✓ Ready in 889ms
- Local:   http://localhost:3000
```

**Bu noktada:**
- ✅ Next.js server çalışıyor
- ✅ API endpoints hazır
- ❌ Borsa MCP henüz çalışmıyor (hiç subprocess başlatılmadı)

---

## ⚡ Borsa MCP Ne Zaman Çalışıyor?

### Tetikleyici: HTTP Request

Borsa MCP sadece şu durumlarda çalışır:

#### 1. Manuel Sync (API Call)

```bash
curl -X POST http://localhost:3000/api/prices/sync
```

#### 2. UI Butonu

```tsx
<Button onClick={fetchPrices}>
  Fiyatları Güncelle
</Button>
```

#### 3. Cron Job (Henüz yok, planlı)

```typescript
// Gelecekte eklenecek
cron.schedule('0 * * * *', () => {
  syncAssetPrices();
});
```

### İstek Geldiğinde Olan Akış

```
1. HTTP Request → /api/prices/sync
   ↓
2. price-sync-service.ts çalışır
   ↓
3. Database'den varlıklar çekilir
   ↓
4. Her varlık için borsa-mcp-client.ts çağrılır
   ↓
5. Python subprocess başlatılır
   ↓
6. Borsa MCP çalışır → Veri çeker
   ↓
7. JSON döner → price_cache'e yazılır
   ↓
8. Response döner → UI güncellenir
```

---

## 📊 Veri Akış Diyagramı

### Detaylı Akış

```
┌──────────────────────────────────────────────────────────────┐
│                    1. USER ACTION                             │
│                                                               │
│  Browser: "Fiyatları Güncelle" butonuna tıkla               │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      │ HTTP POST /api/prices/sync
                      │ Body: { "force": true }
                      ▼
┌──────────────────────────────────────────────────────────────┐
│           2. NEXT.JS API ROUTE (Node.js)                     │
│                                                               │
│  File: app/api/prices/sync/route.ts                         │
│  ┌────────────────────────────────────────────────┐         │
│  │ export async function POST(request) {           │         │
│  │   const validated = validate(body);             │         │
│  │   const result = await syncAssetPrices(config);│         │
│  │   return NextResponse.json(result);             │         │
│  │ }                                               │         │
│  └────────────────────────────────────────────────┘         │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      │ syncAssetPrices(config)
                      ▼
┌──────────────────────────────────────────────────────────────┐
│         3. PRICE SYNC SERVICE (Node.js)                      │
│                                                               │
│  File: lib/services/price-sync-service.ts                   │
│  ┌────────────────────────────────────────────────┐         │
│  │ 1. Database'den varlıkları çek                  │         │
│  │    SELECT * FROM assets                         │         │
│  │    WHERE auto_price_update = true              │         │
│  │                                                 │         │
│  │ 2. Piyasa saatleri kontrolü                    │         │
│  │    if (!isMarketOpen(assetType)) skip;         │         │
│  │                                                 │         │
│  │ 3. Her varlık için:                            │         │
│  │    for (asset of assets) {                     │         │
│  │      price = await fetchAssetPrice(asset);     │         │
│  │      updatePriceCache(asset, price);          │         │
│  │    }                                           │         │
│  └────────────────────────────────────────────────┘         │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      │ fetchAssetPrice(asset)
                      ▼
┌──────────────────────────────────────────────────────────────┐
│        4. BORSA MCP CLIENT (Node.js)                         │
│                                                               │
│  File: lib/services/borsa-mcp-client.ts                     │
│  ┌────────────────────────────────────────────────┐         │
│  │ async getStockPrice(symbol) {                   │         │
│  │   // Python subprocess başlat                   │         │
│  │   const process = spawn('uvx', [                │         │
│  │     '--from', 'git+.../borsa-mcp',             │         │
│  │     'borsa-mcp',                                │         │
│  │     'get_hizli_bilgi',                         │         │
│  │     symbol                                      │         │
│  │   ]);                                           │         │
│  │                                                 │         │
│  │   // Stdout/stderr dinle                       │         │
│  │   process.stdout.on('data', ...);              │         │
│  │   process.stderr.on('data', ...);              │         │
│  │                                                 │         │
│  │   // JSON parse et ve döndür                   │         │
│  │   return JSON.parse(stdout);                   │         │
│  │ }                                               │         │
│  └────────────────────────────────────────────────┘         │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      │ child_process.spawn()
                      ▼
┌──────────────────────────────────────────────────────────────┐
│       5. PYTHON SUBPROCESS (Borsa MCP)                       │
│                                                               │
│  Command: uvx --from git+... borsa-mcp get_hizli_bilgi THYAO│
│  ┌────────────────────────────────────────────────┐         │
│  │ #!/usr/bin/env python3                         │         │
│  │ from fastmcp import FastMCP                    │         │
│  │                                                 │         │
│  │ # FastMCP server başlat                        │         │
│  │ app = FastMCP("BorsaMCP")                      │         │
│  │                                                 │         │
│  │ @app.tool()                                    │         │
│  │ def get_hizli_bilgi(symbol: str):             │         │
│  │     # Harici API'ye istek at                   │         │
│  │     response = requests.get(KAP_URL)           │         │
│  │     return response.json()                     │         │
│  └────────────────────────────────────────────────┘         │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      │ HTTP Request
                      ▼
┌──────────────────────────────────────────────────────────────┐
│          6. EXTERNAL APIs                                     │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ KAP API     │  │ TEFAS API   │  │ Dovizcom    │         │
│  │ (BIST data) │  │ (Fon data)  │  │ (Altın/Döviz)│        │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │ BtcTurk API │  │ Coinbase    │                          │
│  │ (Kripto TRY)│  │ (Kripto USD)│                          │
│  └─────────────┘  └─────────────┘                          │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      │ JSON Response
                      ▼
┌──────────────────────────────────────────────────────────────┐
│         7. PYTHON → NODE.JS (stdout)                         │
│                                                               │
│  JSON veri subprocess'ten Node.js'e döner:                  │
│  {                                                           │
│    "symbol": "THYAO",                                        │
│    "price": 185.40,                                          │
│    "change": 1.80,                                           │
│    "changePercent": 0.98                                     │
│  }                                                           │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      │ updatePriceCache()
                      ▼
┌──────────────────────────────────────────────────────────────┐
│              8. DATABASE (SQLite)                             │
│                                                               │
│  File: portfolio.db                                          │
│  ┌────────────────────────────────────────────────┐         │
│  │ INSERT INTO price_cache (                       │         │
│  │   asset_id,                                    │         │
│  │   current_price,                               │         │
│  │   change_percent,                              │         │
│  │   last_updated,                                │         │
│  │   ...                                          │         │
│  │ ) VALUES (?, ?, ?, ?)                          │         │
│  │                                                 │         │
│  │ INSERT INTO price_sync_logs (                  │         │
│  │   status: 'completed',                         │         │
│  │   successful_updates: 1,                       │         │
│  │   duration_ms: 2345                            │         │
│  │ )                                              │         │
│  └────────────────────────────────────────────────┘         │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      │ NextResponse.json()
                      ▼
┌──────────────────────────────────────────────────────────────┐
│             9. HTTP RESPONSE → BROWSER                        │
│                                                               │
│  {                                                           │
│    "success": true,                                          │
│    "data": {                                                 │
│      "log_id": "uuid-123",                                   │
│      "total_assets": 15,                                     │
│      "successful": 14,                                       │
│      "failed": 1,                                            │
│      "duration_ms": 2345                                     │
│    }                                                         │
│  }                                                           │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      │ setState(prices)
                      ▼
┌──────────────────────────────────────────────────────────────┐
│            10. UI UPDATE (React)                              │
│                                                               │
│  Component: DemoPriceFetcher                                 │
│  ┌────────────────────────────────────────────────┐         │
│  │ setPrices(response.data);                       │         │
│  │ setLoading(false);                              │         │
│  │                                                 │         │
│  │ // UI Re-render                                │         │
│  │ {prices.map(price => (                         │         │
│  │   <PriceCard                                   │         │
│  │     price={price.currentPrice}                │         │
│  │     change={price.changePercent}              │         │
│  │   />                                           │         │
│  │ ))}                                            │         │
│  └────────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔧 Component Detayları

### 1. API Route (app/api/prices/sync/route.ts)

```typescript
export async function POST(request: NextRequest) {
    // 1. Request validation
    const body = await request.json();
    const validated = SyncRequestSchema.parse(body);
    
    // 2. Execute sync
    const result = await syncAssetPrices({
        assetTypes: validated.asset_types,
        force: validated.force
    });
    
    // 3. Return response
    return NextResponse.json({
        success: true,
        data: result
    });
}
```

**Görevler:**
- ✅ Request validation (Zod)
- ✅ Service çağrısı
- ✅ Error handling
- ✅ Response formatting

### 2. Price Sync Service (lib/services/price-sync-service.ts)

```typescript
export async function syncAssetPrices(config: SyncConfig) {
    // 1. Database'den varlıkları çek
    const assets = await db.query.assets.findMany({
        where: eq(assets.autoPriceUpdate, true)
    });
    
    // 2. Piyasa kontrolü
    const filteredAssets = config.force 
        ? assets
        : assets.filter(a => isMarketOpen(a.assetType));
    
    // 3. Her varlık için fiyat çek
    for (const asset of filteredAssets) {
        const result = await fetchAssetPrice(asset);
        await updatePriceCache(asset, result.price);
    }
    
    // 4. Log kaydet
    await logSync(result);
}
```

**Görevler:**
- ✅ Database query
- ✅ Market hours validation
- ✅ Batch processing
- ✅ Cache management
- ✅ Error recovery
- ✅ Logging

### 3. Borsa MCP Client (lib/services/borsa-mcp-client.ts)

```typescript
async function executeMCPCommand(args: string[]) {
    return new Promise((resolve, reject) => {
        // Subprocess başlat
        const process = spawn('uvx', [
            '--from', 'git+https://github.com/saidsurucu/borsa-mcp',
            'borsa-mcp',
            ...args
        ]);
        
        let stdout = '';
        
        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        process.on('close', (code) => {
            if (code === 0) {
                resolve(JSON.parse(stdout));
            } else {
                reject(new Error('Command failed'));
            }
        });
    });
}
```

**Görevler:**
- ✅ Subprocess management
- ✅ Stream handling (stdout/stderr)
- ✅ JSON parsing
- ✅ Timeout handling
- ✅ Retry logic
- ✅ Error handling

---

## 🐍 Subprocess Mekanizması

### Neden Subprocess?

Python ve Node.js farklı runtime'lar. Direkt import edemezsiniz:

```javascript
// ❌ YANLIŞ - Çalışmaz
import borsaMCP from 'borsa-mcp'

// ✅ DOĞRU - Subprocess ile
const process = spawn('uvx', ['borsa-mcp', ...])
```

### Subprocess Lifecycle

```
1. spawn() çağrılır
   ↓
2. Yeni Python process oluşturulur
   ↓
3. Borsa MCP çalışır
   ↓
4. stdout'a JSON yazar
   ↓
5. Process exit(0) ile kapanır
   ↓
6. Node.js stdout'u okur ve parse eder
```

### Performans

- **İlk çalıştırma**: ~60 saniye (dependencies cache'lenir)
- **Sonraki çalıştırmalar**: ~2-5 saniye
- **Concurrent requests**: Desteklenir (ayrı process'ler)

---

## 💻 Fiyatlar UI'a Nasıl Yansıyor?

### Yöntem 1: Demo Component (Yeni Eklendi)

```tsx
// components/demo-price-fetcher.tsx
const [prices, setPrices] = useState([]);

const fetchPrices = async () => {
    // 1. API çağrısı
    const response = await fetch('/api/prices/sync', {
        method: 'POST',
        body: JSON.stringify({ force: true })
    });
    
    // 2. Response'u al
    const data = await response.json();
    
    // 3. State güncelle
    setPrices(data.prices);
    
    // 4. React re-render olur
};
```

### Yöntem 2: Portfolio Dashboard (Mevcut)

```tsx
// app/dashboard/portfolio-dashboard.tsx
useEffect(() => {
    // Component mount olunca veriyi çek
    async function loadAssets() {
        const response = await fetch('/api/portfolio/assets');
        const assets = await response.json();
        
        // Her asset için cached fiyat var mı kontrol et
        setAssets(assets);
    }
    
    loadAssets();
}, []);
```

### Veri Akışı

```
Button Click
  ↓
fetchPrices()
  ↓
POST /api/prices/sync
  ↓
Borsa MCP → Database
  ↓
Response → setState()
  ↓
React Re-render
  ↓
Güncel fiyatlar ekranda
```

---

## ⏰ Otomatik Güncelleme (Gelecek)

Şu an manuel sync var. Cron service eklenince:

```typescript
// lib/services/cron-service.ts (henüz yok)
import cron from 'node-cron';

// Her saat başı
cron.schedule('0 * * * *', async () => {
    await syncAssetPrices({
        assetTypes: ['GOLD', 'STOCK', 'CRYPTO']
    });
});

// TEFAS fonları: Hafta içi 11:00
cron.schedule('0 11 * * 1-5', async () => {
    await syncAssetPrices({
        assetTypes: ['FUND']
    });
});
```

---

## 🎯 Özet

### Anahtar Noktalar

1. **npm run dev** → Sadece Next.js server başlar
2. **Borsa MCP** → Sadece API çağrısında çalışır
3. **Subprocess** → Python ve Node.js arasında köprü
4. **Cache** → Database'de saklanır (price_cache)
5. **UI** → React state ile güncellenir

### İşleyiş Özeti

```
npm run dev
  ↓
Server hazır (Borsa MCP henüz çalışmıyor)
  ↓
User: "Fiyatları Güncelle" butonuna tıklar
  ↓
API → Service → Borsa MCP Client
  ↓
Python subprocess başlatılır
  ↓
Borsa MCP → Harici API'ler
  ↓
Veri döner → Database'e yazılır
  ↓
UI güncellenir
```

---

**Son Güncelleme**: 2025-10-13  
**Yazar**: Portfolio Tracker Team  
**Durum**: ✅ Fully Documented
