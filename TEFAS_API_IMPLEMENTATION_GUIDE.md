# TEFAS API Implementation Guide

## 📚 Kendi API'mizi Yazmak İçin Öğrenilenler

### RapidAPI TEFAS API'den Öğrendiklerimiz

#### 1. API Architecture (Go + Redis + OpenAPI)
```
Tech Stack:
- Backend: Golang (high performance)
- Cache: Redis (in-memory caching)
- Docs: OpenAPI 3.1 + Swagger
- Rate Limiting: Built-in middleware
```

#### 2. Key Endpoints Structure
```go
Core Endpoints:
GET /api/v1/funds                    // Tüm fonlar (3285 fon)
GET /api/v1/funds/:code              // Tek fon detayları + history
GET /api/v1/funds/companies          // Portföy yönetim şirketleri
GET /api/v1/funds/returns            // Fon getirileri
GET /api/v1/funds/sizes              // Fon büyüklükleri
GET /api/v1/funds/count-by-type      // Fon tipi istatistikleri

Trading Reports:
GET /api/v1/funds-reports/trading-institutions
GET /api/v1/funds-reports/total-transaction-volume
GET /api/v1/funds-reports/member-based-transaction-volume
GET /api/v1/funds-reports/fund-based-transaction-volume
GET /api/v1/funds-reports/fund-type-based-member-stock-balances
GET /api/v1/funds/periodic-top-earners

Utilities:
GET /api/v1/healthz                  // Health check
GET /api/v1/reset                    // Cache reset (admin)
```

#### 3. Data Source Strategy
```
Primary: https://www.tefas.gov.tr
Method: Web scraping + data transformation
```

#### 4. Response Format (Example: /funds/:code)
```json
{
  "success": true,
  "data": {
    "code": "AAK",
    "title": "ATA PORTFÖY ÇOKLU VARLIK DEĞİŞKEN FON",
    "lineValues": [
      {
        "order": 0,
        "value": 4.137761,
        "date": "2020-10-14T00:00:00.000Z",
        "count": 1255
      }
    ],
    "details": {
      "Fonun Faiz İçeriği": "",
      "Fonun Risk Değeri": "4",
      "KAP Bilgi Adresi": "https://www.kap.org.tr/..."
    },
    "IsTimeLong": true
  }
}
```

---

## 🛠️ Kendi API'mizi Yazmak İçin Adımlar

### Option 1: Python FastAPI (Önerilen - Hızlı Başlangıç)
```python
# Architecture
FastAPI (async) + SQLite/PostgreSQL + BeautifulSoup/Playwright
Cache: Redis or in-memory LRU cache
Deploy: Railway/Render/Fly.io (free tier)

#장점
✅ Python scraping ekosistemi zengin
✅ FastAPI async ve hızlı
✅ OpenAPI docs otomatik
✅ Railway'de kolay deploy

# Implementation
1. TEFAS web scraping (BeautifulSoup)
2. Data normalization + caching
3. RESTful API endpoints
4. Scheduled updates (daily 12PM)
```

### Option 2: Node.js Express (Mevcut Stack)
```javascript
// Architecture
Express.js + Puppeteer/Cheerio + PostgreSQL
Cache: Node-cache or Redis
Deploy: Vercel/Railway

//장점
✅ Mevcut stack ile uyumlu
✅ Puppeteer ile dynamic scraping
✅ TypeScript type safety
✅ Vercel serverless functions

// Implementation
1. Puppeteer for TEFAS scraping
2. Express REST API
3. PostgreSQL for persistence
4. Cron job for updates
```

### Option 3: Go (Production Grade)
```go
// Architecture (RapidAPI gibi)
Gin/Fiber + Redis + PostgreSQL
Scraping: Colly/Chromedp

// 장점
✅ Çok yüksek performans
✅ Low memory footprint
✅ Concurrent scraping
✅ Production-ready

// Zorluk
❌ Go öğrenme eğrisi
❌ Scraping ecosystem daha az
```

---

## 📋 Minimal MVP Implementation (Python FastAPI)

### Adım 1: TEFAS Scraper
```python
# scraper.py
import requests
from bs4 import BeautifulSoup
import pandas as pd

def scrape_tefas_funds():
    """Scrape all TEFAS funds list"""
    url = "https://www.tefas.gov.tr/FonKarsilastirma.aspx"
    response = requests.post(url, data={'fontip': 'YAT'})
    
    # Parse HTML table
    soup = BeautifulSoup(response.text, 'html.parser')
    table = soup.find('table', {'id': 'MainContent_GridViewFunds'})
    
    funds = []
    for row in table.find_all('tr')[1:]:  # Skip header
        cols = row.find_all('td')
        funds.append({
            'code': cols[0].text.strip(),
            'name': cols[1].text.strip(),
            'type': cols[2].text.strip()
        })
    
    return funds

def scrape_fund_price(fund_code):
    """Scrape specific fund price history"""
    url = f"https://www.tefas.gov.tr/FonAnaliz.aspx?FonKod={fund_code}"
    response = requests.get(url)
    
    soup = BeautifulSoup(response.text, 'html.parser')
    # Parse price table
    # ... (implement based on TEFAS HTML structure)
    
    return price_data
```

