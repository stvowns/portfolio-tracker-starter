# CASH → Nakit Temizliği

## Yapılan Değişiklikler

### ✅ 1. Varlık Türü Dropdown'ından (TRY) Kaldırıldı
**Önce:** `Nakit (TRY)`  
**Şimdi:** `Nakit`

**Dosya:** `components/portfolio/add-transaction-dialog.tsx`

```diff
- <SelectItem value="CASH">Nakit (TRY)</SelectItem>
+ <SelectItem value="CASH">Nakit</SelectItem>
```

---

### ✅ 2. Tüm getAssetTypeLabel Fonksiyonları Güncellendi

Backend'de `CASH` enum'u kalıyor (veritabanı için gerekli), ama kullanıcıya gösterilen her yerde "Nakit" yazıyor.

#### Güncellenen Dosyalar:

**1. components/portfolio/add-transaction-dialog.tsx**
```typescript
const labels: Record<string, string> = {
    "CASH": "Nakit",  // ✅ Eklendi
    "GOLD": "Altın",
    "SILVER": "Gümüş",
    // ...
};
```

**2. components/portfolio/assets-table.tsx**
```typescript
const labels: Record<string, string> = {
    "CASH": "Nakit",  // ✅ Eklendi
    "GOLD": "Altın",
    "SILVER": "Gümüş",
    "STOCK": "Hisse Senedi",
    "FUND": "Yatırım Fonu",
    "CRYPTO": "Kripto Para",
    "EUROBOND": "Eurobond",
    "ETF": "ETF"
};
```

**3. app/dashboard/portfolio-dashboard.tsx**
```typescript
const labels: Record<string, string> = {
    'cash': 'Nakit',
    'CASH': 'Nakit',  // ✅ Eklendi (büyük harf versiyonu)
    'gold': 'Altın',
    'GOLD': 'Altın',  // ✅ Eklendi
    'silver': 'Gümüş',
    'SILVER': 'Gümüş',  // ✅ Eklendi
    'stock': 'Hisse',
    'STOCK': 'Hisse Senedi',  // ✅ Eklendi
    'fund': 'Fon',
    'FUND': 'Yatırım Fonu',  // ✅ Eklendi
    'crypto': 'Kripto',
    'CRYPTO': 'Kripto Para',  // ✅ Eklendi
    'etf': 'ETF',
    'ETF': 'ETF',  // ✅ Eklendi
    'eurobond': 'Eurobond',
    'EUROBOND': 'Eurobond',  // ✅ Eklendi
    // ...
};
```

**4. components/portfolio/recent-transactions.tsx**
```typescript
const labels: Record<string, string> = {
    "CASH": "Nakit",  // ✅ Eklendi
    "GOLD": "Altın",
    "SILVER": "Gümüş",
    "STOCK": "Hisse Senedi",
    "FUND": "Yatırım Fonu",
    "CRYPTO": "Kripto Para",
    "EUROBOND": "Eurobond",
    "ETF": "ETF"
};
```

**5. components/portfolio/asset-detail-modal.tsx**
```typescript
const labels: Record<string, string> = {
    "CASH": "Nakit",  // ✅ Eklendi
    "GOLD": "Altın",
    "SILVER": "Gümüş",
    "STOCK": "Hisse Senedi",
    "FUND": "Yatırım Fonu",
    "CRYPTO": "Kripto Para",
    "EUROBOND": "Eurobond",
    "ETF": "ETF"
};
```

---

## Backend'de Değişmeyen Yerler

### ⚠️ CASH Enum'u Korundu
Backend kodda `CASH` enum'u kalıyor:

**lib/validations/portfolio.ts:**
```typescript
export const AssetTypeSchema = z.enum([
    "GOLD",
    "SILVER", 
    "STOCK",
    "FUND",
    "CRYPTO",
    "EUROBOND",
    "ETF",
    "CASH"  // ✅ Backend için gerekli
]);
```

**Neden:**
- Veritabanında `asset_type = 'CASH'` olarak tutuluyor
- API'ler CASH ile çalışıyor
- Değiştirilirse tüm mevcut veriler bozulur

---

## UI vs Backend Farkı

### Backend (Değişmez):
```typescript
assetType: "CASH"  // Enum value
```

### UI (Kullanıcıya Gösterilen):
```typescript
getAssetTypeLabel("CASH") → "Nakit"  // Türkçe
```

---

## Test Senaryoları

### ✅ Test 1: Dropdown Menü
1. "Yeni İşlem" butonuna tıkla
2. Varlık Türü dropdown'ını aç
3. **Kontrol:** "Nakit" yazıyor mu? (TRY yok)

**Beklenen:** ✅ Sadece "Nakit" görünmeli

---

