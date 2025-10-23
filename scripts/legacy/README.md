# 📜 Legacy Scripts - Reference Documentation

## ⚠️ IMPORTANT
Bu script'ler **DEPRECATED** durumdadır. Yeni proje **batch upsert** yaklaşımını kullanmaktadır.

## 📚 Eski Script'lerden Yararlanma Rehberi

### 1. 🏦 BIST Sync (`sync-bist-tickers.ts`)

**✅ Kullanılabilir Parçalar:**
```typescript
// BIST Service entegrasyonu
const companies = await bistService.fetchCompanies();

// Loglama mantığı
console.log('📥 Fetching BIST companies from BIST Service...');
console.log(`✅ Found ${companies.length} companies`);

// Validation logic
if (!company.ticker_kodu || company.ticker_kodu.trim() === '') {
    console.log(`⚠️ Skipping company without ticker: ${company.sektor}`);
    continue;
}
```

**❌ DEPRECATED (Kullanma):**
```typescript
// DANGEROUS - Tüm veriyi siler
await db.delete(tickerCache).where(eq(tickerCache.assetType, 'STOCK'));

// DANGEROUS - Insert only, no upsert
await db.insert(tickerCache).values({...});
```

**🔄 Yeni Approach İçin Referans:**
- Batch processing logic
- Error handling pattern
- Progress reporting

### 2. 💰 TEFAS Sync (`sync-tefas-data.ts`)

**✅ Kullanılabilir Parçalar:**
```typescript
// TEFAS Service entegrasyonu
const { tefasService } = await import('../lib/services/tefas-service');

// Fund fetching pattern
const funds = await tefasService.fetchAllFunds();

// Data validation
if (!fund.tefasKodu || !fund.fonAdi) {
    console.log(`⚠️ Skipping invalid fund: ${fund.fonUnvan}`);
    continue;
}
```

**❌ DEPRECATED (Kullanma):**
```typescript
// DANGEROUS - Cache temizleme
await db.delete(tickerCache).where(eq(tickerCache.assetType, 'FUND'));
```

**🔄 Yeni Approach İçin Referans:**
- TEFAS API usage patterns
- Fund data structure
- Error handling

### 3. 📊 Fiyat Çekme (`fetch_price.py`)

**✅ Kullanılabilir Parçalar:**
```python
# Fiyat çekme logic
response = requests.get(url, params=params, headers=headers, timeout=30)
data = response.json()

# Error handling
if response.status_code != 200:
    print(f"Error fetching price: {response.status_code}")
    return None
```

**🔄 Yeni Approach İçin Referans:**
- API entegrasyon pattern
- Timeout handling
- Response parsing

## 🎯 Yeni Implementasyon İçin Notlar

### Batch Processing Pattern (Eski kodlardan uyarla):
```typescript
// Eski: Loop içinde insert
for (const company of companies) {
    await db.insert(tickerCache).values({...});
}

// Yeni: Batch upsert
const batch = companies.slice(0, 500);
await db.insert(marketInstruments).values(batch)
  .onConflictDoUpdate({
    target: [marketInstruments.type, marketInstruments.symbol],
    set: { /* update fields */ }
  });
```

### Error Handling Pattern (Koru):
```typescript
// Eski kodlardaki hata yönetimi
try {
    const companies = await bistService.fetchCompanies();
    console.log(`✅ Found ${companies.length} companies`);
} catch (error) {
    console.error('❌ BIST fetch error:', error);
    throw error;
}
```

### Progress Reporting (Koru):
```typescript
// Eski progress reporting
let successful = 0;
let failed = 0;

for (const company of companies) {
    try {
        await processCompany(company);
        successful++;
    } catch (error) {
        failed++;
        console.error(`Failed to process ${company.sektor}:`, error);
    }
}

console.log(`✅ Sync completed: ${successful} successful, ${failed} failed`);
```

## 🚀 Yeni Script'ler İçin İpuçları

### 1. Transaction Kullan
```typescript
await db.transaction(async (tx) => {
    // Batch işlemleri
    await tx.insert(marketInstruments).values(batch)
      .onConflictDoUpdate({...});

    // Fiyat geçmişi
    await tx.insert(priceHistory).values(historyBatch);
});
```

### 2. Memory Optimization
```typescript
// Büyük veri setleri için stream processing
async function* processInBatches(items: any[], batchSize = 500) {
    for (let i = 0; i < items.length; i += batchSize) {
        yield items.slice(i, i + batchSize);
    }
}
```

### 3. Performance Logging
```typescript
const startTime = Date.now();
// ... işlem
const duration = Date.now() - startTime;
console.log(`Batch processed in ${duration}ms`);
```

---

## ⚡ Quick Reference

| Özellik | Eski Script | Yeni Approach |
|---------|-------------|----------------|
| **Veri Ekleme** | `INSERT` | `UPSERT (ON CONFLICT UPDATE)` |
| **Hata Yönetimi** | ✅ İyi | ✅ İyi + Retry |
| **Progress** | ✅ Console log | ✅ Console + Performance log |
| **Memory** | ❌ Tüm veri | ✅ Batch processing |
| **Transaction** | ❌ Yok | ✅ Atomic |
| **Performance** | ❌ Yavaş | ✅ 5x hızlı |

---

*Bu doküman yeni geliştirme sırasında referans olarak kullanılacaktır.*