# 🚀 Price API Kurulum Rehberi

Bu rehber, Borsa MCP entegrasyonunun kurulumu için adım adım talimatlar içerir.

## ✅ Ön Gereksinimler

### 1. Python 3.11+ (Linux Mint)

```bash
# Python sürümünü kontrol et
python3 --version

# Eğer yoksa veya eski sürümse
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip
```

### 2. UV Package Manager

```bash
# UV'yi kur
curl -LsSf https://astral.sh/uv/install.sh | sh

# Shell'i yeniden başlat veya source et
source ~/.bashrc  # veya ~/.zshrc

# UV'yi test et
uvx --version
```

### 3. Git (zaten kurulu olmalı)

```bash
git --version
```

## 📦 Kurulum Adımları

### Adım 1: Database Migration

```bash
cd /home/cosmogen/Desktop/portfolio-tracker-starter

# Migration çalıştır
npm run db:migrate
```

**Beklenen Çıktı:**
- ✅ `price_cache` tablosu oluşturuldu
- ✅ `price_sync_logs` tablosu oluşturuldu
- ✅ `assets` tablosuna yeni alanlar eklendi

### Adım 2: Borsa MCP Test

```bash
# Borsa MCP'yi test et
uvx --from git+https://github.com/saidsurucu/borsa-mcp borsa-mcp --help
```

**Beklenen Çıktı:**
```
usage: borsa-mcp [-h] [--version] ...
...
```

Eğer hata alırsanız:

```bash
# Python ve pip'i güncelle
python3 -m pip install --upgrade pip

# Tekrar dene
uvx --from git+https://github.com/saidsurucu/borsa-mcp borsa-mcp --help
```

### Adım 3: Environment Variables

`.env` dosyasına ekleyin:

```env
# Borsa MCP Configuration
BORSA_MCP_ENABLED=true
ENABLE_BORSA_MCP_LOGS=true

# Price Cache Configuration
PRICE_CACHE_TTL=3600
PRICE_CACHE_ENABLED=true
```

### Adım 4: Development Server

```bash
# Geliştirme sunucusunu başlat
npm run dev
```

Server başladıktan sonra (http://localhost:3000):

### Adım 5: API Test

```bash
# Health check
curl http://localhost:3000/api/prices/sync

# Manuel sync tetikle (boş body ile)
curl -X POST http://localhost:3000/api/prices/sync \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Beklenen Başarılı Response:**
```json
{
  "success": true,
  "message": "Price synchronization completed",
  "data": {
    "log_id": "...",
    "total_assets": 0,
    "successful": 0,
    "failed": 0,
    "skipped": 0,
    "duration_ms": 123
  }
}
```

## 🧪 Test Senaryoları

### Test 1: Altın Fiyatı Çek

```bash
# Önce bir altın varlığı oluştur (UI'dan veya API'den)
# Sonra sync et
curl -X POST http://localhost:3000/api/prices/sync \
  -H "Content-Type: application/json" \
  -d '{"asset_types": ["gold"], "force": true}'
```

### Test 2: BIST Hisse Fiyatı

```bash
# THYAO, GARAN gibi bir hisse ekle
curl -X POST http://localhost:3000/api/prices/sync \
  -H "Content-Type: application/json" \
  -d '{"asset_types": ["stock"], "force": true}'
```

### Test 3: TEFAS Fonu

```bash
# Bir TEFAS fonu ekle (örn: AAK)
curl -X POST http://localhost:3000/api/prices/sync \
  -H "Content-Type: application/json" \
  -d '{"asset_types": ["fund"], "force": true}'
```

## 🐛 Sorun Giderme

### Problem 1: "uvx: command not found"

**Çözüm:**
```bash
# UV'yi tekrar kur
curl -LsSf https://astral.sh/uv/install.sh | sh

# PATH'e ekle
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Problem 2: "Python subprocess failed"

**Çözüm:**
```bash
# Python3 symlink kontrol
which python3

# Eğer yoksa
sudo ln -s /usr/bin/python3.11 /usr/bin/python3
```

### Problem 3: "Borsa MCP timeout"

**Çözüm:**
İlk çalıştırmada Borsa MCP dependencies indirileceği için yavaş olabilir.
Tekrar deneyin veya timeout değerini artırın:

```typescript
// lib/services/borsa-mcp-client.ts
const DEFAULT_CONFIG: MCPConfig = {
    timeout: 60000,  // 30000'den 60000'e çıkar
    ...
};
```

### Problem 4: "Database migration failed"

**Çözüm:**
```bash
# Drizzle studio ile kontrol et
npm run db:studio

# Migration'ı tekrar çalıştır
npm run db:push
```

## 📊 Log Kontrolü

### Development Logs

```bash
# Terminal'de canlı logları izle
npm run dev

# Başka bir terminal'de sync tetikle
curl -X POST http://localhost:3000/api/prices/sync \
  -H "Content-Type: application/json" \
  -d '{"force": true}'
```

### Database Logs

```bash
# Drizzle Studio'yu aç
npm run db:studio

# Browser'da http://localhost:4983 açılacak
# price_sync_logs tablosunu kontrol et
```

## 🎯 Sonraki Adımlar

### 1. Cron Service Kurulumu (İsteğe Bağlı)

Şu an için cron service henüz implement edilmedi. Manuel sync ile test edebilirsiniz.

**Planlanan:**
- Saatlik otomatik sync
- TEFAS fonları için hafta içi 11:00 sync
- Error notification

### 2. Additional Endpoints (İsteğe Bağlı)

```bash
# TODO: Bu endpoint'ler henüz yok
GET  /api/prices/latest
GET  /api/prices/asset/:id
POST /api/prices/batch
GET  /api/prices/history/:id
```

### 3. Dashboard Entegrasyonu

`app/dashboard/portfolio-dashboard.tsx` dosyasına:
- Real-time price updates
- "Fiyatları Güncelle" butonu
- Son güncelleme zamanı gösterimi

## 📚 Dokümantasyon

- **Entegrasyon Rehberi**: `documentation/PRICE_API_INTEGRATION.md`
- **API Endpoints**: `documentation/PRICE_API_ENDPOINTS.md`
- **Dashboard İyileştirmeleri**: `DASHBOARD_IMPROVEMENTS.md`

## ✅ Kurulum Tamamlandı!

Başarılı bir şekilde kurulum yaptıysanız:

1. ✅ Database migration çalıştı
2. ✅ Borsa MCP kuruldu ve çalışıyor
3. ✅ API endpoint'leri test edildi
4. ✅ İlk sync başarılı oldu

**Tebrikler! 🎉** Artık portfolio tracker'ınız Türk piyasalarından otomatik fiyat çekebilir.

---

**Son Güncelleme**: 2025-10-13  
**Platform**: Linux Mint  
**Node.js**: v18+  
**Python**: 3.11+
