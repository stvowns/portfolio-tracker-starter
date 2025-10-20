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

Sorular ve uygulanacak öncelikler için: Önce palet + özet kartlar + tablo ergonomisi; ardından grafik ve erişilebilirlik turu önerilir.
