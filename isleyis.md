# Portfolio Tracker - Sistem İşleyişi Dokümantasyonu

## Direktör Yapısı ve İlişkiler

Bu doküman, `lib/service`, `scripts`, ve `api/prices` klasörleri arasındaki ilişkiyi, dashboard'daki varlık yönetim mekanizmasını ve API yönetimi yapısını açıklamaktadır.

## 1. Klasör Yapısı ve Sorumluluk Alanları

### 📁 lib/services/ - Merkezi Servis Katmanı
- **bist-service.ts**: Borsa İstanbul (BIST) işlemleri
  - Şirket ticker'larını KAP API'den çeker
  - Hisse fiyatlarını Yahoo Finance API'den alır
  - BIST şirketleri için arama ve filtreleme işlemleri
- **tefas-service.ts**: TEFAS fon işlemleri
  - Fon bilgilerini resmi TEFAS API'den çeker
  - Gerçek zamanlı fon fiyatlarını alır
  - GitHub API'yi fallback olarak kullanır

### 📁 scripts/ - Otomasyon Scriptleri
- **sync-bist-tickers.ts**: BIST ticker senkronizasyonu
  - Tüm BIST şirketlerini çeker ve veritabanına yazar
  - `bistService.fetchCompanies()` kullanır
  - `tickerCache` tablosunu günceller
- **sync-tefas-data.ts**: TEFAS veri senkronizasyonu
  - Tüm TEFAS fonlarını çeker ve veritabanına yazar
  - `tefasService.fetchFunds()` kullanır
  - `tickerCache` tablosunu günceller
- **fetch_price.py**: Python tabanlı alternatif fiyat çekme scripti

### 📁 app/api/prices/ - API Endpoint'leri
- **latest/route.ts**: Anlık fiyat API'si
  - `GET /api/prices/latest?symbol=GARAN&type=STOCK`
  - Servis katmanını kullanarak fiyat bilgisi sağlar
- **sync/route.ts**: Senkronizasyon tetikleme API'si
  - `POST /api/prices/sync`
  - Manuel senkronizasyon işlemleri için

## 2. Dashboard Varlık Yönetim Mekanizması

### 🔄 Veri Akış Şeması
```
API Endpoint → Service Layer → Database → Dashboard
     ↓              ↓              ↓           ↓
/api/prices/latest → tefasService/bistService → priceCache → Real-time display
```

### 💾 Veritabanı Yapısı

#### Ticker Cache Tablosu (`tickerCache`)
- **Amaç**: Auto-complete ve arama için ticker bilgileri
- **İçerik**: BIST şirketleri ve TEFAS fonları
- **Güncelleme**: Script'ler ile manuel veya otomatik
- **Alanlar**:
  - `assetType`: 'STOCK', 'FUND'
  - `symbol`: BIST kodu veya TEFAS fon kodu
  - `name`: Şirket adı veya fon adı
  - `dataSource`: 'kap-direct', 'tefas'

#### Price Cache Tablosu (`priceCache`)
- **Amaç**: Anlık fiyat bilgileri ve geçmiş veriler
- **İçerik**: Gerçek zamanlı fiyat, değişim, OHLCV
- **Güncelleme**: API çağrıları ile gerçek zamanlı
- **Alanlar**:
  - `currentPrice`: Güncel fiyat
  - `changeAmount/Percent`: Değişim bilgileri
  - `syncStatus`: 'active', 'stale', 'error'

### 🔄 Dashboard Veri Yönetimi
1. **Arama**: `tickerCache` tablosundan filtreleme
2. **Ekleme**: Kullanıcı seçimi ile `assets` tablosuna ekleme
3. **Fiyat**: `priceCache` tablosundan anlık fiyat çekme
4. **Senkronizasyon**: Servis katmanı üzerinden otomatik güncelleme

## 3. API Yönetimi ve Merkeziyetsizlik

### ✅ API Yönetimi Merkezi Hale Getirildi Mİ?
**Evet, büyük ölçüde merkezi hale getirildi:**

- **Servis Katmanı**: `lib/services/` altında birleşti
  - `bistService` ve `tefasService` sınıfları
  - Tekil giriş noktaları
  - Fallback mekanizmaları
- **API Endpoints**: `/api/prices/` altında standartlaştırıldı
  - `latest` endpoint'i tüm varlık tiplerini destekler
  - `sync` endpoint'i merkezi senkronizasyon sağlar
- **Veritabanı**: Drizzle ORM ile merkezi schema yönetimi
  - `price-cache.ts` tekil schema dosyası
  - Tüm price ve ticker verileri aynı yerde

### 🔄 Merkezi Yapının Avantajları
- **Tek Sorumluluk**: Her servisin tek bir sahibi var
- **Ölçeklenebilirlik**: Yeni varlık tipleri kolayca eklenebilir
- **Hata Yönetimi**: Merkezi logging ve monitoring
- **Performans**: Connection pooling ve caching