### ✅ Test 2: Varlık Tablosu
1. Dashboard'a git
2. Nakit varlığı ekle (örn: Nakit USD)
3. Varlıklar tablosuna bak
4. **Kontrol:** Varlık türü "Nakit" mi?

**Beklenen:** ✅ Badge'de "Nakit" yazmalı, "CASH" yazmamalı

---

### ✅ Test 3: İşlem Geçmişi
1. Nakit işlemi ekle
2. İşlem geçmişine bak
3. **Kontrol:** İşlem türü "Nakit" mi?

**Beklenen:** ✅ "Nakit" yazmalı

---

### ✅ Test 4: Varlık Detayı
1. Nakit varlığına tıkla
2. Detay modal'ı aç
3. **Kontrol:** Varlık türü "Nakit" mi?

**Beklenen:** ✅ Modal header'da "Nakit" yazmalı

---

### ✅ Test 5: Varlık Dağılımı Badge'leri
1. Dashboard üstündeki badge'lere bak
2. **Kontrol:** "💵 Nakit: XX.XX%" mi?

**Beklenen:** ✅ "Nakit" yazmalı, "cash" veya "CASH" yazmamalı

---

## Değişiklik Özeti

| Yer | Önce | Sonra |
|-----|------|-------|
| **Dropdown** | Nakit (TRY) | ✅ Nakit |
| **Varlık Tablosu** | CASH veya - | ✅ Nakit |
| **İşlem Geçmişi** | CASH veya - | ✅ Nakit |
| **Varlık Detayı** | CASH veya - | ✅ Nakit |
| **Badge'ler** | cash | ✅ Nakit |
| **Backend Enum** | CASH | ✅ CASH (korundu) |

---

## Teknik Detaylar

### Label Mapping Pattern
Her component'te aynı pattern kullanılıyor:

```typescript
const getAssetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
        "CASH": "Nakit",
        "GOLD": "Altın",
        "SILVER": "Gümüş",
        // ... diğer türler
    };
    return labels[type] || type;
};
```

### Fallback
Eğer label bulunamazsa:
```typescript
return labels[type] || type;
```
Örnek: Tanımsız bir type → olduğu gibi gösterilir

---

## Uygulama Genelinde Tutarlılık

### ✅ Türkçe Terimler:
- Nakit (Cash)
- Altın (Gold)
- Gümüş (Silver)
- Hisse Senedi (Stock)
- Yatırım Fonu (Fund)
- Kripto Para (Crypto)
- Eurobond (Eurobond)
- ETF (ETF)

### ✅ Backend Enum'lar (İngilizce):
- CASH
- GOLD
- SILVER
- STOCK
- FUND
- CRYPTO
- EUROBOND
- ETF

**Bu ayrım önemli çünkü:**
- Backend değişmez (veritabanı tutarlılığı)
- UI esnektir (çeviri yapılabilir)
- Yeni dil desteği eklenebilir

---

## Gelecek İyileştirmeler

### 1. i18n (Internationalization)
```typescript
// Gelecekte:
const labels = useTranslation("assetTypes");
labels["CASH"] → "Nakit" (TR) | "Cash" (EN) | "نقد" (AR)
```

### 2. Merkezi Label Yönetimi
```typescript
// lib/labels/asset-types.ts
export const ASSET_TYPE_LABELS = {
    tr: {
        "CASH": "Nakit",
        "GOLD": "Altın",
        // ...
    },
    en: {
        "CASH": "Cash",
        "GOLD": "Gold",
        // ...
    }
};
```

### 3. Type Safety
```typescript
type AssetType = "CASH" | "GOLD" | "SILVER" | ...;
const labels: Record<AssetType, string> = { ... };
```

---

## Dosya Değişiklikleri Özeti

**Güncellenen Dosyalar:**
1. ✅ `components/portfolio/add-transaction-dialog.tsx`
2. ✅ `components/portfolio/assets-table.tsx`
3. ✅ `app/dashboard/portfolio-dashboard.tsx`
4. ✅ `components/portfolio/recent-transactions.tsx`
5. ✅ `components/portfolio/asset-detail-modal.tsx`

**Değişmeyen Dosyalar:**
- ❌ `lib/validations/portfolio.ts` (Backend enum korundu)
- ❌ `db/schema/portfolio.ts` (Database schema korundu)
- ❌ `app/api/**/*.ts` (API'ler CASH kullanıyor)

---

## Build Durumu

✅ **Build Başarılı**
- TypeScript errors: Sadece mevcut `any` type hatalar (bizim değişiklikle ilgili değil)
- Runtime errors: Yok
- Linting: Pass

---

**Artık uygulama tamamen Türkçe! 🇹🇷**

"CASH" yerine her yerde "Nakit" görünüyor, ama backend tutarlılığı korunuyor.
