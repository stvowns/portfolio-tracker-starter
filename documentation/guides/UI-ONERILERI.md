# Portföy Takip Uygulaması – UI Önerileri

Bu doküman, mevcut arayüzün güçlü yanlarını koruyarak modern, dinlendirici ve erişilebilir bir kullanıcı deneyimi için önerileri içerir.

## 1) Kısa Değerlendirme (Mevcut Durum Yeterli mi?)
- Güçlü: shadcn/ui, Tailwind v4, dark mode, tema değişkenleri, duyarlı grid, skeleton/empty state, modallar, toast’lar, kart ve grafik yapısı, performans sayfası.
- İyileştirme Alanları: bilgi mimarisi netliği (hızlı filtreleme/aramalar), tablo ergonomisi (yoğunluk/kolon yönetimi), grafik renk uyumu ve okunabilirlik, tutarlı durum mesajları (boş/hata/yükleme), risk ve hedef odaklı özetler, mobilde sabit eylem çubuğu.

Özet: Temel çok iyi. Aşağıdaki iyileştirmelerle “ürün seviyesinde” deneyime yaklaşır.

---

## 2) Tasarım İlkeleri
- Sakin/dinlendirici renkler, yüksek okunabilirlik, minimum görsel gürültü.
- Bilgi yoğun ekranlarda aşamalı ifşa: önce özet, sonra detay.
- Tutarlı boşluk, tipografi ve ikon boyutları.
- Durumsal geri bildirim (işlem başarılı/hatalı, senkronizasyon ilerliyor vb.).

---

## 3) Renk Paleti (Dinlendirici)
Sakin mavi/yeşil tonları + nötr gri arka plan. Aşağıda OKLCH temelli örnek öneri (mevcut yapıya uyumlu):

```css
:root {
  /* Yüzeyler ve metin */
  --background: oklch(0.985 0.004 240);
  --foreground: oklch(0.20 0.04 250);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.20 0.04 250);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.20 0.04 250);

  /* Ana renk (sakin teal) */
  --primary: oklch(0.70 0.10 190);
  --primary-foreground: oklch(0.99 0.003 230);

  /* İkincil ve vurgu */
  --secondary: oklch(0.96 0.01 230);
  --secondary-foreground: oklch(0.25 0.04 250);
  --accent: oklch(0.96 0.01 210);
  --accent-foreground: oklch(0.25 0.04 240);

  /* Durum renkleri */
  --destructive: oklch(0.63 0.20 25);
  --ring: oklch(0.70 0.06 220);
  --border: oklch(0.93 0.01 230);
  --input: oklch(0.93 0.01 230);
  --muted: oklch(0.97 0.006 230);
  --muted-foreground: oklch(0.55 0.03 240);

  /* Grafik paleti (pastel) */
  --chart-1: oklch(0.72 0.10 190); /* teal */
  --chart-2: oklch(0.78 0.12 145); /* yeşil */
  --chart-3: oklch(0.82 0.10 80);  /* sarı */
  --chart-4: oklch(0.75 0.11 280); /* mor */
  --chart-5: oklch(0.78 0.10 20);  /* turuncu */
}

.dark {
  --background: oklch(0.17 0.03 250);
  --foreground: oklch(0.98 0.003 230);
  --card: oklch(0.22 0.03 250);
  --card-foreground: oklch(0.98 0.003 230);
  --popover: oklch(0.22 0.03 250);
  --popover-foreground: oklch(0.98 0.003 230);

  --primary: oklch(0.83 0.06 190);
  --primary-foreground: oklch(0.22 0.03 250);

  --secondary: oklch(0.28 0.03 250);
  --secondary-foreground: oklch(0.98 0.003 230);
  --accent: oklch(0.28 0.03 230);
  --accent-foreground: oklch(0.98 0.003 230);

  --destructive: oklch(0.62 0.18 25);
  --ring: oklch(0.60 0.05 210);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 14%);

  --chart-1: oklch(0.75 0.07 190);
  --chart-2: oklch(0.74 0.10 145);
  --chart-3: oklch(0.78 0.09 80);
  --chart-4: oklch(0.72 0.10 280);
  --chart-5: oklch(0.74 0.09 20);
}
```