## 4. Veri Kaynakları ve API Kaynakları

### 📊 BIST Verileri
- **Ticker Kaynağı**: **Evet, resmi API kullanılıyor**
  - **KAP API**: `https://www.kap.org.tr/tr/api/company/generic/excel/IGS/A`
  - **Veri Tipi**: Excel formatında şirket listesi
  - **Güvenilirlik**: ✅ Resmi Kamuyu Aydınlatma Platformu
- **Fiyat Kaynağı**: **Hayır, resmi API kullanılmıyor**
  - **Yahoo Finance**: `https://query1.finance.yahoo.com/v8/finance/chart/`
  - **Veri Tipi**: Gerçek zamanlı hisse fiyatları
  - **Güvenilirlik**: ⚠️ Üçüncü parti, ancak yaygın olarak kullanılır

### 🏦 TEFAS Verileri
- **Ana Kaynak**: **Evet, resmi API kullanılıyor**
  - **TEFAS API**: `https://www.tefas.gov.tr/api/DB/BindHistoryInfo`
  - **Veri Tipi**: JSON formatında fon bilgileri ve fiyatlar
  - **Güvenilirlik**: ✅ Resmi TEFAS platformu
- **Fallback Kaynak**: **Hayır, alternatif kaynak**
  - **GitHub**: `https://github.com/emirhalici/tefas_intermittent_api`
  - **Amaç**: Resmi API çöktüğünde yedekleme
  - **Güvenilirlik**: ⚠️ Topluluk tarafından tutulan yedek

### 🔍 Veri Kaynakları Özeti
| Veri Tipi | Resmi Kaynak | Üçüncü Parti | Fallback |
|-----------|-------------|--------------|----------|
| BIST Ticker | ✅ KAP API | ❌ | ❌ |
| BIST Fiyat | ❌ | ✅ Yahoo Finance | ❌ |
| TEFAS Ticker | ✅ TEFAS API | ❌ | ✅ GitHub |
| TEFAS Fiyat | ✅ TEFAS API | ❌ | ✅ GitHub |

## 5. Otomasyon ve Senkronizasyon

### 🤖 Otomatik Senkronizasyon
- **Ticker Senkronizasyonu**: Script tabanlı manuel çalışma
  - `npx tsx scripts/sync-bist-tickers.ts`
  - `npx tsx scripts/sync-tefas-data.ts`
- **Fiyat Senkronizasyonu**: API tabanlı anlık güncelleme
  - `POST /api/prices/sync` ile tetikleme
  - Dashboard otomatik olarak fiyatları çeker

### 📝 Loglama ve Monitoring
- **Sync Logs**: Her senkronizasyon işlemi loglanır
- **Status Tracking**: Başarılı, başarısız, devam ediyor durumları
- **Error Handling**: Detaylı hata mesajları ve fallback mekanizmaları

## 6. Güvenlik ve Performans

### 🔒 Güvenlik Önlemleri
- **API Keys**: Ortam değişkenlerinde saklanır
- **Rate Limiting**: API çağrıları için sınırlandırma
- **Error Handling**: Kapsamlı hata yönetimi
- **Data Validation**: Zod schema validasyonu

### ⚡ Performans Optimizasyonları
- **Caching**: Fiyat verileri için cache sistemi
- **Indexing**: Veritabanı indeksleri
- **Batch Processing**: Toplu veri işleme
- **Connection Pooling**: Veritabanı bağlantı yönetimi

## 7. Sonuç ve Özet

### ✅ Güçlü Yönler
- **Merkezi Servis Yönetimi**: Servis katmanı birleşmiş durumda
- **Resmi Veri Kaynakları**: TEFAS ve KAP için resmi API'ler kullanılıyor
- **Güçlü Veritabanı Yapısı**: Drizzle ORM ile iyi schema tasarımı
- **Otomasyon Desteği**: Script ve API tabanlı senkronizasyon

### ⚠️ İyileştirme Alanları
- **BIST Fiyat Kaynağı**: Yahoo Finance yerine resmi bir kaynak araştırılabilir
- **Cron Job**: Otomatik senkronizasyon için zamanlayıcı eklenebilir
- **Monitoring**: Real-time monitoring sistemi kurulabilir
- **Backup**: Veri yedekleme stratejisi geliştirilebilir

### 🎯 Genel Değerlendirme
Sistem, modern bir portföy takip uygulaması için gerekli olan tüm bileşenlere sahip. API yönetimi büyük ölçüde merkezi hale getirilmiş ve veri akışı iyi organize edilmiş durumda. Resmi API'lerin kullanılması veri güvenilirliğini artırmış, ancak bazı alanlarda hala iyileştirme potansiyeli mevcut.