### Adım 2: FastAPI Service
```python
# main.py
from fastapi import FastAPI
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
import redis

app = FastAPI(title="TEFAS API", version="1.0.0")

# Redis cache setup
@app.on_event("startup")
async def startup():
    redis_client = redis.from_url("redis://localhost")
    FastAPICache.init(RedisBackend(redis_client), prefix="tefas-cache")

@app.get("/api/v1/funds")
async def get_all_funds():
    """Get all TEFAS funds"""
    # Cache for 24 hours
    funds = scrape_tefas_funds()
    return {"success": True, "data": funds, "count": len(funds)}

@app.get("/api/v1/funds/{code}")
async def get_fund_details(code: str):
    """Get specific fund details with price history"""
    # Cache for 1 hour
    data = scrape_fund_price(code)
    return {"success": True, "data": data}

@app.get("/healthz")
async def health_check():
    return {"status": "healthy"}
```

### Adım 3: Scheduled Updates
```python
# scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler

def update_cache():
    """Update all funds cache daily at 12PM"""
    funds = scrape_tefas_funds()
    # Save to database
    db.save_funds(funds)

scheduler = BackgroundScheduler()
scheduler.add_job(update_cache, 'cron', hour=12, minute=0)
scheduler.start()
```

### Adım 4: Deployment (Railway)
```yaml
# railway.toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"

[env]
REDIS_URL = "${{RAILWAY_REDIS_URL}}"
```

---

## 🎯 Öncelikli Özellikler (MVP)

### Phase 1 (1-2 gün)
- [x] `/funds` - Tüm fonlar listesi
- [x] `/funds/:code` - Tek fon detayı + fiyat history
- [x] Redis caching (24h for list, 1h for prices)
- [x] Basic error handling

### Phase 2 (3-5 gün)
- [ ] PostgreSQL persistence
- [ ] Scheduled daily updates (cron)
- [ ] Rate limiting (1000 req/hour)
- [ ] OpenAPI docs (automatic)

### Phase 3 (Future)
- [ ] `/funds/returns` - Getiri analizi
- [ ] `/funds/companies` - Şirket listesi
- [ ] `/funds/compare` - Fon karşılaştırma
- [ ] Webhook notifications
- [ ] Historical data analytics

---

## 💰 Maliyet Analizi

### Self-Hosted API
```
Railway Free Tier:
- 500 saat/ay compute
- 1GB RAM
- PostgreSQL included
- Redis included
= $0/ay

Railway Hobby Plan:
- Unlimited compute
- 8GB RAM
- 100GB storage
= $5/ay

Toplam: $0-5/ay (vs RapidAPI Pro $10/ay)
```

### Avantajlar
✅ Sınırsız request
✅ Tam kontrol
✅ Custom endpoints
✅ Kendi verilerimiz
✅ Öğrenme deneyimi

### Zorluklar
⚠️ Maintenance gerekir
⚠️ TEFAS site değişirse update gerekir
⚠️ Scraping rate limiting
⚠️ Uptime monitoring

---

## 🚀 Hızlı Start Komutu

```bash
# 1. Create new repo
mkdir tefas-api && cd tefas-api

# 2. Setup Python FastAPI
pip install fastapi uvicorn beautifulsoup4 requests pandas redis apscheduler

# 3. Copy scraper code above to files

# 4. Run locally
uvicorn main:app --reload

# 5. Deploy to Railway
railway init
railway up
```

---

## 📊 Karşılaştırma

| Feature | RapidAPI | GitHub Scraper | Kendi API'miz |
|---------|----------|----------------|---------------|
| **Maliyet** | $0-10/ay | Ücretsiz | $0-5/ay |
| **Rate Limit** | 10-5K req/day | Sınırsız | Sınırsız |
| **Latency** | ~200ms | ~500ms (GitHub) | ~100ms (Redis cache) |
| **Reliability** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Maintenance** | ✅ Yok | ✅ Yok | ⚠️ Gerekir |
| **Custom Features** | ❌ Yok | ❌ Yok | ✅ Var |
| **Learning** | ❌ Yok | ❌ Yok | ✅ Çok değerli |

---

## 🎓 Sonuç ve Öneri

### Şu an için (Production)
**Mevcut yaklaşım mükemmel:**
1. GitHub API (primary, free)
2. RapidAPI (fallback, 10/day)
3. Static list (58 popular)

### Gelecek için (Eğitim + Bağımsızlık)
**Kendi API'mizi yazmak:**
- Hafta sonu projesi olarak mükemmel
- Python FastAPI + Railway = 2-3 gün
- Production'a geçmeden önce 1-2 hafta test
- Başarılı olursa RapidAPI'den tamamen bağımsız

### Önerilen Timeline
```
Hafta 1-2: Prototype (FastAPI + basic scraping)
Hafta 3-4: Testing + Redis caching
Hafta 5-6: Production deploy + monitoring
Hafta 7+:  Mevcut sistem ile paralel çalıştır
         → Stabilse geçiş yap
```

**Karar:** Şimdilik mevcut sistem ile devam, boş zamanda kendi API'mizi yazmaya başlayalım! 🚀
