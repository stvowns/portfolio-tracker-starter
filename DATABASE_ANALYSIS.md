# 📊 Portföy Takip Sistemi - Database Analiz ve Karşılaştırma

## 🔍 Mevcut Durum

### Şu An Kullanılan Veritabanı
- **Teknoloji**: SQLite 
- **ORM**: Drizzle ORM
- **Dosya**: `portfolio.db`
- **Konfigürasyon**: `.env` dosyasında `DATABASE_URL=file:./portfolio.db`

### Neden SQLite Kullanıyoruz?
- **Kurulum Kolaylığı**: Docker gerektirmez, tek dosya
- **Geliştirme Hızı**: Anında çalışır, setup gerekmez
- **Taşınabilirlik**: Proje ile birlikte taşınabilir
- **Demo Uygunluğu**: Prototip ve demo için ideal

---

## 🏗️ Mevcut Database Yapısı

### Tablolar

#### 1. `portfolios`
```sql
CREATE TABLE portfolios (
    id TEXT PRIMARY KEY,                    -- UUID benzersiz ID
    user_id TEXT NOT NULL,                  -- Kullanıcı ID
    name TEXT NOT NULL DEFAULT 'Ana Portföy',
    base_currency TEXT NOT NULL DEFAULT 'TRY',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. `assets`
```sql
CREATE TABLE assets (
    id TEXT PRIMARY KEY,                    -- UUID benzersiz ID
    user_id TEXT NOT NULL,                  -- Kullanıcı ID
    portfolio_id TEXT,                      -- Portföy ID (opsiyonel)
    asset_type TEXT NOT NULL,               -- GOLD, SILVER, STOCK, FUND, CRYPTO, EUROBOND
    symbol TEXT,                           -- GA, CA, XU100, USD gibi semboller
    name TEXT NOT NULL,                    -- "Çeyrek Altın", "Apple Inc."
    category TEXT,                         -- "Kıymetli Maden", "Tech Stock"
    current_price REAL,                    -- Güncel fiyat
    last_updated DATETIME,                 -- Son güncelleme
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. `transactions`
```sql
CREATE TABLE transactions (
    id TEXT PRIMARY KEY,                    -- UUID benzersiz ID
    user_id TEXT NOT NULL,                  -- Kullanıcı ID
    asset_id TEXT NOT NULL,                 -- Asset ID
    transaction_type TEXT NOT NULL,         -- BUY, SELL
    quantity REAL NOT NULL,                 -- Miktar (1.5, 10 adet gibi)
    price_per_unit REAL NOT NULL,           -- Birim fiyat (2850.50, 125.75 gibi)
    total_amount REAL NOT NULL,             -- Toplam tutar
    transaction_date DATETIME NOT NULL,     -- İşlem tarihi
    notes TEXT,                            -- İşleme ait notlar
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔄 Drizzle ORM Nedir?

### Tanım
**Drizzle ORM** - Modern TypeScript tabanlı veritabanı ORM'ı

### Özellikler
```typescript
// Declarative Schema Definition
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
});

// Type-safe Query Building
const users = await db.select().from(users).where(eq(users.email, 'user@example.com'));

// Multiple Database Support
- SQLite (geliştirme için)
- PostgreSQL (production için)  
- MySQL
```

### Avantajları
- **Type Safety**: TypeScript ile tam tip güvenliği
- **SQL-like Syntax**: SQL bilgisi olanlar için kolay öğrenme
- **Performance**: Hızlı sorgular, minimum overhead
- **Migrations**: Database schema yönetimi
- **Multi-DB**: Farklı veritabanları arasında geçiş kolaylığı

---

## 🥊 SQLite vs PostgreSQL Karşılaştırması

### SQLite
| ✅ Avantajları | ❌ Dezavantajları |
|---------------|------------------|
| ✅ Kurulum gerektirmez | ❌ Tek kullanıcı sınırlaması |
| ✅ Dosya tabanlı, taşınabilir | ❌ Sınırlı concurrency |
| ✅ Geliştirme için hızlı | ❌ Production için değil |
| ✅ Bellek içi performans | ❌ Karmaşık sorgular zayıf |
| ✅ Tüm platformlarda çalışır | ❌ Scale etme zorluğu |
| ✅ Yedeklemesi basit (dosya kopyası) | ❌ Advanced özellikler eksik |

### PostgreSQL  
| ✅ Avantajları | ❌ Dezavantajları |
|---------------|------------------|
| ✅ Production ready | ❌ Kurulum gerektirir |
| ✅ Multi-user concurrency | ❌ Daha fazla kaynak tüketir |
| ✅ Advanced SQL features | ❌ Geliştirme için overkill |
| ✅ Gerçek veri tipleri (JSON, UUID) | ❌ Yönetim gerektirir |
| ✅ Index ve optimization güçlü | ❌ Taşınabilirlik zor |
| ✅ Scale edilebilir | ❌ Learning curve daha yüksek |

---

## 🎯 Bu Proje İçin Tavsiye

### Geliştirme Aşaması (Mevcut)
```bash
✅ SQLite + Drizzle ORM
- Hızlı prototipleme
- Tek geliştirici için yeterli
- Demo ve test için ideal
- Setup gerekmez
```

### Production Aşaması (Önerilen)
```bash
✅ PostgreSQL + Drizzle ORM
- Multi-user desteği
- Gerçek concurrency
- Backup ve recovery
- Extension desteği
- Cloud hosting uyumlu
```

---

## 📈 Geçiş Stratejisi

### SQLite → PostgreSQL Geçişi
Drizzle ORM sayesinde kolay geçiş:

```typescript
// 1. Schema güncelleme
// db/schema/portfolio.ts'de:
// import { sqliteTable } → import { pgTable }
// text() → text(), real() → numeric()

// 2. Konfigürasyon değişikliği
// drizzle.config.ts'de:
// provider: 'sqlite' → provider: 'pg'
// DATABASE_URL değişikliği

// 3. Migration
npm run db:generate  # PostgreSQL için migration oluştur
npm run db:migrate   # PostgreSQL'e uygula
```

---

## 🔮 İdeal Database Tavsiyesi

### Bu Proje İçin En İyi Seçim
**Hybrid Yaklaşım:**

1. **Geliştirme**: SQLite (Hızlı, Basit)
2. **Staging**: PostgreSQL (Production'ı benze)
3. **Production**: PostgreSQL (Scale edilebilir)

### Neden Böyle?
- **Maliyet**: Geliştirme hızlı, production güçlü
- **Risk**: Early stage'de esneklik
- **Performans**: Geliştirme için hızlı, production için güçlü
- **Mevcut**: Drizzle ORM sayesinde geçiş kolaylığı

---

## 📋 Özet

### Mevcut Durum
- ✅ **SQLite**: Geliştirme için mükemmel
- ✅ **Drizzle ORM**: Modern ve type-safe
- ✅ **Schema**: Minimal ve işlevsel
- ✅ **Migration**: Hazır sistem mevcut

### Gelecek Planı
1. **Kısa Vade**: SQLite ile devam et
2. **Orta Vade**: PostgreSQL'e hazırlık yap
3. **Uzun Vade**: Production'a geçiş

### Sonuç
Mevcut seçim **doğru** ve **yönetilebilir**. Proje büyüdükçe PostgreSQL'e geçiş yapılabilir.
