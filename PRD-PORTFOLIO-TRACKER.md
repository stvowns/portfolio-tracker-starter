# Product Requirements Document (PRD)
# Portföy Takip Uygulaması

**Proje Adı**: Portfolio Tracker  
**Versiyon**: 2.0  
**Tarih**: 2025-10-20  
**Durum**: Aktif Geliştirme  
**Hedef Pazar**: Türkiye

---

## 📋 İçindekiler

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Goals](#2-product-vision--goals)
3. [Target Audience](#3-target-audience)
4. [Core Features](#4-core-features)
5. [Asset Classes & Data Sources](#5-asset-classes--data-sources)
6. [User Experience & Interface](#6-user-experience--interface)
7. [Technical Architecture](#7-technical-architecture)
8. [Data Model & Database Schema](#8-data-model--database-schema)
9. [API Integrations](#9-api-integrations)
10. [Security & Authentication](#10-security--authentication)
11. [Performance Requirements](#11-performance-requirements)
12. [Development Roadmap](#12-development-roadmap)
13. [Success Metrics](#13-success-metrics)
14. [Risk & Mitigation](#14-risk--mitigation)

---

## 1. Executive Summary

### 1.1 Problem Statement
Türkiye'deki yatırımcılar, farklı varlık sınıflarını (altın, hisse, fon, ETF, kripto, döviz) tek bir yerde takip edebilecek kullanıcı dostu, Türkçe ve yerel piyasa odaklı bir araç bulamıyor. Mevcut çözümler ya yurt dışı odaklı, ya yalnızca bir varlık türüne özel, ya da teknik kullanıcılar için tasarlanmış.

### 1.2 Solution
Modern, hızlı ve dinlendirici bir web uygulaması:
- **Çoklu varlık desteği**: Altın (12 çeşit), gümüş, BIST hisseleri, TEFAS fonları, kripto, döviz, eurobond, ETF
- **Otomatik fiyat güncellemeleri**: Yahoo Finance, TEFAS API, doviz.com gibi kaynaklardan gerçek zamanlı veri
- **Gelişmiş analitik**: Kar/zarar takibi, performans grafikleri, risk dağılımı
- **Türkçe ve TRY odaklı**: Yerel piyasa fiyatları, komisyon hesaplamaları, vergiler
- **Modern UX**: shadcn/ui, dark mode, responsive tasarım

### 1.3 Key Differentiators
1. **Türkiye piyasasına özel**: BIST, TEFAS, yerel altın fiyatları
2. **Kullanıcı dostu**: Finans bilgisi gerektirmeyen arayüz
3. **Otomatizasyon**: Manuel fiyat girmeye son, otomatik güncellemeler
4. **Şeffaflık**: Her fiyatın kaynağı ve güncelleme zamanı görünür
5. **Ücretsiz**: Temel özellikler tamamen ücretsiz

---

## 2. Product Vision & Goals

### 2.1 Vision
"Türkiye'deki her yatırımcının portföyünü kolayca takip edip analiz edebileceği, güvenilir ve kullanımı kolay platform."

### 2.2 Mission
- Yatırım takibini günlük rutin haline getirmek
- Veri odaklı karar vermeyi demokratize etmek
- Finansal okuryazarlığı artırmak

### 2.3 Goals (Q1 2025)
- **100+ aktif kullanıcı** (ilk ay)
- **%90+ günlük aktiflik** (yatırımcılar günlük kontrol eder)
- **<2 saniye sayfa yükleme süresi**
- **%95+ API başarı oranı** (fiyat çekme)
- **0 kritik güvenlik açığı**

---

## 3. Target Audience

### 3.1 Primary Users
**Bireysel Yatırımcılar (25-45 yaş)**
- Profil: Aktif yatırım yapan, teknolojiye yakın, portföyünü takip etmek isteyen
- Pain points: Çok platformda takip zorunluluğu, manuel hesaplama, güncel fiyat bulamama
- Needs: Tek ekranda tüm varlıklar, otomatik kar/zarar, geçmiş performans

### 3.2 Secondary Users
**Yeni Başlayanlar**
- Profil: İlk kez yatırım yapacak, öğrenme aşamasında
- Needs: Basit arayüz, eğitici içerik, küçük portföy desteği

**Power Users**
- Profil: Gün içi işlem yapan, gelişmiş analiz isteyen
- Needs: Canlı fiyatlar, detaylı grafikler, dışa aktarma

### 3.3 Non-Users
- Kurumsal yatırımcılar (farklı ihtiyaçlar)
- Trading botu geliştiriciler (API kısıtlamaları)
- Sadece nakit tutan kullanıcılar (değer önerisi yok)

---

## 4. Core Features

### 4.1 Must-Have (MVP)
✅ **Kimlik Doğrulama**
- Email/şifre ile kayıt ve giriş (Better Auth)
- Session yönetimi
- Şifre sıfırlama

✅ **Varlık Yönetimi**
- Manuel işlem ekleme (alış/satış)
- Varlık detay modalı: holdings, geçmiş işlemler, kar/zarar
- İşlem düzenleme ve silme
- Portföy sıfırlama (tehlike bölgesi)

✅ **Dashboard**
- Toplam portföy değeri, kar/zarar (TRY & USD)
- Varlık tipi dağılımı (pasta grafik, rozetler)
- Varlık listesi (gruplama: altın, hisse, kripto vs.)
- En iyi/en kötü performans gösteren varlıklar

✅ **Otomatik Fiyatlama**
- Modal açıldığında varlık seçilince otomatik fiyat çekme
- Cache mekanizması (6 saat)
- Kaynak göstergesi (Yahoo, TEFAS, doviz.com)

✅ **UI/UX**
- Dark/light mode
- Responsive (mobil, tablet, desktop)
- Loading states, empty states, error states
- Toast bildirimleri

### 4.2 Should-Have (V2)
🔜 **Gelişmiş Analizler**
- Zaman içinde performans grafiği (line/area chart)
- Risk dağılımı (düşük/orta/yüksek)
- Hedef portföy vs. gerçek dağılım
- Ay/yıl bazlı kar/zarar

🔜 **Zamanlanmış Güncellemeler**
- Günlük 11:00 ve 18:00'de otomatik fiyat güncelleme
- Cron job veya serverless function
- Bildirim (opsiyonel)

🔜 **Filtreleme ve Arama**
- Varlık tipi filtreleme (tıklanabilir rozetler)
- Ticker/ad araması (autocomplete)
- Tarih aralığı filtreleme (işlemler için)

🔜 **Dışa Aktarma**
- CSV/Excel formatında portföy özeti
- İşlem geçmişi raporu
- PDF rapor (aylık/yıllık)

### 4.3 Nice-to-Have (V3+)
💡 **Fiyat Alarmları**
- Hedef fiyat ulaşınca email/push bildirimi
- Günlük değişim eşiği (örn: %5 düşüş)

💡 **Sosyal Özellikler**
- Portföy paylaşımı (anonim)
- Benchmark karşılaştırma (BIST 100, S&P 500)

💡 **Premium Tier**
- Sınırsız varlık (free: 50 varlık)
- Gelişmiş grafikler
- API erişimi

---

## 5. Asset Classes & Data Sources

### 5.1 Altın (GOLD) - 12 Çeşit
**Kaynak**: Yahoo Finance (GC=F) + USD/TRY  
**Güncelleme**: 11:00 & 18:00 (hafta içi)  
**Cache**: 6 saat

**Türler ve Gram Çarpanları**:
| Altın Türü          | Gram Ağırlığı | Örnek Fiyat (₺) |
|---------------------|---------------|-----------------|
| Gram Altın          | 1.0           | 2,940           |
| Çeyrek Altın        | 1.75          | 5,145           |
| Yarım Altın         | 3.5           | 10,290          |
| Tam Altın           | 7.2           | 21,168          |
| Cumhuriyet Altını   | 7.2           | 21,168          |
| Reşat Altını        | 7.2           | 21,168          |
| Has Altın (24 Ayar) | 1.0           | 2,940           |
| 14 Ayar Bilezik     | 0.583         | 1,714           |
| 18 Ayar Bilezik     | 0.75          | 2,205           |
| 22 Ayar Bilezik     | 0.917         | 2,696           |

**Hesaplama Formülü**:
```
Gram Altın (TRY) = (GC=F ons fiyatı USD / 31.1035) × USD/TRY kuru
Çeyrek Altın (TRY) = Gram Altın × 1.75
```

**Fallback**: Manuel fiyat girişi

### 5.2 Gümüş (SILVER) - 4 Çeşit
**Kaynak**: Yahoo Finance (SI=F) + USD/TRY  
**Güncelleme**: 11:00 & 18:00  
**Cache**: 6 saat

**Türler**:
- Gram Gümüş (1g = ~₺37)
- Gümüş Külçe (31.1035g)
- Gümüş Bilezik (gram bazlı)
- Gümüş Ons (31.1035g)

### 5.3 BIST Hisseleri (STOCK)
**Kaynak**: Yahoo Finance (SYMBOL.IS)  
**Güncelleme**: Canlı (09:30-18:00 BIST saatleri)  
**Cache**: 15 dakika

**Popüler Hisseler**:
- THYAO, GARAN, ISCTR, SISE, TUPRS, ASELS, AKBNK, KCHOL...

**Ticker Sync**: 754 BIST hissesi (KAP resmi kayıt)

**API Endpoint**:
```
https://query1.finance.yahoo.com/v8/finance/chart/{SYMBOL}.IS
```

### 5.4 TEFAS Fonları (FUND)
**Kaynak**: TEFAS API (Resmi)  
**Güncelleme**: Günlük 11:00  
**Cache**: 24 saat

**Fon Sayısı**: 2335+ fon  
**API Endpoint**:
```
https://www.tefas.gov.tr/api/DB/BindHistoryInfo
```

**Request Parametreleri**:
- `fontip`: "YAT" (Yatırım Fonu)
- `fonkod`: "AAK"
- `bastarih`: "2025-01-01"
- `bittarih`: "2025-10-20"

**Popüler Fonlar**:
- AAK (Ak Portföy Kısa Vadeli)
- GAH (Garanti Hisse Senedi)
- TKD (Tacirler Değişken)

### 5.5 Kripto Para (CRYPTO)
**Kaynak**: Yahoo Finance (SYMBOL-USD)  
**Güncelleme**: Canlı (7/24)  
**Cache**: 5 dakika

**Desteklenen Kriptolar**:
- Bitcoin (BTC), Ethereum (ETH), Solana (SOL), BNB, XRP, Cardano (ADA), Dogecoin (DOGE)...

**Fiyat**: USD bazında (TRY'ye dönüştürme: × USD/TRY kuru)

### 5.6 Döviz (CURRENCY)
**Kaynak**: Yahoo Finance (PAIR=X)  
**Güncelleme**: Canlı  
**Cache**: 10 dakika

**Paralar**:
- USD/TRY, EUR/TRY, GBP/TRY, CHF/TRY, JPY/TRY

### 5.7 Eurobond (EUROBOND)
**Kaynak**: Investing.com / BigPara (web scraping)  
**Durum**: 🔜 Planlanıyor  
**Cache**: 1 saat

### 5.8 ETF
**Kaynak**: Yahoo Finance  
**Örnekler**: SPY, QQQ, VTI, GLD  
**Cache**: 15 dakika

---

## 6. User Experience & Interface

### 6.1 Design System

**Renk Paleti (Dinlendirici Teal/Yeşil Tonları)**
```css
/* Light Mode */
--primary: oklch(0.70 0.10 190);       /* Sakin teal */
--secondary: oklch(0.96 0.01 230);     /* Açık gri-mavi */
--accent: oklch(0.96 0.01 210);        /* Vurgu rengi */
--background: oklch(0.985 0.004 240);  /* Neredeyse beyaz */
--foreground: oklch(0.20 0.04 250);    /* Koyu metin */

/* Dark Mode */
--primary: oklch(0.83 0.06 190);       /* Parlak teal */
--background: oklch(0.17 0.03 250);    /* Koyu arka plan */
--card: oklch(0.22 0.03 250);          /* Kart arka planı */

/* Grafik Paleti (Pastel) */
--chart-1: oklch(0.72 0.10 190);  /* Teal */
--chart-2: oklch(0.78 0.12 145);  /* Yeşil */
--chart-3: oklch(0.82 0.10 80);   /* Sarı */
--chart-4: oklch(0.75 0.11 280);  /* Mor */
--chart-5: oklch(0.78 0.10 20);   /* Turuncu */
```

**Tipografi**:
- Başlıklar: 600-700 ağırlık
- Sayılar: `font-variant-numeric: tabular-nums` (hizalama)
- Gövde: 14-16px
- Yardımcı metin: 12-13px

**Spacing**: 4, 8, 12, 16, 24, 32px (Tailwind scale)

**Border Radius**: 8-12px (yumuşak köşeler)

**İkonlar**: Lucide React (16, 20, 24px)

### 6.2 Layout

**Header**:
```
┌────────────────────────────────────────────────────────────┐
│ 📊 Portföy Tracker     [🔍 Ara]  [₺/$ Toggle]  [☀️/🌙]  [👤]│
└────────────────────────────────────────────────────────────┘
```

**Dashboard Sections**:
1. **Özet Kartları** (4 kart grid)
   - Toplam Değer
   - Toplam K/Z
   - Yatırım Tutarı
   - Toplam İşlem
   
2. **Varlık Dağılımı**
   - Pasta grafik (ortada)
   - Tıklanabilir rozetler (üstte)
   
3. **Varlık Listesi**
   - Gruplama: Altın, Hisse, Kripto vs.
   - Collapse/expand
   - Satıra tıklayınca modal

**Modal (Varlık Detay)**:
- Tabs: Özet | İşlemler | Performans
- Holdings bilgisi: miktar, ortalama maliyet, K/Z
- İşlem geçmişi (tablo)
- Yeni işlem ekleme formu

### 6.3 Interaction Patterns

**İşlem Ekleme Akışı**:
1. "Yeni İşlem" butonuna tıkla
2. Varlık türü seç (dropdown)
3. Varlık adı seç (autocomplete veya dropdown)
4. **Otomatik fiyat çekme** → loading → fiyat input'una yaz
5. Miktar, tarih, notlar gir
6. "İşlemi Ekle" → Toast bildirimi → Modal kapan → Dashboard güncelle

**Loading States**:
- Skeleton screens (dashboard ilk yükleme)
- Spinner + metin (fiyat çekme)
- Progress bar (toplu güncelleme)

**Empty States**:
- İkon + açıklama + CTA butonu
- Örnek: "Henüz varlık eklenmedi. İlk işleminizi ekleyin!"

**Error States**:
- Toast (kırmızı) + hata mesajı + "Tekrar Dene" butonu
- Fallback: Manuel fiyat girişi

### 6.4 Mobile Experience
- Bottom navigation (mobil için)
- FAB (Floating Action Button) sağ alt köşe → "Hızlı Ekle"
- Swipe gestures (silme/düzenleme)
- Sticky header (tablo/liste)

### 6.5 Accessibility (WCAG 2.1 AA)
- Kontrast oranı ≥ 4.5:1 (metin), ≥ 3:1 (UI elementler)
- Klavye navigasyonu: Tab, Enter, Escape
- Focus indicator: belirgin halka (ring)
- Screen reader desteği: aria-label, aria-live
- Renk körü uyumlu: ikon + desen kombinasyonu

---

## 7. Technical Architecture

### 7.1 Tech Stack
**Frontend**:
- Next.js 15 (App Router, Turbopack)
- React 18
- TypeScript 5.x
- Tailwind CSS v4
- shadcn/ui (40+ component)

**Backend**:
- Next.js API Routes (server-side)
- Better Auth (kimlik doğrulama)
- Drizzle ORM
- SQLite (lokal) / PostgreSQL (prod)

**External APIs**:
- Yahoo Finance (altın, gümüş, hisse, kripto, döviz)
- TEFAS API (fonlar)
- doviz.com (alternatif altın fiyatı)

**DevOps**:
- Docker + docker-compose
- Vercel (deployment)
- PostgreSQL (Supabase / Neon)

### 7.2 System Architecture
```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTPS
       ↓
┌─────────────────────────────────────────────┐
│         Next.js App (Frontend + API)        │
│  ┌──────────────┐  ┌──────────────────────┐ │
│  │  React Pages │  │  API Routes          │ │
│  │  (App Router)│  │  /api/portfolio      │ │
│  │              │  │  /api/prices         │ │
│  │  - Dashboard │  │  /api/tickers/sync   │ │
│  │  - Auth      │  │                      │ │
│  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────┘
       │                   │
       ↓                   ↓
┌──────────────┐   ┌──────────────────────┐
│ Better Auth  │   │  Drizzle ORM         │
│ (Sessions)   │   │  (Type-safe queries) │
└──────────────┘   └──────────────────────┘
                           │
                           ↓
                   ┌──────────────┐
                   │  PostgreSQL  │
                   │  - users     │
                   │  - assets    │
                   │  - transactions│
                   │  - price_cache│
                   │  - tickers   │
                   └──────────────┘

External APIs:
┌──────────────────────────────────────────────┐
│  Yahoo Finance | TEFAS | doviz.com          │
└──────────────────────────────────────────────┘
```

### 7.3 Data Flow (Fiyat Çekme)
```
User tıklar "Çeyrek Altın"
       ↓
Modal açılır → handleGoldSilverSelect()
       ↓
1. Cache kontrolü (price_cache tablosu)
   ├─ Fresh (< 6 saat) → Cache'den al → Input'a yaz
   └─ Expired/Yok → API'ye git ↓
       ↓
2. Yahoo Finance'dan GC=F (gold futures) çek
       ↓
3. USD/TRY kurunu al
       ↓
4. Hesapla: (GC=F / 31.1035) × USD/TRY × 1.75 (çeyrek çarpanı)
       ↓
5. Cache'e kaydet (price_cache tablosu)
       ↓
6. Input'a yaz + Toast göster
       ↓
Kullanıcı diğer bilgileri girer → Submit
```

### 7.4 API Endpoints

**Kimlik Doğrulama**:
- `POST /api/auth/sign-up` - Yeni kullanıcı kaydı
- `POST /api/auth/sign-in` - Giriş
- `POST /api/auth/sign-out` - Çıkış
- `GET /api/auth/session` - Aktif oturum kontrolü

**Portföy**:
- `GET /api/portfolio` - Portföy özeti (toplam değer, K/Z)
- `GET /api/portfolio/assets` - Tüm varlıklar + holdings
- `POST /api/portfolio/transactions` - Yeni işlem ekle
- `PUT /api/portfolio/transactions/:id` - İşlem güncelle
- `DELETE /api/portfolio/transactions/:id` - İşlem sil
- `DELETE /api/portfolio/reset` - Portföyü sıfırla

**Fiyatlar**:
- `GET /api/prices/latest?symbol={SYMBOL}&type={TYPE}` - Anlık fiyat
- `POST /api/prices/sync` - Toplu fiyat güncelleme (cron)
- `GET /api/prices/history?symbol={SYMBOL}&from={DATE}&to={DATE}` - Geçmiş fiyatlar

**Ticker Yönetimi**:
- `POST /api/tickers/sync` - BIST/TEFAS senkronizasyonu (manuel)
- `GET /api/tickers/search?q={QUERY}&type={TYPE}` - Autocomplete

---

## 8. Data Model & Database Schema

### 8.1 ER Diagram
```
┌──────────────┐
│    users     │
├──────────────┤
│ id (PK)      │──┐
│ email        │  │
│ password_hash│  │
│ created_at   │  │
└──────────────┘  │
                  │
       ┌──────────┴──────────┐
       │                     │
       ↓                     ↓
┌──────────────┐      ┌──────────────┐
│  portfolios  │      │   assets     │
├──────────────┤      ├──────────────┤
│ id (PK)      │      │ id (PK)      │
│ user_id (FK) │      │ user_id (FK) │
│ name         │      │ portfolio_id │
│ base_currency│      │ asset_type   │◀─┐
│ created_at   │      │ symbol       │  │
└──────────────┘      │ name         │  │
                      │ current_price│  │
                      │ last_updated │  │
                      │ price_source │  │
                      └──────────────┘  │
                             │          │
                             ↓          │
                      ┌──────────────┐  │
                      │ transactions │  │
                      ├──────────────┤  │
                      │ id (PK)      │  │
                      │ user_id (FK) │  │
                      │ asset_id (FK)│──┘
                      │ type (BUY/SELL)│
                      │ quantity     │
                      │ price_per_unit│
                      │ total_amount │
                      │ date         │
                      │ currency     │
                      └──────────────┘

┌──────────────┐      ┌──────────────┐
│ price_cache  │      │   tickers    │
├──────────────┤      ├──────────────┤
│ id (PK)      │      │ id (PK)      │
│ asset_id (FK)│      │ symbol       │
│ current_price│      │ name         │
│ currency     │      │ type         │
│ last_updated │      │ market       │
│ source       │      │ is_active    │
│ metadata     │      │ created_at   │
└──────────────┘      └──────────────┘
```

### 8.2 Schema Definitions

**users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**assets**
```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE SET NULL,
  asset_type VARCHAR(50) NOT NULL, -- GOLD, STOCK, CRYPTO, FUND...
  symbol VARCHAR(50), -- Ticker symbol
  name VARCHAR(255) NOT NULL, -- "Çeyrek Altın", "GARAN", "Bitcoin"
  category VARCHAR(100), -- "Kıymetli Maden", "Teknoloji", vs.
  currency VARCHAR(10) DEFAULT 'TRY',
  current_price DECIMAL(20,6),
  last_updated TIMESTAMP,
  price_source VARCHAR(100), -- "Yahoo Finance", "TEFAS API"
  auto_price_update BOOLEAN DEFAULT TRUE,
  price_cache_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_user_id (user_id),
  INDEX idx_asset_type (asset_type),
  INDEX idx_symbol (symbol)
);
```

**transactions**
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  transaction_type VARCHAR(10) NOT NULL, -- BUY, SELL
  quantity DECIMAL(20,6) NOT NULL,
  price_per_unit DECIMAL(20,6) NOT NULL,
  total_amount DECIMAL(20,6) NOT NULL,
  transaction_date TIMESTAMP NOT NULL,
  currency VARCHAR(10) DEFAULT 'TRY',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_user_id (user_id),
  INDEX idx_asset_id (asset_id),
  INDEX idx_date (transaction_date),
  INDEX idx_type (transaction_type)
);
```

**price_cache**
```sql
CREATE TABLE price_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  current_price DECIMAL(20,6) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  last_updated TIMESTAMP NOT NULL,
  source VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'success', -- success, failed, stale
  metadata JSONB, -- { "change": 1.5, "changePercent": 0.5, ... }
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_asset_id (asset_id),
  INDEX idx_last_updated (last_updated)
);
```

**tickers** (BIST & TEFAS senkronizasyonu için)
```sql
CREATE TABLE tickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL, -- STOCK, FUND
  market VARCHAR(50), -- BIST, TEFAS
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB, -- { "sector": "Teknoloji", "fundType": "YAT", ... }
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_symbol (symbol),
  INDEX idx_type (type),
  INDEX idx_market (market)
);
```

---

## 9. API Integrations

### 9.1 Yahoo Finance
**Base URL**: `https://query1.finance.yahoo.com`

**Endpoints**:
- `/v8/finance/chart/{SYMBOL}` - Fiyat verisi

**Rate Limits**:
- 60 request/minute
- 2000 request/hour

**Kullanım**:
```typescript
// BIST hisse
const url = `https://query1.finance.yahoo.com/v8/finance/chart/GARAN.IS`;

// Kripto
const url = `https://query1.finance.yahoo.com/v8/finance/chart/BTC-USD`;

// Döviz
const url = `https://query1.finance.yahoo.com/v8/finance/chart/TRY=X`;

// Altın (Gold Futures)
const url = `https://query1.finance.yahoo.com/v8/finance/chart/GC=F`;
```

**Response Örneği**:
```json
{
  "chart": {
    "result": [{
      "meta": {
        "symbol": "GARAN.IS",
        "regularMarketPrice": 125.40,
        "currency": "TRY",
        "previousClose": 123.50
      },
      "timestamp": [1698758400, ...],
      "indicators": {
        "quote": [{
          "close": [125.40, ...]
        }]
      }
    }]
  }
}
```

### 9.2 TEFAS API
**Base URL**: `https://www.tefas.gov.tr/api`

**Endpoint**: `/DB/BindHistoryInfo`

**Method**: POST

**Request Body**:
```json
{
  "fontip": "YAT",
  "fonkod": "AAK",
  "bastarih": "2025-01-01",
  "bittarih": "2025-10-20"
}
```

**Response**:
```json
{
  "data": [
    {
      "FONKODU": "AAK",
      "FIYAT": "0.045821",
      "TARIH": "20.10.2025",
      "TEDPAYSAYISI": "1234567"
    }
  ]
}
```

**Rate Limits**:
- 10 request/minute
- 100 request/hour

**Güncelleme Zamanı**: Hafta içi her gün 11:00 (Türkiye saati)

### 9.3 doviz.com API (Alternatif Altın)
**Base URL**: `https://www.doviz.com/api`

**Endpoint**: `/v1/metals/{METAL_NAME}`

**Örnekler**:
- `/v1/metals/ceyrek-altin`
- `/v1/metals/gram-altin`

**Response**:
```json
{
  "name": "Çeyrek Altın",
  "buying": 5748.15,
  "selling": 5758.20,
  "currency": "TRY",
  "lastUpdate": "2025-10-20T11:30:00Z"
}
```

**Not**: Resmi API dokümantasyonu yok, web scraping gerekebilir.

### 9.4 Error Handling Strategy
```typescript
async function fetchPrice(symbol: string, source: string) {
  try {
    const response = await fetch(apiUrl, { timeout: 5000 });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    return parsePrice(data);
    
  } catch (error) {
    // 1. Log hata
    console.error(`[${source}] Fiyat çekme hatası:`, error);
    
    // 2. Cache'e fallback
    const cached = await getCachedPrice(symbol);
    if (cached && isRecentEnough(cached.lastUpdated)) {
      return cached.price;
    }
    
    // 3. Son çare: null döndür (manuel fiyat girişi)
    return null;
  }
}
```

---

## 10. Security & Authentication

### 10.1 Better Auth Configuration
- **Session yönetimi**: JWT tokens (httpOnly cookies)
- **Şifre**: bcrypt hashing (cost factor: 12)
- **CSRF protection**: CSRF tokens
- **Rate limiting**: 5 failed login → 15 dakika block

### 10.2 Data Protection
- **HTTPS zorunlu**: Tüm API çağrıları
- **Input validation**: Server-side (Zod schemas)
- **SQL injection koruması**: Drizzle ORM parametreli sorgular
- **XSS koruması**: React (otomatik escape)

### 10.3 Authorization
- **Varlık erişimi**: `user_id` kontrolü (her sorgu)
- **İşlem yetkisi**: Sadece kendi portföyü
- **API keys**: Environment variables (`.env`)

### 10.4 Privacy
- **Kişisel veri**: Email, portföy bilgileri (KVKK uyumlu)
- **3. parti paylaşım**: Yok
- **Analytics**: Anonim (plausible.io veya self-hosted)

---

## 11. Performance Requirements

### 11.1 Frontend
- **Initial Load**: <2 saniye (3G bağlantı)
- **Time to Interactive**: <3 saniye
- **Lighthouse Score**: >90 (Performance, Accessibility)

### 11.2 API Response Times
- **Portföy özeti**: <200ms
- **Varlık listesi**: <300ms
- **Fiyat çekme (cache)**: <50ms
- **Fiyat çekme (API)**: <2 saniye

### 11.3 Database
- **Query optimizasyon**: Index kullanımı
- **N+1 problem**: Eager loading (Drizzle `with`)
- **Connection pooling**: Max 20 connection

### 11.4 Caching Strategy
- **Fiyat cache**: 6 saat (altın, hisse)
- **Ticker listesi**: 24 saat
- **Portfolio summary**: 1 dakika (SWR)
- **Static assets**: CDN (Vercel Edge)

### 11.5 Scalability
- **Kullanıcı kapasitesi**: 10,000+ (Phase 1)
- **Varlık/kullanıcı**: 200 (free), sınırsız (premium)
- **API rate limit**: 100 request/dakika/kullanıcı

---

## 12. Development Roadmap

### Phase 1: MVP (Tamamlandı ✅)
**Süre**: 4 hafta  
**Hedef**: Temel işlevsellik

- [x] Kimlik doğrulama (Better Auth)
- [x] Dashboard (özet kartlar, varlık listesi)
- [x] Manuel işlem ekleme
- [x] Otomatik fiyat çekme (Yahoo Finance)
- [x] Altın/gümüş fiyatları (hesaplama)
- [x] Cache mekanizması
- [x] Dark mode
- [x] Responsive tasarım

### Phase 2: Gelişmiş Özellikler (Devam Ediyor 🚧)
**Süre**: 6 hafta  
**Hedef**: Kullanılabilirlik ve güvenilirlik

- [ ] TEFAS senkronizasyonu (2335 fon)
- [ ] BIST senkronizasyonu (754 hisse)
- [ ] Zamanlanmış fiyat güncellemeleri (cron)
- [ ] Filtreleme ve arama
- [ ] Performans grafikleri (Recharts)
- [ ] Risk dağılımı analizi
- [ ] CSV/Excel dışa aktarma
- [ ] Email bildirimleri (opsiyonel)

### Phase 3: UI İyileştirmeleri (Planlanıyor 📅)
**Süre**: 3 hafta  
**Hedef**: Ürün seviyesi deneyim

- [ ] Yeni renk paleti (dinlendirici teal)
- [ ] Mini-sparkline grafikler (özet kartlar)
- [ ] Tıklanabilir rozetler (filtre)
- [ ] Tablo yoğunluk modu
- [ ] Kolon görünürlük menüsü
- [ ] Sticky header
- [ ] Sağ detay paneli (desktop)
- [ ] Mobil FAB (Floating Action Button)

### Phase 4: Monetizasyon (Gelecek 💡)
**Süre**: 4 hafta  
**Hedef**: Sürdürülebilir gelir

- [ ] Premium tier (aylık ₺29.99)
  - Sınırsız varlık
  - Gelişmiş grafikler
  - API erişimi
  - Fiyat alarmları
- [ ] Stripe entegrasyonu
- [ ] Fatura sistemi
- [ ] Referral programı

### Phase 5: Ölçeklendirme (Uzun Vadeli 🚀)
**Süre**: Sürekli  
**Hedef**: 100K+ kullanıcı

- [ ] Redis caching (merkezi)
- [ ] PostgreSQL Read Replicas
- [ ] CDN optimizasyonu
- [ ] Serverless Functions (fiyat güncellemeleri)
- [ ] Monitoring (Sentry, DataDog)
- [ ] Load testing

---

## 13. Success Metrics

### 13.1 User Engagement
- **Günlük aktif kullanıcı (DAU)**: >80%
- **Haftalık aktif kullanıcı (WAU)**: >90%
- **Ortalama oturum süresi**: >5 dakika
- **Sayfa/oturum**: >10
- **Bounce rate**: <30%

### 13.2 Feature Adoption
- **İşlem ekleme**: >50 işlem/kullanıcı (ilk ay)
- **Otomatik fiyat kullanımı**: >80%
- **Dashboard görüntüleme**: >1 kez/gün
- **Dark mode kullanımı**: >40%

### 13.3 Performance
- **API başarı oranı**: >95%
- **Sayfa yükleme süresi**: <2 saniye (p95)
- **API response time**: <500ms (p95)
- **Uptime**: >99.5%

### 13.4 Business
- **Kullanıcı büyümesi**: %20 MoM (ilk 6 ay)
- **Retention (30 gün)**: >60%
- **Conversion (free → premium)**: >5% (V4'te)
- **NPS (Net Promoter Score)**: >50

### 13.5 Data Quality
- **Fiyat doğruluğu**: >98% (doğrulama örneklemleri)
- **Cache hit rate**: >70%
- **Veri tutarlılığı**: 0 critical bug

---

## 14. Risk & Mitigation

### 14.1 Technical Risks
| Risk | Olasılık | Etki | Azaltma Stratejisi |
|------|----------|------|-------------------|
| Yahoo Finance API değişikliği | Orta | Yüksek | Alternatif kaynak (doviz.com), fallback mekanizması |
| TEFAS API rate limit | Düşük | Orta | Cache (24 saat), toplu güncelleme (off-peak) |
| Database performance (100K+ kullanıcı) | Orta | Yüksek | Index optimizasyon, read replicas, Redis |
| Client-side API leak (CORS) | Düşük | Orta | Proxy tüm çağrıları server-side |
| Fiyat hesaplama hataları | Düşük | Yüksek | Unit testler, doğrulama örneklemi, user feedback |

### 14.2 Business Risks
| Risk | Olasılık | Etki | Azaltma Stratejisi |
|------|----------|------|-------------------|
| Kullanıcı benimseme düşük | Orta | Yüksek | Beta testler, early adopter feedback, UX iyileştirme |
| Rakip ürün (benzer çözüm) | Orta | Orta | Hızlı feature development, Türkiye odağı, topluluk |
| Regülasyon (KVKK) | Düşük | Yüksek | Hukuk danışmanlığı, veri minimizasyon |
| Hosting maliyeti | Orta | Düşük | Vercel Hobby (başlangıç), optimize caching, premium tier |

### 14.3 Security Risks
| Risk | Olasılık | Etki | Azaltma Stratejisi |
|------|----------|------|-------------------|
| SQL injection | Düşük | Kritik | Drizzle ORM (parametreli), input validation |
| XSS attack | Düşük | Yüksek | React (otomatik escape), CSP headers |
| API key sızması | Düşük | Orta | `.env` (gitignore), Vercel environment variables |
| Brute force login | Orta | Orta | Rate limiting (5 deneme), CAPTCHA |

### 14.4 Contingency Plans
**Yahoo Finance API kesintisi**:
1. Fallback: doviz.com (altın/gümüş), Investing.com (hisse)
2. Cache'den eski fiyat göster (uyarı ile)
3. Manuel fiyat girişi aktif et

**Database crash**:
1. Otomatik yedek (Supabase: daily backup)
2. Failover (read replica → primary)
3. Maintenance mode sayfası

**Güvenlik açığı keşfi**:
1. Anında patch deploy
2. Kullanıcılara bildirim (etkilendiyse)
3. Post-mortem raporu

---

## 15. Appendix

### 15.1 Glossary
- **Asset (Varlık)**: Yatırım yapılabilir herhangi bir şey (altın, hisse, kripto vs.)
- **Holdings**: Bir varlıktan sahip olunan toplam miktar ve değer
- **Transaction (İşlem)**: Alış veya satış hareketi
- **K/Z (Kar/Zarar)**: Mevcut fiyat - ortalama maliyet
- **Cache**: Geçici veri depolama (performans için)
- **Ticker**: Varlık simgesi (örn: GARAN, BTC)

### 15.2 References
- [Yahoo Finance API (Unofficial)](https://github.com/ranaroussi/yfinance)
- [TEFAS Resmi API Dokümantasyonu](https://www.tefas.gov.tr)
- [Better Auth Docs](https://better-auth.com/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Next.js 15 Docs](https://nextjs.org/docs)

### 15.3 Contact
- **Proje Sahibi**: [Ekip/Kişi]
- **Teknik Sorumlu**: [Ekip/Kişi]
- **Tasarım Sorumlu**: [Ekip/Kişi]
- **GitHub Repo**: [URL]
- **Destek Email**: support@portfoliotracker.com

---

**Son Güncelleme**: 2025-10-20  
**Doküman Versiyonu**: 2.0  
**Durum**: Aktif - Geliştirme Devam Ediyor 🚀