Notlar:
- Kontrast ≥ WCAG AA. Primaries hafif doygun, göz yormayan.
- Grafikte 5–7 pastel ton, renk körlüğü için ton ve parlaklık farkı belirgin.

---

## 4) Tipografi
- Başlıklar: 600/700 ağırlık, kısa ve net; alt başlıklar 500.
- Sayılar: tabular-nums (finansal hizalama), 14–16px gövde, 12–13px yardımcı metin.
- Uzun satırları 66–80 karakterle sınırla.

---

## 5) Layout ve Navigasyon
- Üst çubuk: para birimi + tema + “Hızlı Ekle” bir arada; mobilde sağ alt FAB.
- Dashboard bölümleri: Özet kartlar → Dağılım/performans → Varlık listesi.
- Sağ detay paneli opsiyonu: varlık tıklayınca modal yerine sağ panel (desktop).
- Breadcrumbs ve arama: varlık bazlı hızlı arama (ticker, ad, tip).

---

## 6) Dashboard İyileştirmeleri
- Özet kartlarda mini-sparkline ve geçen aya kıyas oranı.
- Varlık tipi rozetleri tıklanınca listeyi filtrelesin.
- “Hedefe ilerleme” (hedef portföy dağılımı vs. gerçekleşen) barı.
- Risk göstergesi: düşük/orta/yüksek yüzdeleri bar olarak.

---

## 7) Tablolar ve Listeler
- Yoğunluk modu: rahat/sıkı; satır yüksekliği toggle.
- Kolon görünürlüğü menüsü, sıralama ve çoklu filtre.
- Sayısal kolonlar sağa hizalı; K/Z pozitif/negatif renk kodlu.
- Sticky header + sanal listeleme (büyük veri için performans).
- “Boş durum” net CTA (işlem ekle, içe aktar).

---

## 8) Modallar ve Formlar
- İşlem ekleme: basit → gelişmiş sekmeleri (komisyon, not, etiket).
- Varsayılan odak, enter ile kaydet, escape ile kapat; klavye erişilebilirliği.
- Yıkıcı eylemler için ikincil doğrulama (metin onayı / tekrar tıklama).

---

## 9) Grafikler
- Pastel set (bkz. --chart-*). İnce grid, okunaklı tooltip.
- Renk + desen (stroke/dash/pattern) kombinasyonu erişilebilirlik için.
- Animasyon: 150–200ms ease-out, reduce-motion tercihine saygı.

---

## 10) Durum Yönetimi
- Yükleniyor: skeleton + beklenen süre (kısa metin).
- Hata: sorunun özeti + yeniden dene butonu + destek linki.
- Boş: açıklama + örnek veri ekleme seçeneği.
- Toast stili: bilgilendirme/başarı/uyarı/hata için tutarlı ikon ve renk.

---

## 11) Erişilebilirlik
- Kontrast: AA; odak halkaları belirgin (ring).
- Klavye ile tüm işlemler yapılabilir; modallar focus-trap.
- Canlı bölge (aria-live) ile işlem sonuçları okunur.
- Renk dışında durum ipucu (ikon, desen, metin).

---

## 12) Performans
- Büyük listelerde virtualization, grafiklerde memozizasyon.
- Görsel ve ikon sprite optimizasyonu, lazy-loading.
- Tema değişimi ve para birimi geçişinde minimum reflow.

---

## 13) Bileşen Tutarlılığı
- Spacing ölçeği: 4/8/12/16/24/32.
- Kart gölgeleri düşük yoğunluk, hover’da hafif artış.
- Kenar yuvarlaklığı: 8–12px (mevcut radius ile tutarlı).
- İkon boyutları: 16/20/24; metin ile dikey hizalı.

