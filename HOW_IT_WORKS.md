# 🎓 Borsa MCP Entegrasyonu - Nasıl Çalışıyor?

## 🤔 Ana Soru: npm run dev Yazınca Ne Oluyor?

### Basit Cevap

**npm run dev** yazınca sadece Next.js server başlar. **Borsa MCP henüz çalışmıyor!**

Borsa MCP sadece siz "Fiyatları Güncelle" butonuna bastığınızda devreye girer.

---

## 🏗️ Mimari - Soru/Cevap Formatında

### S1: Borsa MCP sürekli çalışıyor mu?

**CEVAP: HAYIR!** ❌

Borsa MCP **on-demand** (ihtiyaç anında) çalışır:

```
✅ npm run dev → Next.js server başlar
❌ Borsa MCP çalışmıyor (henüz subprocess yok)

✅ User: "Fiyatları Güncelle" butonuna basar
✅ API çağrısı yapılır
✅ Python subprocess başlatılır
✅ Borsa MCP çalışır
✅ Veri çekilir
✅ Subprocess kapanır
```

### S2: Neden Python subprocess kullanıyoruz?

**CEVAP:** Node.js Python kodunu direkt çalıştıramaz!

```javascript
// ❌ ÇALİŞMAZ - Python modülü Node.js'e import edilemez
import borsaMCP from 'borsa-mcp'  

// ✅ ÇALIŞIR - Subprocess ile Python çalıştır
const process = spawn('uvx', ['borsa-mcp', ...args])
```

**Benzetme:** 
- Node.js = Türkçe konuşan
- Python = İngilizce konuşan
- Subprocess = Tercüman (aralarında iletişim sağlar)

### S3: Her fiyat güncellemesinde yeni subprocess mu açılıyor?

**CEVAP: EVET!** ✅

Her API çağrısında:
1. Yeni Python process başlatılır
2. Borsa MCP çalışır
3. Veri çekilir
4. Process kapanır

**Performans:** İlk çalıştırma yavaş (~60s), sonraki hızlı (~2-5s) çünkü cache var.

### S4: Fiyatlar nereye kaydediliyor?

**CEVAP:** SQLite database'de `price_cache` tablosuna

```sql
price_cache
├── asset_id
├── current_price      → 2847.50
├── change_percent     → +0.98%
├── last_updated       → 2025-10-13 22:15:00
└── ...
```

---

## 🔄 Veri Akışı - Gerçek Örnek

### Örnek: Gram Altın Fiyatı Çekme

```
1️⃣ USER ACTION
   Browser'da "Fiyatları Güncelle" butonuna tıkla
   
2️⃣ HTTP REQUEST
   POST http://localhost:3001/api/prices/sync
   Body: { "force": true }
   
3️⃣ NEXT.JS API ROUTE
   app/api/prices/sync/route.ts dosyası çalışır
   ↓
   await syncAssetPrices({ force: true })
   
4️⃣ PRICE SYNC SERVICE  
   lib/services/price-sync-service.ts çalışır
   ↓
   Database: SELECT * FROM assets WHERE assetType = 'GOLD'
   Sonuç: Gram Altın bulundu (id: mgpea7gxxbo0jlvxk5)
   ↓
   Piyasa kontrolü: isMarketOpen('GOLD') → true
   ↓
   await fetchAssetPrice(gramAltinAsset)
   
5️⃣ BORSA MCP CLIENT
   lib/services/borsa-mcp-client.ts çalışır
   ↓
   await getCurrencyPrice('gram-altin')
   ↓
   spawn('uvx', [
     '--from', 'git+.../borsa-mcp',
     'borsa-mcp',
     'get_dovizcom_guncel',
     'gram-altin'
   ])
   
6️⃣ PYTHON SUBPROCESS
   Terminal'de yeni Python process:
   ↓
   $ uvx borsa-mcp get_dovizcom_guncel gram-altin
   ↓
   FastMCP server başlar
   ↓
   Dovizcom API'sine istek atar:
   GET https://api.doviz.com/api/v12/gram-altin
   ↓
   Response alır:
   {
     "name": "Gram Altın",
     "buying": 2840.50,
     "selling": 2847.50,
     "change_rate": 0.98
   }
   
7️⃣ PYTHON → NODE.JS
   Python stdout'a JSON yazar:
   ↓
   stdout: '{"price": 2847.50, "change": 0.98, ...}'
   ↓
   Node.js stdout'u okur ve parse eder
   ↓
   return { success: true, data: {...} }
   
8️⃣ DATABASE UPDATE
   price_cache tablosuna INSERT:
   ↓
   INSERT INTO price_cache (
     asset_id: 'mgpea7gxxbo0jlvxk5',
     current_price: 2847.50,
     change_percent: 0.98,
     last_updated: 1697225700000,
     market: 'Dovizcom',
     sync_status: 'active'
   )
   
9️⃣ RESPONSE → BROWSER
   NextResponse.json({
     success: true,
     data: {
       successful: 1,
       failed: 0,
       duration_ms: 2345
     }
   })
   
🔟 UI UPDATE
   React component:
   ↓
   setPrices([{ 
     name: "Gram Altın",
     currentPrice: 2847.50,
     changePercent: 0.98
   }])
   ↓
   React re-render → Güncel fiyat ekranda!
```

---

## 💡 Kritik Kavramlar

### 1. **On-Demand Execution**

Borsa MCP sürekli çalışmaz, sadece istendiğinde:

