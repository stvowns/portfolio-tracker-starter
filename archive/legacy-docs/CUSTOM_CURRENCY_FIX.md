# Özel Para Birimi Düzeltmeleri

## Sorunlar ve Çözümleri

### ✅ 1. Input Kapanma Sorunu
**Sorun:** Özel para birimi seçilince açılan kutucuğa bir karakter yazınca hemen kapanıyordu.

**Neden:** Select dropdown içindeki input, dropdown dışına tıklama olarak algılanıyordu.

**Çözüm:** 
- Input'u Select'in dışına taşıdık
- `showCustomInput` state'i ile kontrol ettik
- Input açıkken Select'i "custom" değerinde tutuyoruz
- "← Listeye Dön" butonu ekledik

**Kod:**
```typescript
const [showCustomInput, setShowCustomInput] = useState(false);

<Select 
    value={showCustomInput ? "custom" : assetName}
    onValueChange={(value) => {
        if (value === "custom") {
            setShowCustomInput(true);
            setCustomCurrency("");
            setValue("assetName", "");
        } else {
            setShowCustomInput(false);
            setValue("assetName", value);
        }
    }}
>
```

---

### ✅ 2. "Varlık Adı Gereklidir" Hatası
**Sorun:** Özel para birimi seçince "Varlık adı gereklidir" uyarısı veriyor, kayıt yapmıyordu.

**Neden:** `setValue("assetName", "")` ile boş string set ediliyordu ve form validation hemen çalışıyordu.

**Çözüm:**
- `showCustomInput` state'i ile input açılıp kapanmayı kontrol ettik
- Kullanıcı en az 1 karakter yazana kadar `assetName` set edilmiyor
- `if (value.length > 0)` kontrolü ekledik

**Kod:**
```typescript
onChange={(e) => {
    const value = e.target.value.toUpperCase();
    setCustomCurrency(value);
    if (value.length > 0) {  // En az 1 karakter yazılmalı
        setValue("assetName", `Nakit ${value}`);
    }
}}
```

---

### ✅ 3. Nakit için Birim Fiyat Default 1
**Sorun:** Nakit eklerken birim fiyat boş geliyordu, kullanıcı 1 yazmak zorundaydı.

**Çözüm:** `assetType` değiştiğinde CASH ise otomatik 1 yazılıyor.

**Kod:**
```typescript
useEffect(() => {
    if (assetType === "CASH") {
        setValue("pricePerUnit", 1);
    }
}, [assetType, setValue]);
```

---

## Yeni Kullanıcı Deneyimi

### Özel Para Birimi Ekleme Adımları:

1. **Nakit Seç**
   ```
   Varlık Türü: Nakit (TRY)
   ```

2. **Özel Para Birimi Seç**
   ```
   Varlık Adı: ✏️ Özel Para Birimi
   ```

3. **Input Açılır**
   ```
   [Özel para birimi kodu (örn: SAR, AED)]
   [← Listeye Dön]
   ```

4. **Para Birimi Kodunu Yaz**
   ```
   SAR → "Nakit SAR" olarak kaydedilir
   AED → "Nakit AED" olarak kaydedilir
   ```

5. **Birim Fiyat Otomatik 1**
   ```
   Birim Fiyat: 1 (otomatik)
   💡 Nakit için birim fiyat: 1 yazın (1:1 değer)
   ```

6. **Miktar ve Diğer Bilgileri Gir**
   ```
   Miktar: 5000
   Satın Alma Para Birimi: ₺ Türk Lirası
   ```

7. **Kaydet**

---

## Yeni Özellikler

### 1. "Listeye Dön" Butonu
Özel para birimi input'u açıkken:
```
[← Listeye Dön]
```
Tıklandığında:
- Input kapanır
- Select listesine geri döner
- Girilen değer temizlenir

### 2. Auto Focus
Input açıldığında otomatik focus alır:
```typescript
<Input autoFocus />
```

### 3. Otomatik Büyük Harf
Para birimi kodları otomatik büyük harfe çevrilir:
```
sar → SAR
aed → AED
```

---

## Test Senaryoları

### ✅ Test 1: Normal Para Birimi
1. Varlık Türü: Nakit (TRY)
2. Varlık Adı: 💵 Amerikan Doları
3. Birim fiyat otomatik 1 mi?
4. Miktar: 1000
5. Kaydet
6. **Sonuç:** "Nakit USD" olarak kaydedilir

---