---

## 14) Uygulama Adımları (Önerilen Yol Haritası)
1) Renk paletini globals.css’te güncelle, kontrast testini yap.
2) Özet kartlara mini-sparkline ve hedef/gerçekleşen etiketleri ekle.
3) Varlık tipi rozetlerini filtre tetikleyicisi yap.
4) Tablo: yoğunluk modu, kolon görünürlüğü, çoklu filtre, sticky header.
5) Sağ detay paneli (desktop) + mobilde modal; boş/ yükleniyor/ hata şablonlarını birleştir.
6) Grafiklerde pastel paleti ve desen desteği; reduce-motion uygula.
7) Erişilebilirlik turu: odak, aria-live, rol/isim/etiketler.
8) Büyük veri için virtualization ve memozizasyon.

---

## 15) Kod Parçaları
Tema değişkenlerini uygulamak için (özet):

```diff
/* app/globals.css */
:root {
-  --primary: oklch(0.208 0.042 265.755);
+  --primary: oklch(0.70 0.10 190);
-  --ring: oklch(0.704 0.04 256.788);
+  --ring: oklch(0.70 0.06 220);
  /* ... diğerleri yukarıdaki palete göre güncellenir ... */
}

.dark {
-  --primary: oklch(0.929 0.013 255.508);
+  --primary: oklch(0.83 0.06 190);
-  --ring: oklch(0.551 0.027 264.364);
+  --ring: oklch(0.60 0.05 210);
}
```

Grafik renkleri (örnek prop kullanımı):

```ts
const chartColors = [
  'oklch(0.72 0.10 190)',
  'oklch(0.78 0.12 145)',
  'oklch(0.82 0.10 80)',
  'oklch(0.75 0.11 280)',
  'oklch(0.78 0.10 20)'
];
```

Tablo yoğunluk modu (örnek sınıf yaklaşımı):

```tsx
<div className={cn('grid grid-rows-auto', dense ? 'text-sm [&_tr]:h-9' : 'text-base [&_tr]:h-11')}>
  {/* rows */}
</div>
```

---

## 16) Dashboard Tasarımı (Detaylı Bilgiler)

### 16.1 Dashboard Genel Yapısı
Dashboard, kullanıcının portföy durumunu tek bakışta anlaması için tasarlanmış ana ekrandır. Aşağıdaki hiyerarşik yapıyı takip eder:

**Ana Bölümler:**
1. **Header Bar** - Para birimi, tema, hızlı ekleme
2. **Özet Kartlar Grid** - Toplam değer, gün içi değişim, performans
3. **Ana Grafik Alanı** - Portföy dağılımı ve zaman içindeki performans
4. **Varlık Listesi** - Detaylı varlık bilgileri ve işlemler
5. **Hedef ve Risk Paneli** - Portföy hedeflerine uyum ve risk analizi

### 16.2 Layout Grid Yapısı

**Desktop (≥ 1024px):**
```
┌─────────────────────────────────────────────────────────┐
│ Header (H: 64px)                                         │
├─────────────────────────────────────────────────────────┤
│ Özet Kartlar (H: 140px, Grid 4x1)                        │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────────────────────┐ │
│ │ Ana Grafik      │ │ Hedef & Risk Paneli (W: 320px)   │ │
│ │ (Flex-1)        │ │ ┌─────────────┐ ┌─────────────┐ │ │
│ │                 │ │ │ Hedef       │ │ Risk        │ │ │
│ │                 │ │ │ İlerleme    │ │ Göstergesi  │ │ │
│ │                 │ │ └─────────────┘ └─────────────┘ │ │
│ └─────────────────┘ └─────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Varlık Listesi (Flex-1, Sticky Header)                   │
└─────────────────────────────────────────────────────────┘
```

