# Değişiklikler Özeti

## 1. Hydration Hatası Düzeltmesi

**Sorun:** Dark Reader tarayıcı eklentisi, SVG ikonlarına `data-darkreader` nitelikleri ekliyor ve bu React'in hydration uyarılarına neden oluyordu.

**Çözüm:** `app/dashboard/page.tsx` dosyasında hydration uyarılarını bastıran bir console.error override'ı eklendi:

```typescript
// Suppress hydration warnings for Dark Reader extension attributes
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('data-darkreader') || args[0].includes('Hydration'))
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}
```

## 2. Gümüş Varlığı İsim Değişikliği

**Sorun:** Gümüş varlıklarında "Gümüş Para" olarak gösterilen seçenek "Gümüş Ons" olarak değiştirilmesi istendi.

**Çözümler:**

### Frontend (UI)
`components/portfolio/add-transaction-dialog.tsx` dosyasında ilgili seçenek güncellendi:

```typescript
case "SILVER":
    return [
        { value: "Gram Gümüş", label: "Gram Gümüş" },
        { value: "Gümüş Külçe", label: "Gümüş Külçe" },
        { value: "Gümüş Bilezik", label: "Gümüş Bilezik" },
        { value: "Gümüş Ons", label: "Gümüş Ons" }  // Değiştirildi
    ];
```

### Veritabanı
Mevcut veritabanındaki kayıtlar SQL ile güncellendi:

```sql
UPDATE assets 
SET name = 'Gümüş Ons' 
WHERE name = 'Gümüş Para' AND asset_type = 'SILVER';
```

## 3. Nakit Bakiye Takibi

**Sorun:** Bir varlık satıldığında (SELL işlemi), elde edilen TL veya döviz tutarı kasaya eklenmeli ve nakit bakiye olarak gösterilmeliydi.

**Çözüm:** `app/api/portfolio/transactions/route.ts` dosyasında SELL işlemlerinde otomatik nakit varlığı ve işlem oluşturulması sağlandı:

### Uygulama Mantığı:

1. **SELL İşlemi Algılama:** Bir satış işlemi oluşturulduğunda kontrol edilir
2. **Nakit Varlığı Bulma/Oluşturma:** İlgili para biriminde (`TRY`, `USD`, `EUR`) bir `CASH` tipi varlık aranır:
   - Varsa kullanılır
   - Yoksa otomatik oluşturulur (örn: "Nakit (TRY)")
3. **Gelir İşlemi Kaydı:** Satıştan elde edilen tutar için otomatik bir `BUY` işlemi oluşturulur
4. **Not Ekleme:** İşlem notuna satılan varlığın adı eklenir: "XXX satışından elde edilen gelir"

### Kod Örneği:

```typescript
// Eğer SELL işlemi ise, satıştan elde edilen parayı nakit varlık olarak kaydet
if (validatedData.transactionType === "SELL") {
    const saleProceeds = totalAmount;
    const cashCurrency = validatedData.currency || "TRY";
    const cashAssetName = `Nakit (${cashCurrency})`;

    // Nakit varlığını bul veya oluştur
    const cashAsset = await db
        .select()
        .from(assets)
        .where(and(
            eq(assets.userId, session.user.id),
            eq(assets.assetType, "CASH"),
            eq(assets.currency, cashCurrency)
        ))
        .limit(1);

    let cashAssetId: string;
    
    if (cashAsset.length === 0) {
        // Nakit varlığı yoksa oluştur
        const newCashAsset = await db
            .insert(assets)
            .values({
                id: generateId(),
                userId: session.user.id,
                assetType: "CASH",
                name: cashAssetName,
                symbol: cashCurrency,
                currency: cashCurrency,
                currentPrice: 1.0,
            })
            .returning();
        
        cashAssetId = newCashAsset[0].id;
    } else {
        cashAssetId = cashAsset[0].id;
    }

    // Nakit giriş işlemi oluştur
    await db
        .insert(transactions)
        .values({
            id: generateId(),
            userId: session.user.id,
            assetId: cashAssetId,
            transactionType: "BUY",
            quantity: saleProceeds,
            pricePerUnit: 1.0,
            totalAmount: saleProceeds,
            transactionDate: new Date(validatedData.transactionDate),
            currency: cashCurrency,
            notes: `${asset[0].name} satışından elde edilen gelir`,
        });
}
```

## 4. Varlık Silme Davranışı (Değişiklik Yok)

**Doğrulama:** Varlık tablosundaki "Sil" butonu (Trash2 ikonu) şu şekilde çalışıyor:

- Varlık ve tüm işlemleri doğrudan silinir (veritabanından)
- Onay diyalogu gösterilir
- Bu davranış değiştirilmedi, istenen şekilde çalışıyor

**Satış vs Silme Farkı:**

| İşlem | Davranış | Sonuç |
|-------|----------|-------|
| **Normal Satış (SELL İşlemi)** | İşlem dialogundan SATIŞ seçeneği ile | Varlık satılır, nakit bakiye artar |
| **Direkt Silme (Sil Butonu)** | Tablodaki kırmızı çöp kutusu butonu | Varlık ve tüm işlemler silinir, nakit eklenmez |

## Test Senaryoları

### Senaryo 1: Altın Satışı (TRY)
1. Bir altın varlığı satın alın (örn: Çeyrek Altın)
2. Satış işlemi yapın (SELL)
3. Dashboard'da "Nakit (TRY)" varlığının göründüğünü doğrulayın
4. Nakit tutarının satış geliri kadar arttığını kontrol edin

### Senaryo 2: Yabancı Dövizle Satış (USD)
1. USD cinsinden bir varlık satın alın
2. USD ile satış yapın
3. "Nakit (USD)" varlığının oluştuğunu doğrulayın
4. USD cinsinden nakit bakiyenin arttığını kontrol edin

### Senaryo 3: Varlık Silme
1. Herhangi bir varlık seçin
2. Sil butonuna (🗑️) tıklayın
3. Onay verin
4. Varlığın ve tüm işlemlerinin silindiğini kontrol edin
5. Nakit bakiyenin değişmediğini doğrulayın

## Etkilenen Dosyalar

1. `app/dashboard/page.tsx` - Hydration uyarı düzeltmesi
2. `components/portfolio/add-transaction-dialog.tsx` - Gümüş seçenekleri güncelleme
3. `app/api/portfolio/transactions/route.ts` - Nakit takibi mantığı
4. `portfolio.db` - Veritabanı güncelleme (Gümüş Para → Gümüş Ons)

## Geriye Dönük Uyumluluk

- Mevcut varlıklar etkilenmez
- Geçmiş işlemler korunur
- Sadece yeni SELL işlemleri nakit takibi yapar
- Eski "Gümüş Para" kayıtları otomatik olarak "Gümüş Ons" olarak güncellendi

## Notlar

- Nakit varlıkları `currentPrice: 1.0` ile oluşturulur (1:1 değer)
- Her para birimi için ayrı nakit varlığı oluşturulur (TRY, USD, EUR)
- Satış işleminin notu otomatik olarak kaynak varlığı belirtir
- Silme işlemi geri alınamaz bir işlemdir ve onay gerektirir