### ✅ Test 2: Özel Para Birimi (SAR)
1. Varlık Türü: Nakit (TRY)
2. Varlık Adı: ✏️ Özel Para Birimi
3. Input açıldı mı?
4. "SAR" yaz (küçük harf de olabilir)
5. Birden fazla karakter yazabildin mi?
6. Birim fiyat 1 mi?
7. Miktar: 5000
8. Kaydet
9. **Sonuç:** "Nakit SAR" olarak kaydedilir

---

### ✅ Test 3: Listeye Dön
1. Varlık Türü: Nakit (TRY)
2. Varlık Adı: ✏️ Özel Para Birimi
3. Input açıldı
4. "AE" yaz (tam yazmadan)
5. "← Listeye Dön" butonuna tıkla
6. **Sonuç:** Liste görünür, yazılanlar temizlenir
7. Yeniden normal para birimi seçebilirsin

---

### ✅ Test 4: Birim Fiyat Default
1. Varlık Türü: Nakit (TRY)
2. **Dikkat:** Birim fiyat otomatik 1 olmalı
3. Varlık Adı: 💵 Euro
4. Miktar: 500
5. Birim fiyat değiştirmeden kaydet
6. **Sonuç:** 500 EUR × 1 = 500 olarak kaydedilir

---

### ✅ Test 5: Birim Fiyat Değiştirme
1. Varlık Türü: Nakit (TRY)
2. Varlık Adı: 💵 Amerikan Doları
3. Miktar: 100
4. Birim fiyat: 35.12 (kur) - Manuel değiştir
5. Satın Alma Para Birimi: ₺ Türk Lirası
6. **Sonuç:** 100 USD × 35.12 = 3,512 TRY maliyet

---

## Teknik Detaylar

### State Yönetimi
```typescript
const [customCurrency, setCustomCurrency] = useState("");
const [showCustomInput, setShowCustomInput] = useState(false);
```

### Form Değerleri
```typescript
// Otomatik set ediliyor
setValue("assetName", `Nakit ${value}`);  // "Nakit SAR"
setValue("pricePerUnit", 1);              // Nakit için default
```

### Validation
- `assetName` en az 1 karakter yazıldığında set edilir
- Form validation sadece değer varken çalışır
- Hata mesajı gösterilmez

---

## Dosya Değişiklikleri

**Değiştirilen:** `components/portfolio/add-transaction-dialog.tsx`

**Değişiklikler:**
1. ✅ `showCustomInput` state eklendi
2. ✅ Select value kontrolü eklendi
3. ✅ Input Select'in dışına taşındı
4. ✅ "Listeye Dön" butonu eklendi
5. ✅ `autoFocus` eklendi
6. ✅ CASH için otomatik `pricePerUnit: 1` eklendi
7. ✅ `value.length > 0` kontrolü eklendi

---

## Karşılaştırma

### Önce:
```
❌ Input açılır → 1 karakter → kapanır
❌ "Varlık adı gereklidir" hatası
❌ Birim fiyat boş geliyor
```

### Şimdi:
```
✅ Input açılır → istediğin kadar yaz → açık kalır
✅ "← Listeye Dön" butonu var
✅ En az 1 karakter yazınca "Nakit XXX" kaydedilir
✅ Birim fiyat otomatik 1 geliyor
✅ İstersen değiştirebilirsin
```

---

## Kullanım Örnekleri

### Örnek 1: Suudi Riyali
```
Varlık Türü: Nakit (TRY)
Varlık Adı: ✏️ Özel Para Birimi → "SAR"
Miktar: 10,000
Birim Fiyat: 1 (otomatik)
Satın Alma Para Birimi: SAR için TRY seç
→ Sonuç: "Nakit SAR" 10,000
```

### Örnek 2: BAE Dirhemi
```
Varlık Türü: Nakit (TRY)
Varlık Adı: ✏️ Özel Para Birimi → "AED"
Miktar: 50,000
Birim Fiyat: 9.56 (TL kuru, manuel)
Satın Alma Para Birimi: ₺ Türk Lirası
→ Sonuç: "Nakit AED" 50,000 (maliyet: 478,000 TRY)
```

### Örnek 3: İsviçre Frangı (Listeden)
```
Varlık Türü: Nakit (TRY)
Varlık Adı: 💵 İsviçre Frangı (listeden seç)
Miktar: 5,000
Birim Fiyat: 1 (otomatik)
→ Sonuç: "Nakit CHF" 5,000
```

---

**Artık tüm para birimleri sorunsuz eklenebilir! ✅**