**Tablet (768px - 1023px):**
- Özet kartlar 2x2 grid
- Grafik paneli tam geniş
- Hedef/risk paneli grafik altında horizontal cards

**Mobil (< 768px):**
- Özet kartlar 1x4 vertical stack (scrollable)
- Grafik tam geniş, responsive height
- Varlık listesi compact view
- Sabit alt FAB (Hızlı Ekle)

### 16.3 Özet Kartlar Detayları

**Kart Tipleri ve İçeriği:**

1. **Toplam Portföy Değeri**
   - Ana değer: ₺125,750.00
   - Alt bilgi: +2.3% bugün
   - Mini sparkline: son 7 gün
   - Hover: detaylı breakdown modal

2. **Gün İçi Performans**
   - Değişim: +₺2,850.00 (+2.3%)
   - Renk kodlama: yeşil (artış)/kırmızı (düşüş)
   - Icon: trend up/down
   - Click: gün içi detay view

3. **Ay Performansı**
   - Aylık değişim: +₺8,250.00 (+7.1%)
   - Yüzde bar görseli
   - Karşılaştırma: önceki ay
   - Tooltip: detaylı aylık karşılaştırma

4. **Varlık Sayısı**
   - Toplam varlık: 12 adet
   - Kategori badges: Altın (4), Hisse (5), Döviz (3)
   - Click: kategori filtreleme

**Kart Tasarım Detayları:**
- Boyut: Desktop (280x140px), Tablet (flex), Mobil (full width)
- Shadow: Subtle (0 1px 3px 0 rgba(0, 0, 0, 0.1))
- Border: 1px solid var(--border)
- Radius: 12px
- Padding: 20px
- Background: var(--card)
- Transition: All 200ms ease-out

### 16.4 Ana Grafik Alanı

**Grafik Tipleri (Toggle):**
1. **Portföy Dağılımı** - Pie/Donut chart
2. **Zaman Performansı** - Line chart (1M, 3M, 6M, 1Y)
3. **Kategori Performansı** - Grouped bar chart

**Grafik Özellikleri:**
- Tooltip: Detaylı bilgi ve mini tablo
- Legend: Interactive (click to filter)
- Zoom: Scroll ile yakınlaştırma
- Export: PNG/SVG download
- Responsive: Container based sizing

**Renk Kullanımı:**
- Altın: --chart-1 (teal)
- Hisse: --chart-2 (yeşil) 
- Döviz: --chart-3 (sarı)
- Crypto: --chart-4 (mor)
- Diğer: --chart-5 (turuncu)

### 16.5 Hedef ve Risk Paneli

**Hedef İlerleme Kartı:**
```
┌─────────────────────────────┐
│ 🎯 Portföy Hedefi           │
│ ████████░░░░ 80%           │
│ Mevcut: 100K / Hedef: 125K │
│ Kalan: 25K                 │
│ Son 3 ayda: +15K          │
└─────────────────────────────┘
```

**Risk Göstergesi Kartı:**
```
┌─────────────────────────────┐
│ ⚠️ Risk Seviyesi             │
│ ██████░░░░░ Düşük           │
│ Skor: 3.2/10               │
│ Çeşitlendirme: İyi         │
│ Volatilite: Düşük          │
└─────────────────────────────┘
```

**Risk Hesaplama Formülü:**
- Çeşitlendirme (30%): Kategori dağılımı
- Volatilite (25%): Varlık oynaklığı
- Likidite (20%): kolay dönüştürülebilirlik
- Piyasa riski (15%): ekonominin genel durumu
- Konsantrasyon (10%): tek varlık bağımlılığı

### 16.6 Varlık Listesi Tasarımı