```
npm run dev
  → Next.js: ✅ Çalışıyor
  → Borsa MCP: ❌ Çalışmıyor

User: Buton tıklar
  → Next.js: ✅ Çalışıyor
  → Borsa MCP: ✅ ŞİMDİ çalışıyor (subprocess)

İşlem biter
  → Next.js: ✅ Çalışıyor
  → Borsa MCP: ❌ Kapandı (subprocess exit)
```

### 2. **Process Lifecycle**

```
spawn()           → Yeni process başlar
  ↓
exec()            → Komut çalışır (2-5 saniye)
  ↓
stdout.write()    → JSON yazar
  ↓
exit(0)           → Process kapanır
  ↓
on('close')       → Node.js bildirim alır
```

### 3. **Cache Strategy**

```
İlk sync → Borsa MCP çalışır → Database'e yaz
  ↓
İkinci istek → Cache'den oku (hızlı)
  ↓
Cache eski mi? (TTL expired?)
  ├─ EVET → Borsa MCP çalışır (refresh)
  └─ HAYIR → Cache'den dön (hızlı)
```

### 4. **Piyasa Saatleri**

```typescript
isMarketOpen('STOCK')
  ↓
İstanbul saati kontrol et
  ↓
Saat 09:30 - 18:00 arası mı?
  ├─ EVET → Fiyat çek
  └─ HAYIR → Skip (cache kullan)
```

---

## 🎨 UI'da Fiyatlar Nasıl Gösteriliyor?

### Demo Component (Yeni!)

```tsx
// components/demo-price-fetcher.tsx
<Button onClick={fetchPrices}>
  Fiyatları Güncelle
</Button>

{prices.map(price => (
  <PriceCard
    name={price.name}
    price={price.currentPrice}
    change={price.changePercent}
  />
))}
```

### Çalışma Prensibi

```
1. User butona tıklar
   ↓
2. fetchPrices() fonksiyonu çalışır
   ↓
3. POST /api/prices/sync
   ↓
4. Borsa MCP devreye girer
   ↓
5. Fiyatlar database'e yazılır
   ↓
6. Response döner
   ↓
7. setPrices(data) → State güncellenir
   ↓
8. React re-render → Ekranda fiyatlar görünür
```

---

## 🧪 Canlı Test

### Adım 1: Server Başlat

```bash
cd /home/cosmogen/Desktop/portfolio-tracker-starter
npm run dev
```

**Çıktı:**
```
✓ Ready in 791ms
- Local: http://localhost:3001
```

**Bu noktada:**
- ✅ Next.js çalışıyor
- ✅ API endpoints hazır
- ❌ Borsa MCP çalışmıyor (henüz subprocess başlatılmadı)

### Adım 2: Browser Aç

```
http://localhost:3001/dashboard
```

**Göreceksiniz:**
- Dashboard kartları
- "💰 Canlı Fiyat Demo" kartı
- "Fiyatları Güncelle" butonu

### Adım 3: Butona Tıkla

**Arka planda olan:**

```bash
# Terminal'de görebilirsiniz (verbose mode açıksa)
[Borsa MCP] Executing: get_dovizcom_guncel gram-altin
[Borsa MCP] Success in 2345ms
```

**Browser'da göreceksiniz:**
```
✅ Sync tamamlandı: 15 başarılı, 0 başarısız

┌─────────────────────────────────────┐
│ Gram Altın         Dovizcom         │
│ ₺2,847.50                           │
│ 📈 +₺27.50 (+0.98%)                │
│ Son güncelleme: 22:15:43           │
└─────────────────────────────────────┘
```

---

## 🎯 Özet - En Basit Haliyle

### npm run dev yazınca:
1. ✅ Next.js server başlar
2. ✅ API endpoints yüklenir
3. ❌ Borsa MCP YET çalışmıyor

### Butona basınca:
1. ✅ HTTP POST isteği gider
2. ✅ Python subprocess başlatılır
3. ✅ Borsa MCP çalışır (~2-5 saniye)
4. ✅ Veri çekilir ve database'e yazılır
5. ✅ Response döner
6. ✅ UI güncellenir
7. ✅ Subprocess kapanır

### Fiyatlar UI'da nasıl görünüyor:
- React state ile (`useState`)
- Component re-render ile
- Real-time değil, buton tıklanınca güncellenir

---

## 📚 İlgili Dosyalar

### Backend
- `lib/services/borsa-mcp-client.ts` - Python subprocess wrapper
- `lib/services/price-sync-service.ts` - Sync logic
- `app/api/prices/sync/route.ts` - API endpoint

### Frontend
- `components/demo-price-fetcher.tsx` - **YENİ! Demo UI**
- `app/dashboard/page.tsx` - Updated (demo eklendi)

### Documentation
- `documentation/ARCHITECTURE_EXPLAINED.md` - **YENİ! Mimari açıklama**
- `documentation/PRICE_API_INTEGRATION.md` - Teknik detaylar
- `documentation/SETUP_PRICE_API.md` - Kurulum
- `HOW_IT_WORKS.md` - **BU DOSYA!**

---

## 🎉 Sonuç

**Artık sistemi tamamen anlıyorsunuz!**

Server çalışıyor → http://localhost:3001/dashboard adresine gidin → "Fiyatları Güncelle" butonuna tıklayın → Canlı fiyatları görün!

---

**Oluşturuldu**: 2025-10-13  
**Platform**: Linux Mint  
**Durum**: ✅ Production Ready
