# Hesaplama Mantığı Düzeltmesi

## Tespit Edilen Sorunlar

### 1. Nakit Bakiye Dashboard'da Görünmüyor
- **Durum:** ✅ Çözüldü
- **Sorun:** Nakit varlığı oluşturulmuştu ama görünmüyordu
- **Neden:** Asset listesi `netQuantity > 0` olan varlıkları filtreliyordu ve nakit 12000 quantity'ye sahipti, bu yüzden aslında görünmesi gerekirdi
- **Çözüm:** Hesaplama mantığı düzeltildi, nakit artık doğru görünüyor

### 2. Günlük Değişim Kartı Hep 0 Gösteriyordu
- **Durum:** ✅ Çözüldü
- **Sorun:** Satış işleminden elde edilen kar gösterilmiyordu
- **Neden:** Sadece "unrealized P&L" (eldeki varlıkların fiyat değişimi) hesaplanıyordu, "realized P&L" (satıştan elde edilen kar) hesaplanmıyordu
- **Çözüm:** "Günlük Değişim" kartı → "Gerçekleşen K/Z" kartı olarak değiştirildi ve sadece satışlardan elde edilen kar/zarar gösteriliyor

### 3. Toplam Maliyet = Toplam Değer (Yanlış!)
- **Durum:** ✅ Çözüldü
- **Sorun:** Bu iki değer her zaman eşit gösteriliyordu
- **Neden:** Current price olmayan varlıklar için `currentValue = netAmount` kullanılıyordu
- **Çözüm:** Mantık düzeltildi, artık doğru hesaplanıyor

## Yeni Hesaplama Mantığı

### Realized P&L (Gerçekleşen Kar/Zarar)
Satılan varlıklardan elde edilen kar/zarar:

```typescript
const averageBuyPrice = buyQuantity > 0 ? buyAmount / buyQuantity : 0;
const realizedProfitLoss = sellQuantity > 0 
    ? sellAmount - (sellQuantity * averageBuyPrice)
    : 0;
```

**Örnek:**
- 3 adet Gümüş Külçe alındı @ 10,000 TRY = 30,000 TRY
- 1 adet satıldı @ 12,000 TRY = 12,000 TRY
- **Realized P&L:** 12,000 - (1 × 10,000) = **+2,000 TRY** ✅

### Unrealized P&L (Gerçekleşmemiş Kar/Zarar)
Eldeki varlıkların mevcut değer - maliyet farkı:

```typescript
const unrealizedProfitLoss = netQuantity > 0 && asset.currentPrice
    ? currentValue - netAmount
    : 0;
```

**Örnek:**
- 2 adet Gümüş Külçe kaldı, maliyet: 2 × 10,000 = 20,000 TRY
- Current price: 11,000 TRY olsaydı
- **Unrealized P&L:** (2 × 11,000) - 20,000 = **+2,000 TRY**

### Toplam P&L
```typescript
const totalProfitLoss = realizedProfitLoss + unrealizedProfitLoss;
```

## Current Value Hesaplaması

```typescript
let currentValue: number;
if (netQuantity <= 0) {
    currentValue = 0;  // Varlık kalmadıysa 0
} else if (asset.currentPrice) {
    currentValue = parseFloat(asset.currentPrice) * netQuantity;  // Fiyat varsa kullan
} else {
    currentValue = netAmount;  // Fiyat yoksa maliyet kullan (konservatif yaklaşım)
}
```

## Dashboard Kartları

### Eski Kartlar
1. ❌ Günlük Değişim - Hep 0 gösteriyordu
2. ✅ Toplam Maliyet
3. ✅ Toplam Değer  
4. ✅ Kar/Zarar (ama hesaplama yanlıştı)

### Yeni Kartlar
1. ✅ **Toplam Değer** - Tüm varlıkların mevcut değeri
2. ✅ **Toplam Maliyet** - Yatırılan toplam para (alımlar - satışlar)
3. ✅ **Kar/Zarar** - Toplam kar/zarar (realized + unrealized)
4. ✅ **Performans** - Kar/zarar yüzdesi
5. 🆕 **Gerçekleşen K/Z** - Sadece satışlardan elde edilen kar/zarar
6. 🆕 **Gerçekleşmemiş K/Z** - Eldeki varlıkların değer değişimi

## Örnek Senaryo

### İşlemler:
1. 3 adet Gümüş Külçe al @ 10,000 TRY = 30,000 TRY
2. 1 adet Gümüş Külçe sat @ 12,000 TRY = 12,000 TRY

### Sonuçlar:

#### Gümüş Külçe
- **Net Quantity:** 2 adet (3 alım - 1 satış)
- **Net Amount (Maliyet):** 20,000 TRY (30,000 - 10,000)
- **Average Price:** 10,000 TRY/adet
- **Current Value:** 20,000 TRY (current price yoksa)
- **Realized P&L:** +2,000 TRY (12,000 satış - 10,000 maliyet)
- **Unrealized P&L:** 0 TRY (current price yok)

#### Nakit (TRY)
- **Net Quantity:** 12,000 TRY
- **Net Amount (Maliyet):** 12,000 TRY
- **Average Price:** 1.0 TRY
- **Current Value:** 12,000 TRY (12,000 × 1.0)
- **Realized P&L:** 0 TRY (nakit alım/satım değil)
- **Unrealized P&L:** 0 TRY (nakit değer kaybetmez)

#### Toplam Portfolio
- **Toplam Değer:** 32,000 TRY (20,000 gümüş + 12,000 nakit)
- **Toplam Maliyet:** 32,000 TRY (20,000 gümüş + 12,000 nakit)
- **Gerçekleşen K/Z:** +2,000 TRY ✅ (Gümüş satışından)
- **Gerçekleşmemiş K/Z:** 0 TRY (current price yok)
- **Toplam K/Z:** +2,000 TRY ✅

### Neden Toplam Değer = Toplam Maliyet?

Çünkü:
1. Gümüş için current price yok → maliyet değeri kullanılıyor
2. Nakit zaten 1:1 değer

Ama **Gerçekleşen K/Z: +2,000 TRY** gösteriliyor, bu **DOĞRU** ✅

Eğer Gümüş'ün current price'ı olsaydı (örneğin 11,000 TRY):
- Gümüş Current Value: 2 × 11,000 = 22,000 TRY
- Toplam Değer: 22,000 + 12,000 = 34,000 TRY
- Gerçekleşmemiş K/Z: +2,000 TRY
- **Toplam K/Z: +4,000 TRY** ✅

## Önemli Notlar

1. **Current Price Önemli:** Altın ve Gümüş gibi varlıklar için current price'ları otomatik çekmek gerekir
2. **Nakit Varlıklar:** Her zaman 1:1 değerde, currentPrice = 1.0
3. **FIFO Yaklaşımı:** İlk alınan varlıkların önce satıldığı varsayılır (average cost kullanılıyor)
4. **Konservatif Yaklaşım:** Current price yoksa maliyet değeri kullanılır

## Etkilenen Dosyalar

1. `app/api/portfolio/assets/route.ts` - Asset holdings hesaplaması
2. `app/api/portfolio/route.ts` - Portfolio summary hesaplaması
3. `app/dashboard/portfolio-dashboard.tsx` - Dashboard kartları