**Tablo Kolonları:**
1. **Varlık** - Icon + Ad + Ticker (Badge)
2. **Miktar** - Sayısal + Birim (gram/adet/USD)
3. **Alış Fiyatı** - Tarihli ortalama
4. **Mevcut Fiyat** - Real-time fiyat + trend icon
5. **Değer** - Miktar × Mevcut Fiyat
6. **K/Z** - Değer - Maliyet + yüzde
7. **Performans** - Mini sparkline (7 gün)
8. **İşlemler** - Action buttons

**Dense/Normal Mode Toggle:**
- Normal: Row height 56px, padding 12px
- Dense: Row height 40px, padding 8px
- Font size: 14px → 13px (dense mode)

**Interactive Features:**
- Sort: All columns (except actions)
- Filter: Multi-select categories, price range, performance
- Search: Real-time ticker/name search
- Expand: Row expansion for detailed transactions

### 16.7 Responsive Breakpoints

**Desktop (≥ 1024px):**
- Grid: 12-column system
- Typography: Body 16px, Small 14px
- Spacing: 24px base unit
- Cards: Fixed dimensions where appropriate

**Tablet (768px - 1023px):**
- Grid: 8-column system  
- Typography: Body 15px, Small 13px
- Spacing: 20px base unit
- Cards: Flexible dimensions
- Hiding: Secondary info in tooltips

**Mobil (< 768px):**
- Single column layout
- Typography: Body 14px, Small 12px
- Spacing: 16px base unit
- Cards: Full width
- Horizontal scrolling for tables
- Bottom navigation: FAB + quick actions

### 16.8 State Management ve Data Flow

**Data Structure:**
```typescript
interface DashboardData {
  summary: {
    totalValue: number;
    dailyChange: number;
    dailyChangePercent: number;
    monthlyChange: number;
    monthlyChangePercent: number;
    assetCount: number;
  };
  portfolio: Asset[];
  targets: Target[];
  riskAnalysis: RiskScore;
  performance: PerformanceData[];
}
```

**Update Strategies:**
- Real-time prices: WebSocket connection
- Batch updates: Every 30 seconds for non-critical data
- Optimistic UI: Immediate response, rollback on error
- Caching: 5-minute cache for historical data

### 16.9 Performance Optimizasyonları

**Rendering Optimizations:**
- Virtual scrolling for large asset lists (>100 items)
- Memoized chart components
- Intersection Observer for lazy loading
- Debounced search (300ms)

**Bundle Optimizations:**
- Chart library: Tree-shakeable imports
- Icons: Custom sprite
- Images: WebP format with fallback
- CSS: Critical path inline

**Network Optimizations:**
- API response compression
- Data pagination for transaction history
- Background sync for price updates
- Service worker for offline support

### 16.10 User Interaction Patterns

**Keyboard Shortcuts:**
- `Ctrl/Cmd + K`: Quick search
- `Ctrl/Cmd + N`: New transaction
- `Ctrl/Cmd + /`: Show shortcuts
- `Escape`: Close modals/panels
- `Tab/Shift+Tab`: Navigate interface

**Touch Gestures (Mobil):**
- Swipe left/right: Navigate time periods
- Pull to refresh: Update prices
- Long press: Show context menu
- Double tap: Quick action

**Drag & Drop:**
- Reorder portfolio items
- Drag to filters
- Quick category assignment

### 16.11 Accessibility (WCAG 2.1 AA)

**Visual Accessibility:**
- Color contrast ratio ≥ 4.5:1 for normal text
- Focus indicators: 2px solid, high contrast
- Text scaling: Support 200% zoom
- High contrast mode: OS level support

**Keyboard Navigation:**
- Full keyboard access to all features
- Logical tab order
- Skip navigation links
- Focus trapping in modals

**Screen Reader Support:**
- Semantic HTML5 elements
- ARIA labels and descriptions
- Live regions for dynamic updates
- Data table markup for lists

---

Sorular ve uygulanacak öncelikler için: Önce palet + özet kartlar + tablo ergonomisi; ardından grafik ve erişilebilirlik turu önerilir.
